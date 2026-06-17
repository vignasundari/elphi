// Admin.js
import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Admin.css';
import API_BASE from '../config/api';

const Admin = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/messages`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch messages:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className={darkMode ? 'admin dark-mode' : 'admin light-mode'}>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">📨 Elphida Admin</h2>
          <button onClick={toggleTheme} className="btn btn-outline-light">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <h3 className="mb-3">📬 Contact Submissions</h3>

        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, idx) => (
                  <tr key={msg._id}>
                    <td>{idx + 1}</td>
                    <td>{msg.name}</td>
                    <td>{msg.email}</td>
                    <td>{msg.message}</td>
                    <td>{new Date(msg.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
