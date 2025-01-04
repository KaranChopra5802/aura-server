const { model, Schema } = require("mongoose");

const paymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionTime: {
    type: Date,
    default: Date.now,
  },
});

const Payments = model("payments", paymentSchema);

module.exports = { Payments };
