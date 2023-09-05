import * as mongoose from "mongoose";

class Database {
  private DB_URL = `mongodb://root:Password@${this.GetName()}:27017/db_portal`;

  createConnection() {
    mongoose.set('strictQuery', false);

    console.log(this.DB_URL);
    mongoose.connect(this.DB_URL);
  }

  private GetName(): string {
    return Boolean(process.env.RUN_IN_DOCKER)
      ? "mongo"
      : "localhost";
  }
}

export default Database;