const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "DELIVERED", "READ"],
      default: "DELIVERED",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

const ChatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    messages: {
      type: [MessageSchema],
      required: true,
      default : []
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("chats", ChatSchema);

module.exports = { Chat };
