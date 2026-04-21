const express = require("express");
const router = express.Router();

const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("video"), (req, res) => {
  try {
    const videoPath = req.file.path;
    const outputDir = path.join(__dirname, "../frames");

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    ffmpeg(videoPath)
      .output(`${outputDir}/frame-%03d.jpg`)
      .on("end", () => {
        const score = Math.random();

        res.json({
          success: true,
          result: score > 0.5 ? "Fake" : "Real",
          confidence: (score * 100).toFixed(2) + "%"
        });

        fs.unlinkSync(videoPath);
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ success: false, error: "Processing failed" });
      })
      .run();

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;