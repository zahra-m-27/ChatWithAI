const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto"); // To generate unique session IDs
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("FATAL ERROR: API_KEY environment variable is not set.");
  process.exit(1); // Exit if API key is missing
}

const allowedOrigins = [
  "https://chat-with-ai-s71j.onrender.com",
  "http://localhost:5173",
];
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// --- In-Memory Session Storage (Simple Demo - Lost on Restart) ---
// Key: sessionId (string)
// Value: ChatSession object
const chatSessions = new Map();

// --- API Endpoint for Chat ---
app.post("/chat", async (req, res) => {
  const { message, clientSessionId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  let currentSessionId = clientSessionId;
  let chatSession;

  try {
    // Find or Create Chat Session
    if (currentSessionId && chatSessions.has(currentSessionId)) {
      // Session exists, retrieve it
      console.log(`Existing session found: ${currentSessionId}`);
      chatSession = chatSessions.get(currentSessionId);
    } else {
      // No session ID provided or session not found, start a new one
      console.log("Starting new chat session...");
      chatSession = model.startChat({
        history: [], // Start with empty history
        // You can add generationConfig here if needed
      });
      // Generate a new unique ID for this session
      currentSessionId = crypto.randomUUID();
      chatSessions.set(currentSessionId, chatSession); // Store the new session
      console.log(`New session created: ${currentSessionId}`);
    }

    // 3. Send Message using the ChatSession
    const result = await chatSession.sendMessage(message);
    const response = result.response;
    const replyText = response.text();

    // Optional: Clean up blocked responses if necessary (check promptFeedback)
    if (response.promptFeedback?.blockReason) {
      console.warn(
        `Request blocked: ${response.promptFeedback.blockReason}`,
        response.promptFeedback
      );
      // You might want to return a specific message indicating the block
      return res.status(400).json({
        error: `Request blocked due to safety settings (${response.promptFeedback.blockReason}). Please modify your prompt.`,
        sessionId: currentSessionId, // Still return sessionId
      });
    }

    // 4. Send Response back to Client
    console.log(`Responding to session ${currentSessionId}`);
    res.status(200).json({
      reply: replyText,
      sessionId: currentSessionId, // Always return the sessionId
    });
  } catch (error) {
    console.error("Error during chat processing:", error);
    // Try to include session ID in error if available
    const errorResponse = {
      error: "Error communicating with Gemini or processing request",
    };
    if (currentSessionId) {
      errorResponse.sessionId = currentSessionId;
    }
    res.status(500).json(errorResponse);
  }
});

// --- Simple endpoint to clear sessions (for testing) ---
app.post("/clear-sessions", (req, res) => {
  const initialCount = chatSessions.size;
  chatSessions.clear();
  console.log(`Cleared ${initialCount} chat sessions.`);
  res.status(200).json({ message: `Cleared ${initialCount} chat sessions.` });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using model: ${model.model}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});
