class CheckIn {
  constructor(cardJSON) {
    this.cardJSON = cardJSON;
    this.teamStatus = {};
    this.teamCardSection = [
      {
        type: "TextBlock",
        text: "How's your team?",
        size: "Large",
        color: "Dark",
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: "",
        wrap: true,
        spacing: "Padding",
        horizontalAlignment: "Left",
      },
    ];
  }

  getCard() {
    let cardJSON = { ...this.cardJSON };
    console.log(cardJSON);
    if (!!Object.keys(this.teamStatus).length) {
      this._addTeamSection(cardJSON);
      this._updateTeamSection(cardJSON);
    }
    // if (this.cardJSON.body[0].columns[0].items.length > 2)
    this._resetStatus();
    return cardJSON; //this.cardJSON;
  }

  addRecord({ name, feeling }) {
    this.isFirstCheckIn = false;
    this.teamStatus[name] = feeling;
    console.log(this.teamStatus);
  }

  reset() {
    this.resetStatus();
    this.isFirstCheckIn = true;
  }

  _resetStatus() {
    // al
    this.teamStatus = {};
  }

  _updateTeamSection(cardJSON) {
    cardJSON.body[0].columns[0].items[2].text = `In your last session most of your team were doing ${this.teamStatus["Anthony Donovan"]}.`;
  }

  _addTeamSection() {
    cardJSON.body[0].columns[0].items.splice(1, 0, ...this.teamCardSection);
    cardJSON.body[0].columns[0].items[3].spacing = "Padding";
  }
}

module.exports = { CheckIn };
