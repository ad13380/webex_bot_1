var cloneDeep = require("lodash/fp/cloneDeep");

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
    let cardJSON = cloneDeep(this.cardJSON);
    if (!!Object.keys(this.teamStatus).length) {
      this._addTeamSection(cardJSON);
      this._updateTeamSection(cardJSON);
    }
    this._resetStatus();
    return cardJSON;
  }

  addRecord({ name, feeling }) {
    this.teamStatus[name] = feeling;
  }

  _resetStatus() {
    this.teamStatus = {};
  }

  _updateTeamSection(cardJSON) {
    cardJSON.body[0].columns[0].items[2].text = `In your last session most of your team were doing ${this.teamStatus["Anthony Donovan"]}.`;
  }

  _addTeamSection(cardJSON) {
    cardJSON.body[0].columns[0].items.splice(1, 0, ...this.teamCardSection);
    cardJSON.body[0].columns[0].items[3].spacing = "Padding";
  }
}

module.exports = { CheckIn };
