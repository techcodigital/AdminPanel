"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRole] = useState("all");
  const [acting, setActing]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");

  async function load() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { router.push("/login"); return; }
    const json = await res.json();
    setData(Array.isArray(json) ? json : json?.users ?? json?.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleBan(id: string, isBanned: boolean) {
    setActing(id);
    await fetch(`${BASE}/users/${id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ banned: !isBanned }),
    });
    setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
    await load();
    setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    setActing(id);
    await fetch(`${BASE}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setMsg("User deleted ✓");
    await load();
    setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  const roles = [...new Set(data.map(u => u.role).filter(Boolean))];
  const filtered = data.filter(u => {
    const q = search.toLowerCase();
    const matchS = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
    const matchR = roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter;
    return matchS && matchR;
  });

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
        .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
        .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
        tr:hover .pg-td{background:rgba(79,110,247,0.03);}
        .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;}
        .pg-input:focus{border-color:#4f6ef7;}
        .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
        .pg-btn:hover{border-color:rgba(79,110,247,0.4);color:#e8eaf6;}
        .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;}
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>All Users</h1>
          <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>{loading ? "Loading..." : `${data.length} users registered`}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="pg-input" placeholder="Search name, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <select className="pg-input" value={roleFilter} onChange={e => setRole(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",       value: data.length,                                                              color: "#4f6ef7" },
          { label: "Influencers", value: data.filter(u => (u.role||"").toLowerCase() === "influencer").length,    color: "#a855f7" },
          { label: "Brands",      value: data.filter(u => (u.role||"").toLowerCase() === "brand").length,         color: "#00d4ff" },
          { label: "Banned",      value: data.filter(u => u.isBanned).length,                                     color: "#ff4757" },
        ].map((s, i) => (
          <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#8892b0" }}>{s.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {msg && <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>{msg}</div>}

      <div className="pg-card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {["ID", "Name", "Email", "Role", "Verified", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No users found</td></tr>
            ) : filtered.map((u: any) => {
              const id = u._id || u.id;
              return (
                <tr key={id}>
                  <td className="pg-td"><span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span></td>
                  <td className="pg-td">
                    <div style={{ fontWeight: 600 }}>{u.name ||u.profile?.name}</div>
                    {u.name && <div style={{ fontSize: 11, color: "#4a5568" }}>@{u.name}</div>}
                  </td>
                  <td className="pg-td"><span style={{ fontSize: 12.5, color: "#8892b0" }}>{u.email}</span></td>
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: u.role === "influencer" ? "rgba(168,85,247,0.12)" : u.role === "brand" ? "rgba(0,212,255,0.12)" : u.role === "admin" ? "rgba(255,71,87,0.12)" : "rgba(74,85,104,0.2)",
                      color: u.role === "influencer" ? "#a855f7" : u.role === "brand" ? "#00d4ff" : u.role === "admin" ? "#ff4757" : "#8892b0",
                      border: `1px solid ${u.role === "influencer" ? "rgba(168,85,247,0.25)" : u.role === "brand" ? "rgba(0,212,255,0.25)" : "rgba(74,85,104,0.3)"}`,
                    }}>{u.role || "user"}</span>
                  </td>
                  <td className="pg-td">
                    {u.isVerified
                      ? <span className="badge" style={{ background: "rgba(0,214,143,0.12)", color: "#00d68f", border: "1px solid rgba(0,214,143,0.25)" }}>✓ Yes</span>
                      : <span className="badge" style={{ background: "rgba(74,85,104,0.2)", color: "#8892b0", border: "1px solid rgba(74,85,104,0.3)" }}>No</span>}
                  </td>
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: u.isBanned ? "rgba(255,71,87,0.12)" : "rgba(0,214,143,0.12)",
                      color: u.isBanned ? "#ff4757" : "#00d68f",
                      border: `1px solid ${u.isBanned ? "rgba(255,71,87,0.25)" : "rgba(0,214,143,0.25)"}`,
                    }}>{u.isBanned ? "Banned" : "Active"}</span>
                  </td>
                  <td className="pg-td"><span style={{ fontSize: 12, color: "#4a5568" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</span></td>
                  <td className="pg-td">
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="pg-btn" disabled={acting === id || u.role === "admin"}
                        onClick={() => handleBan(id, u.isBanned)}
                        style={{ color: u.isBanned ? "#00d68f" : "#f5a623", borderColor: u.isBanned ? "rgba(0,214,143,0.3)" : "rgba(245,166,35,0.3)" }}>
                        {acting === id ? "..." : u.isBanned ? "Unban" : "Ban"}
                      </button>
                      <button className="pg-btn" disabled={acting === id || u.role === "admin"}
                        onClick={() => handleDelete(id)}
                        style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}>
                        {acting === id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "http://localhost:3001/api/admin";

// function getToken() {
//   return typeof window !== "undefined" ? localStorage.getItem("token") : null;
// }

// export default function AdminUsersPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [roleFilter, setRole] = useState("all");
//   const [acting, setActing]   = useState<string | null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = getToken();
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.users ?? json?.data ?? []);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this user permanently?")) return;
//     setActing(id);
//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     setMsg("User deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const roles = [...new Set(data.map(u => u.role).filter(Boolean))];
//   const filtered = data.filter(u => {
//     const q = search.toLowerCase();
//     const matchS = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
//     const matchR = roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter;
//     return matchS && matchR;
//   });

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{`
//         @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
//         @keyframes spin { to{transform:rotate(360deg)} }
//         .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//         .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//         .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//         tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//         .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;}
//         .pg-input:focus{border-color:#4f6ef7;}
//         .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//         .pg-btn:hover{border-color:rgba(79,110,247,0.4);color:#e8eaf6;}
//         .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//         .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;}
//       `}</style>

//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>All Users</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>{loading ? "Loading..." : `${data.length} users registered`}</p>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input className="pg-input" placeholder="Search name, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
//           <select className="pg-input" value={roleFilter} onChange={e => setRole(e.target.value)} style={{ width: 130 }}>
//             <option value="all">All Roles</option>
//             {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* Summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
//         {[
//           { label: "Total",       value: data.length,                                                              color: "#4f6ef7" },
//           { label: "Influencers", value: data.filter(u => (u.role||"").toLowerCase() === "influencer").length,    color: "#a855f7" },
//           { label: "Brands",      value: data.filter(u => (u.role||"").toLowerCase() === "brand").length,         color: "#00d4ff" },
//           { label: "Banned",      value: data.filter(u => u.isBanned).length,                                     color: "#ff4757" },
//         ].map((s, i) => (
//           <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <span style={{ fontSize: 13, color: "#8892b0" }}>{s.label}</span>
//             <span style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</span>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow: "hidden" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>
//               {["ID", "Name", "Email", "Role", "Verified", "Status", "Joined", "Actions"].map(h => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
//                 <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={8} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No users found</td></tr>
//             ) : filtered.map((u: any) => {
//               const id = u._id || u.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td">
//                     <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
//                     {u.username && <div style={{ fontSize: 11, color: "#4a5568" }}>@{u.username}</div>}
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize: 12.5, color: "#8892b0" }}>{u.email}</span></td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: u.role === "influencer" ? "rgba(168,85,247,0.12)" : u.role === "brand" ? "rgba(0,212,255,0.12)" : u.role === "admin" ? "rgba(255,71,87,0.12)" : "rgba(74,85,104,0.2)",
//                       color: u.role === "influencer" ? "#a855f7" : u.role === "brand" ? "#00d4ff" : u.role === "admin" ? "#ff4757" : "#8892b0",
//                       border: `1px solid ${u.role === "influencer" ? "rgba(168,85,247,0.25)" : u.role === "brand" ? "rgba(0,212,255,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>{u.role || "user"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {u.isVerified
//                       ? <span className="badge" style={{ background: "rgba(0,214,143,0.12)", color: "#00d68f", border: "1px solid rgba(0,214,143,0.25)" }}>✓ Yes</span>
//                       : <span className="badge" style={{ background: "rgba(74,85,104,0.2)", color: "#8892b0", border: "1px solid rgba(74,85,104,0.3)" }}>No</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: u.isBanned ? "rgba(255,71,87,0.12)" : "rgba(0,214,143,0.12)",
//                       color: u.isBanned ? "#ff4757" : "#00d68f",
//                       border: `1px solid ${u.isBanned ? "rgba(255,71,87,0.25)" : "rgba(0,214,143,0.25)"}`,
//                     }}>{u.isBanned ? "Banned" : "Active"}</span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize: 12, color: "#4a5568" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button className="pg-btn" disabled={acting === id || u.role === "admin"}
//                         onClick={() => handleBan(id, u.isBanned)}
//                         style={{ color: u.isBanned ? "#00d68f" : "#f5a623", borderColor: u.isBanned ? "rgba(0,214,143,0.3)" : "rgba(245,166,35,0.3)" }}>
//                         {acting === id ? "..." : u.isBanned ? "Unban" : "Ban"}
//                       </button>
//                       <button className="pg-btn" disabled={acting === id || u.role === "admin"}
//                         onClick={() => handleDelete(id)}
//                         style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}>
//                         {acting === id ? "..." : "Delete"}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }