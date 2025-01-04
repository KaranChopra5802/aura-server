const { model, Schema } = require("mongoose");

const eventSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  joinees: {
    type: [Schema.Types.ObjectId],
    ref: "users",
    default: [],
  },
  editedJoinees: {
    type: [Schema.Types.ObjectId],
    ref: "users",
    default: [],
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  isEdited:{
    type: Boolean,
    default: false
  },
  attendedBy:{
    type: [Schema.Types.ObjectId],
    ref: "users",
    default: []
  }, createdAt:{
    type: Date,
    default: Date.now
  }
});

const Events = model("events", eventSchema);

module.exports = { Events };
