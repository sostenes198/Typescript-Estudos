import { Collection, MongoClient } from "mongodb";
import { TestObj } from "./types";

class Mongo {
  private static _dbName: string = "test";
  private static _collection: string = "test-container";

  private readonly _client: MongoClient;
  private _collection?: Collection<TestObj>;

  public constructor() {
    this._client = new MongoClient("mongodb://localhost:27017/?directConnection=true");
  }

  public async connect(): Promise<void> {
    await this._client.connect();
    this._collection = this._client.db(Mongo._dbName).collection(Mongo._collection);
  }

  public async disconnect(): Promise<void> {
    await this._client.close();
  }

  public async Populate(testObjs: Array<TestObj>): Promise<void> {
    await this._collection?.insertMany(testObjs);
  }

  public async ListAll(): Promise<TestObj[] | undefined> {
    return await this._collection?.find<TestObj>({}).toArray();
  }
}

export default new Mongo();