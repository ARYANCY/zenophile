const mongoose = require("mongoose");

const MetricsSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  message: { type: String, required: true },
  metrics: {
    stress_level: { type: Number, default: 0 },
    happiness_level: { type: Number, default: 0 },
    anxiety_level: { type: Number, default: 0 },
    focus_level: { type: Number, default: 0 },
    energy_level: { type: Number, default: 0 },
    confidence_level: { type: Number, default: 0 },
    motivation_level: { type: Number, default: 0 },
    calmness_level: { type: Number, default: 0 },
    sadness_level: { type: Number, default: 0 },
    loneliness_level: { type: Number, default: 0 },
    gratitude_level: { type: Number, default: 0 },
    overall_mood_level: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Metrics", MetricsSchema);
