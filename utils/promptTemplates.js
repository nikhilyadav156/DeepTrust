/**
 * Centralized prompt templates for all Gemini API calls.
 * Each template enforces strict JSON output to ensure safe parsing.
 */

const promptTemplates = {
  /**
   * Misinformation detection prompt.
   * @param {string} text - The content to analyze.
   * @returns {string} Structured prompt string.
   */
  misinformationAnalysis: (text) => `
You are an expert fact-checker and misinformation analyst. Analyze the following text and return a structured JSON response.

TEXT TO ANALYZE:
"""
${text}
"""

Evaluate this text carefully and respond ONLY with a valid JSON object in this exact format:
{
  "truthScore": <integer between 0 and 100, where 0 is completely false and 100 is completely true>,
  "label": "<one of: Real | Fake | Uncertain>",
  "explanation": "<clear, concise explanation of your verdict in 2-3 sentences>",
  "intent": "<one of: scam | political | satire | clickbait | health-misinformation | general-misinformation | legitimate | unknown>"
}

Rules:
- truthScore 0-30 → label must be "Fake"
- truthScore 31-65 → label must be "Uncertain"
- truthScore 66-100 → label must be "Real"
- Be objective and evidence-based
- Do NOT include any text outside the JSON object
`,

  /**
   * LinkedIn profile authenticity prompt.
   * @param {Object} profile - Profile data object.
   * @returns {string} Structured prompt string.
   */
  linkedinAnalysis: ({ name, bio, company, experience }) => `
You are a professional investigator specializing in detecting fake or suspicious LinkedIn profiles. Analyze the following profile data and return a structured JSON response.

PROFILE DATA:
- Name: ${name || "Not provided"}
- Bio: ${bio || "Not provided"}
- Company: ${company || "Not provided"}
- Experience: ${experience || "Not provided"}

Evaluate this profile for authenticity and respond ONLY with a valid JSON object in this exact format:
{
  "authenticityScore": <integer between 0 and 100, where 0 is definitely fake and 100 is definitely real>,
  "verdict": "<one of: Likely Real | Suspicious>",
  "redFlags": [<array of strings, each describing a specific red flag found. Empty array if none.>],
  "explanation": "<clear explanation of your verdict in 2-3 sentences>"
}

Rules:
- authenticityScore >= 60 → verdict must be "Likely Real"
- authenticityScore < 60 → verdict must be "Suspicious"
- Red flags to look for: vague/generic bio, mismatched experience, implausible career jumps, keyword stuffing, suspicious company names, incomplete information
- Do NOT include any text outside the JSON object
`,

  /**
   * Virality prediction prompt.
   * @param {string} text - The content to analyze for virality.
   * @returns {string} Structured prompt string.
   */
  viralityPrediction: (text) => `
You are a social media expert and viral content analyst. Predict the virality potential of the following content and return a structured JSON response.

CONTENT TO ANALYZE:
"""
${text}
"""

Analyze this content's viral potential and respond ONLY with a valid JSON object in this exact format:
{
  "viralityScore": <integer between 0 and 100, where 0 has no viral potential and 100 is extremely viral>,
  "trend": "<one of: Low | Medium | High>",
  "reasons": [<array of 3-5 strings, each explaining a specific factor contributing to or reducing virality>]
}

Rules:
- viralityScore 0-33 → trend must be "Low"
- viralityScore 34-66 → trend must be "Medium"
- viralityScore 67-100 → trend must be "High"
- Consider: emotional appeal, controversy, relatability, shareability, timeliness, clarity, call-to-action
- Do NOT include any text outside the JSON object
`,
};

module.exports = promptTemplates;
