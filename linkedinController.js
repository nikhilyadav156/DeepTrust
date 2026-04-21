const { callAI } = require("../services/aiService");
const { linkedinAnalysis } = require("../utils/promptTemplates");

/**
 * POST /api/linkedin-check
 */
const checkLinkedInProfile = async (req, res) => {
  const { name, bio, company, experience } = req.body;

  const hasContent = [name, bio, company, experience].some(
    (field) => field && typeof field === "string" && field.trim().length > 0
  );

  if (!hasContent) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message:
        "At least one profile field (name, bio, company, experience) must be provided.",
    });
  }

  const profile = {
    name: name?.trim() || "",
    bio: bio?.trim() || "",
    company: company?.trim() || "",
    experience: experience?.trim() || "",
  };

  try {
    const prompt = linkedinAnalysis(profile);
    const result = await callAI(prompt);

    // 🔥 Handle fallback from AI service
    if (!result.success) {
      return res.status(200).json(result);
    }

    const data = result.data;

    // ✅ Safe parsing
    const authenticityScore = Math.min(
      100,
      Math.max(0, parseInt(data.authenticityScore) || 50)
    );

    const validVerdicts = ["Likely Real", "Suspicious"];
    const verdict = validVerdicts.includes(data.verdict)
      ? data.verdict
      : authenticityScore >= 60
      ? "Likely Real"
      : "Suspicious";

    const redFlags = Array.isArray(data.redFlags)
      ? data.redFlags.filter((f) => typeof f === "string")
      : [];

    return res.status(200).json({
      success: true,
      data: {
        authenticityScore,
        verdict,
        redFlags,
        explanation: data.explanation || "No explanation provided.",
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Profile check failed",
      message: error.message,
      fallback: {
        authenticityScore: 50,
        verdict: "Suspicious",
        redFlags: ["Unable to complete analysis"],
        explanation: "Profile analysis could not be completed at this time.",
      },
    });
  }
};

module.exports = { checkLinkedInProfile };