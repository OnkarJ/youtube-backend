import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// need to enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(expree.json({ limit: "16kb" })); // to access json data from request body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to access url data from request body
app.use(express.static("public")); // to access static files from public folder
app.use(cookieParser()); // to parse cookies from request

export { app };
