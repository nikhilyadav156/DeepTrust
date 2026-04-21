const { callAI } = require("../services/aiService");
const { viralityPrediction } = require("../utils/promptTemplates");

/**
 * Generates mock time-series data
 */
const generateTimeSeriesData = (viralityScore) => {
  const days = 7;
  const baseReach = Math.round(viralityScore * 10);
  const growthMultipliers = [1, 2.1, 4.5, 7.2, 9.8, 8.3, 6.1];

  return Array.from({ length: days }, (_, i) => {
    const noise = Math.round((Math.random() - 0.5) * baseReach * 0.2);
    const reach = Math.max(
      0,
      Math.round(baseReach * growthMultipliers[i] + noise)
    );

    return {
      day: i + 1,
      label: `Day ${i + 1}`,
      reach,
    };
  });
};

/**
 * POST /api/virality
 */
const predictVirality = async (req, res) => {
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
      message: "Text must be at least 10 characters long for virality analysis.",
    });
  }

  try {
    const prompt = viralityPrediction(text.trim());
    const result = await callAI(prompt);

    // 🔥 Handle fallback from AI service
    if (!result.success) {
      return res.status(200).json(result);
    }

    const data = result.data;

    // ✅ Safe parsing
    const viralityScore = Math.min(
      100,
      Math.max(0, parseInt(data.viralityScore) || 30)
    );

    const validTrends = ["Low", "Medium", "High"];
    const trend = validTrends.includes(data.trend)
      ? data.trend
      : viralityScore <= 33
      ? "Low"
      : viralityScore <= 66
      ? "Medium"
      : "High";

    const reasons = Array.isArray(data.reasons)
      ? data.reasons.filter((r) => typeof r === "string").slice(0, 5)
      : ["No specific reasons identified."];

    const timeSeriesData = generateTimeSeriesData(viralityScore);

    return res.status(200).json({
      success: true,
      data: {
        viralityScore,
        trend,
        reasons,
        timeSeriesData,
      },
    });

  } catch (error) {
    const fallbackScore = 25;

    return res.status(500).json({
      success: false,
      error: "Virality prediction failed",
      message: error.message,
      fallback: {
        viralityScore: fallbackScore,
        trend: "Low",
        reasons: ["Analysis unavailable at this time."],
        timeSeriesData: generateTimeSeriesData(fallbackScore),
      },
    });
  }
};

module.exports = { predictVirality };