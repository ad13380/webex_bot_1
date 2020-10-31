class CheckIn {
  constructor(cardJSON) {
    this.cardJSON = cardJSON;
    this.isFirstCheckIn = true;
    this.teamStatus = {};
  }

  getCard() {
    return this.cardJSON;
  }

  addRecord({ name, feeling }) {
    this.isFirstCheckIn = false;
    this.teamStatus[name] = feeling;
    console.log(this.teamStatus);
  }

  resetStatus() {
    this.teamStatus = {};
  }

  reset() {
    this.resetStatus();
    this.isFirstCheckIn = true;
  }
}

module.exports = { CheckIn };
