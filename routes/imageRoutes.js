const express = require("express");
const router = express.Router();
const { analyzeImage } = require("../controllers/imageController");

router.post("/", analyzeImage);

module.exports = router;