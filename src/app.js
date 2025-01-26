import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
); // need to enable CORS
app.use(express.json({ limit: "16kb" })); // to access json data from request body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to access url data from request body
app.use(express.static("public")); // to access static files from public folder
app.use(cookieParser()); // to parse cookies from request

// ROUTES IMPORT (yes, this is imported later to keep it separate)
import userRouter from "./routes/user.routes.js";

// ROUTES DECLARATION
// main url is like this: https://localhost:8000/api/v1/users/register or https://localhost:8000/api/v1/users/login, "/users" will push to the router
app.use("/api/v1/users", userRouter); // we use to write app.get("/", () => {}), but we are segregating code file wise

export { app };
