"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = "https://api.collabzy.in/api/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  function getPasswordStrength(pw: string): { width: string; color: string } {
    if (!pw) return { width: "0%", color: "transparent" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    return { width: ["33%","66%","100%"][score-1]||"15%", color: ["#ef4444","#f97316","#22c55e"][score-1]||"#ef4444" };
  }

  function getMatchHint() {
    if (!form.confirm) return null;
    return form.password === form.confirm
      ? { text: "✓ Passwords match", color: "#22c55e" }
      : { text: "✗ Passwords do not match", color: "#f87171" };
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required");
    if (!form.email.includes("@")) return setError("Enter valid email");
    if (form.password.length < 6) return setError("Min 6 characters");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email.trim().toLowerCase(), password: form.password, role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      localStorage.setItem("admin_email", form.email.trim().toLowerCase());
      if (data.token) localStorage.setItem("token", data.token);
      // ✅ OTP verify page pe bhejo
      router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const strength = getPasswordStrength(form.password);
  const matchHint = getMatchHint();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');
        .register-input { width:100%; background:rgba(255,255,255,0.04); border:0.5px solid rgba(255,255,255,0.1); border-radius:10px; padding:11px 12px 11px 38px; font-size:14px; color:#fff; font-family:'Sora',sans-serif; outline:none; transition:border-color 0.2s,background 0.2s; box-sizing:border-box; }
        .register-input::placeholder { color:rgba(255,255,255,0.2); }
        .register-input:focus { border-color:rgba(79,110,247,0.6); background:rgba(79,110,247,0.05); }
        .register-btn { width:100%; padding:13px; background:linear-gradient(135deg,#4f6ef7,#7c3aed); border:none; border-radius:10px; font-size:14px; font-weight:600; color:#fff; cursor:pointer; font-family:'Sora',sans-serif; transition:opacity 0.2s,transform 0.15s; margin-top:6px; }
        .register-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .register-btn:disabled { opacity:0.5; cursor:not-allowed; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:8px; }
      `}</style>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#080c18",fontFamily:"'Sora',sans-serif",position:"relative",overflow:"hidden",padding:"2rem"}}>
        <div style={{position:"absolute",width:350,height:350,borderRadius:"50%",background:"#4f6ef7",filter:"blur(80px)",opacity:0.15,top:-80,right:-60,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:250,height:250,borderRadius:"50%",background:"#7c3aed",filter:"blur(80px)",opacity:0.15,bottom:-60,left:-40,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:420,background:"rgba(15,21,40,0.97)",border:"0.5px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"2.5rem 2rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"2rem"}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <span style={{fontSize:15,fontWeight:600,color:"#fff"}}>Collabzy</span>
            <span style={{marginLeft:"auto",fontSize:10,fontWeight:500,color:"#4f6ef7",background:"rgba(79,110,247,0.12)",border:"0.5px solid rgba(79,110,247,0.3)",padding:"2px 8px",borderRadius:20}}>Admin Portal</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:600,color:"#fff",margin:0}}>Create account</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:4,marginBottom:"2rem"}}>Register as an admin to manage your workspace</p>
          {error && (
            <div style={{background:"rgba(220,38,38,0.1)",border:"0.5px solid rgba(220,38,38,0.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#f87171",marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          <form onSubmit={handleRegister} style={{display:"flex",flexDirection:"column",gap:0}}>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.45)",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Full name</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",display:"flex",color:"rgba(255,255,255,0.25)"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input className="register-input" type="text" placeholder="Rahul Sharma" value={form.name} onChange={(e)=>update("name",e.target.value)} required/>
              </div>
            </div>
            <div style={{marginBottom:"1rem"}}>
              <label style={{display:"block",fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.45)",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Email address</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",display:"flex",color:"rgba(255,255,255,0.25)"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input className="register-input" type="email" placeholder="admin@collabzy.in" value={form.email} onChange={(e)=>update("email",e.target.value)} required/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:"1.25rem"}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.45)",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Password</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",display:"flex",color:"rgba(255,255,255,0.25)"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input className="register-input" type="password" placeholder="Min 6 chars" value={form.password} onChange={(e)=>update("password",e.target.value)} required/>
                </div>
                <div style={{height:3,borderRadius:2,marginTop:6,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:2,width:strength.width,background:strength.color,transition:"width 0.3s,background 0.3s"}}/>
                </div>
              </div>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.45)",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Confirm</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",display:"flex",color:"rgba(255,255,255,0.25)"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input className="register-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={(e)=>update("confirm",e.target.value)} required/>
                </div>
                {matchHint && <p style={{fontSize:11,marginTop:5,color:matchHint.color}}>{matchHint.text}</p>}
              </div>
            </div>
            <button type="submit" disabled={loading} className="register-btn">
              {loading ? <><span className="spinner"/>Creating account...</> : "Create Admin Account"}
            </button>
          </form>
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"1.25rem 0",color:"rgba(255,255,255,0.15)",fontSize:12}}>
            <div style={{flex:1,height:"0.5px",background:"rgba(255,255,255,0.08)"}}/>or<div style={{flex:1,height:"0.5px",background:"rgba(255,255,255,0.08)"}}/>
          </div>
          <p style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.35)"}}>
            Already have an account?{" "}
            <Link href="/login" style={{color:"#4f6ef7",textDecoration:"none",fontWeight:500}}>Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}


// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// const API = "https://api.collabzy.in/api/auth";

// export default function RegisterPage() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirm: "",
//     role: "admin",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   function update(key: string, val: string) {
//     setForm((f) => ({ ...f, [key]: val }));
//   }

//   function getPasswordStrength(pw: string): { width: string; color: string } {
//     if (!pw) return { width: "0%", color: "transparent" };
//     let score = 0;
//     if (pw.length >= 6) score++;
//     if (pw.length >= 10) score++;
//     if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
//     const colors = ["#ef4444", "#f97316", "#22c55e"];
//     const widths = ["33%", "66%", "100%"];
//     return { width: widths[score - 1] || "15%", color: colors[score - 1] || "#ef4444" };
//   }

//   function getMatchHint(): { text: string; color: string } | null {
//     if (!form.confirm) return null;
//     if (form.password === form.confirm)
//       return { text: "✓ Passwords match", color: "#22c55e" };
//     return { text: "✗ Passwords do not match", color: "#f87171" };
//   }

//   async function handleRegister(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");

//     if (!form.name.trim()) return setError("Name is required");
//     if (!form.email.includes("@")) return setError("Enter valid email");
//     if (form.password.length < 6) return setError("Min 6 characters");
//     if (form.password !== form.confirm) return setError("Passwords do not match");

//     setLoading(true);

//     try {
//       const res = await fetch(`${API}/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: form.name,
//           email: form.email.trim().toLowerCase(),
//           password: form.password,
//           role: "admin",
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.message || "Signup failed");

//       if (data.token) localStorage.setItem("token", data.token);
//       localStorage.setItem("admin_email", form.email);

//       router.push("/admin");
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   }

//   const strength = getPasswordStrength(form.password);
//   const matchHint = getMatchHint();

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

//         .register-input {
//           width: 100%;
//           background: rgba(255,255,255,0.04);
//           border: 0.5px solid rgba(255,255,255,0.1);
//           border-radius: 10px;
//           padding: 11px 12px 11px 38px;
//           font-size: 14px;
//           color: #fff;
//           font-family: 'Sora', sans-serif;
//           outline: none;
//           transition: border-color 0.2s, background 0.2s;
//           box-sizing: border-box;
//         }
//         .register-input::placeholder { color: rgba(255,255,255,0.2); }
//         .register-input:focus {
//           border-color: rgba(79,110,247,0.6);
//           background: rgba(79,110,247,0.05);
//         }
//         .register-btn {
//           width: 100%;
//           padding: 13px;
//           background: linear-gradient(135deg, #4f6ef7, #7c3aed);
//           border: none;
//           border-radius: 10px;
//           font-size: 14px;
//           font-weight: 600;
//           color: #fff;
//           cursor: pointer;
//           font-family: 'Sora', sans-serif;
//           letter-spacing: 0.02em;
//           transition: opacity 0.2s, transform 0.15s;
//           margin-top: 6px;
//         }
//         .register-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
//         .register-btn:active:not(:disabled) { transform: translateY(0); }
//         .register-btn:disabled { opacity: 0.5; cursor: not-allowed; }

//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }
//         .spinner {
//           display: inline-block;
//           width: 14px;
//           height: 14px;
//           border: 2px solid rgba(255,255,255,0.3);
//           border-top-color: #fff;
//           border-radius: 50%;
//           animation: spin 0.7s linear infinite;
//           vertical-align: middle;
//           margin-right: 8px;
//         }
//       `}</style>

//       <div style={{
//         minHeight: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "#080c18",
//         fontFamily: "'Sora', sans-serif",
//         position: "relative",
//         overflow: "hidden",
//         padding: "2rem",
//       }}>

//         {/* Glow orbs */}
//         <div style={{
//           position: "absolute", width: 350, height: 350, borderRadius: "50%",
//           background: "#4f6ef7", filter: "blur(80px)", opacity: 0.15,
//           top: -80, right: -60, pointerEvents: "none",
//         }} />
//         <div style={{
//           position: "absolute", width: 250, height: 250, borderRadius: "50%",
//           background: "#7c3aed", filter: "blur(80px)", opacity: 0.15,
//           bottom: -60, left: -40, pointerEvents: "none",
//         }} />

//         {/* Card */}
//         <div style={{
//           position: "relative", zIndex: 2,
//           width: "100%", maxWidth: 420,
//           background: "rgba(15,21,40,0.97)",
//           border: "0.5px solid rgba(255,255,255,0.08)",
//           borderRadius: 20,
//           padding: "2.5rem 2rem",
//         }}>

//           {/* Logo row */}
//           <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
//             <div style={{
//               width: 36, height: 36,
//               background: "linear-gradient(135deg,#4f6ef7,#7c3aed)",
//               borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
//             }}>
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
//               </svg>
//             </div>
//             <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Collabzy</span>
//             <span style={{
//               marginLeft: "auto", fontSize: 10, fontWeight: 500,
//               color: "#4f6ef7",
//               background: "rgba(79,110,247,0.12)",
//               border: "0.5px solid rgba(79,110,247,0.3)",
//               padding: "2px 8px", borderRadius: 20,
//             }}>Admin Portal</span>
//           </div>

//           <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: 0 }}>Create account</h1>
//           <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4, marginBottom: "2rem" }}>
//             Register as an admin to manage your workspace
//           </p>

//           {/* Error box */}
//           {error && (
//             <div style={{
//               background: "rgba(220,38,38,0.1)",
//               border: "0.5px solid rgba(220,38,38,0.3)",
//               borderRadius: 10, padding: "10px 14px",
//               fontSize: 13, color: "#f87171",
//               marginBottom: "1rem",
//               display: "flex", alignItems: "center", gap: 8,
//             }}>
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
//                 <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
//               </svg>
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

//             {/* Name */}
//             <div style={{ marginBottom: "1rem" }}>
//               <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
//                 Full name
//               </label>
//               <div style={{ position: "relative" }}>
//                 <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", color: "rgba(255,255,255,0.25)" }}>
//                   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
//                 </span>
//                 <input className="register-input" type="text" placeholder="Rahul Sharma" value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" required />
//               </div>
//             </div>

//             {/* Email */}
//             <div style={{ marginBottom: "1rem" }}>
//               <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
//                 Email address
//               </label>
//               <div style={{ position: "relative" }}>
//                 <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", color: "rgba(255,255,255,0.25)" }}>
//                   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
//                 </span>
//                 <input className="register-input" type="email" placeholder="rahul@company.com" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required />
//               </div>
//             </div>

//             {/* Password + Confirm row */}
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>

//               {/* Password */}
//               <div>
//                 <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
//                   Password
//                 </label>
//                 <div style={{ position: "relative" }}>
//                   <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", color: "rgba(255,255,255,0.25)" }}>
//                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
//                   </span>
//                   <input className="register-input" type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} required />
//                 </div>
//                 {/* Strength bar */}
//                 <div style={{ height: 3, borderRadius: 2, marginTop: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
//                   <div style={{ height: "100%", borderRadius: 2, width: strength.width, background: strength.color, transition: "width 0.3s, background 0.3s" }} />
//                 </div>
//               </div>

//               {/* Confirm */}
//               <div>
//                 <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
//                   Confirm
//                 </label>
//                 <div style={{ position: "relative" }}>
//                   <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", color: "rgba(255,255,255,0.25)" }}>
//                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><polyline points="9,12 11,14 15,10"/></svg>
//                   </span>
//                   <input className="register-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} required />
//                 </div>
//                 {matchHint && (
//                   <p style={{ fontSize: 11, marginTop: 5, color: matchHint.color, minHeight: 14 }}>{matchHint.text}</p>
//                 )}
//               </div>

//             </div>

//             <button type="submit" disabled={loading} className="register-btn">
//               {loading ? <><span className="spinner" />Creating account...</> : "Create Admin Account"}
//             </button>

//           </form>

//           {/* Divider */}
//           <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.25rem 0", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
//             <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.08)" }} />
//             or
//             <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.08)" }} />
//           </div>

//           <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
//             Already have an account?{" "}
//             <Link href="/login" style={{ color: "#4f6ef7", textDecoration: "none", fontWeight: 500 }}>
//               Sign in
//             </Link>
//           </p>

//         </div>
//       </div>
//     </>
//   );
// }


// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// const API = "https://api.collabzy.in/api/auth";

// export default function RegisterPage() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirm: "",
//     role: "admin",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   function update(key: string, val: string) {
//     setForm((f) => ({ ...f, [key]: val }));
//   }

//   async function handleRegister(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");

//     if (!form.name.trim()) return setError("Name is required");
//     if (!form.email.includes("@")) return setError("Enter valid email");
//     if (form.password.length < 6) return setError("Min 6 characters");
//     if (form.password !== form.confirm) return setError("Passwords not match");

//     setLoading(true);

//     try {
//       const res = await fetch(`${API}/signup`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: form.name,
//           email: form.email.trim().toLowerCase(),
//           password: form.password,
//           role: "admin", // 🔥 force admin
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || "Signup failed");
//       }

//       // ✅ token save (if backend returns)
//       if (data.token) {
//         localStorage.setItem("token", data.token);
//       }

//       localStorage.setItem("admin_email", form.email);

//       // ✅ redirect
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
//       color: "white",
//       fontFamily: "sans-serif",
//     }}>
//       <div style={{
//         width: 400,
//         background: "#0f1526",
//         padding: 30,
//         borderRadius: 12,
//       }}>
//         <h2 style={{ marginBottom: 20 }}>Admin Register</h2>

//         <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          
//           <input
//             type="text"
//             placeholder="Name"
//             value={form.name}
//             onChange={(e) => update("name", e.target.value)}
//             required
//           />

//           <input
//             type="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={(e) => update("email", e.target.value)}
//             required
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={(e) => update("password", e.target.value)}
//             required
//           />

//           <input
//             type="password"
//             placeholder="Confirm Password"
//             value={form.confirm}
//             onChange={(e) => update("confirm", e.target.value)}
//             required
//           />

//           {error && <p style={{ color: "red" }}>{error}</p>}

//           <button
//             type="submit"
//             disabled={loading}
//             style={{
//               padding: 12,
//               background: "#4f6ef7",
//               border: "none",
//               color: "white",
//               cursor: "pointer",
//               borderRadius: 6,
//             }}
//           >
//             {loading ? "Creating..." : "Register"}
//           </button>

//           <p style={{ fontSize: 14 }}>
//             Already have account? <Link href="/login">Login</Link>
//           </p>

          

//         </form>
//       </div>
//     </div>
//   );
// }


// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// export default function RegisterPage() {
//   const router = useRouter();
//   const [form, setForm] = useState({
//     name: "", email: "", password: "", confirm: "", role: "admin",
//   });
//   const [loading, setLoading]   = useState(false);
//   const [error, setError]       = useState("");
//   const [showPass, setShowPass] = useState(false);
//   const [showConf, setShowConf] = useState(false);

//   function update(key: string, val: string) {
//     setForm(f => ({ ...f, [key]: val }));
//   }

//   function handleRegister(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");

//     if (!form.name.trim())              return setError("Name is required");
//     if (!form.email.includes("@"))      return setError("Enter a valid email");
//     if (form.password.length < 6)       return setError("Password must be at least 6 characters");
//     if (form.password !== form.confirm) return setError("Passwords do not match");

//     setLoading(true);

//     setTimeout(() => {
//       // Save admin to localStorage (replace with real API later)
//       const admins = JSON.parse(localStorage.getItem("admins") || "[]");
//       const exists = admins.find((a: any) => a.email === form.email);
//       if (exists) {
//         setError("An account with this email already exists");
//         setLoading(false);
//         return;
//       }

//       admins.push({
//         name:      form.name,
//         email:     form.email,
//         password:  form.password,
//         role:      form.role,
//         createdAt: new Date().toISOString(),
//       });

//       localStorage.setItem("admins", JSON.stringify(admins));
//       localStorage.setItem("token", `token-${form.email}-${Date.now()}`);
//       localStorage.setItem("admin_email", form.email);
//       localStorage.setItem("admin_name", form.name);

//       router.push("/admin");
//     }, 800);
//   }

//   const strength = form.password.length === 0 ? 0
//     : form.password.length < 6  ? 1
//     : form.password.length < 10 ? 2
//     : 3;

//   const strengthLabel = ["", "Weak", "Medium", "Strong"];
//   const strengthColor = ["", "#ff4757", "#f5a623", "#00d68f"];

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
//       padding: "40px 16px",
//     }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
//         @keyframes spin   { to { transform: rotate(360deg); } }
//         @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
//         @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

//         .rcard {
//           width: 460px;
//           background: #0f1526;
//           border: 1px solid rgba(79,110,247,0.2);
//           border-radius: 20px;
//           padding: 40px 36px;
//           animation: fadeUp 0.5s ease;
//           position: relative;
//           z-index: 1;
//           box-shadow: 0 24px 80px rgba(0,0,0,0.5);
//         }
//         .rfield { display:flex; flex-direction:column; gap:7px; }
//         .rlabel { font-size:11.5px; color:#4a5568; text-transform:uppercase; letter-spacing:0.8px; font-weight:600; }
//         .rinput {
//           width:100%; background:#141b30; border:1px solid rgba(79,110,247,0.15);
//           color:#e8eaf6; padding:12px 14px; border-radius:9px; font-size:14px;
//           outline:none; transition:all 0.2s; font-family:inherit;
//         }
//         .rinput:focus { border-color:#4f6ef7; box-shadow:0 0 0 3px rgba(79,110,247,0.12); background:#1a2240; }
//         .rinput::placeholder { color:#2d3748; }
//         .pwrap { position:relative; }
//         .pwrap .rinput { padding-right:44px; }
//         .peye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:#4a5568; cursor:pointer; font-size:16px; padding:2px; }
//         .peye:hover { color:#8892b0; }
//         .rbtn {
//           width:100%; background:linear-gradient(135deg,#4f6ef7,#6366f1); color:white;
//           border:none; padding:13px; border-radius:9px; font-size:14px; font-weight:700;
//           cursor:pointer; transition:all 0.25s; font-family:inherit;
//           display:flex; align-items:center; justify-content:center; gap:8px;
//           box-shadow:0 4px 20px rgba(79,110,247,0.3);
//         }
//         .rbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(79,110,247,0.45); }
//         .rbtn:disabled { opacity:0.65; cursor:not-allowed; }
//         .rselect {
//           width:100%; background:#141b30; border:1px solid rgba(79,110,247,0.15);
//           color:#e8eaf6; padding:12px 14px; border-radius:9px; font-size:14px;
//           outline:none; transition:all 0.2s; font-family:inherit; cursor:pointer;
//           appearance: none;
//           background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
//           background-repeat: no-repeat;
//           background-position: right 14px center;
//           padding-right: 36px;
//         }
//         .rselect:focus { border-color:#4f6ef7; box-shadow:0 0 0 3px rgba(79,110,247,0.12); }
//         .rlink { text-align:center; font-size:13px; color:#4a5568; }
//         .rlink a { color:#4f6ef7; font-weight:600; text-decoration:none; }
//         .rlink a:hover { color:#7c93ff; }
//         .two-col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
//       `}</style>

//       {/* BG Glows */}
//       <div style={{ position:"fixed", top:"20%", right:"10%", width:350, height:350, background:"radial-gradient(circle, rgba(168,85,247,0.07), transparent 70%)", animation:"float 7s ease-in-out infinite", pointerEvents:"none" }} />
//       <div style={{ position:"fixed", bottom:"20%", left:"10%", width:400, height:400, background:"radial-gradient(circle, rgba(79,110,247,0.06), transparent 70%)", animation:"float 9s ease-in-out infinite reverse", pointerEvents:"none" }} />

//       <div className="rcard">
//         {/* Logo */}
//         <div style={{ textAlign:"center", marginBottom:28 }}>
//           <div style={{
//             width:52, height:52, background:"linear-gradient(135deg,#a855f7,#4f6ef7)",
//             borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center",
//             fontSize:22, fontWeight:700, color:"white",
//             margin:"0 auto 14px", boxShadow:"0 8px 28px rgba(168,85,247,0.4)",
//             animation:"float 4s ease-in-out infinite",
//           }}>I</div>
//           <h1 style={{ fontSize:22, fontWeight:700, color:"#e8eaf6", marginBottom:4 }}>Create Admin Account</h1>
//           <p style={{ fontSize:13, color:"#4a5568" }}>Register as a new admin</p>
//         </div>

//         <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:16 }}>

//           {/* Name + Role */}
//           <div className="two-col">
//             <div className="rfield">
//               <label className="rlabel">Full Name</label>
//               <input className="rinput" type="text" placeholder="John Doe"
//                 value={form.name} onChange={e => update("name", e.target.value)} required />
//             </div>
//             <div className="rfield">
//               <label className="rlabel">Role</label>
//               <select className="rselect" value={form.role} onChange={e => update("role", e.target.value)}>
//                 <option value="admin">Admin</option>
//                 <option value="super_admin">Super Admin</option>
//                 <option value="moderator">Moderator</option>
//                 <option value="support">Support</option>
//                 <option value="finance">Finance</option>
//               </select>
//             </div>
//           </div>

//           {/* Email */}
//           <div className="rfield">
//             <label className="rlabel">Email Address</label>
//             <input className="rinput" type="email" placeholder="admin@example.com"
//               value={form.email} onChange={e => update("email", e.target.value)} required autoComplete="email" />
//           </div>

//           {/* Password */}
//           <div className="rfield">
//             <label className="rlabel">Password</label>
//             <div className="pwrap">
//               <input className="rinput" type={showPass ? "text" : "password"}
//                 placeholder="Min. 6 characters"
//                 value={form.password} onChange={e => update("password", e.target.value)}
//                 required autoComplete="new-password" />
//               <button type="button" className="peye" onClick={() => setShowPass(p => !p)}>
//                 {showPass ? "🙈" : "👁"}
//               </button>
//             </div>
//             {/* Strength bar */}
//             {form.password.length > 0 && (
//               <div style={{ marginTop:6 }}>
//                 <div style={{ display:"flex", gap:4, marginBottom:4 }}>
//                   {[1,2,3].map(i => (
//                     <div key={i} style={{
//                       flex:1, height:3, borderRadius:2,
//                       background: i <= strength ? strengthColor[strength] : "#1a2240",
//                       transition: "background 0.3s",
//                     }} />
//                   ))}
//                 </div>
//                 <span style={{ fontSize:11, color:strengthColor[strength] }}>{strengthLabel[strength]}</span>
//               </div>
//             )}
//           </div>

//           {/* Confirm Password */}
//           <div className="rfield">
//             <label className="rlabel">Confirm Password</label>
//             <div className="pwrap">
//               <input className="rinput" type={showConf ? "text" : "password"}
//                 placeholder="Re-enter password"
//                 value={form.confirm} onChange={e => update("confirm", e.target.value)}
//                 required autoComplete="new-password" />
//               <button type="button" className="peye" onClick={() => setShowConf(p => !p)}>
//                 {showConf ? "🙈" : "👁"}
//               </button>
//             </div>
//             {form.confirm && form.password !== form.confirm && (
//               <span style={{ fontSize:11.5, color:"#ff4757" }}>⚠ Passwords do not match</span>
//             )}
//             {form.confirm && form.password === form.confirm && (
//               <span style={{ fontSize:11.5, color:"#00d68f" }}>✓ Passwords match</span>
//             )}
//           </div>

//           {/* Error */}
//           {error && (
//             <div style={{ background:"rgba(255,71,87,0.08)", border:"1px solid rgba(255,71,87,0.25)", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#ff4757", display:"flex", alignItems:"center", gap:8 }}>
//               ⚠ {error}
//             </div>
//           )}

//           {/* Submit */}
//           <button className="rbtn" type="submit" disabled={loading} style={{ marginTop:4 }}>
//             {loading ? (
//               <>
//                 <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
//                 Creating account...
//               </>
//             ) : "Create Account →"}
//           </button>

//           <div className="rlink">
//             Already have an account? <Link href="/login">Sign in</Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
