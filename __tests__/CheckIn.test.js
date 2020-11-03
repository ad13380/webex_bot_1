const { CheckIn } = require("../models/CheckIn");

describe("CheckIn", () => {
  let checkIn;

  beforeEach(() => {
    checkIn = new CheckIn(null);
  });

  it("test", () => {
    checkIn.addRecord({ name: "Alex Smith", feeling: "ok" });
    checkIn.addRecord({ name: "Alan Shepherd", feeling: "not so great" });
    checkIn.addRecord({ name: "Daniel Johnson", feeling: "great" });
    checkIn.addRecord({ name: "Joesph Allen", feeling: "ok" });
    console.log(checkIn._getTeamSummary());
    // expect(checkIn.teamStatus).toEqual(true);
  });
});
