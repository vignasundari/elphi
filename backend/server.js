require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

/* ================= FILE UPLOAD SETUP ================= */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max

/* ================= MONGODB CONNECTION ================= */
mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================= USER SCHEMA ================= */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", userSchema);

/* ================= TASK SCHEMA ================= */
const taskSchema = new mongoose.Schema({
  email: { type: String, required: true },
  dateKey: { type: String, required: true },
  tasks: [{
    name: String,
    status: { type: String, default: "Not Started" }
  }]
});
taskSchema.index({ email: 1, dateKey: 1 }, { unique: true });

const Task = mongoose.model("Task", taskSchema);

/* ================= STREAK SCHEMA ================= */
const streakSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  currentStreak: { type: Number, default: 1 },
  lastLoginDate: { type: String, required: true }
});

const Streak = mongoose.model("Streak", streakSchema);

/* ================= STUDY ROOM MESSAGE SCHEMA ================= */
const roomMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  text: String,
  sender: String,
  createdAt: { type: Date, default: Date.now }
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
  uploadedAt: { type: Date, default: Date.now }
});
noteSchema.index({ subject: 1 });
noteSchema.index({ email: 1 });

const Note = mongoose.model("Note", noteSchema);

/* ================= SIGNUP ================= */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
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
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

/* ================= AI CHAT PROXY ================= */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in .env");
      return res.status(500).json({ message: "AI service not configured" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const payload = {
      contents: [{ role: "user", parts: [{ text: message }] }],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", result);
      return res.status(response.status).json({
        message: result?.error?.message || "AI service error"
      });
    }

    const reply =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't get a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat proxy error:", error);
    res.status(500).json({ message: "Error connecting to AI service" });
  }
});

/* ================= STREAK ENDPOINTS ================= */

// POST - update streak on login
app.post("/api/streak/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    const today = new Date().toISOString().split("T")[0];
    const existing = await Streak.findOne({ email });

    if (!existing) {
      const streak = new Streak({ email, currentStreak: 1, lastLoginDate: today });
      await streak.save();
      return res.json({ currentStreak: 1 });
    }

    if (existing.lastLoginDate === today) {
      return res.json({ currentStreak: existing.currentStreak });
    }

    const lastDate = new Date(existing.lastLoginDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak;
    if (diffDays === 1) {
      newStreak = existing.currentStreak + 1;
    } else {
      newStreak = 1;
    }

    existing.currentStreak = newStreak;
    existing.lastLoginDate = today;
    await existing.save();

    return res.json({ currentStreak: newStreak });
  } catch (error) {
    console.error("Streak update error:", error);
    res.status(500).json({ message: "Error updating streak" });
  }
});

// GET - fetch current streak for a user
app.get("/api/streak", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "email required" });
    const streak = await Streak.findOne({ email });
    res.json({ currentStreak: streak?.currentStreak || 0 });
  } catch (error) {
    console.error("Get streak error:", error);
    res.status(500).json({ message: "Error fetching streak" });
  }
});

/* ================= TASK ENDPOINTS ================= */

// GET tasks for a user + date
app.get("/api/tasks", async (req, res) => {
  try {
    const { email, dateKey } = req.query;
    if (!email || !dateKey) {
      return res.status(400).json({ message: "email and dateKey required" });
    }
    const doc = await Task.findOne({ email, dateKey });
    res.json({ tasks: doc ? doc.tasks : [] });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// GET all tasks for a user in a given month (for calendar view)
app.get("/api/tasks/month", async (req, res) => {
  try {
    const { email, year, month } = req.query;
    if (!email || !year || !month) {
      return res.status(400).json({ message: "email, year, and month required" });
    }
    // dateKey format is like "Mon Feb 24 2026" — we search by regex
    const docs = await Task.find({ email });
    // Filter by matching year and month from the dateKey string
    const filtered = docs.filter(doc => {
      const d = new Date(doc.dateKey);
      return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month);
    });
    const result = {};
    filtered.forEach(doc => {
      result[`tasks-${doc.dateKey}`] = doc.tasks;
    });
    res.json({ tasks: result });
  } catch (error) {
    console.error("Get month tasks error:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// POST (upsert) tasks for a user + date
app.post("/api/tasks", async (req, res) => {
  try {
    const { email, dateKey, tasks } = req.body;
    if (!email || !dateKey) {
      return res.status(400).json({ message: "email and dateKey required" });
    }
    const doc = await Task.findOneAndUpdate(
      { email, dateKey },
      { tasks },
      { upsert: true, new: true }
    );
    res.json({ tasks: doc.tasks });
  } catch (error) {
    console.error("Save tasks error:", error);
    res.status(500).json({ message: "Error saving tasks" });
  }
});

// GET upcoming tasks for a user (today and future)
app.get("/api/tasks/upcoming", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "email required" });

    const docs = await Task.find({ email });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = docs
      .filter(doc => {
        const d = new Date(doc.dateKey);
        return d >= today;
      })
      .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey))
      .slice(0, 20);

    res.json({ upcoming });
  } catch (error) {
    console.error("Get upcoming tasks error:", error);
    res.status(500).json({ message: "Error fetching upcoming tasks" });
  }
});

/* ================= STUDY ROOM ENDPOINTS ================= */

// GET messages for a room
app.get("/api/rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await RoomMessage.find({ roomId }).sort({ createdAt: 1 }).limit(200);
    res.json({ messages });
  } catch (error) {
    console.error("Get room messages error:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// POST a message to a room
app.post("/api/rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, sender } = req.body;
    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }
    const msg = new RoomMessage({ roomId, text, sender: sender || "Anonymous" });
    await msg.save();
    res.json({ message: msg });
  } catch (error) {
    console.error("Send room message error:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});

/* ================= NOTES ENDPOINTS ================= */

// Upload a note file
app.post("/api/notes/upload", upload.single("file"), async (req, res) => {
  try {
    const { email, uploaderName, semester, subject, title } = req.body;
    if (!email || !semester || !subject || !title || !req.file) {
      return res.status(400).json({ message: "email, semester, subject, title, and file are required" });
    }

    const note = new Note({
      email,
      uploaderName: uploaderName || "Anonymous",
      semester,
      subject,
      title,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`
    });

    await note.save();
    res.json({ message: "Note uploaded successfully", note });
  } catch (error) {
    console.error("Upload note error:", error);
    res.status(500).json({ message: "Error uploading note" });
  }
});

// Get notes for a specific subject
app.get("/api/notes", async (req, res) => {
  try {
    const { subject } = req.query;
    if (!subject) {
      return res.status(400).json({ message: "subject query param required" });
    }
    const notes = await Note.find({ subject }).sort({ uploadedAt: -1 });
    res.json({ notes });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Error fetching notes" });
  }
});

// Get all notes uploaded by a specific user
app.get("/api/notes/user", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "email query param required" });
    }
    const notes = await Note.find({ email }).sort({ uploadedAt: -1 });
    res.json({ notes });
  } catch (error) {
    console.error("Get user notes error:", error);
    res.status(500).json({ message: "Error fetching user notes" });
  }
});

// Delete a note
app.delete("/api/notes/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    // Delete the file from disk
    const filePath = path.join(uploadsDir, path.basename(note.fileUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ message: "Error deleting note" });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
