const axios = require("axios");
const config = require("../config/config");

/**
 * Remove markdown code fences like ```json ... ```
 */
const stripCodeFences = (raw = "") => {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
};

/**
 * Extract and parse JSON safely from AI response
 */
const extractJson = (text) => {
  const cleaned = stripCodeFences(text);

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Try extracting JSON block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  throw new Error("Invalid JSON format in AI response");
};

/**
 * Base Groq API call
 */
const callGroqAPI = async (prompt) => {
  try {
    const response = await axios.post(
      config.groq.baseUrl,
      {
        model: config.groq.model || "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2
        // ❌ removed max_tokens (causing 400)
      },
      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: config.groq.timeoutMs,
      }
    );

    const rawText = response.data?.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Empty response from Groq");
    }

    return extractJson(rawText);

  } catch (error) {
    // 🔥 ADD THIS DEBUG (IMPORTANT)
    console.log("GROQ ERROR FULL:", error.response?.data || error.message);

    throw error;
  }
};
/**
 * Retry wrapper with exponential backoff
 */
const callAI = async (prompt, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await callGroqAPI(prompt);

      return {
        success: true,
        data,
      };

    } catch (error) {
      const status = error.response?.status;

      // 🔥 Handle rate limiting
      if (status === 429) {
        const delay = Math.pow(2, attempt) * 1000;

        if (attempt < retries - 1) {
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        return buildFallback("Rate limit exceeded");
      }

      // 🔥 Handle timeout
      if (error.code === "ECONNABORTED") {
        return buildFallback("Request timeout");
      }

      // 🔥 Retry on server errors
      if (status >= 500 && attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      // Final failure
      return buildFallback(error.message);
    }
  }

  return buildFallback("Unknown AI failure");
};

/**
 * Fallback response generator
 */
const buildFallback = (reason) => {
  return {
    success: false,
    error: "AI service unavailable",
    message: reason,

    // 🔽 Default safe structure for all APIs
    fallback: {
      truthScore: 50,
      label: "Uncertain",
      explanation: "AI analysis unavailable at the moment.",
      intent: "unknown",

      authenticityScore: 50,
      verdict: "Uncertain",
      redFlags: ["Analysis unavailable"],

      viralityScore: 25,
      trend: "Low",
      reasons: ["Analysis unavailable"],

      timeSeriesData: [
        { day: 1, reach: 200 },
        { day: 2, reach: 450 },
        { day: 3, reach: 900 },
        { day: 4, reach: 1500 },
        { day: 5, reach: 2200 },
        { day: 6, reach: 1800 },
        { day: 7, reach: 1200 },
      ],
    },
  };
};

module.exports = { callAI };