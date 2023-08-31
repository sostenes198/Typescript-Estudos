import * as mongoose from 'mongoose';

class Db {
    private DB_URL = 'mongodb://root:Password@localhost:27017/db_portal';

    createConnection() {
        mongoose.connect(this.DB_URL);
    }
}

export default Db;