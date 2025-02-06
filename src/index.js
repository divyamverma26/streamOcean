import connectDb from "./database/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`app is listening on: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => console.log("DB connection failed", err));
