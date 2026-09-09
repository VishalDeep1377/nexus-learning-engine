'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

function Signup() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
  });

  const router = useRouter();

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.currentTarget.name]: e.currentTarget.value });
  }

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/signup", formData);
      if (response.status === 201) {
        toast.success("Account created! Redirecting to login...");
        router.push("/auth/login");
      }
    } catch (error) {
      console.log("Error occurred while signup", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    router.push("/");
    return null;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .auth-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #050810;
          overflow: hidden;
          position: relative;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: orbFloat 8s ease-in-out infinite;
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #8b5cf6, #6366f1);
          top: -150px; right: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, #06b6d4, #0ea5e9);
          bottom: -80px; left: -80px;
          animation-delay: -4s;
        }
        .orb-3 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, #ec4899, #a855f7);
          top: 40%; right: 35%;
          animation-delay: -2s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.05); }
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Left panel */
        .left-panel {
          width: 420px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          z-index: 1;
        }

        /* Right hero panel */
        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
          padding: 60px 70px;
          position: relative;
          z-index: 1;
        }

        .right-inner {
          max-width: 460px;
          width: 100%;
          text-align: right;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 60px;
          justify-content: flex-end;
        }
        .brand-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 0 24px rgba(139,92,246,0.4);
        }
        .brand-name {
          font-size: 20px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.3px;
        }
        .brand-dot { color: #8b5cf6; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 100px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #c4b5fd;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .hero-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 20px;
          color: white;
          letter-spacing: -2px;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 40%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          margin-bottom: 44px;
        }

        .stats-row {
          display: flex;
          gap: 32px;
          justify-content: flex-end;
        }
        .stat-item {}
        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          font-weight: 500;
          margin-top: 2px;
        }

        .panel-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        /* Form card */
        .form-card {
          width: 100%;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 44px 40px;
          box-shadow:
            0 0 0 1px rgba(139,92,246,0.08),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .form-header {
          margin-bottom: 32px;
        }
        .form-title {
          font-size: 26px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.8px;
          margin-bottom: 8px;
        }
        .form-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.4);
        }
        .form-subtitle a {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .form-subtitle a:hover { color: #c4b5fd; }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 22px;
        }

        .field-wrapper { position: relative; }
        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .field-wrapper.focused .field-label { color: #a78bfa; }

        .input-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          color: rgba(255,255,255,0.2);
          transition: color 0.2s;
          pointer-events: none;
          width: 18px; height: 18px;
        }
        .field-wrapper.focused .input-icon { color: #a78bfa; }

        .auth-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: white;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.06);
          box-shadow: 0 0 0 4px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.08);
        }

        .toggle-pass {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.25);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .toggle-pass:hover { color: rgba(255,255,255,0.6); }

        .password-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          margin-top: 6px;
          padding-left: 4px;
        }

        /* Password strength */
        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          padding-left: 4px;
        }
        .strength-segment {
          height: 3px;
          flex: 1;
          border-radius: 2px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s ease;
        }

        .btn-submit {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          letter-spacing: -0.2px;
          box-shadow: 0 8px 24px rgba(139,92,246,0.35);
        }
        .btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(139,92,246,0.5); }
        .btn-submit:hover::before { opacity: 1; }
        .btn-submit:active { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .btn-content {
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex; align-items: center; gap: 16px; margin: 22px 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .divider-text {
          font-size: 12px; color: rgba(255,255,255,0.2);
          font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;
        }

        .oauth-group { display: flex; flex-direction: column; gap: 10px; }
        .btn-oauth {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.25s ease;
          position: relative; overflow: hidden;
        }
        .btn-oauth::after {
          content: '';
          position: absolute; inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.25s;
        }
        .btn-oauth:hover::after { background: rgba(255,255,255,0.05); }
        .btn-oauth:hover { transform: translateY(-1px); }
        .btn-oauth:active { transform: translateY(0); }
        .btn-google { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: white; }
        .btn-github { background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08); color: white; }

        .terms-text {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          margin-top: 20px;
          line-height: 1.5;
        }
        .terms-text a { color: rgba(255,255,255,0.4); text-decoration: none; }
        .terms-text a:hover { color: #a78bfa; }

        @media (max-width: 1024px) {
          .right-panel { display: none; }
          .panel-divider { display: none; }
          .left-panel { width: 100%; }
          .auth-root { justify-content: center; }
        }
        @media (max-width: 480px) {
          .left-panel { padding: 20px; }
          .form-card { padding: 32px 24px; }
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: particleFloat linear infinite;
          opacity: 0;
        }
        @keyframes particleFloat {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="auth-root">
        {/* Background */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-bg" />

        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="particle" style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: i % 2 === 0 ? '#8b5cf6' : '#06b6d4',
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            animationDelay: `${Math.random() * 10}s`,
          }} />
        ))}

        {/* Left: Form panel */}
        <div className="left-panel">
          <div className="form-card">
            <div className="form-header">
              <h2 className="form-title">Create your account</h2>
              <p className="form-subtitle">
                Already have one?{" "}
                <Link href="/auth/login">Sign in →</Link>
              </p>
            </div>

            <div className="field-group">
              {/* Full Name */}
              <div className={`field-wrapper ${focusedField === 'name' ? 'focused' : ''}`}>
                <label className="field-label">Full Name</label>
                <div className="input-box">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    id="signup-name"
                    type="text"
                    className="auth-input"
                    placeholder="John Doe"
                    name="name"
                    value={formData.name}
                    onChange={handleDataChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className={`field-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                <label className="field-label">Email Address</label>
                <div className="input-box">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="signup-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    name="email"
                    value={formData.email}
                    onChange={handleDataChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`field-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
                <label className="field-label">Password</label>
                <div className="input-box">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Create a strong password"
                    name="password"
                    value={formData.password}
                    onChange={handleDataChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="new-password"
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {/* Password strength indicator */}
                {formData.password.length > 0 && (
                  <div className="strength-bar">
                    {[0, 1, 2, 3].map((i) => {
                      const len = formData.password.length;
                      const strength = len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
                      const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];
                      return (
                        <div
                          key={i}
                          className="strength-segment"
                          style={{ background: i < strength ? colors[strength] : undefined }}
                        />
                      );
                    })}
                  </div>
                )}
                <p className="password-hint">Use at least 8 characters with letters & numbers</p>
              </div>
            </div>

            <button
              id="signup-submit"
              type="button"
              className="btn-submit"
              onClick={handleSignup}
              disabled={loading}
            >
              <div className="btn-content">
                {loading ? (
                  <>
                    <div className="spinner" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </div>
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or sign up with</span>
              <div className="divider-line" />
            </div>

            <div className="oauth-group">
              <button
                id="signup-google"
                className="btn-oauth btn-google"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                id="signup-github"
                className="btn-oauth btn-github"
                onClick={() => signIn("github", { prompt: "login", callbackUrl: "/" })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            <p className="terms-text">
              By creating an account, you agree to our{" "}
              <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>

        <div className="panel-divider" />

        {/* =====================================================
            RIGHT CODE-TO-CAREER PANEL
            ===================================================== */}
        
        <div
          className="
            relative
            hidden
            min-h-screen
            flex-1
            overflow-hidden
            lg:block
          "
        >
          {/* =================================================
              BASE GRADIENT
              ================================================= */}
        
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #061B2A 0%, #071F35 35%, #151B55 65%, #3B1C72 100%)",
            }}
          />
        
          {/* =================================================
              TOP RIGHT ORGANIC SHAPE
              ================================================= */}
        
          <div
            className="
              pointer-events-none
              absolute
              -right-[18%]
              -top-[30%]
              h-[75%]
              w-[65%]
              rounded-full
              bg-gradient-to-br
              from-blue-500/40
              via-indigo-600/30
              to-purple-600/10
            "
          />
        
          {/* =================================================
              MIDDLE FLOWING SHAPE
              ================================================= */}
        
          <div
            className="
              pointer-events-none
              absolute
              right-[-5%]
              top-[25%]
              h-[65%]
              w-[55%]
              rounded-[50%_0_0_50%]
              bg-indigo-600/10
            "
          />
        
          {/* =================================================
              BOTTOM WAVE
              ================================================= */}
        
          <div
            className="
              pointer-events-none
              absolute
              -bottom-[28%]
              -right-[10%]
              h-[55%]
              w-[70%]
              rotate-[-8deg]
              rounded-[70%_0_0_0]
              bg-gradient-to-br
              from-blue-600/60
              via-indigo-600/60
              to-purple-700/80
            "
          />
        
          {/* =================================================
              PURPLE GLOW
              ================================================= */}
        
          <div
            className="
              pointer-events-none
              absolute
              bottom-[-15%]
              right-[20%]
              h-[35%]
              w-[45%]
              rounded-full
              bg-purple-600/30
              blur-[100px]
            "
          />
        
          {/* =================================================
              LARGE CODE SYMBOL
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[7%]
              top-[3%]
              select-none
              font-mono
              text-[220px]
              font-black
              leading-none
              tracking-[-0.15em]
              text-blue-300/10
              xl:text-[270px]
            "
          >
            {"</>"}
          </div>
        
          {/* =================================================
              DOT GRID
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[9%]
              top-[12%]
              grid
              grid-cols-6
              gap-4
              opacity-50
            "
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="
                  h-1
                  w-1
                  rounded-full
                  bg-blue-300
                  animate-pulse
                "
                style={{
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>
        
          {/* =================================================
              OUTER ORBIT
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[17%]
              top-[34%]
              h-[310px]
              w-[310px]
              rounded-full
              border
              border-blue-400/15
              animate-[spin_30s_linear_infinite]
            "
          />
        
          {/* =================================================
              INNER ORBIT
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[22%]
              top-[39%]
              h-[210px]
              w-[210px]
              rounded-full
              border
              border-purple-400/15
              animate-[spin_20s_linear_infinite_reverse]
            "
          />
        
          {/* =================================================
              FLOATING CODE CARD
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[31%]
              top-[44%]
              flex
              h-[105px]
              w-[135px]
              rotate-[-8deg]
              items-center
              justify-center
              rounded-xl
              border
              border-blue-400/20
              bg-blue-950/30
              backdrop-blur-sm
              animate-bounce
            "
          >
            <span className="font-mono text-xl text-blue-300">
              {"</>"}
            </span>
          </div>
        
          {/* =================================================
              FLOATING PYTHON CARD
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[18%]
              top-[36%]
              flex
              h-[110px]
              w-[145px]
              rotate-[7deg]
              items-center
              justify-center
              rounded-xl
              border
              border-purple-400/20
              bg-purple-950/30
              backdrop-blur-sm
              animate-pulse
            "
          >
            <span className="font-mono text-xl text-purple-300">
              Python
            </span>
          </div>
        
          {/* =================================================
              FLOATING AI CARD
              ================================================= */}
        
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              right-[11%]
              top-[50%]
              flex
              h-[105px]
              w-[140px]
              rotate-[-5deg]
              items-center
              justify-center
              rounded-xl
              border
              border-indigo-400/20
              bg-indigo-950/30
              backdrop-blur-sm
              animate-bounce
            "
          >
            <span className="font-mono text-xl text-indigo-300">
              AI / ML
            </span>
          </div>
        
          {/* =================================================
              CONTENT
              ================================================= */}
        
          <div
            className="
              relative
              z-10
              flex
              h-full
              flex-col
              justify-center
              px-10
              py-12
              xl:px-16
            "
          >
            <div className="max-w-[470px]">
        
              {/* Eyebrow */}
        
              <div className="mb-5 flex items-center gap-3">
        
                <div className="h-[2px] w-8 bg-blue-400" />
        
                <span
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.28em]
                    text-blue-300
                  "
                >
                  Your journey starts here
                </span>
        
              </div>
        
              {/* Main heading */}
        
              <h2
                className="
                  mb-5
                  text-[38px]
                  font-bold
                  leading-[1.08]
                  tracking-[-0.03em]
                  text-white
                  xl:text-[46px]
                "
              >
                Learn.
                <br />
        
                Build.
                <br />
        
                <span
                  className="
                    bg-gradient-to-r
                    from-blue-400
                    via-indigo-400
                    to-purple-400
                    bg-clip-text
                    text-transparent
                  "
                >
                  Grow.
                </span>
              </h2>
        
              {/* Description */}
        
              <p
                className="
                  mb-9
                  max-w-[430px]
                  text-[15px]
                  leading-7
                  text-slate-300
                "
              >
                Build the skills, projects, and confidence you
                need to turn your coding journey into a real
                career.
              </p>
        
              {/* =================================================
                  LEARN
                  ================================================= */}
        
              <div className="mb-6 flex items-center gap-4">
        
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-blue-400/20
                    bg-blue-500/10
                    text-blue-300
                  "
                >
                  ◇
                </div>
        
                <div>
        
                  <h3 className="text-[15px] font-semibold text-white">
                    Learn
                  </h3>
        
                  <p className="text-[13px] text-slate-400">
                    Structured paths for modern technologies
                  </p>
        
                </div>
        
              </div>
        
              {/* =================================================
                  BUILD
                  ================================================= */}
        
              <div className="mb-6 flex items-center gap-4">
        
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-indigo-400/20
                    bg-indigo-500/10
                    font-mono
                    text-indigo-300
                  "
                >
                  {"</>"}
                </div>
        
                <div>
        
                  <h3 className="text-[15px] font-semibold text-white">
                    Build
                  </h3>
        
                  <p className="text-[13px] text-slate-400">
                    Hands-on projects and real-world experience
                  </p>
        
                </div>
        
              </div>
        
              {/* =================================================
                  GROW
                  ================================================= */}
        
              <div className="flex items-center gap-4">
        
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-purple-400/20
                    bg-purple-500/10
                    text-purple-300
                  "
                >
                  ↗
                </div>
        
                <div>
        
                  <h3 className="text-[15px] font-semibold text-white">
                    Grow
                  </h3>
        
                  <p className="text-[13px] text-slate-400">
                    Become career-ready with guidance and community
                  </p>
        
                </div>
        
              </div>
        
            </div>
        
            {/* =================================================
                BOTTOM TAGLINE
                ================================================= */}
        
            <div
              className="
                absolute
                bottom-8
                left-10
                flex
                items-center
                gap-4
                xl:left-16
              "
            >
        
              <div
                className="
                  h-[2px]
                  w-12
                  bg-gradient-to-r
                  from-blue-400
                  to-purple-500
                "
              />
        
              <span
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.35em]
                  text-slate-400
                "
              >
                A better you every day
              </span>
        
            </div>
        
          </div>
        
        </div>
      </div>
    </>
  );
}

export default Signup;
