const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tasks: [
    {
      title: { type: String, required: true },
      completed: { type: Boolean, default: false },
      dueDate: { type: Date },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Todo", TodoSchema);
