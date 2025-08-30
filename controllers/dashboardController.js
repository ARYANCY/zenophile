const Metrics = require("../models/metrics");
const Todo = require("../models/todo");

exports.getDashboard = async (req, res) => {
  const userId = req.query.userId || req.session.userId;

  if (!userId) {
    return res.send("User ID is missing.");
  }

  try {
    // Fetch latest 7 metrics
    const metricsRecords = await Metrics.find({ userId })
      .sort({ createdAt: -1 })
      .limit(7);

    // Prepare chart data
    const chartLabels = metricsRecords.map(m => m.createdAt.toLocaleDateString()).reverse();
    const chartData = {
      stress_level: metricsRecords.map(m => m.metrics.stress_level).reverse(),
      happiness_level: metricsRecords.map(m => m.metrics.happiness_level).reverse(),
      anxiety_level: metricsRecords.map(m => m.metrics.anxiety_level).reverse(),
      overall_mood_level: metricsRecords.map(m => m.metrics.overall_mood_level).reverse()
    };

    // Fetch todos
    const todosRecord = await Todo.findOne({ userId });
    const todos = todosRecord ? todosRecord.tasks : [];

    res.render("dashboard/dashboard", { chartLabels, chartData, todos });

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.send("Error fetching dashboard data.");
  }
};
