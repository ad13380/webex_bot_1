class Pomodoro {
  constructor() {
    this.state = {
      status: "",
      isInSession: false,
      isPaused: false,
      secondsRemaining: 0,
      secondsWorked: 0,
      breakCounter: 0,
    };
    this.reminders = {
      workReminder:
        "You are already in a work session, use the **break** command to start the next break session",
      breakReminder:
        "You are already in a break, use the **work** command to start the next work session",
      pauseReminder:
        "You need to resume the session first, use the **resume** command to resume the current session",
      resumeReminder:
        "You are already in a live session, use the **pause** command to pause the current session",
      notInSessionReminder:
        "You need to start a Pomodoro session first, use the **work** command to start your first work session",
    };
    this.SHORT_BREAK_MSG = "a short 5 minute break ☕️";
    this.LONG_BREAK_MSG = "a longer 20 minute break 🏖️";
    this.WORK_MSG = "a 25 miniute working session 📚";
    // fix these to be in seconds
    this.WORKING_TIME_LIMIT = 3 * 60000;
    this.SHORT_BREAK_TIME_LIMIT = 1 * 60000;
    this.LONG_BREAK_TIME_LIMIT = 2 * 60000;
    this.BREAK_COUNTER_LIMIT = 3;
  }

  updateTime(msInterval) {
    // fix interval to be in sec
    this.state.secondsRemaining -= msInterval;
    if (this.state.status === "work")
      this.state.secondsWorked += msInterval / 1000;
  }

  getReminder(reminderType) {
    return this.reminders[reminderType];
  }

  getStatusUpdate() {
    return `We are in a ${
      this.state.isPaused ? "paused " : ""
    }${this._formatSession()} session with ${this._formatTime(
      this.state.secondsRemaining
    )} left`;
  }

  getSessionUpdate(newSession, trigger = null) {
    let sessionMsg;
    if (newSession === "workSession") {
      this.state.status = "work";
      this.state.secondsRemaining = this.WORKING_TIME_LIMIT;
      sessionMsg = this.WORK_MSG;
    } else if (newSession === "breakSession") {
      if (this._isLongBreak()) {
        this.state.status = "longBreak";
        this.state.secondsRemaining = this.LONG_BREAK_TIME_LIMIT;
        sessionMsg = this.LONG_BREAK_MSG;
      } else {
        this.state.status = "shortBreak";
        this.state.secondsRemaining = this.SHORT_BREAK_TIME_LIMIT;
        sessionMsg = this.SHORT_BREAK_MSG;
      }
    }
    return this._formatSessionChangeMsg(sessionMsg, trigger);
  }

  getFinishMessage() {
    return `We worked for ${this._formatTime(
      this.state.secondsWorked
    )} in this session 💪`;
  }

  reset() {
    this.state = {
      status: "",
      isInSession: false,
      isPaused: false,
      secondsRemaining: 0,
      secondsWorked: 0,
      breakCounter: 0,
    };
  }

  get isInSession() {
    return this.state.isInSession;
  }

  set isInSession(bool) {
    this.state.isInSession = bool;
  }

  _isLongBreak() {
    if (++this.state.breakCounter > this.BREAK_COUNTER_LIMIT) {
      this.state.breakCounter = 0;
      return true;
    }
    return false;
  }

  _formatSessionChangeMsg(sessionMsg, trigger) {
    return trigger
      ? `${trigger.person.displayName} started ${sessionMsg}`
      : `Time for ${sessionMsg}`;
  }

  _formatTime(seconds) {
    // this is in milliseconds, fix this
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
  }

  _formatSession() {
    if (
      this.state.status === "longBreak" ||
      this.state.status === "shortBreak"
    ) {
      return "break";
    }
    if (this.state.status === "work") return "work";
  }
}

module.exports = { Pomodoro };
