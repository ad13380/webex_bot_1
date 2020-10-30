var framework = require("webex-node-bot-framework");
var webhook = require("webex-node-bot-framework/webhook");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
// imports
const { Pomodoro } = require("./models/Pomodoro");

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
const TIME_INTERVAL = 1000;
const pom = new Pomodoro();

function startSession(bot) {
  pom.isInSession = true;
  interval = setInterval(() => {
    console.log(
      pom.state.status,
      Math.floor(pom.state.secondsRemaining / 60000)
    );

    if (!pom.state.isPaused) {
      pom.updateTime(TIME_INTERVAL);
    }

    if (pom.state.secondsRemaining === 0) {
      let updateMessage;
      if (pom.state.status === "work") {
        updateMessage = pom.getSessionUpdate("breakSession");
      } else if (
        pom.state.status === "shortBreak" ||
        pom.state.status === "longBreak"
      ) {
        updateMessage = pom.getSessionUpdate("workSession");
      }
      bot
        .say("markdown", updateMessage)
        .catch((e) => console.error(`bot.say failed: ${e.message}`));
    }
  }, TIME_INTERVAL);
}

// WORK
framework.hears("work", function (bot, trigger) {
  responded = true;

  if (!pom.isInSession) startSession(bot);

  let reminderMessage;
  if (pom.state.isPaused) reminderMessage = pom.getReminder("pauseReminder");
  else if (pom.state.status === "work")
    reminderMessage = pom.getReminder("workReminder");
  if (reminderMessage)
    return bot
      .reply(trigger.message, reminderMessage, "markdown")
      .catch((e) => console.error(`bot.say failed: ${e.message}`));

  let updateMessage = pom.getSessionUpdate("workSession", trigger);
  bot
    .say("markdown", updateMessage)
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
});

// BREAK
framework.hears("break", function (bot, trigger) {
  responded = true;

  let reminderMessage;
  if (!pom.isInSession)
    reminderMessage = pom.getReminder("notInSessionReminder");
  else if (pom.state.isPaused)
    reminderMessage = pom.getReminder("pauseReminder");
  else if (
    pom.state.status === "shortBreak" ||
    pom.state.status === "longBreak"
  )
    reminderMessage = pom.getReminder("breakReminder");
  if (reminderMessage)
    return bot
      .reply(trigger.message, reminderMessage, "markdown")
      .catch((e) => console.error(`bot.say failed: ${e.message}`));

  let updateMessage = pom.getSessionUpdate("breakSession", trigger);
  bot
    .say("markdown", updateMessage)
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
});

// STATUS
framework.hears("status", function (bot, trigger) {
  responded = true;

  if (!pom.isInSession) {
    let reminderMessage = pom.getReminder("notInSessionReminder");
    return bot
      .reply(trigger.message, reminderMessage, "markdown")
      .catch((e) => console.error(`bot.say failed: ${e.message}`));
  }

  let statusMessage = pom.getStatusUpdate();
  bot
    .say("markdown", statusMessage)
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
});

// PAUSE
framework.hears("pause", function (bot, trigger) {
  responded = true;

  let reminderMessage;
  if (!pom.isInSession)
    reminderMessage = pom.getReminder("notInSessionReminder");
  else if (pom.state.isPaused)
    reminderMessage = pom.getReminder("pauseReminder");
  if (reminderMessage)
    return bot
      .reply(trigger.message, reminderMessage, "markdown")
      .catch((e) => console.error(`bot.say failed: ${e.message}`));

  pom.state.isPaused = true;
  bot.say(`${trigger.person.displayName} paused the session ⏸️`);
});

// RESUME
framework.hears("resume", function (bot, trigger) {
  responded = true;

  let reminderMessage;
  if (!pom.isInSession)
    reminderMessage = pom.getReminder("notInSessionReminder");
  else if (!pom.state.isPaused)
    reminderMessage = pom.getReminder("resumeReminder");
  if (reminderMessage)
    return bot
      .reply(trigger.message, reminderMessage, "markdown")
      .catch((e) => console.error(`bot.say failed: ${e.message}`));

  pom.state.isPaused = false;
  bot
    .say(`${trigger.person.displayName} resumed the session ▶️`)
    .then(() => {
      let statusMessage = pom.getStatusUpdate();
      bot
        .say("markdown", statusMessage)
        .catch((e) => console.error(`bot.say failed: ${e.message}`));
    })
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
});

// FINISH
framework.hears("finish", function (bot, trigger) {
  responded = true;

  if (!pom.isInSession) {
    let reminderMessage = pom.getReminder("notInSessionReminder");
    return bot
      .reply(trigger.message, reminderMessage, "markdown")
      .catch((e) => console.error(`bot.say failed: ${e.message}`));
  }

  clearInterval(interval);
  bot
    .say(`${trigger.person.displayName} ended the session`)
    .then(() => {
      let finishMessage = pom.getFinishMessage();
      bot.say(finishMessage);
    })
    .catch((e) => console.error(`bot.say failed: ${e.message}`));
  pom.reset();
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
