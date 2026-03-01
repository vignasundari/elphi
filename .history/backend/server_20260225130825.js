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
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

/* ================= MONGODB CONNECTION ================= */
mongoose.connect("mongodb+srv://Amirthaa:elphida03@elphida.1e5pyx4.mongodb.net/?appName=Elphida")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================= SCHEMAS ================= */
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
}));

const Task = mongoose.model("Task", new mongoose.Schema({
  email: { type: String, required: true },
  dateKey: { type: String, required: true },
  tasks: [{ name: String, status: { type: String, default: "Not Started" } }]
}).index({ email: 1, dateKey: 1 }, { unique: true }));

const RoomMessage = mongoose.model("RoomMessage", new mongoose.Schema({
  roomId: { type: String, required: true },
  text: String,
  sender: String,
  createdAt: { type: Date, default: Date.now }
}).index({ roomId: 1, createdAt: 1 }));

const Note = mongoose.model("Note", new mongoose.Schema({
  email: { type: String, required: true },
  uploaderName: String,
  semester: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  fileName: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now }
}).index({ subject: 1 }).index({ email: 1 }));

/* ================= AUTH ROUTES ================= */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.json({ message: "Signup successful" });
  } catch (error) { res.status(500).json({ message: "Error signing up" }); }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", user: { name: user.name, email: user.email } });
  } catch (error) { res.status(500).json({ message: "Error logging in" }); }
});

/* ================= FIXED AI CHAT PROXY ================= */
const GEMINI_API_KEY = "AIzaSyBB152D1cfIb5MVc8prtyeVnBOpt6v4APk";

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    // Correct payload for Gemini API
    const payload = {
      contents: [{ parts: [{ text: message }] }]
    };

    // Using gemini-1.5-flash as it's the most stable for standard API keys
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", result);
      return res.status(response.status).json({ message: result?.error?.message || "AI Error" });
    }

    const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Connection to AI failed" });
  }
});

/* ================= TASK ENDPOINTS ================= */
app.get("/api/tasks", async (req, res) => {
  const { email, dateKey } = req.query;
  const doc = await Task.findOne({ email, dateKey });
  res.json({ tasks: doc ? doc.tasks : [] });
});

app.post("/api/tasks", async (req, res) => {
  const { email, dateKey, tasks } = req.body;
  const doc = await Task.findOneAndUpdate({ email, dateKey }, { tasks }, { upsert: true, new: true });
  res.json({ tasks: doc.tasks });
});

/* ================= STUDY ROOM & NOTES (UNCHANGED) ================= */
app.get("/api/rooms/:roomId/messages", async (req, res) => {
  const messages = await RoomMessage.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
  res.json({ messages });
});

app.post("/api/rooms/:roomId/messages", async (req, res) => {
  const msg = new RoomMessage({ ...req.body, roomId: req.params.roomId });
  await msg.save();
  res.json({ message: msg });
});

app.post("/api/notes/upload", upload.single("file"), async (req, res) => {
  try {
    const note = new Note({ ...req.body, fileName: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
    await note.save();
    res.json({ message: "Note uploaded", note });
  } catch (e) { res.status(500).json({ message: "Upload failed" }); }
});

app.get("/api/notes", async (req, res) => {
  const notes = await Note.find({ subject: req.query.subject }).sort({ uploadedAt: -1 });
  res.json({ notes });
});

app.delete("/api/notes/:id", async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.listen(5000, () => console.log("Server running on port 5000"));