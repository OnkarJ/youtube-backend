import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

// APPROACH 2: TAKE A SEPARATE FILE DB WRITE CODE THERE AND JUST IMPORT IT IN MAIN FILE
connectDB()
  .then(() => {
    // after connecting to database, we will start the server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
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
