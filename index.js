var framework = require("webex-node-bot-framework");
var webhook = require("webex-node-bot-framework/webhook");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const reminderObject = require("./helperFunctions/reminderObject");

app.use(bodyParser.json());
app.use(express.static("images"));
const config = require("./config.json");

// init framework
var framework = new framework(config);
framework.start();
console.log("Starting framework, please wait...");

framework.on("initialized", function () {
  console.log("framework is all fired up! [Press CTRL-C to quit]");
});

framework.on("spawn", (bot, id, actorId) => {
  if (!actorId) {
    console.log(
      `While starting up, the framework found our bot in a space called: ${bot.room.title}`
    );
  } else {
    // When actorId is present it means someone added your bot got added to a new space
    // Lets find out more about them..
    var msg =
      "You can say `help` to get the list of words I am able to respond to.";
    bot.webex.people
      .get(actorId)
      .then((user) => {
        msg = `Hello there ${user.displayName}. ${msg}`;
      })
      .catch((e) => {
        console.error(
          `Failed to lookup user details in framwork.on("spawn"): ${e.message}`
        );
        msg = `Hello there. ${msg}`;
      })
      .finally(() => {
        // Say hello, and tell users what you do!
        if (bot.isDirect) {
          bot.say("markdown", msg);
        } else {
          let botName = bot.person.displayName;
          msg += `\n\nDon't forget, in order for me to see your messages in this group space, be sure to *@mention* ${botName}.`;
          bot.say("markdown", msg);
        }
      });
  }
});

//Process incoming messages

let responded = false;

framework.hears(/help|what can i (do|say)|what (can|do) you do/i, function (
  bot,
  trigger
) {
  console.log(`someone needs help! They asked ${trigger.text}`);
  responded = true;
  bot
    .say(`Hello ${trigger.person.displayName}.`)
    .then(() => sendHelp(bot))
    .catch((e) => console.error(`Problem in help hander: ${e.message}`));
});

let newCardJSON = {
  type: "AdaptiveCard",
  body: [
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "ActionSet",
              separator: true,
              actions: [
                {
                  type: "Action.Submit",
                  title: "🔥",
                  data: {
                    feeling: "fire",
                  },
                },
              ],
            },
          ],
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "😒",
                  data: {
                    feeling: "bad",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.2",
};

// Buttons & Cards data

/* On mention with card example
ex User enters @botname 'card me' phrase, the bot will produce a personalized card - https://developer.webex.com/docs/api/guides/cards
*/
framework.hears("card me", function (bot, trigger) {
  console.log("someone asked for a card");
  responded = true;
  let avatar = trigger.person.avatar;

  cardJSON.body[0].columns[0].items[0].url = avatar
    ? avatar
    : `${config.webhookUrl}/missing-avatar.jpg`;
  cardJSON.body[0].columns[0].items[1].text = trigger.person.displayName;
  cardJSON.body[0].columns[0].items[2].text = trigger.person.emails[0];
  bot.sendCard(
    cardJSON,
    "This is customizable fallback text for clients that do not support buttons & cards"
  );
});

// =======
// Test
// =======

var interval;

let state = {
  status: "",
  isInSession: false,
  isPaused: false,
  secondsRemaining: 0,
  secondsWorked: 0,
  breakCounter: 0,
};
// constants
const SHORT_BREAK_MSG = "a short 5 minute break ☕️";
const LONG_BREAK_MSG = "a longer 20 minute break 🏖️";
const WORK_MSG = "a 25 miniute working session 📚";
const WORKING_TIME_LIMIT = 3 * 60000;
const SHORT_BREAK_TIME_LIMIT = 5000;
const LONG_BREAK_TIME_LIMIT = 20000;

const isLongBreak = () => {
  // magic number
  if (++state.breakCounter > 3) {
    state.breakCounter = 0;
    return true;
  }
  return false;
};

const formatSessionChangeMsg = (sessionMsg, trigger) => {
  return trigger
    ? `${trigger.person.displayName} started ${sessionMsg}`
    : `Time for ${sessionMsg}`;
};

const formatTime = (seconds) => {
  let timeFormatArray = [];
  const hours = Math.floor(seconds / 3600000);
  const minutes = Math.floor((seconds - hours * 3600000) / 60000);

  if (hours > 0) {
    timeFormatArray.push(hours > 1 ? `${hours} hours` : "1 hour");
  }
  if (minutes >= 1) {
    timeFormatArray.push(minutes > 1 ? `${minutes} minutes` : "1 minute");
  } else if (hours === 0) {
    timeFormatArray.push("less than a minute");
  }

  return timeFormatArray.join(" and ");
};

const formatSession = () => {
  if (state.status === "longBreak" || state.status === "shortBreak") {
    return "break";
  }
  if (state.status === "work") return "work";
};

const sendReminder = (bot, trigger, reminder) => {
  bot
    .reply(trigger.message, reminderObject[reminder], "markdown")
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
};

const sendStatus = (bot) => {
  bot.say(
    `We are in a ${
      state.isPaused ? "paused " : ""
    }${formatSession()} session with ${formatTime(state.secondsRemaining)} left`
  );
};

const startSession = (bot) => {
  state.isInSession = true;
  interval = setInterval(() => {
    console.log(state.status, Math.floor(state.secondsRemaining / 60000));

    if (!state.isPaused) {
      state.secondsRemaining -= 1000;
      if (state.status === "work") state.secondsWorked++;
    }

    if (state.secondsRemaining === 0) {
      if (state.status === "work") {
        updateSession(bot, "breakSession");
      } else if (
        state.status === "shortBreak" ||
        state.status === "longBreak"
      ) {
        updateSession(bot, "workSession");
      }
    }
  }, 1000);
};

