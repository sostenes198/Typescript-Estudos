import * as mongoose from "mongoose";

class Database {
  private DB_URL = "mongodb://root:Password@localhost:27017/db_portal";

  createConnection() {
    mongoose.set('strictQuery', false);
    mongoose.connect(this.DB_URL);
  }
}

export default Database;