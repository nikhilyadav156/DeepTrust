const express = require("express");
const router = express.Router();
const { predictVirality } = require("../controllers/viralityController");

/**
 * @route   POST /api/virality
 * @desc    Predict the virality score of content
 * @access  Public
 * @body    { text: string }
 */
router.post("/", predictVirality);

module.exports = router;
