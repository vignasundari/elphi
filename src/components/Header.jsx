import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: '8px',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  fontSize: '14px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left'
};

const Header = ({ setIsLoggedIn }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("elphiUser"));

  // 🔥 Read streak from localStorage
  useEffect(() => {
    const storedStreak = parseInt(localStorage.getItem("elphiStreak")) || 0;
    setStreak(storedStreak);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
  localStorage.removeItem("elphiUser");
  localStorage.removeItem("isLoggedIn"); // add this
  setIsLoggedIn(false);
  navigate("/", { replace: true });
};

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: '1px solid var(--border-color)',
      height: '80px',
      position: 'sticky',
      top: 0,
      backgroundColor: 'var(--bg-primary)',
      zIndex: 10
    }}>
      {/* Logo */}
      <h1 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--accent-blue)'
      }}>
        Elphida
      </h1>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>

        {/* 🔥 Daily Streak Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-secondary)',
          padding: '8px 14px',
          borderRadius: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ fontWeight: 600 }}>
            {streak} Day Streak
          </span>
        </div>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              background: 'var(--bg-secondary)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <FaUser size={18} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              width: '220px',
              padding: '12px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 20
            }}>

              {/* User Name */}
              <div style={{
                fontWeight: 600,
                marginBottom: '8px',
                padding: '8px 12px'
              }}>
                👋 {user?.name || "Student"}
              </div>

              <div style={{
                height: '1px',
                background: 'var(--border-color)',
                margin: '6px 0'
              }}></div>

              {/* Profile Button */}
              <button
                style={dropdownItemStyle}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/profile");
                }}
              >
                <FaUser /> Profile
              </button>

              {/* Logout */}
              <button
                style={{ ...dropdownItemStyle, color: '#FF5B5B' }}
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Logout
              </button>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;