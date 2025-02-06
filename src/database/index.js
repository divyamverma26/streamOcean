import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(`DB connected on host: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.error("Connection with database failed");
    process.exit(1);
  }
};

export default connectDb;
