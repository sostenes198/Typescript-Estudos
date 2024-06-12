import Mongo from "./Mongo";

beforeAll(async () => {
  await Mongo.connect();
});

afterAll(async () => {
  await Mongo.disconnect();
});
