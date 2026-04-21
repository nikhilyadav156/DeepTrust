const express = require("express");
const router = express.Router();
const { analyzeText } = require("../controllers/analysisController");

/**
 * @route   POST /api/analyze
 * @desc    Analyze text for misinformation
 * @access  Public
 * @body    { text: string }
 */
router.post("/", analyzeText);

module.exports = router;
