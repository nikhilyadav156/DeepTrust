const app = require("./app");
const config = require("./config/config");

const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

// File upload setup
const upload = multer({ dest: "uploads/" });

// 🔥 Deepfake Detection Route (FAST DEMO VERSION)
app.post("/api/deepfake-detect", upload.single("video"), (req, res) => {
  try {
    const videoPath = req.file.path;
    const outputDir = path.join(__dirname, "frames");

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    ffmpeg(videoPath)
      .output(`${outputDir}/frame-%03d.jpg`)
      .on("end", () => {
        // ⚡ Demo logic (replace with ML later)
        const score = Math.random();

        res.json({
          result: score > 0.5 ? "Fake" : "Real",
          confidence: (score * 100).toFixed(2) + "%",
          message: "Frame analysis completed"
        });

        // cleanup
        fs.unlinkSync(videoPath);
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).json({ error: "Video processing failed" });
      })
      .run();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// 🚀 Start server
const server = app.listen(config.port, () => {
  console.log(`\n🚀 Server running in ${config.nodeEnv} mode`);
  console.log(`📡 Listening on http://localhost:${config.port}`);

  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${config.port}/health`);
  console.log(`   POST http://localhost:${config.port}/api/analyze`);
  console.log(`   POST http://localhost:${config.port}/api/linkedin-check`);
  console.log(`   POST http://localhost:${config.port}/api/virality`);
  console.log(`   POST http://localhost:${config.port}/api/image-analyze`);
  console.log(`   POST http://localhost:${config.port}/api/deepfake-detect 🚀 NEW\n`);
});


// 🛑 Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  server.close(() => process.exit(1));
});