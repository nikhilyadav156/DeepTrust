require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",

  // 🔥 Groq Config (Primary AI)
 groq: {
  apiKey: process.env.GROQ_API_KEY,
  baseUrl: "https://api.groq.com/openai/v1/chat/completions",
  model: "llama-3.1-8b-instant",
  timeoutMs: 10000,
},

  // 🧠 Optional: Keep Gemini as fallback (recommended)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    baseUrl:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
    timeoutMs: 15000,
  },
};

// 🔐 Strict validation for Groq
if (!config.groq.apiKey) {
  console.error(
    "[Config] FATAL: GROQ_API_KEY is not set. Please check your .env file."
  );
  process.exit(1);
}

module.exports = config;