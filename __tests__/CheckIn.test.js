const { CheckIn } = require("../models/CheckIn");
const cardJson = require("../templates/checkInCardJSON");

describe("CheckIn", () => {
  let checkIn;

  beforeEach(() => {
    checkIn = new CheckIn(cardJson);
  });

  describe("generates a check in card json", () => {
    it("when there are no team status records", () => {
      expect(checkIn.getCard()).toEqual(cardJson);
    });

    it("with a team summary section when there is a team status record", () => {
      checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
      let expectedResult = [
        {
          color: "Accent",
          text: "Team Check In",
          type: "TextBlock",
          weight: "Lighter",
        },
        {
          color: "Dark",
          size: "Large",
          spacing: "Small",
          text: "How is your team doing?",
          type: "TextBlock",
        },
        {
          horizontalAlignment: "Left",
          spacing: "Padding",
          text: "In your last session Alex Smith was doing ok.",
          type: "TextBlock",
          wrap: true,
        },
        {
          color: "Dark",
          horizontalAlignment: "Left",
          size: "Large",
          spacing: "Padding",
          text: "How are you doing?",
          type: "TextBlock",
          wrap: true,
        },
      ];
      expect(checkIn.getCard().body[0].columns[0].items).toEqual(
        expectedResult
      );
    });
  });

  describe("gives an accuarte team summary", () => {
    it("for a single entry", () => {
      checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
      expect(checkIn.getCard().body[0].columns[0].items[2].text).toEqual(
        "In your last session Alex Smith was doing ok."
      );
    });

    it("for two entries of the same feeling", () => {
      checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
      checkIn.addRecord({ name: "Joseph Allen", feeling: "ok" });
      expect(checkIn.getCard().body[0].columns[0].items[2].text).toEqual(
        "In your last session Alex Smith and Joseph Allen were doing ok."
      );
    });

    it("for several entries of the same feeling", () => {
      checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
      checkIn.addRecord({ name: "Joseph Allen", feeling: "ok" });
      checkIn.addRecord({ name: "Daniel Johnson", feeling: "ok" });
      expect(checkIn.getCard().body[0].columns[0].items[2].text).toEqual(
        "In your last session Alex Smith, Joseph Allen and Daniel Johnson were doing ok."
      );
    });

    it("for several entries with several different feelings", () => {
      checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
      checkIn.addRecord({ name: "Alan Shepherd", feeling: "not so great" });
      checkIn.addRecord({ name: "Daniel Johnson", feeling: "great" });
      checkIn.addRecord({ name: "Joseph Allen", feeling: "ok" });
      checkIn.addRecord({ name: "Amy Wilson", feeling: "ok" });
      checkIn.addRecord({ name: "Grace Watson", feeling: "great" });
      checkIn.addRecord({ name: "Owen Cooper", feeling: "good" });
      expect(checkIn.getCard().body[0].columns[0].items[2].text).toEqual(
        "In your last session Daniel Johnson and Grace Watson were doing great, Owen Cooper was doing good, Alex Smith, Joseph Allen and Amy Wilson were doing ok and Alan Shepherd was doing not so great."
      );
    });

    it("for an entry that has been changed between check ins", () => {
      checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
      checkIn.addRecord({ name: "Alex Smith", feeling: "good" });
      expect(checkIn.getCard().body[0].columns[0].items[2].text).toEqual(
        "In your last session Alex Smith was doing good."
      );
    });
  });
});
