var framework = require("webex-node-bot-framework");
var webhook = require("webex-node-bot-framework/webhook");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
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
/* On mention with command
ex User enters @botname help, the bot will write back in markdown
*/
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

/* On mention reply example
ex User enters @botname 'reply' phrase, the bot will post a threaded reply
*/
framework.hears("reply", function (bot, trigger) {
  console.log("someone asked for a reply.  We will give them two.");
  responded = true;
  bot.reply(
    trigger.message,
    "This is threaded reply sent using the `bot.reply()` method.",
    "markdown"
  );
  var msg_attach = {
    text:
      "This is also threaded reply with an attachment sent via bot.reply(): ",
    file:
      "https://media2.giphy.com/media/dTJd5ygpxkzWo/giphy-downsized-medium.gif",
  };
  bot.reply(trigger.message, msg_attach);
});

// =======
// Test
// =======

// make this a state variable
var interval;
var status = "";
var isInSession = false;
var isPaused = false;
var timeRemaining = 0;
var secondsWorked = 0;
var breakCounter = 0;
const SHORT_BREAK_MSG = "a short 5 minute break ☕️";
const LONG_BREAK_MSG = "a longer 20 minute break 🏖️";
const WORK_MSG = "a 25 miniute working session 📚";
const WORKING_TIME_LIMIT = 25000;
const SHORT_BREAK_TIME_LIMIT = 5000;

const isLongBreak = () => {
  if (++breakCounter > 3) {
    breakCounter = 0;
    return true;
  }

  return false;
};

const updateSession = (bot, newSession, trigger = null) => {
  let sessionMsg;
  if (newSession === "workSession") {
    status = "work";
    timeRemaining = WORKING_TIME_LIMIT;
    sessionMsg = WORK_MSG;
  } else if (newSession === "breakSession") {
    status = "shortBreak";
    timeRemaining = SHORT_BREAK_TIME_LIMIT;
    sessionMsg = SHORT_BREAK_MSG;
  }

  sessionMsg = trigger
    ? `${trigger.person.displayName} started ${sessionMsg}`
    : `Time for ${sessionMsg}`;

  bot
    .say("markdown", sessionMsg)
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
};

const startSession = (bot) => {
  isInSession = true;
  interval = setInterval(() => {
    console.log(status, timeRemaining);

    if (!isPaused) {
      timeRemaining -= 1000;
      if (status === "work") secondsWorked++;
    }

    if (timeRemaining === 0) {
      if (status === "work") {
        updateSession(bot, "breakSession");
      } else if (status === "shortBreak") {
        updateSession(bot, "workSession");
      }
    }
  }, 1000);
};

const commandReminder = (bot, trigger, reminder) => {
  let reminderMsg;
  switch (reminder) {
    case "workReminder":
      reminderMsg =
        "You are already in a work session, use the **break** command to start the next break session";
      break;
    case "breakReminder":
      reminderMsg =
        "You are already in a break, use the **work** command to start the next work session";
      break;
    case "pauseReminder":
      reminderMsg =
        "You need to resume the session first, use the **resume** command to resume the current session";
      break;
    case "resumeReminder":
      reminderMsg =
        "You are already in a live session, use the **pause** command to pause the current session";
      break;
    case "notInSessionReminder":
      reminderMsg =
        "You need to start a Pomodoro session first, use the **work** command to start your first work session";
      break;
  }
  bot
    .reply(trigger.message, reminderMsg, "markdown")
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
};

// WORK
framework.hears("work", function (bot, trigger) {
  responded = true;

  if (!isInSession) startSession(bot);
  if (isPaused) return commandReminder(bot, trigger, "pauseReminder");
  if (status === "work") return commandReminder(bot, trigger, "workReminder");

  updateSession(bot, "workSession", trigger);
});

// SHORT BREAK
framework.hears("break", function (bot, trigger) {
  responded = true;

  if (!isInSession)
    return commandReminder(bot, trigger, "notInSessionReminder");
  if (isPaused) return commandReminder(bot, trigger, "pauseReminder");
  if (status === "shortBreak" || status === "longBreak")
    return commandReminder(bot, trigger, "breakReminder");

  updateSession(bot, "breakSession", trigger);
});

// PAUSE
framework.hears("pause", function (bot, trigger) {
  responded = true;

  if (!isInSession)
    return commandReminder(bot, trigger, "notInSessionReminder");
  if (isPaused) return commandReminder(bot, trigger, "pauseReminder");

  isPaused = true;
  bot.say(`${trigger.person.displayName} paused the session ⏸️`);
});

// RESUME
framework.hears("resume", function (bot, trigger) {
  responded = true;
  console.log("resume");

  if (!isInSession)
    return commandReminder(bot, trigger, "notInSessionReminder");
  if (!isPaused) return commandReminder(bot, trigger, "resumeReminder");

  isPaused = false;
  bot.say(`${trigger.person.displayName} resumed the session ▶️`);
});

// FINISH
framework.hears("finish", function (bot, trigger) {
  responded = true;

  if (!isInSession)
    return commandReminder(bot, trigger, "notInSessionReminder");

  // make a set to initial state function
  clearInterval(interval);
  isInSession = false;
  isPaused = false;
  status = "";
  minutesWorked = 0;
  timeRemaining = 0;

  // need an if statement
  bot.say(
    `${trigger.person.displayName} ended the session, worked ${secondsWorked} seconds`
  );
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

//Server config & housekeeping
// Health Check
app.get("/", function (req, res, bot) {
  res.send(`I'm alive.`);
});

var server = app.listen(config.port, function () {
  framework.debug("framework listening on port %s", config.port);
});

// gracefully shutdown (ctrl-c)
process.on("SIGINT", function () {
  framework.debug("stoppping...");
  server.close();
  framework.stop().then(function () {
    process.exit();
  });
});
