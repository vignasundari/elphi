import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaExpand, FaPlus, FaSignInAlt, FaPaperPlane, FaCopy } from "react-icons/fa";
import "./StudyRooms.css";

const API_BASE = "http://localhost:5000";

/* Generate a 6-char alphanumeric room code */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* Format timestamp for message */
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const StudyRooms = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);

  const pollingRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fsMessagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fsInputRef = useRef(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("elphiUser"));
    } catch {
      return null;
    }
  })();

  const scrollToBottom = useCallback(() => {
    // Use scrollTop on the container directly — avoids scrolling parent ancestors
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    const fsEl = fsMessagesContainerRef.current;
    if (fsEl) fsEl.scrollTop = fsEl.scrollHeight;
  }, []);

  /* Fetch messages */
  const fetchMessages = useCallback(async () => {
    if (!roomId || !inRoom) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [roomId, inRoom]);

  /* Poll every 2 seconds */
  useEffect(() => {
    if (!inRoom) return;
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 2000);
    return () => clearInterval(pollingRef.current);
  }, [fetchMessages, inRoom]);

  /* Auto-scroll on new messages */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* Send message */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !roomId) return;

    try {
      await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMsg, sender: currentUser?.name || "Anonymous" }),
      });
      setNewMsg("");
      fetchMessages();
      // Re-focus the input after sending
      setTimeout(() => {
        if (isFullscreen) {
          fsInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 50);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  /* Handle Enter key */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  /* Create room */
  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomId(code);
    setInRoom(true);
    setShowJoinForm(false);
    setJoinError("");
  };

  /* Join room */
  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setJoinError("Please enter a valid room code");
      return;
    }
    setRoomId(code);
    setInRoom(true);
    setShowJoinForm(false);
    setJoinCode("");
    setJoinError("");
  };

  /* Leave room */
  const handleLeaveRoom = () => {
    setInRoom(false);
    setRoomId("");
    setMessages([]);
    setIsFullscreen(false);
    clearInterval(pollingRef.current);
  };

  /* Copy room code */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: ignore */
    }
  };

  /* Render a single message bubble */
  const renderMessage = (msg, i) => {
    const isSelf = msg.sender === (currentUser?.name || "Anonymous");
    return (
      <div key={msg._id || i} className={`sr-msg ${isSelf ? "sr-msg-self" : "sr-msg-other"}`}>
        {!isSelf && <div className="sr-msg-sender">{msg.sender}</div>}
        <div className="sr-msg-bubble">{msg.text}</div>
        <div className="sr-msg-time">{formatTime(msg.createdAt)}</div>
      </div>
    );
  };

  /* ========== LOBBY SCREEN ========== */
  if (!inRoom) {
    return (
      <div className="study-room-card">
        <div className="sr-lobby">
          <div className="sr-lobby-title">📚 Study Rooms</div>
          <div className="sr-lobby-sub">
            Create a room and invite friends, or join an existing room with a code.
          </div>

          {!showJoinForm ? (
            <div className="sr-lobby-buttons">
              <button className="sr-btn sr-btn-create" onClick={handleCreateRoom}>
                <FaPlus size={13} /> Create Room
              </button>
              <button className="sr-btn sr-btn-join" onClick={() => setShowJoinForm(true)}>
                <FaSignInAlt size={13} /> Join Room
              </button>
            </div>
          ) : (
            <div className="sr-join-form">
              <input
                className="sr-join-input"
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                placeholder="Enter code"
                maxLength={8}
                autoFocus
              />
              {joinError && <div className="sr-error">{joinError}</div>}
              <div className="sr-join-actions">
                <button className="sr-btn-sm sr-btn-confirm" onClick={handleJoinRoom}>
                  Join
                </button>
                <button
                  className="sr-btn-sm sr-btn-cancel"
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinCode("");
                    setJoinError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ========== FULLSCREEN CHAT ========== */
  if (isFullscreen) {
    return (
      <>
        {/* keep card placeholder so layout doesn't shift */}
        <div className="study-room-card" style={{ visibility: "hidden" }} />

        <div className="sr-fullscreen">
          {/* Header */}
          <div className="sr-fs-header">
            <div className="sr-fs-header-left">
              <div className="sr-fs-room-icon">💬</div>
              <div>
                <div className="sr-fs-room-name">Study Room</div>
                <div className="sr-fs-room-code">
                  Code: {roomId}{" "}
                  <FaCopy
                    size={10}
                    style={{ cursor: "pointer", marginLeft: 4 }}
                    onClick={handleCopyCode}
                  />
                  {copied && <span className="sr-copied-tooltip">Copied!</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="sr-leave-btn" onClick={handleLeaveRoom}>
                Leave
              </button>
              <button className="sr-fs-close" onClick={() => setIsFullscreen(false)}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="sr-fs-messages" ref={fsMessagesContainerRef}>
            {messages.length === 0 ? (
              <div className="sr-empty">
                <div className="sr-empty-icon">💬</div>
                <div>No messages yet. Start the conversation!</div>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
          </div>

          {/* Input */}
          <form className="sr-fs-input-bar" onSubmit={sendMessage}>
            <input
              ref={fsInputRef}
              className="sr-fs-text-input"
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              autoFocus
            />
            <button
              type="submit"
              className="sr-fs-send-btn"
              disabled={!newMsg.trim()}
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </div>
      </>
    );
  }

  /* ========== MINI CHAT (CARD VIEW) ========== */
  return (
    <div className="study-room-card">
      {/* Header */}
      <div className="sr-chat-header">
        <div className="sr-chat-header-left">
          <div className="sr-room-icon">💬</div>
          <div>
            <div className="sr-room-name">Study Room</div>
            <div
              className="sr-room-code-label"
              onClick={handleCopyCode}
              style={{ cursor: "pointer" }}
              title="Click to copy"
            >
              Code: <span style={{ fontWeight: 700, color: "var(--accent-blue)" }}>{roomId}</span>
              {copied && <span className="sr-copied-tooltip" style={{ marginLeft: 6 }}>Copied!</span>}
            </div>
          </div>
        </div>
        <button className="sr-leave-btn" onClick={handleLeaveRoom}>
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="sr-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="sr-empty">
            <div className="sr-empty-icon">💬</div>
            <div>No messages yet</div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </div>

      {/* Input */}
      <form className="sr-input-bar" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          className="sr-text-input"
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button type="submit" className="sr-send-btn" disabled={!newMsg.trim()}>
          <FaPaperPlane size={14} />
        </button>
      </form>

      {/* Expand button */}
      <button
        className="sr-expand-btn"
        onClick={() => setIsFullscreen(true)}
        title="Open Fullscreen"
      >
        <FaExpand size={13} />
      </button>
    </div>
  );
};

export default StudyRooms;
