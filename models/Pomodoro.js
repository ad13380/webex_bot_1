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
    this.SHORT_BREAK_MSG = "a short 5 minute break ☕️";
    this.LONG_BREAK_MSG = "a longer 20 minute break 🏖️";
    this.WORK_MSG = "a 25 miniute working session 📚";
    this.WORKING_TIME_LIMIT = 3 * 60000;
    this.SHORT_BREAK_TIME_LIMIT = 5000;
    this.LONG_BREAK_TIME_LIMIT = 20000;
    this.BREAK_COUNTER_LIMIT = 3;
  }

  _isLongBreak() {
    // magic number
    if (++this.state.breakCounter > this.BREAK_COUNTER_LIMIT) {
      this.state.breakCounter = 0;
      return true;
    }
    return false;
  }
}
