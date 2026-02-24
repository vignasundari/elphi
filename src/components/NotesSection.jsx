import { useState, useEffect } from 'react';
import NoteCard from './NoteCard';

const API_BASE = 'http://localhost:5000';

const NotesSection = ({ subject = 'Core Subject 1A' }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/notes?subject=${encodeURIComponent(subject)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNotes();
    return () => { cancelled = true; };
  }, [subject]);

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
        Handwritten Notes & Materials
      </h2>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No notes uploaded for this subject yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {notes.map(note => <NoteCard key={note._id} note={note} />)}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
