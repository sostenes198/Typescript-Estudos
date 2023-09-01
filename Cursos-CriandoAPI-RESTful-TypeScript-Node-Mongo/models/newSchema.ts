import * as mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
  title: { type: String },
  text: { type: String },
  author: { type: String },
  active: { type: Boolean }
});

export default NewsSchema;