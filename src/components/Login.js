// src/components/Login.js
import React, { useEffect, useRef, useState } from 'react'; // Import useState
import './Login.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Link, useNavigate } from 'react-router-dom';

// Create an Audio object instance outside the component to avoid re-creation
const bookOpenSound = new Audio('/sounds/book-open.mp3'); // IMPORTANT: Verify this path!

const Login = ({ setIsLoggedIn }) => {
        const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const navigate = useNavigate();
    const sparkleContainerRef = useRef(null);
    const loginFormWrapperRef = useRef(null);
   const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // 🔥 Save session in localStorage
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("elphiUser", JSON.stringify(data.user));

    // 🔥 Update streak on login
    try {
      await fetch("http://localhost:5000/api/streak/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.user.email })
      });
    } catch (err) {
      console.error("Failed to update streak:", err);
    }

    setIsLoggedIn(true);
    navigate("/dashboard");

  } catch (error) {
    alert("Server error");
  }
};
    // New state for dark mode
    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem('theme') === 'dark' // Initialize from localStorage
    );

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
        // Sparkle creation logic (unchanged)
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

        // Mouse move event handler (unchanged)
        const handleMouseMove = (e) => {
            if (Math.random() < 0.1) {
                createSparkle(e.clientX, e.clientY);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Book open animation trigger (unchanged)
        const timer = setTimeout(() => {
            if (loginFormWrapperRef.current) {
                loginFormWrapperRef.current.classList.add('is-open');
                bookOpenSound.play().catch(error => {
                    console.warn("Could not play book open sound:", error);
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
        <div className="login-page-wrapper">
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
                        {/* Wave fills will be adjusted by CSS variables */}
                        <use xlinkHref="#gentle-wave" x="48" y="0" />
                        <use xlinkHref="#gentle-wave" x="48" y="3" />
                        <use xlinkHref="#gentle-wave" x="48" y="5" />
                        <use xlinkHref="#gentle-wave" x="48" y="7" />
                    </g>
                </svg>
            </div>

            <div className="container d-flex align-items-center justify-content-center vh-100 login-container">
                <div ref={loginFormWrapperRef} className="login-form-book-wrapper">
                    <div className="login-form p-4">
                        <h3 className="text-center mb-4 login-title">Welcome Back 👋</h3>
                        <form className="login-form-content" onSubmit={handleSubmit}>
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
  placeholder="Enter your password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>                            </div>
                            <button type="submit" className="btn btn-primary btn-block w-100 login-button">Sign In</button>

                            <a href="/forgot" className="d-block text-center mt-3 forgot-password-link">Forgot Password?</a>

                            <div className="social-login text-center mt-4">
                                <button type="button" className="btn btn-light w-100 mb-2 social-button google-button">
                                    <i className="bi bi-google me-2"></i> Login with Google
                                </button>
                            </div>
                        </form>
                        <div className="mt-4 text-center register-section">
    <p>Don't have an account? <Link to="/signup">Register here</Link></p>
</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;