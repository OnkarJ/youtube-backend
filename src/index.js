// require("dotenv").config({ path: "./.env" }); // another way to import dotenv, we need to import dot env ASAP in the application, so that it is available in all places.

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// telling dotenv the path of our env file
dotenv.config({
  path: "./.env",
});

// APPROACH 2: TAKE A SEPARATE FILE DB WRITE CODE THERE AND JUST IMPORT IT IN MAIN FILE
connectDB()
  .then(() => {
    // after connecting to database, we will start the server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection FAILED !!!", err);
  });

// APPROACH 1: TO CONNECT TO DATABASE BY AN IFFE OR CALLING A SIMPLE CONNECTDB() FUNCTION
/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error: ", error);
  }
})();
*/
