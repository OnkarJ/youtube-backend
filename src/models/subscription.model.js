import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // one who is subscribing
      refs: "User",
    },
    channel: {
      // one to whom the "subscriber" is subcribing
      type: mongoose.Schema.Types.ObjectId,
      refs: "User",
    },
  },
  { timeStamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
