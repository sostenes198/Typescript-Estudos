import Mongo from "../Mongo";
import { BaseConfigs } from "../base.configs";
import { TestObj } from "../types";

describe("TestContainer", () => {
  it("Should validate running container from test container", async () => {
    // arrange - act
    await Mongo.Populate(BaseConfigs.DefaultObjs);

    // assert
    const result: TestObj[] | undefined = await Mongo.ListAll();

    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(result).toStrictEqual(BaseConfigs.DefaultObjs);
  });
});