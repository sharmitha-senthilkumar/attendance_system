import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

// Student Schema
const studentSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const Student = mongoose.model("Student", studentSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["P", "A"],
    required: true,
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

// Home Route
app.get("/", (req, res) => {
  res.send("Server Has Started Successfully");
});

// Test Route
app.get("/subi", (req, res) => {
  res.send("Server says Hi to Subi");
});

// Get All Students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Student
app.post("/students", async (req, res) => {
  try {
    const newStudent = await Student.create({
      rollNo: req.body.rollNo,
      name: req.body.name,
    });

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or Update Attendance
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date },
      {
        studentId,
        date,
        status,
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Attendance
app.get("/attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find().populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Today's Attendance
app.get("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.find({
      date: today,
    }).populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Today's Attendance
app.delete("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await Attendance.deleteMany({
      date: today,
    });

    res.status(200).json({
      message: "Today's attendance has been completely reset.",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
