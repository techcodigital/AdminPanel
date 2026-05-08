"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = "https://api.collabzy.in/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      const token = data.token;
      if (!token) throw new Error("Token not received");
      if (data.user?.role !== "admin") throw new Error("Access denied: Admin only");

      localStorage.setItem("token", token);
      localStorage.setItem("admin_email", data.user.email);
      localStorage.setItem("admin_name", data.user.name || data.user.email); // ✅ naam save karo

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0e1a", fontFamily: "sans-serif" }}>
      <div style={{ width: 400, background: "#0f1526", padding: 30, borderRadius: 12, color: "white" }}>
        <h2 style={{ marginBottom: 20 }}>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: 10, borderRadius: 6 }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: 10, borderRadius: 6 }} />
          {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding: 12, borderRadius: 6, background: "#4f6ef7", color: "white", border: "none", cursor: "pointer" }}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15, fontSize: 14, color: "#aaa" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#4f6ef7", fontWeight: "bold" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}




// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link"; // ✅ FIX

// const API = "https://api.collabzy.in/api/auth";

// export default function LoginPage() {
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await fetch(`${API}/login`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: email.trim().toLowerCase(),
//           password,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || "Login failed");
//       }

//       const token = data.token;
//       if (!token) throw new Error("Token not received");

//       if (data.user?.role !== "admin") {
//         throw new Error("Access denied: Admin only");
//       }

//       localStorage.setItem("token", token);
//       localStorage.setItem("admin_email", data.user.email);

//       router.push("/admin");

//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div style={{
//       minHeight: "100vh",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       background: "#0a0e1a",
//       fontFamily: "sans-serif",
//     }}>
//       <div style={{
//         width: 400,
//         background: "#0f1526",
//         padding: 30,
//         borderRadius: 12,
//         color: "white"
//       }}>
//         <h2 style={{ marginBottom: 20 }}>Admin Login</h2>

//         <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          
//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             style={{ padding: 10, borderRadius: 6 }}
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             style={{ padding: 10, borderRadius: 6 }}
//           />

//           {error && (
//             <p style={{ color: "red", fontSize: 14 }}>{error}</p>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             style={{
//               padding: 12,
//               borderRadius: 6,
//               background: "#4f6ef7",
//               color: "white",
//               border: "none",
//               cursor: "pointer"
//             }}
//           >
//             {loading ? "Signing in..." : "Login"}
//           </button>
//         </form>

//         {/* ✅ SIGNUP LINK */}
//         <p style={{ 
//           textAlign: "center", 
//           marginTop: 15, 
//           fontSize: 14, 
//           color: "#aaa" 
//         }}>
//           Don’t have an account?{" "}
//           <Link href="/register" style={{ color: "#4f6ef7", fontWeight: "bold" }}>
//             Sign up
//           </Link>
//         </p>

//       </div>
//     </div>
//   );
// }

// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// const ADMIN_EMAIL    = "admin@influencehub.com";
// const ADMIN_PASSWORD = "admin123";
// const FAKE_TOKEN     = "admin-token-influencehub-2024";

// export default function LoginPage() {
//   const router = useRouter();
//   const [email, setEmail]       = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading]   = useState(false);
//   const [error, setError]       = useState("");
//   const [showPass, setShowPass] = useState(false);

//   function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     setTimeout(() => {
//       if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
//         localStorage.setItem("token", FAKE_TOKEN);
//         localStorage.setItem("admin_email", email);
//         router.push("/admin");
//       } else {
//         setError("Invalid email or password");
//         setLoading(false);
//       }
//     }, 800);
//   }

//   return (
//     <div style={{
//       minHeight: "100vh",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       background: "#0a0e1a",
//       fontFamily: "'Space Grotesk', sans-serif",
//       overflow: "hidden",
//       position: "relative",
//     }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
//         @keyframes spin    { to { transform: rotate(360deg); } }
//         @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
//         @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

//         .lcard {
//           width: 420px;
//           background: #0f1526;
//           border: 1px solid rgba(79,110,247,0.2);
//           border-radius: 20px;
//           padding: 40px 36px;
//           animation: fadeUp 0.5s ease;
//           position: relative;
//           z-index: 1;
//           box-shadow: 0 24px 80px rgba(0,0,0,0.5);
//         }
//         .lfield { display:flex; flex-direction:column; gap:7px; }
//         .llabel { font-size:11.5px; color:#4a5568; text-transform:uppercase; letter-spacing:0.8px; font-weight:600; }
//         .linput {
//           width:100%; background:#141b30; border:1px solid rgba(79,110,247,0.15);
//           color:#e8eaf6; padding:12px 14px; border-radius:9px; font-size:14px;
//           outline:none; transition:all 0.2s; font-family:inherit;
//         }
//         .linput:focus { border-color:#4f6ef7; box-shadow:0 0 0 3px rgba(79,110,247,0.12); background:#1a2240; }
//         .linput::placeholder { color:#2d3748; }
//         .pwrap { position:relative; }
//         .pwrap .linput { padding-right:44px; }
//         .peye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:#4a5568; cursor:pointer; font-size:16px; padding:2px; transition:color 0.2s; }
//         .peye:hover { color:#8892b0; }
//         .lbtn {
//           width:100%; background:linear-gradient(135deg,#4f6ef7,#6366f1); color:white;
//           border:none; padding:13px; border-radius:9px; font-size:14px; font-weight:700;
//           cursor:pointer; transition:all 0.25s; font-family:inherit;
//           display:flex; align-items:center; justify-content:center; gap:8px;
//           box-shadow:0 4px 20px rgba(79,110,247,0.3);
//         }
//         .lbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(79,110,247,0.45); }
//         .lbtn:disabled { opacity:0.65; cursor:not-allowed; }
//         .hint-box {
//           background:rgba(79,110,247,0.06); border:1px solid rgba(79,110,247,0.15);
//           border-radius:9px; padding:12px 14px; font-size:12.5px; color:#8892b0; line-height:1.7;
//         }
//         .hint-box b { color:#4f6ef7; font-family:monospace; font-weight:600; }
//         .llink { text-align:center; font-size:13px; color:#4a5568; }
//         .llink a { color:#4f6ef7; font-weight:600; text-decoration:none; }
//         .llink a:hover { color:#7c93ff; }
//       `}</style>

//       {/* BG Glows */}
//       <div style={{ position:"fixed", top:"25%", left:"10%", width:350, height:350, background:"radial-gradient(circle, rgba(79,110,247,0.07), transparent 70%)", animation:"float 6s ease-in-out infinite", pointerEvents:"none" }} />
//       <div style={{ position:"fixed", bottom:"15%", right:"10%", width:400, height:400, background:"radial-gradient(circle, rgba(168,85,247,0.06), transparent 70%)", animation:"float 8s ease-in-out infinite reverse", pointerEvents:"none" }} />

//       <div className="lcard">
//         {/* Logo */}
//         <div style={{ textAlign:"center", marginBottom:32 }}>
//           <div style={{
//             width:56, height:56, background:"linear-gradient(135deg,#4f6ef7,#a855f7)",
//             borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center",
//             fontSize:26, fontWeight:700, color:"white",
//             margin:"0 auto 16px", boxShadow:"0 8px 28px rgba(79,110,247,0.4)",
//             animation:"float 4s ease-in-out infinite",
//           }}>I</div>
//           <h1 style={{ fontSize:22, fontWeight:700, color:"#e8eaf6", marginBottom:4 }}>InfluenceHub</h1>
//           <p style={{ fontSize:13, color:"#4a5568" }}>Admin Dashboard</p>
//         </div>

//         <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:18 }}>

//           <div className="lfield">
//             <label className="llabel">Email Address</label>
//             <input className="linput" type="email" placeholder="admin@influencehub.com"
//               value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
//           </div>

//           <div className="lfield">
//             <label className="llabel">Password</label>
//             <div className="pwrap">
//               <input className="linput" type={showPass ? "text" : "password"}
//                 placeholder="Enter your password"
//                 value={password} onChange={e => setPassword(e.target.value)}
//                 required autoComplete="current-password" />
//               <button type="button" className="peye" onClick={() => setShowPass(p => !p)}>
//                 {showPass ? "🙈" : "👁"}
//               </button>
//             </div>
//           </div>

//           {error && (
//             <div style={{ background:"rgba(255,71,87,0.08)", border:"1px solid rgba(255,71,87,0.25)", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#ff4757", display:"flex", alignItems:"center", gap:8 }}>
//               ⚠ {error}
//             </div>
//           )}

//           <button className="lbtn" type="submit" disabled={loading}>
//             {loading ? (
//               <>
//                 <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
//                 Signing in...
//               </>
//             ) : "Sign In →"}
//           </button>

//           <div className="hint-box">
//             <div style={{ fontWeight:600, color:"#e8eaf6", marginBottom:4, fontSize:12 }}>🔑 Demo Credentials</div>
//             Email: <b>{ADMIN_EMAIL}</b><br />
//             Password: <b>{ADMIN_PASSWORD}</b>
//           </div>

//           <div className="llink">
//             New admin? <Link href="/register">Create account</Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }



// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const router = useRouter();
//   const [email, setEmail]       = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading]   = useState(false);
//   const [error, setError]       = useState("");

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const res = await fetch("http://localhost:3001/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Login failed");

//       localStorage.setItem("token", data.token);
//       router.push("/admin");
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div style={{
//       minHeight: "100vh",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       background: "#0a0e1a",
//       fontFamily: "'Space Grotesk', sans-serif",
//     }}>
//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
//         .login-card {
//           width: 380px;
//           background: #141b30;
//           border: 1px solid rgba(79,110,247,0.2);
//           border-radius: 16px;
//           padding: 36px 32px;
//           animation: fadeIn 0.4s ease;
//         }
//         .login-input {
//           width: 100%;
//           background: #0f1526;
//           border: 1px solid rgba(79,110,247,0.2);
//           color: #e8eaf6;
//           padding: 11px 14px;
//           border-radius: 8px;
//           font-size: 14px;
//           outline: none;
//           transition: border-color 0.2s, box-shadow 0.2s;
//           font-family: inherit;
//         }
//         .login-input:focus {
//           border-color: #4f6ef7;
//           box-shadow: 0 0 0 3px rgba(79,110,247,0.15);
//         }
//         .login-input::placeholder { color: #4a5568; }
//         .login-btn {
//           width: 100%;
//           background: #4f6ef7;
//           color: white;
//           border: none;
//           padding: 12px;
//           border-radius: 8px;
//           font-size: 14px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s;
//           font-family: inherit;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//         .login-btn:hover:not(:disabled) {
//           background: #3a55e8;
//           box-shadow: 0 0 20px rgba(79,110,247,0.3);
//           transform: translateY(-1px);
//         }
//         .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
//       `}</style>

//       {/* Background glow */}
//       <div style={{
//         position: "fixed",
//         top: "30%", left: "50%",
//         transform: "translate(-50%, -50%)",
//         width: 500, height: 500,
//         background: "radial-gradient(circle, rgba(79,110,247,0.08), transparent 70%)",
//         pointerEvents: "none",
//       }} />

//       <div className="login-card">
//         {/* Logo */}
//         <div style={{ textAlign: "center", marginBottom: 32 }}>
//           <div style={{
//             width: 52, height: 52,
//             background: "linear-gradient(135deg, #4f6ef7, #a855f7)",
//             borderRadius: 14,
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: 24, fontWeight: 700, color: "white",
//             margin: "0 auto 16px",
//             boxShadow: "0 8px 24px rgba(79,110,247,0.3)",
//           }}>I</div>
//           <div style={{ fontSize: 22, fontWeight: 700, color: "#e8eaf6" }}>
//             InfluenceHub
//           </div>
//           <div style={{ fontSize: 13, color: "#4a5568", marginTop: 4 }}>
//             Admin Dashboard
//           </div>
//         </div>

//         <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
//           <div>
//             <label style={{
//               fontSize: 12, color: "#4a5568",
//               display: "block", marginBottom: 7,
//               textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600,
//             }}>Email</label>
//             <input
//               className="login-input"
//               type="email"
//               placeholder="admin@example.com"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               required
//               autoComplete="email"
//             />
//           </div>

//           <div>
//             <label style={{
//               fontSize: 12, color: "#4a5568",
//               display: "block", marginBottom: 7,
//               textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600,
//             }}>Password</label>
//             <input
//               className="login-input"
//               type="password"
//               placeholder="••••••••"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//               required
//               autoComplete="current-password"
//             />
//           </div>

//           {error && (
//             <div style={{
//               background: "rgba(255,71,87,0.1)",
//               border: "1px solid rgba(255,71,87,0.3)",
//               borderRadius: 8, padding: "10px 14px",
//               fontSize: 13, color: "#ff4757",
//               display: "flex", alignItems: "center", gap: 8,
//             }}>
//               <span>⚠</span> {error}
//             </div>
//           )}

//           <button className="login-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
//             {loading ? (
//               <div style={{
//                 width: 18, height: 18,
//                 border: "2px solid rgba(255,255,255,0.3)",
//                 borderTopColor: "white",
//                 borderRadius: "50%",
//                 animation: "spin 0.7s linear infinite",
//               }} />
//             ) : "Sign In"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }