const express = require("express");
const router = express.Router();
const { checkLinkedInProfile } = require("../controllers/linkedinController");

/**
 * @route   POST /api/linkedin-check
 * @desc    Analyze a LinkedIn profile for authenticity
 * @access  Public
 * @body    { name: string, bio: string, company: string, experience: string }
 */
router.post("/", checkLinkedInProfile);

module.exports = router;
