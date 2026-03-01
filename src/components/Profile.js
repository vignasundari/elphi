import React, { useEffect, useState, useCallback } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./profile.css";

const API_BASE = "http://localhost:5000";

const SEMESTERS = [
  { name: 'Semester 1', subjects: ['Core Subject 1A', 'Elective 1B', 'Lab Session 1C'] },
  { name: 'Semester 2', subjects: ['Core Subject 2A', 'Elective 2B', 'Lab Session 2C'] },
  { name: 'Semester 3', subjects: ['Core Subject 3A', 'Elective 3B', 'Lab Session 3C'] },
  { name: 'Semester 4', subjects: ['Core Subject 4A', 'Elective 4B', 'Lab Session 4C'] },
  { name: 'Semester 5', subjects: ['Core Subject 5A', 'Elective 5B', 'Lab Session 5C'] },
  { name: 'Semester 6', subjects: ['Core Subject 6A', 'Elective 6B', 'Lab Session 6C'] },
  { name: 'Semester 7', subjects: ['Core Subject 7A', 'Elective 7B', 'Lab Session 7C'] },
  { name: 'Semester 8', subjects: ['Core Subject 8A', 'Elective 8B', 'Lab Session 8C'] },
];

const Profile = () => {
  const [streak, setStreak] = useState(0);
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);

  // Upload form state
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const subjects = SEMESTERS.find(s => s.name === selectedSemester)?.subjects || [];

  const fetchUserNotes = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_BASE}/api/notes/user?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to fetch user notes:", err);
    }
  }, []);

  const fetchStreak = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_BASE}/api/streak?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setStreak(data.currentStreak || 0);
      }
    } catch (err) {
      console.error("Failed to fetch streak:", err);
    }
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("elphiUser"));

    if (!storedUser) {
      window.location.href = "/login";
      return;
    }

    setUser(storedUser);
    fetchStreak(storedUser.email);
    fetchUserNotes(storedUser.email);
  }, [fetchUserNotes, fetchStreak]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedSemester || !selectedSubject || !noteTitle.trim()) {
      setUploadMsg("Please fill all fields and select a file.");
      return;
    }

    setUploading(true);
    setUploadMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', user.email);
    formData.append('uploaderName', user.name || 'Anonymous');
    formData.append('semester', selectedSemester);
    formData.append('subject', selectedSubject);
    formData.append('title', noteTitle.trim());

    try {
      const res = await fetch(`${API_BASE}/api/notes/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMsg('Note uploaded successfully!');
        setNoteTitle('');
        setFile(null);
        setSelectedSemester('');
        setSelectedSubject('');
        // Reset file input
        const fileInput = document.getElementById('note-file-input');
        if (fileInput) fileInput.value = '';
        fetchUserNotes(user.email);
      } else {
        setUploadMsg(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMsg('Error connecting to server.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUserNotes(user.email);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #475569',
    background: '#334155',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  };

  return (
    <div className="profile-container">
      <div className="profile-card">

        <div className="profile-header">
          <i className="bi bi-person-circle profile-icon"></i>
          <h2>{user?.name || "Student"}</h2>
          <p>{user?.email}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-box">
            <i className="bi bi-fire"></i>
            <h3 className="streak-fire">{streak}</h3>
            <p>Day Streak</p>
          </div>

          <div className="stat-box">
            <i className="bi bi-journal-text"></i>
            <h3>{notes.length}</h3>
            <p>Uploaded Notes</p>
          </div>
        </div>

        {/* ===== UPLOAD SECTION ===== */}
        <div className="notes-section" style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px' }}>
            <i className="bi bi-cloud-arrow-up" style={{ marginRight: '8px' }}></i>
            Upload Notes
          </h4>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Semester */}
            <select
              value={selectedSemester}
              onChange={(e) => { setSelectedSemester(e.target.value); setSelectedSubject(''); }}
              style={selectStyle}
            >
              <option value="">Select Semester</option>
              {SEMESTERS.map(sem => (
                <option key={sem.name} value={sem.name}>{sem.name}</option>
              ))}
            </select>

            {/* Subject */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={selectStyle}
              disabled={!selectedSemester}
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            {/* Title */}
            <input
              type="text"
              placeholder="Note title (e.g. Chapter 3 Summary)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              style={selectStyle}
            />

            {/* File */}
            <input
              id="note-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ ...selectStyle, padding: '8px' }}
            />

            <button
              type="submit"
              disabled={uploading}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: uploading ? '#475569' : '#6366f1',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Note'}
            </button>

            {uploadMsg && (
              <p style={{ color: uploadMsg.includes('success') ? '#4ade80' : '#f87171', fontSize: '14px' }}>
                {uploadMsg}
              </p>
            )}
          </form>
        </div>

        {/* ===== MY UPLOADED NOTES ===== */}
        <div className="notes-section">
          <h4>My Uploaded Notes</h4>

          {notes.length === 0 ? (
            <p className="empty">No notes uploaded yet.</p>
          ) : (
            <ul>
              {notes.map((note) => (
                <li key={note._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <i className="bi bi-file-earmark-text" style={{ marginRight: '8px' }}></i>
                    <strong>{note.title}</strong>
                    <span style={{ opacity: 0.6, fontSize: '13px', marginLeft: '8px' }}>
                      {note.subject} • {note.semester}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(note._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                    title="Delete note"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
