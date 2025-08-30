const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const Metrics = require("../models/metrics");
const Todo = require("../models/todo");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory session storage
let userSessions = {};

// Helper to clean AI JSON strings
function cleanJsonString(str) {
  if (!str) return "{}";
  return str.trim().replace(/^```json\s*/, '').replace(/```$/, '').trim();
}

// --- GET Chatbot Page ---
exports.getChatbot = (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId).toString();
    if (!userSessions[userId]) {
      userSessions[userId] = {
        messages: [
          { sender: "bot", text: "Hello! I’m your therapist chatbot. How are you feeling today?" }
        ]
      };
    }
    res.render("chatbot/chatbot", {
      messages: userSessions[userId].messages,
      sessionID: userId
    });
  } catch (err) {
    console.error("Error rendering chatbot:", err);
    res.status(500).send("Internal Server Error");
  }
};

// --- POST Chatbot Message ---
exports.postChatbot = async (req, res) => {
  const rawUserId = req.session.userId;
  if (!rawUserId) return res.status(400).send("Session not initialized.");

  const userId = new mongoose.Types.ObjectId(rawUserId).toString();

  if (!userSessions[userId]) userSessions[userId] = { messages: [] };
  const session = userSessions[userId];

  const { message } = req.body;
  session.messages.push({ sender: "user", text: message });

  try {
    const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const history = session.messages.map(m => `${m.sender}: ${m.text}`).join("\n");

    // --- Chatbot Response ---
    let botResponse = "";
    try {
      const chatbotPrompt = `
        You are a friendly therapist chatbot.
        Conversation so far:
        ${history}
        User just said: "${message}"
        Respond empathetically and naturally.
      `;
      const chatbotResult = await model.generateContent(chatbotPrompt);
      botResponse = typeof chatbotResult.response.text === "function"
        ? chatbotResult.response.text()
        : chatbotResult.response.text;
    } catch (err) {
      console.error("Chatbot generation error:", err);
      botResponse = "Sorry, I couldn't process that message.";
    }
    session.messages.push({ sender: "bot", text: botResponse });

    // --- Metrics Generation ---
    let metricsData = {};
    try {
      const metricsPrompt = `
        Analyze user's emotional state (0-50 scale):
        stress_level, happiness_level, anxiety_level, focus_level,
        energy_level, confidence_level, motivation_level, calmness_level,
        sadness_level, loneliness_level, gratitude_level, overall_mood_level
        User message: "${message}"
        Respond ONLY in strict JSON format.
      `;
      const metricsResult = await model.generateContent(metricsPrompt);
      metricsData = JSON.parse(cleanJsonString(
        typeof metricsResult.response.text === "function"
          ? metricsResult.response.text()
          : metricsResult.response.text
      ));
    } catch (err) {
      console.error("Failed to parse metrics JSON:", err);
      metricsData = {};
    }

    // --- Save Metrics ---
    try {
      await Metrics.create({
        userId: new mongoose.Types.ObjectId(rawUserId),
        message,
        metrics: metricsData,
        createdAt: new Date()
      });
    } catch (err) {
      console.error("Failed to save metrics:", err);
    }

    // --- TODOs Generation ---
    let todosData = [];
    try {
      const todoPrompt = `
        Based on these metrics (0-50):
        ${JSON.stringify(metricsData, null, 2)}
        Suggest 5 actionable tasks for the user to improve well-being.
        Respond ONLY in JSON: { "todos": [ { "title": "...", "completed": false }, ... ] }
      `;
      const todoResult = await model.generateContent(todoPrompt);
      todosData = JSON.parse(cleanJsonString(
        typeof todoResult.response.text === "function"
          ? todoResult.response.text()
          : todoResult.response.text
      )).todos || [];
    } catch (err) {
      console.error("Failed to parse todos JSON:", err);
      todosData = [];
    }

    // --- Save TODOs ---
    try {
      await Todo.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(rawUserId) },
        { tasks: todosData, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Failed to save todos:", err);
    }

    // --- Render Page ---
    res.render("chatbot/chatbot", { messages: session.messages, sessionID: userId });

  } catch (err) {
    console.error("Gemini API error:", err);
    session.messages.push({
      sender: "bot",
      text: "Sorry, I'm having trouble responding right now."
    });
    res.render("chatbot/chatbot", { messages: session.messages, sessionID: userId });
  }
};
