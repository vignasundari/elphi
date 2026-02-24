// src/components/Signup.js
import React, { useEffect, useRef, useState } from 'react';
import './Signup.css'; // We'll create this CSS file next
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate, Link } from "react-router-dom";
// You might want a different sound for signup, or reuse the book-open one.
// For now, let's assume a 'register-chime.mp3' or similar, placed in /public/sounds/
const signupSound = new Audio('/sounds/register-chime.mp3'); // IMPORTANT: Verify this path!

const Signup = ({ setIsLoggedIn }) => {    const sparkleContainerRef = useRef(null);
    const signupFormWrapperRef = useRef(null);
    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem('theme') === 'dark'
    );
const navigate = useNavigate();

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!name || !email || !password || !confirmPassword) {
    alert("Please fill all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Signup successful! Please login.");
    navigate("/login");

  } catch (error) {
    alert("Server error");
  }
};
    // Apply dark mode class to body on state change
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Toggle dark mode function
    const toggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    useEffect(() => {
        // Sparkle creation logic (copied from Login.js)
        const createSparkle = (x, y) => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;

            (sparkleContainerRef.current || document.body).appendChild(sparkle);

            sparkle.addEventListener('animationend', () => {
                sparkle.remove();
            });
        };

        const handleMouseMove = (e) => {
            if (Math.random() < 0.1) {
                createSparkle(e.clientX, e.clientY);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Book open animation trigger for signup form
        const timer = setTimeout(() => {
            if (signupFormWrapperRef.current) {
                signupFormWrapperRef.current.classList.add('is-open');
                // Play sound when the animation starts
                signupSound.play().catch(error => {
                    console.warn("Could not play signup sound:", error);
                });
            }
        }, 100);

        // Cleanup function
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="signup-page-wrapper">
            {/* Dark Mode Toggle Button */}
            <button
                className="dark-mode-toggle btn btn-sm"
                onClick={toggleDarkMode}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
            </button>

            <div ref={sparkleContainerRef} className="sparkle-container"></div>

            <div className="waves-background">
                <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
                    <defs>
                        <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                    </defs>
                    <g className="parallax">
                        <use xlinkHref="#gentle-wave" x="48" y="0" />
                        <use xlinkHref="#gentle-wave" x="48" y="3" />
                        <use xlinkHref="#gentle-wave" x="48" y="5" />
                        <use xlinkHref="#gentle-wave" x="48" y="7" />
                    </g>
                </svg>
            </div>

            <div className="container d-flex align-items-center justify-content-center vh-100 signup-container">
                {/* Book opening animation wrapper */}
                <div ref={signupFormWrapperRef} className="signup-form-book-wrapper">
                    <div className="signup-form p-4">
                        <h3 className="text-center mb-4 signup-title">Join Our Learning Journey! ✨</h3>
<form className="signup-form-content" onSubmit={handleSubmit}>                            <div className="form-group mb-3">
                                <label>Full Name</label>
<input
  type="text"
  className="form-control"
  placeholder="Enter your full name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>                            </div>
                            <div className="form-group mb-3">
                                <label>Email</label>
<input
  type="email"
  className="form-control"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>                            </div>
                            <div className="form-group mb-4">
                                <label>Password</label>
<input
  type="password"
  className="form-control"
  placeholder="Create a password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>                            </div>
                            <div className="form-group mb-4">
                                <label>Confirm Password</label>
<input
  type="password"
  className="form-control"
  placeholder="Confirm your password"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  required
/>                            </div>
                            <button type="submit" className="btn btn-primary btn-block w-100 signup-button">Register Now!</button>

                            <div className="social-login text-center mt-4">
                                <button type="button" className="btn btn-light w-100 mb-2 social-button google-button">
                                    <i className="bi bi-google me-2"></i> Sign Up with Google
                                </button>
                
                            </div>
                        </form>
                        <div className="mt-4 text-center login-section">
                            <p>Already have an account? <Link to="/login" className="login-link">Sign in here</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;