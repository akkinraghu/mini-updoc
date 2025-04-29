import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, ThemeSwitcher } from "../contexts/ThemeContext";

// Types
interface User {
  id: string;
  username: string;
  role: "patient" | "doctor";
}

interface LoginProps {
  onLogin: (user: User) => void;
  API_BASE_URL: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, API_BASE_URL }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup_or_login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Login successful
      const user: User = {
        id: data.id,
        username: data.username,
        role: data.role,
      };

      onLogin(user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className={`login-container ${theme}`}>
        <h2>Welcome to UpDoc</h2>
        <p className="login-subtitle">Ticket Management System</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="👤 Username"
              autoComplete="username"
              className="login-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="🔒 Password"
              autoComplete="current-password"
              className="login-input"
            />
          </div>
          
          <div className="form-group">
            <div className="role-selector">
              <div 
                className={`role-option ${role === "patient" ? "selected" : ""}`}
                onClick={() => setRole("patient")}
              >
                <span className="role-icon">👨‍⚕️</span>
                <span className="role-label">Patient</span>
              </div>
              <div 
                className={`role-option ${role === "doctor" ? "selected" : ""}`}
                onClick={() => setRole("doctor")}
              >
                <span className="role-icon">👩‍⚕️</span>
                <span className="role-label">Doctor</span>
              </div>
            </div>
          </div>
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Processing..." : "Login / Signup"}
          </button>
        </form>
        
        <div className="theme-switcher-container">
          <p className="theme-text">Change appearance:</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Login;
