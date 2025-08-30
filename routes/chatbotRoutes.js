const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

router.get("/", chatbotController.getChatbot);
router.post("/", chatbotController.postChatbot);

module.exports = router;
