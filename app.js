const express = require("express");
const cors = require("cors");
const multer = require("multer");
const config = require("./config/config");

// Route imports
const analysisRoutes = require("./routes/analysisRoutes");
const linkedinRoutes = require("./routes/linkedinRoutes");
const viralityRoutes = require("./routes/viralityRoutes");
const imageRoutes = require("./routes/imageRoutes");

// ✅ NEW: Deepfake route
const deepfakeRoutes = require("./routes/deepfakeRoutes");

// AI service (for test route)
const { callAI } = require("./services/aiService");

const app = express();

// ─── Middleware ─────────────────────────────────────────

app.use(
  cors({
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Multer Setup (for image upload) ────────────────────

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─── Health Check ───────────────────────────────────────

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Misinformation Detection API is live.",
    version: "1.0.0",
    endpoints: {
      analyze: "POST /api/analyze",
      linkedinCheck: "POST /api/linkedin-check",
      virality: "POST /api/virality",
      imageAnalyze: "POST /api/image-analyze",
      deepfake: "POST /api/deepfake-detect 🚀 NEW"
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────

app.use("/api/analyze", analysisRoutes);
app.use("/api/linkedin-check", linkedinRoutes);
app.use("/api/virality", viralityRoutes);

// Image route
app.use("/api/image-analyze", upload.single("image"), imageRoutes);

// ✅ Deepfake route
app.use("/api/deepfake-detect", deepfakeRoutes);

// ─── TEST ROUTE (DEBUG AI) ─────────────────────────────

app.get("/test-ai", async (req, res) => {
  try {
    const result = await callAI(
      'Return ONLY valid JSON: {"message": "hello"}'
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Test route failed",
      message: err.message,
    });
  }
});

// ─── 404 Handler ───────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// ─── Global Error Handler ──────────────────────────────

app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: status === 500 ? "Internal Server Error" : err.message,
    message: err.message,
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
});

module.exports = app;