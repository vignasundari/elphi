const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= FILE UPLOAD SETUP ================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

/* ================= MONGODB CONNECTION ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ================= USER SCHEMA ================= */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

/* ================= TASK SCHEMA ================= */
const taskSchema = new mongoose.Schema({
  email: { type: String, required: true },
  dateKey: { type: String, required: true },
  tasks: [
    {
      name: String,
      status: { type: String, default: "Not Started" },
    },
  ],
});

taskSchema.index({ email: 1, dateKey: 1 }, { unique: true });

const Task = mongoose.model("Task", taskSchema);

/* ================= ROOM MESSAGE SCHEMA ================= */
const roomMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  text: String,
  sender: String,
  createdAt: { type: Date, default: Date.now },
});

roomMessageSchema.index({ roomId: 1, createdAt: 1 });

const RoomMessage = mongoose.model("RoomMessage", roomMessageSchema);

/* ================= NOTE SCHEMA ================= */
const noteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  uploaderName: String,
  semester: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  fileName: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now },
});

noteSchema.index({ subject: 1 });
noteSchema.index({ email: 1 });

const Note = mongoose.model("Note", noteSchema);

/* ================= SIGNUP ================= */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Wrong password" });

    res.json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

/* ================= AI CHAT PROXY ================= */
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ message: "Message is required" });

    const payload = {
      contents: [{ role: "user", parts: [{ text: message }] }],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: result?.error?.message || "AI service error",
      });
    }

    const reply =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI";

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI connection error" });
  }
});

/* ================= START SERVER ================= */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});