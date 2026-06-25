import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "https://localhost:3000";

  useEffect(() => {
    getStudents();
  }, []);

  // Fetch students and today's attendance
  const getStudents = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        //fetch("http://localhost:3000/students"),
        fetch(`${API_URL}/students`),
        //fetch("http://localhost:3000/attendance/today")
        fetch(`${API_URL}/attendance`),
      ]);

      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();

      console.log("Students Data:", studentsData);
      console.log("Attendance Data:", attendanceData);

      const attendanceMap = {};

      // FIXED: Handle null studentId safely
      attendanceData.forEach((record) => {
        if (!record.studentId) return;

        const sId = record.studentId?._id || record.studentId;

        if (sId) {
          attendanceMap[sId] = record.status;
        }
      });

      const updatedStudents = studentsData.map((student) => ({
        ...student,
        attendance: attendanceMap[student._id] || ""
      }));

      setStudents(updatedStudents);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  };

  // Save attendance
  const saveAttendance = async (studentId, status) => {
    try {
      await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId,
          status,
          date: new Date().toISOString().split("T")[0]
        })
      });

      console.log("Attendance Saved");
    } catch (err) {
      console.log("Error saving attendance:", err);
    }
  };

  // Update UI immediately
  const markAttendance = (id, status) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student._id === id
          ? {
              ...student,
              attendance: status
            }
          : student
      )
    );
  };

  // Present count
  const presentCount = students.filter(
    (student) => student.attendance === "P"
  ).length;

  // Absent count
  const absentCount = students.filter(
    (student) => student.attendance === "A"
  ).length;

  // Reset attendance
  const resetAttendance = async () => {
    try {
      const response = await fetch(
        `${API_URL}/attendance?today`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete records from database"
        );
      }

      console.log("Database reset successful.");

      setStudents((prevStudents) =>
        prevStudents.map((student) => ({
          ...student,
          attendance: ""
        }))
      );
    } catch (err) {
      console.log("Error resetting attendance:", err);
      alert(
        "Could not reset attendance. Please check your connection."
      );
    }
  };

  return (
    <div className="container">
      <h1>Attendance Management System</h1>

      <div className="summary">
        <h3>Total Present: {presentCount}</h3>

        <h3>Total Absent: {absentCount}</h3>

        <button onClick={resetAttendance}>
          Reset All
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Actions</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                style={{ textAlign: "center" }}
              >
                No Students Found
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student._id}>
                <td>{student.rollNo}</td>

                <td>{student.name}</td>

                <td>
                  <button
                    onClick={() => {
                      markAttendance(student._id, "P");
                      saveAttendance(student._id, "P");
                    }}
                  >
                    P
                  </button>

                  <button
                    onClick={() => {
                      markAttendance(student._id, "A");
                      saveAttendance(student._id, "A");
                    }}
                  >
                    A
                  </button>
                </td>

                <td>
                  {student.attendance || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;