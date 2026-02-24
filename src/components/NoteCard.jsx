import { FaDownload, FaStar, FaFileAlt } from "react-icons/fa";
import StarRating from "./StarRating";

const API_BASE = "http://localhost:5000";

const styles = {
  downloadButton: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "var(--accent-purple)",
    color: "var(--text-primary)",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "opacity 0.2s",
    cursor: "pointer",
    border: "none",
    textDecoration: "none",
  },
};

const NoteCard = ({ note }) => {
  // Build the full URL for backend-served files
  const fullFileUrl = note.fileUrl?.startsWith('http')
    ? note.fileUrl
    : `${API_BASE}${note.fileUrl}`;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        background: "var(--card-bg, #fff)",
      }}
    >
      {/* Thumbnail or placeholder */}
      <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
        {note.thumbnail ? (
          <img
            src={note.thumbnail}
            alt={note.title}
            style={{ width: "100%", height: "150px", objectFit: "cover", cursor: "pointer" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "150px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-tertiary)",
            cursor: "pointer",
          }}>
            <FaFileAlt size={48} color="var(--accent-purple)" />
          </div>
        )}
      </a>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        {/* Title */}
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          {note.title}
        </h3>

        {/* Rating (only if available) */}
        {note.rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-orange)" }}>
              <FaStar />
              <span style={{ fontWeight: 600 }}>{Number(note.rating).toFixed(1)}</span>
            </div>
            {note.count != null && (
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                ({note.count} ratings)
              </span>
            )}
          </div>
        )}

        {/* Submitter */}
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
          Submitted by: {note.uploaderName || note.submitter || "Anonymous"}
        </p>

        {/* Interactive Star Rating */}
        <div style={{ marginBottom: "16px" }}>
          <StarRating
            isInteractive={true}
            subject="notes"
            topic={note._id || note.id}
          />
        </div>

        {/* Download button */}
        <a
          href={fullFileUrl}
          download
          style={{ ...styles.downloadButton, marginTop: "auto" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <FaDownload /> Download Notes
        </a>
      </div>
    </div>
  );
};

export default NoteCard;
