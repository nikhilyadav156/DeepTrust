const { callAI } = require("../services/aiService");
const { misinformationAnalysis } = require("../utils/promptTemplates");

/**
 * POST /api/analyze
 */
const analyzeText = async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: "The 'text' field is required and must be a non-empty string.",
    });
  }

  if (text.trim().length < 10) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: "Text must be at least 10 characters long for meaningful analysis.",
    });
  }

  try {
    const prompt = misinformationAnalysis(text.trim());
    const result = await callAI(prompt);

    // 🔥 Handle fallback from AI service
    if (!result.success) {
      return res.status(200).json(result);
    }

    const data = result.data;

    // ✅ Safe parsing
    const truthScore = Math.min(
      100,
      Math.max(0, parseInt(data.truthScore) || 50)
    );

    const validLabels = ["Real", "Fake", "Uncertain"];
    const label = validLabels.includes(data.label)
      ? data.label
      : "Uncertain";

    const validIntents = [
      "scam",
      "political",
      "satire",
      "clickbait",
      "health-misinformation",
      "general-misinformation",
      "legitimate",
      "unknown",
    ];

    const intent = validIntents.includes(data.intent)
      ? data.intent
      : "unknown";

    return res.status(200).json({
      success: true,
      data: {
        truthScore,
        label,
        explanation: data.explanation || "No explanation provided.",
        intent,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Analysis failed",
      message: error.message,
      fallback: {
        truthScore: 50,
        label: "Uncertain",
        explanation: "Analysis could not be completed at this time.",
        intent: "unknown",
      },
    });
  }
};

module.exports = { analyzeText };