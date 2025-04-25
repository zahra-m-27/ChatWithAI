const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

app.use(
  cors({
    origin: "*", // Replace with your frontend URL
  })
);
app.use(express.json()); // Use built-in middleware to parse JSON

const client = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

app.post("/chat", async (req, res) => {
  const { message } = req.body; // Destructure message from req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required" }); // Handle missing message
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message,
    });
    // console.log(response.candidates[0].content.parts[0].text);
    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    res.status(500).json({ error: "Error communicating with Gemini" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
