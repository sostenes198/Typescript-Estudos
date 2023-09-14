import * as mongoose from "mongoose";
import NewsSchema from "../models/newSchema";

export default mongoose.model("news", NewsSchema);
