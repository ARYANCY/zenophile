const mongoose = require("mongoose"); 
const Metrics = require("../models/metrics");
const Todo = require("../models/todo");

exports.getDashboard = async (req, res) => {
  const userId = req.query.userId || req.session.userId;

  if (!userId) {
    return res.send("User ID is missing.");
  }

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : null;

  if (!userObjectId) return res.send("Invalid User ID");

  try {
    const metricsRecords = await Metrics.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(7)
      .lean();

    // Prepare chart data
    const chartLabels = metricsRecords
      .map(m => m.createdAt.toLocaleDateString())
      .reverse();

    const chartData = {
      stress_level: metricsRecords.map(m => m.metrics?.stress_level || 0).reverse(),
      happiness_level: metricsRecords.map(m => m.metrics?.happiness_level || 0).reverse(),
      anxiety_level: metricsRecords.map(m => m.metrics?.anxiety_level || 0).reverse(),
      overall_mood_level: metricsRecords.map(m => m.metrics?.overall_mood_level || 0).reverse()
    };

    const todosRecord = await Todo.findOne({ userId: userObjectId }).lean();
    const todos = todosRecord?.tasks || [];

    res.render("dashboard/dashboard", { chartLabels, chartData, todos });

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.send("Error fetching dashboard data.");
  }
};
