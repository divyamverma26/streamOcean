import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  //cors config
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" })); //config to accept json data
app.use(express.urlencoded({ limit: "16kb", extended: true })); //options in both are not necessary
app.use(express.static("public"));
app.use(cookieParser());

export default app;
