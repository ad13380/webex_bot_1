var framework = require("webex-node-bot-framework");
var webhook = require("webex-node-bot-framework/webhook");
var express = require("express");
var bodyParser = require("body-parser");
const fetch = require("node-fetch");
var app = express();
const { Pomodoro } = require("./models/Pomodoro");
const { CheckIn } = require("./models/CheckIn");
const checkInCardJSON = require("./templates/checkInCardJSON");
app.use(bodyParser.json());
app.use(express.static("images"));
const config = require("./config.json");

// init framework
var framework = new framework(config);
let interval;
let responded = false;
const TIME_INTERVAL = 1000;
const pom = new Pomodoro();
const check = new CheckIn(checkInCardJSON);

framework.start();
console.log("Starting framework, please wait...");

framework.on("initialized", function () {
  console.log("framework is all fired up! [Press CTRL-C to quit]");
});

framework.on("spawn", (bot, id, actorId) => {
  if (actorId) {
    let msg =
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

async function getDisplayName(personId) {
  const url = `https://webexapis.com/v1/people/${personId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });
  const responseJson = await response.json();
  return responseJson.displayName;
}

// WHAT CAN I DO
framework.hears(/help|what can i (do|say)|what (can|do) you do/i, function (
  bot,
  trigger
) {
  responded = true;
  bot
    .say(`Hello ${trigger.person.displayName}.`)
    .then(() => sendHelp(bot))
    .catch((e) => console.error(`Problem in help hander: ${e.message}`));
});

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

// CATCH ALL
framework.hears(/.*/, function (bot, trigger) {
  if (!responded) {
    bot
      .say(`Sorry, I don't know how to respond to "${trigger.text}"`)
      .then(() => sendHelp(bot))
      .catch((e) =>
        console.error(`Problem in the unexepected command hander: ${e.message}`)
      );
  }
  responded = false;
});

// Temporary - remove later
framework.hears("check in", function (bot, trigger) {
  responded = true;
  bot.sendCard(check.getCard());
});

// PROCESS A CARD BUTTON CLICK
framework.on("attachmentAction", function (bot, trigger) {
  getDisplayName(trigger.attachmentAction.personId).then((displayName) => {
    let response = {
      name: displayName,
      feeling: trigger.attachmentAction.inputs.feeling,
    };
    check.addRecord(response);
  });
});

// POST REQUESTS
app.post("/", webhook(framework));

// HEALTH CHECK
app.get("/", function (req, res, bot) {
  res.send(`I'm alive`);
});

var server = app.listen(config.port, function () {
  framework.debug("framework listening on port %s", config.port);
});

// GRACEFUL SHUTDOWN
process.on("SIGINT", function () {
  framework.debug("stoppping...");
  server.close();
  framework.stop().then(function () {
    process.exit();
  });
});
