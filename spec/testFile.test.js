const Webex = require(`webex`);
const webex = Webex.init({
  credentials: {
    // this is a temporary token
    access_token:
      "NDFlYjA1MmEtYTVkOC00MTJjLTg0YmItNTI3NTlhZWE3OTIzZDRhYjU2NzUtY2Yy_PF84_consumer",
  },
});

describe("Creating a room and leaving", () => {
  async function createRoom() {
    webex.rooms
      .create({
        title: `Test Room`,
      })
      .then((room) => {
        return webex.memberships.create({
          roomId: room.id,
          personEmail: `pomobot@webex.bot`,
        });
      })
      // .then((membership) => {
      //   return webex.memberships.remove(membership);
      // })
      .catch((error) => {
        console.error(error);
      });
  }

  createRoom();

  // afterEach(() => {});

  // it("test", () => {
  //   expect(true).toEqual(true);
  // });
});
