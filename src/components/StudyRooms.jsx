import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaExpand } from "react-icons/fa";

const API_BASE = "http://localhost:5000";

const StudyRooms = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomId, setRoomId] = useState("default-room");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  const pollingRef = useRef(null);

  // 🔹 FETCH MESSAGES (polling)
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [roomId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollingRef.current);
  }, [fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const user = JSON.parse(localStorage.getItem("elphiUser"));
    try {
      await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMsg, sender: user?.name || "Anonymous" }),
      });
      setNewMsg("");
      fetchMessages(); // refresh immediately after sending
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // ✅ Small Card UI
  const MiniChat = () => (
    <>
      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "var(--accent-blue)" }}>
        Study Rooms
      </h2>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
        }}
      />

      <div style={{ background: "#111", color: "#fff", padding: "8px", height: "180px", overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <p key={msg._id || i}><strong>{msg.sender}:</strong> {msg.text}</p>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type message..."
          style={{ flexGrow: 1, borderRadius: "8px", padding: "8px" }}
        />
        <button type="submit" style={{ background: "var(--accent-blue)", color: "#fff", borderRadius: "8px", padding: "0 12px" }}>
          Send
        </button>
      </form>

      <button
        onClick={() => setIsFullscreen(true)}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          padding: "8px",
          background: "var(--bg-tertiary)",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          color: "var(--text-secondary)",
        }}
        title="Open Fullscreen Study Room"
      >
        <FaExpand size={14} />
      </button>
    </>
  );

  // ✅ Fullscreen UI
  const FullscreenRoom = () => (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "var(--bg-primary)", display: "flex", color: "var(--text-primary)"
    }}>
      {/* Exit */}
      <button
        onClick={() => setIsFullscreen(false)}
        style={{
          position: "absolute", top: "16px", right: "16px", padding: "12px",
          background: "#ef4444", color: "#fff", borderRadius: "50%",
          border: "none", cursor: "pointer", fontSize: "16px", zIndex: 51
        }}
      >
        ✕
      </button>

      {/* Chat (fullscreen) */}
      <div style={{ flex: 1, borderLeft: "1px solid var(--border-color)", padding: "12px", display: "flex", flexDirection: "column" }}>
        <h3>Room: {roomId}</h3>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <p key={msg._id || i}><strong>{msg.sender}:</strong> {msg.text}</p>
          ))}
        </div>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px" }}>
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type..."
            style={{ flexGrow: 1, borderRadius: "8px", padding: "8px" }}
          />
          <button type="submit" style={{ background: "var(--accent-blue)", color: "#fff", borderRadius: "8px", padding: "0 12px" }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );

  return <div className="card relative">{!isFullscreen ? <MiniChat /> : <FullscreenRoom />}</div>;
};

export default StudyRooms;
