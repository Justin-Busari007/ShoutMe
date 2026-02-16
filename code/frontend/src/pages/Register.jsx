import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Password validation checks
  const passwordChecks = {
    minLength: form.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(form.password),
    hasLowerCase: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };

  const passwordsMatch = form.password === form.password2 && form.password2.length > 0;
  const allChecksPassed = Object.values(passwordChecks).every(Boolean) && passwordsMatch;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        form,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const access = res.data?.tokens?.access;
      const refresh = res.data?.tokens?.refresh;

      if (access && refresh) {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        setMessage("Registration successful! Redirecting...");

        setTimeout(() => {
          navigate("/events");
        }, 1000);
      } else {
        setMessage("Registration successful, but tokens were not returned.");
      }
    } catch (err) {
      const status = err.response?.status;
      const backend = err.response?.data;

      console.error("Registration error:", backend);

      setMessage(
        backend
          ? `Registration failed: ${JSON.stringify(backend)}`
          : `Registration failed (${status ?? "Unknown error"}).`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              id="password2"
              type="password"
              name="password2"
              placeholder="Re-enter your password"
              value={form.password2}
              onChange={handleChange}
              required
            />
            {form.password2 && !passwordsMatch && (
              <span className="error-text">Passwords do not match</span>
            )}
            {form.password2 && passwordsMatch && (
              <span className="success-text">✓ Passwords match</span>
            )}
          </div>

          {/* Password Requirements Checklist */}
          {form.password && (
            <div className="password-requirements">
              <p className="requirements-title">Password must contain:</p>
              <ul>
                <li className={passwordChecks.minLength ? "valid" : "invalid"}>
                  {passwordChecks.minLength ? "✓" : "○"} At least 8 characters
                </li>
                <li className={passwordChecks.hasUpperCase ? "valid" : "invalid"}>
                  {passwordChecks.hasUpperCase ? "✓" : "○"} One uppercase letter
                </li>
                <li className={passwordChecks.hasLowerCase ? "valid" : "invalid"}>
                  {passwordChecks.hasLowerCase ? "✓" : "○"} One lowercase letter
                </li>
                <li className={passwordChecks.hasNumber ? "valid" : "invalid"}>
                  {passwordChecks.hasNumber ? "✓" : "○"} One number
                </li>
                <li className={passwordChecks.hasSpecial ? "valid" : "invalid"}>
                  {passwordChecks.hasSpecial ? "✓" : "○"} One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !allChecksPassed}
            className={allChecksPassed ? "btn-primary" : "btn-disabled"}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {message && (
          <div className={message.includes("successful") ? "message success" : "message error"}>
            {message}
          </div>
        )}

        <p className="login-link">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>

      <style>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin: 0 0 30px 0;
          color: #1a202c;
          font-size: 28px;
          text-align: center;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }

        input {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
          outline: none;
        }

        input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .error-text {
          color: #e53e3e;
          font-size: 13px;
          font-weight: 500;
        }

        .success-text {
          color: #48bb78;
          font-size: 13px;
          font-weight: 500;
        }

        .password-requirements {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-top: -8px;
        }

        .requirements-title {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
        }

        .password-requirements ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .password-requirements li {
          font-size: 14px;
          padding-left: 4px;
          transition: all 0.2s;
        }

        .password-requirements li.valid {
          color: #48bb78;
          font-weight: 500;
        }

        .password-requirements li.invalid {
          color: #a0aec0;
        }

        button {
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-disabled {
          background: #cbd5e0;
          color: #718096;
          cursor: not-allowed;
        }

        button:disabled {
          transform: none;
          box-shadow: none;
        }

        .message {
          margin-top: 20px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
        }

        .message.success {
          background: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .message.error {
          background: #fed7d7;
          color: #742a2a;
          border: 1px solid #fc8181;
          white-space: pre-wrap;
        }

        .login-link {
          text-align: center;
          margin-top: 24px;
          color: #718096;
          font-size: 14px;
        }

        .login-link a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .login-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
