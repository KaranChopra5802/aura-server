const { model, Schema } = require("mongoose");
const { createHmac, randomBytes } = require("crypto");


const chatInfo = new Schema({
  socketID: {
    type: String,
    default: null
  },
  chatID: {
    type: Schema.Types.ObjectId,
    ref: "chats",
    required: true,
  },
});

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    hobbies: [
      {
        type: String,
      },
    ],
    dateOfBirth: {
      type: Date,
      required: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageUrl: {
      type: String,
    },
    gender: {
      type: String,
      required: true,
    },
    timeAccountCreation: {
      type: Date,
      default: Date.now,
    },
    auraPoints: {
      type: Number,
      default: 50,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    status: {
      type: Boolean,
      default: false,
    },
    pushId: {
      type: String,
    },
    mood: {
      type: String,
    },
    address: {
      addressLine1: {
        type: String,
      },
      addressLine2: {
        type: String,
      },
      pincode: {
        type: Number,
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    lastLoggedAt: {
      type: Date,
    },
    pointsReceived: {
      type: [Schema.Types.ObjectId],
      ref: "payments",
    },
    pointsSent: {
      type: [Schema.Types.ObjectId],
      ref: "payments",
    },
    chats: {
      type: [Schema.Types.ObjectId],
      ref: "chats",
      default: []
    },
    chatInfo: {
      type: [chatInfo],
      default: [],
    },
    eventsCreated: {
      type: [Schema.Types.ObjectId],
      ref: "events",
      default: [],
    },
    eventsJoined: {
      type: [Schema.Types.ObjectId],
      ref: "events",
      default: [],
    },
  },
  { timestamps: true }
);



userSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) return;
  const salt = randomBytes(16).toString();
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashedPassword;

  next();
});

const User = model("users", userSchema);

module.exports = { User };