const updateSession = (bot, newSession, trigger = null) => {
  let sessionMsg;

  if (newSession === "workSession") {
    state.status = "work";
    state.secondsRemaining = WORKING_TIME_LIMIT;
    sessionMsg = WORK_MSG;
  } else if (newSession === "breakSession") {
    if (isLongBreak()) {
      state.status = "longBreak";
      state.secondsRemaining = LONG_BREAK_TIME_LIMIT;
      sessionMsg = LONG_BREAK_MSG;
    } else {
      state.status = "shortBreak";
      state.secondsRemaining = SHORT_BREAK_TIME_LIMIT;
      sessionMsg = SHORT_BREAK_MSG;
    }
  }

  formatSessionMsg = formatSessionChangeMsg(sessionMsg, trigger);
  bot
    .say("markdown", formatSessionMsg)
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
};

// WORK
framework.hears("work", function (bot, trigger) {
  responded = true;

  if (!state.isInSession) startSession(bot);
  if (state.isPaused) return sendReminder(bot, trigger, "pauseReminder");
  if (state.status === "work")
    return sendReminder(bot, trigger, "workReminder");

  updateSession(bot, "workSession", trigger);
});

// SHORT BREAK
framework.hears("break", function (bot, trigger) {
  responded = true;

  if (!state.isInSession)
    return sendReminder(bot, trigger, "notInSessionReminder");
  if (state.isPaused) return sendReminder(bot, trigger, "pauseReminder");
  if (state.status === "shortBreak" || state.status === "longBreak")
    return sendReminder(bot, trigger, "breakReminder");

  updateSession(bot, "breakSession", trigger);
});

// STATUS
framework.hears("status", function (bot, trigger) {
  responded = true;

  if (!state.isInSession)
    return sendReminder(bot, trigger, "notInSessionReminder");

  sendStatus(bot);
});

// PAUSE
framework.hears("pause", function (bot, trigger) {
  responded = true;

  if (!state.isInSession)
    return sendReminder(bot, trigger, "notInSessionReminder");
  if (state.isPaused) return sendReminder(bot, trigger, "pauseReminder");

  state.isPaused = true;
  bot.say(`${trigger.person.displayName} paused the session ⏸️`);
});

// RESUME
framework.hears("resume", function (bot, trigger) {
  responded = true;

  if (!state.isInSession)
    return sendReminder(bot, trigger, "notInSessionReminder");
  if (!state.isPaused) return sendReminder(bot, trigger, "resumeReminder");

  state.isPaused = false;
  bot
    .say(`${trigger.person.displayName} resumed the session ▶️`)
    .then(() => sendStatus(bot))
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
});

// FINISH
framework.hears("finish", function (bot, trigger) {
  responded = true;

  if (!state.isInSession)
    return sendReminder(bot, trigger, "notInSessionReminder");

  // make a set to initial state function
  clearInterval(interval);
  state.isInSession = false;
  state.isPaused = false;
  state.status = "";
  minutesWorked = 0;
  state.secondsRemaining = 0;

  // need an if statement
  bot.say(`${trigger.person.displayName} ended the session`).then(() => {
    bot.say(
      `We worked for ${formatTime(state.secondsWorked)} in this session 💪`
    );
  });
});

app.post("/", webhook(framework));

// Process a submitted card
framework.on("attachmentAction", function (bot, trigger) {
  bot.say(
    `Got an attachmentAction:\n${JSON.stringify(
      trigger.attachmentAction.inputs.feeling,
      null,
      2
    )}`
  );
});

let cardJSON = {
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  type: "AdaptiveCard",
  version: "1.0",
  body: [
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "5",
          items: [
            {
              type: "Image",
              url: "Your avatar appears here!",
              size: "large",
              horizontalAlignment: "Center",
              style: "person",
            },
            {
              type: "TextBlock",
              text: "Your name will be here!",
              size: "medium",
              horizontalAlignment: "Center",
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: "And your email goes here!",
              size: "small",
              horizontalAlignment: "Center",
              isSubtle: true,
              wrap: false,
            },
          ],
        },
      ],
    },
  ],
};

framework.hears("card again", function (bot, trigger) {
  console.log("hello");
  responded = true;
  bot.sendCard(newCardJSON);
});

// =======
// Test
// =======

/* On mention with unexpected bot command
   Its a good practice is to gracefully handle unexpected input
*/
framework.hears(/.*/, function (bot, trigger) {
  // This will fire for any input so only respond if we haven't already
  if (!responded) {
    console.log(`catch-all handler fired for user input: ${trigger.text}`);
    bot
      .say(`Sorry, I don't know how to respond to "${trigger.text}"`)
      .then(() => sendHelp(bot))
      .catch((e) =>
        console.error(`Problem in the unexepected command hander: ${e.message}`)
      );
  }
  responded = false;
});

function sendHelp(bot) {
  bot.say(
    "markdown",
    "These are the commands I can respond to:",
    "\n\n " +
      "1. **framework**   (learn more about the Webex Bot Framework) \n" +
      "2. **info**  (get your personal details) \n" +
      "3. **space**  (get details about this space) \n" +
      "4. **card me** (a cool card!) \n" +
      "5. **say hi to everyone** (everyone gets a greeting using a call to the Webex SDK) \n" +
      "6. **reply** (have bot reply to your message) \n" +
      "7. **help** (what you are reading now)"
  );
}

// health check
app.get("/", function (req, res, bot) {
  res.send(`I'm alive.`);
});

var server = app.listen(config.port, function () {
  framework.debug("framework listening on port %s", config.port);
});

// graceful shutdown
process.on("SIGINT", function () {
  framework.debug("stoppping...");
  server.close();
  framework.stop().then(function () {
    process.exit();
  });
});
