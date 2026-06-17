import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import API_BASE from "../config/api";

const StarRating = ({ isInteractive = false, subject, topic, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0); // ⭐ personal choice
  const [averageRating, setAverageRating] = useState(0); // ⭐ average from backend
  const [voteCount, setVoteCount] = useState(0);
  const [isRated, setIsRated] = useState(false);

  // 🔹 Load rating info from backend
  useEffect(() => {
    fetch(`${API_BASE}/api/ratings?subject=${subject}&topic=${topic}`)
      .then(res => res.json())
      .then(data => {
        setAverageRating(data.average || 0);
        setVoteCount(data.votes || 0);
      })
      .catch(() => {});
  }, [subject, topic]);

  // 🔹 Handle user click
  const handleClick = (rating) => {
    if (!isInteractive || isRated) return;

    setUserRating(rating);
    setIsRated(true);

    fetch(`${API_BASE}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topic, rating }),
    })
      .then(res => res.json())
      .then(data => {
        setAverageRating(data.average);
        setVoteCount(data.votes);
        if (onRate) onRate();
      });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
      {isInteractive && (
        <span style={{ marginRight: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
          Rate this note:
        </span>
      )}
      {[1, 2, 3, 4, 5].map(star => {
        const active =
          hoverRating >= star || userRating >= star || (!userRating && averageRating >= star);

        return (
          <button
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !isRated && setHoverRating(star)}
            onMouseLeave={() => !isRated && setHoverRating(0)}
            style={{ background: "none", border: "none", cursor: isRated ? "default" : "pointer" }}
          >
            <FaStar
              size={18}
              color={active ? "var(--accent-orange)" : "var(--text-secondary)"}
              style={{ transition: "color 0.2s" }}
            />
          </button>
        );
      })}
      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
        ({voteCount} vote{voteCount !== 1 ? "s" : ""})
      </span>
    </div>
  );
};

export default StarRating;
