const mongoose = require("mongoose");

const ScoketSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

const Socket = mongoose.model("sockets", ScoketSchema);
module.exports = { Socket };
