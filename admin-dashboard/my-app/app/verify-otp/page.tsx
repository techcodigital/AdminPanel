"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = "https://api.collabzy.in/api/auth";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || localStorage.getItem("admin_email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer === 0) return;
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  function handleChange(index: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) return setError("Please enter the 6-digit OTP");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      setSuccess("Email verified! Redirecting...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResending(true);
    try {
      const res = await fetch(`${API}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend");
      setTimer(60);
      setSuccess("OTP resent! Check your email.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');

        .otp-input {
          width: 48px;
          height: 56px;
          background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          font-size: 22px;
          font-weight: 600;
          color: #fff;
          text-align: center;
          font-family: 'Sora', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          caret-color: #4f6ef7;
        }
        .otp-input:focus {
          border-color: rgba(79,110,247,0.7);
          background: rgba(79,110,247,0.08);
        }
        .otp-input:not(:placeholder-shown) {
          border-color: rgba(79,110,247,0.4);
        }
        .verify-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #4f6ef7, #7c3aed);
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          transition: opacity 0.2s, transform 0.15s;
        }
        .verify-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080c18",
        fontFamily: "'Sora', sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "2rem",
      }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "#4f6ef7", filter: "blur(80px)", opacity: 0.12, top: -60, right: -40, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "#7c3aed", filter: "blur(80px)", opacity: 0.12, bottom: -50, left: -30, pointerEvents: "none" }} />

        {/* Card */}
        <div style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: 400,
          background: "rgba(15,21,40,0.97)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          textAlign: "center",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Collabzy</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "#4f6ef7", background: "rgba(79,110,247,0.12)", border: "0.5px solid rgba(79,110,247,0.3)", padding: "2px 8px", borderRadius: 20 }}>
              Admin Portal
            </span>
          </div>

          {/* Mail icon */}
          <div style={{ width: 64, height: 64, background: "rgba(79,110,247,0.1)", border: "0.5px solid rgba(79,110,247,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: 0 }}>Check your email</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8, marginBottom: "2rem", lineHeight: 1.6 }}>
            We sent a 6-digit OTP to<br />
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{email}</span>
          </p>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(220,38,38,0.1)", border: "0.5px solid rgba(220,38,38,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#4ade80", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9,12 11,14 15,10"/></svg>
              {success}
            </div>
          )}

          {/* OTP inputs */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "1.5rem" }} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                className="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                placeholder="·"
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {/* Verify button */}
          <button onClick={handleVerify} disabled={loading} className="verify-btn">
            {loading ? <><span className="spinner" />Verifying...</> : "Verify OTP"}
          </button>

          {/* Resend */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: "1.25rem" }}>
            Didn't receive OTP?{" "}
            {timer > 0 ? (
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Resend in {timer}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ background: "none", border: "none", color: "#4f6ef7", fontWeight: 500, cursor: "pointer", fontSize: 13, fontFamily: "'Sora', sans-serif", padding: 0 }}
              >
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </p>

        </div>
      </div>
    </>
  );
}