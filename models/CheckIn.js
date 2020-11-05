var cloneDeep = require("lodash/fp/cloneDeep");

class CheckIn {
  constructor(cardJSON) {
    this.cardJSON = cardJSON;
    this.teamStatus = {};
    this.teamCardSection = [
      {
        type: "TextBlock",
        text: "How is your team doing?",
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
    this.teamSummaryOrder = ["great", "good", "ok", "not so great"];
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

  _getTeamSummary() {
    const feelingArray = this.teamSummaryOrder
      .map((feeling) => {
        if (Object.values(this.teamStatus).includes(feeling)) {
          const feelingEntry = Object.keys(this.teamStatus).filter(
            (name) => this.teamStatus[name] === feeling
          );
          return `${this._combineEntires(feelingEntry)} ${
            feelingEntry.length > 1 ? "were" : "was"
          } doing ${feeling}`;
        }
      })
      .filter((entry) => !!entry);

    return this._combineEntires(feelingArray);
  }

  _combineEntires(entries) {
    if (entries.length > 1) {
      return (
        entries.slice(0, entries.length - 1).join(", ") +
        " and " +
        entries[entries.length - 1]
      );
    }
    return entries[0];
  }

  _resetStatus() {
    this.teamStatus = {};
  }

  _updateTeamSection(cardJSON) {
    const teamSummary = this._getTeamSummary();
    cardJSON.body[0].columns[0].items[2].text = `In your last session ${teamSummary}.`;
  }

  _addTeamSection(cardJSON) {
    cardJSON.body[0].columns[0].items.splice(1, 0, ...this.teamCardSection);
    cardJSON.body[0].columns[0].items[3].spacing = "Padding";
  }
}

module.exports = { CheckIn };
