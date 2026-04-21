const Tesseract = require("tesseract.js");
const { callAI } = require("../services/aiService");
const { misinformationAnalysis } = require("../utils/promptTemplates");

/**
 * Clean OCR text (remove noise, extra spaces, weird chars)
 */
const cleanText = (text = "") => {
  return text
    .replace(/\n+/g, " ")
    .replace(/[^\w\s.,!?%$₹@-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * POST /api/image-analyze
 */
const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Image file is required",
      });
    }

    // 🧠 OCR extraction (optimized)
    const ocrResult = await Tesseract.recognize(
      req.file.buffer,
      "eng",
      {
        logger: () => {}, // 🔇 disable logs (clean console)
      }
    );

    let extractedText = cleanText(ocrResult.data.text);

    // ❌ If text too small → reject early
    if (!extractedText || extractedText.length < 15) {
      return res.status(400).json({
        success: false,
        error: "Low text detected",
        message:
          "Could not extract meaningful text. Try a clearer image or screenshot with readable content.",
      });
    }

    // 🔥 Limit text (avoid token explosion)
    extractedText = extractedText.slice(0, 1000);

    // 🤖 AI Analysis
    const prompt = misinformationAnalysis(extractedText);
    const aiResult = await callAI(prompt);

    // 🔁 If AI fails → pass fallback directly
    if (!aiResult.success) {
      return res.status(200).json({
        ...aiResult,
        extractedText,
      });
    }

    const data = aiResult.data;

    // ✅ Safe parsing
    const truthScore = Math.min(
      100,
      Math.max(0, parseInt(data.truthScore) || 50)
    );

    const validLabels = ["Real", "Fake", "Uncertain"];
    const label = validLabels.includes(data.label)
      ? data.label
      : "Uncertain";

    const intent = data.intent || "unknown";

    return res.status(200).json({
      success: true,
      data: {
        extractedText,
        truthScore,
        label,
        explanation:
          data.explanation || "No explanation provided.",
        intent,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Image analysis failed",
      message: error.message,
      fallback: {
        truthScore: 50,
        label: "Uncertain",
        explanation: "Could not analyze the image at this time.",
        intent: "unknown",
      },
    });
  }
};

module.exports = { analyzeImage };