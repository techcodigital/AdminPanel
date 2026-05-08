"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";

const S = `
  @keyframes spin{to{transform:rotate(360deg)}}
  .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
  .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
  .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
  tr:hover .pg-td{background:rgba(79,110,247,0.03);}
  .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
  .pg-input:focus{border-color:#4f6ef7;}
  .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
  .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;}
`;

export default function AdminInfluencersPage() {
  const router = useRouter();
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [acting, setActing]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`${BASE}/users-full`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { router.push("/login"); return; }
    const json = await res.json();
    const users = Array.isArray(json) ? json : json?.users ?? json?.data ?? [];
    setData(users.filter((u: any) => u.role === "influencer"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleBan(id: string, isActive: boolean) {
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/users/${id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ banned: isActive }),
    });
    setMsg(isActive ? "User banned ✓" : "User unbanned ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this influencer?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setMsg("Deleted ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  const filtered = data.filter(u => {
    const q = search.toLowerCase();
    const ms =
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.location || "").toLowerCase().includes(q);
    const mf =
      filter === "all" ||
      (filter === "active" && u.isActive) ||
      (filter === "banned" && !u.isActive);
    return ms && mf;
  });

  const tagBadge = (label: string, color: string, bg: string, border: string) => (
    <span className="badge" style={{ background:bg,color,border:`1px solid ${border}`,marginRight:3,marginBottom:2 }}>
      {label}
    </span>
  );

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Influencers</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} influencers`}</p>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <input
            className="pg-input"
            placeholder="Search name, email, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:220 }}
          />
          <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:130 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Total",   color:"#a855f7", count: data.length },
          { label:"Active",  color:"#00d68f", count: data.filter(u => u.isActive).length },
          { label:"Banned",  color:"#ff4757", count: data.filter(u => !u.isActive).length },
        ].map((x, i) => (
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
            <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>{x.count}</span>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>
          {msg}
        </div>
      )}

      {/* Table */}
      <div className="pg-card" style={{ overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead>
            <tr>
              {["ID","Name","Email","Followers","City","Categories","Sub-Categories","Profile","Status","Actions"].map(h => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign:"center",padding:40 }}>
                <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No influencers found</td></tr>
            ) : filtered.map((u: any) => {
              const id      = u._id || u.id;
              const cats    = Array.isArray(u.categories)    ? u.categories    : u.categories    ? [u.categories]    : [];
              const subCats = Array.isArray(u.subCategories) ? u.subCategories : u.subCategories ? [u.subCategories] : [];
              return (
                <tr key={id}>
                  {/* ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
                  </td>

                  {/* Name */}
                  <td className="pg-td">
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      {u.profileImage && (
                        <img src={u.profileImage} alt="" style={{ width:28,height:28,borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(79,110,247,0.2)" }}/>
                      )}
                      <span style={{ fontWeight:600,fontSize:13 }}>{u.name || "—"}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0" }}>{u.email || "—"}</span>
                  </td>

                  {/* Followers */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontWeight:600,color:"#4f6ef7" }}>
                      {u.followers != null ? Number(u.followers).toLocaleString("en-IN") : "—"}
                    </span>
                  </td>

                  {/* City */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0",textTransform:"capitalize" }}>
                      {u.location || "—"}
                    </span>
                  </td>

                  {/* Categories */}
                  <td className="pg-td">
                    <div style={{ display:"flex",flexWrap:"wrap",gap:2 }}>
                      {cats.length
                        ? cats.map((c: string, i: number) => <span key={i}>{tagBadge(c,"#00d4ff","rgba(0,212,255,0.12)","rgba(0,212,255,0.25)")}</span>)
                        : "—"}
                    </div>
                  </td>

                  {/* Sub-Categories */}
                  <td className="pg-td">
                    <div style={{ display:"flex",flexWrap:"wrap",gap:2 }}>
                      {subCats.length
                        ? subCats.map((sc: string, i: number) => <span key={i}>{tagBadge(sc,"#a78bfa","rgba(167,139,250,0.12)","rgba(167,139,250,0.25)")}</span>)
                        : <span style={{ fontSize:12,color:"#4a5568" }}>—</span>}
                    </div>
                  </td>

                  {/* Profile Status */}
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: u.profileStatus === "completed" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                      color:      u.profileStatus === "completed" ? "#00d68f" : "#f5a623",
                      border:     `1px solid ${u.profileStatus === "completed" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
                    }}>
                      {u.profileStatus || "pending"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: u.isActive ? "rgba(0,214,143,0.12)" : "rgba(255,71,87,0.12)",
                      color:      u.isActive ? "#00d68f" : "#ff4757",
                      border:     `1px solid ${u.isActive ? "rgba(0,214,143,0.25)" : "rgba(255,71,87,0.25)"}`,
                    }}>
                      {u.isActive ? "Active" : "Banned"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="pg-td">
                    <div style={{ display:"flex",gap:5 }}>
                      <button
                        className="pg-btn"
                        disabled={acting === id}
                        onClick={() => handleBan(id, u.isActive)}
                        style={{ color: u.isActive ? "#f5a623" : "#00d68f", borderColor: u.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
                      >
                        {acting === id ? "..." : u.isActive ? "Ban" : "Unban"}
                      </button>
                      <button
                        className="pg-btn"
                        disabled={acting === id}
                        onClick={() => handleDelete(id)}
                        style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}
                      >
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

// const BASE = "https://api.collabzy.in/api/admin";

// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
// `;

// export default function AdminInfluencersPage() {
//   const router = useRouter();
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [acting, setActing] = useState<string | null>(null);
//   const [msg, setMsg] = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.push("/login");
//       return;
//     }

//     setLoading(true);

//     const res = await fetch(`${BASE}/users-full`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (res.status === 401) {
//       router.push("/login");
//       return;
//     }

//     const json = await res.json();

//     const users =
//       Array.isArray(json) ? json : json?.users ?? json?.data ?? [];

//     // sirf influencers filter
//     setData(users.filter((u: any) => u.role === "influencer"));

//     setLoading(false);
//   }

//   useEffect(() => {
//     load();
//   }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     const token = localStorage.getItem("token");

//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ banned: !isBanned }),
//     });

//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this influencer?")) return;

//     setActing(id);
//     const token = localStorage.getItem("token");

//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter((u) =>
//     (u.name || u.username || "")
//       .toLowerCase()
//       .includes(search.toLowerCase()) ||
//     (u.email || "").toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 20,
//         }}
//       >
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>
//             Influencers
//           </h1>
//           <p
//             style={{
//               fontSize: 13,
//               color: "#4a5568",
//               marginTop: 3,
//             }}
//           >
//             {loading ? "Loading..." : `${data.length} influencers`}
//           </p>
//         </div>

//         <input
//           className="pg-input"
//           placeholder="Search name or email..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           style={{ width: 240 }}
//         />
//       </div>

//       {msg && (
//         <div
//           style={{
//             background: "rgba(0,214,143,0.1)",
//             border: "1px solid rgba(0,214,143,0.25)",
//             borderRadius: 8,
//             padding: "10px 16px",
//             marginBottom: 16,
//             fontSize: 13,
//             color: "#00d68f",
//           }}
//         >
//           {msg}
//         </div>
//       )}

//       <div className="pg-card" style={{ overflowX: "auto" }}>
//         <table
//           style={{
//             width: "100%",
//             borderCollapse: "separate",
//             borderSpacing: 0,
//           }}
//         >
//           <thead>
//             <tr>
//               {[
//                 "ID",
//                 "Name",
//                 // "Username",
//                 "Email",
//                 "Followers",
//                 "Category",
//                 "Verified",
//                 "Status",
//                 // "Joined",
//                 "Actions",
//               ].map((h) => (
//                 <th key={h} className="pg-th">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={10} style={{ textAlign: "center", padding: 40 }}>
//                   <div
//                     style={{
//                       width: 24,
//                       height: 24,
//                       border: "2px solid rgba(79,110,247,0.2)",
//                       borderTopColor: "#4f6ef7",
//                       borderRadius: "50%",
//                       animation: "spin 0.7s linear infinite",
//                       margin: "0 auto",
//                     }}
//                   />
//                 </td>
//               </tr>
//             ) : filtered.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={10}
//                   className="pg-td"
//                   style={{ textAlign: "center", color: "#4a5568" }}
//                 >
//                   No influencers found
//                 </td>
//               </tr>
//             ) : (
//               filtered.map((u: any) => {
//                 const id = u._id || u.id;

//                 return (
//                   <tr key={id}>
//                     <td className="pg-td">
//                       <span
//                         style={{
//                           fontFamily: "monospace",
//                           fontSize: 11,
//                           color: "#4a5568",
//                         }}
//                       >
//                         {id?.slice(-6)}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       <span style={{ fontWeight: 600 }}>
//                         {u.name || "—"}
//                       </span>
//                     </td>
// {/* 
//                     <td className="pg-td">
//                       <span
//                         style={{ color: "#4f6ef7", fontSize: 13 }}
//                       >
//                         @{u.username || "—"}
//                       </span>
//                     </td> */}

//                     <td className="pg-td">
//                       <span
//                         style={{
//                           fontSize: 12.5,
//                           color: "#8892b0",
//                         }}
//                       >
//                         {u.email}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       <span
//                         style={{
//                           fontFamily: "monospace",
//                           fontWeight: 600,
//                         }}
//                       >
//                         {u.followers ?? u.followerCount ?? "—"}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       {u.categories ? (
//                         <span
//                           className="badge"
//                           style={{
//                             background: "rgba(79,110,247,0.12)",
//                             color: "#4f6ef7",
//                             border:
//                               "1px solid rgba(79,110,247,0.25)",
//                           }}
//                         >
//                           {u.categories}
//                         </span>
//                       ) : (
//                         "—"
//                       )}
//                     </td>

//                     <td className="pg-td">
//                       {u.isVerified ? (
//                         <span
//                           className="badge"
//                           style={{
//                             background:
//                               "rgba(0,214,143,0.12)",
//                             color: "#00d68f",
//                             border:
//                               "1px solid rgba(0,214,143,0.25)",
//                           }}
//                         >
//                           ✓ Yes
//                         </span>
//                       ) : (
//                         <span
//                           className="badge"
//                           style={{
//                             background:
//                               "rgba(245,166,35,0.12)",
//                             color: "#f5a623",
//                             border:
//                               "1px solid rgba(245,166,35,0.25)",
//                           }}
//                         >
//                           Pending
//                         </span>
//                       )}
//                     </td>

//                     <td className="pg-td">
//                       <span
//                         className="badge"
//                         style={{
//                           background: u.isBanned
//                             ? "rgba(255,71,87,0.12)"
//                             : "rgba(0,214,143,0.12)",
//                           color: u.isBanned
//                             ? "#ff4757"
//                             : "#00d68f",
//                           border: `1px solid ${
//                             u.isBanned
//                               ? "rgba(255,71,87,0.25)"
//                               : "rgba(0,214,143,0.25)"
//                           }`,
//                         }}
//                       >
//                         {u.isBanned ? "Banned" : "Active"}
//                       </span>
//                     </td>

//                     {/* <td className="pg-td">
//                       <span
//                         style={{
//                           fontSize: 12,
//                           color: "#4a5568",
//                         }}
//                       >
//                         {u.createdAt
//                           ? new Date(
//                               u.createdAt
//                             ).toLocaleDateString("en-IN")
//                           : "—"}
//                       </span>
//                     </td> */}

//       {/* <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{u.createdAt?new Date(u.createdAt).toLocaleDateString("en-IN"):"—"}</span></td> */}

//                     <td className="pg-td">
//                       <div style={{ display: "flex", gap: 5 }}>
//                         <button
//                           className="pg-btn"
//                           disabled={acting === id}
//                           onClick={() =>
//                             handleBan(id, u.isBanned)
//                           }
//                           style={{
//                             color: u.isBanned
//                               ? "#00d68f"
//                               : "#f5a623",
//                             borderColor: u.isBanned
//                               ? "rgba(0,214,143,0.3)"
//                               : "rgba(245,166,35,0.3)",
//                           }}
//                         >
//                           {acting === id
//                             ? "..."
//                             : u.isBanned
//                             ? "Unban"
//                             : "Ban"}
//                         </button>

//                         <button
//                           className="pg-btn"
//                           disabled={acting === id}
//                           onClick={() => handleDelete(id)}
//                           style={{
//                             color: "#ff4757",
//                             borderColor:
//                               "rgba(255,71,87,0.3)",
//                           }}
//                         >
//                           {acting === id ? "..." : "Delete"}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }



// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "https://api.collabzy.in/api/admin";

// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
// `;

// export default function AdminInfluencersPage() {
//   const router = useRouter();
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [acting, setActing] = useState<string | null>(null);
//   const [msg, setMsg] = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.push("/login");
//       return;
//     }

//     setLoading(true);

//     const res = await fetch(`${BASE}/users-full`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (res.status === 401) {
//       router.push("/login");
//       return;
//     }

//     const json = await res.json();

//     const users =
//       Array.isArray(json) ? json : json?.users ?? json?.data ?? [];

//     // sirf influencers filter
//     setData(users.filter((u: any) => u.role === "influencer"));

//     setLoading(false);
//   }

//   useEffect(() => {
//     load();
//   }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     const token = localStorage.getItem("token");

//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ banned: !isBanned }),
//     });

//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this influencer?")) return;

//     setActing(id);
//     const token = localStorage.getItem("token");

//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter((u) =>
//     (u.name || u.username || "")
//       .toLowerCase()
//       .includes(search.toLowerCase()) ||
//     (u.email || "").toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 20,
//         }}
//       >
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>
//             Influencers
//           </h1>
//           <p
//             style={{
//               fontSize: 13,
//               color: "#4a5568",
//               marginTop: 3,
//             }}
//           >
//             {loading ? "Loading..." : `${data.length} influencers`}
//           </p>
//         </div>

//         <input
//           className="pg-input"
//           placeholder="Search name or email..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           style={{ width: 240 }}
//         />
//       </div>

//       {msg && (
//         <div
//           style={{
//             background: "rgba(0,214,143,0.1)",
//             border: "1px solid rgba(0,214,143,0.25)",
//             borderRadius: 8,
//             padding: "10px 16px",
//             marginBottom: 16,
//             fontSize: 13,
//             color: "#00d68f",
//           }}
//         >
//           {msg}
//         </div>
//       )}

//       <div className="pg-card" style={{ overflowX: "auto" }}>
//         <table
//           style={{
//             width: "100%",
//             borderCollapse: "separate",
//             borderSpacing: 0,
//           }}
//         >
//           <thead>
//             <tr>
//               {[
//                 "ID",
//                 "Name",
//                 "Username",
//                 "Email",
//                 "Followers",
//                 "categories",
//                 "Verified",
//                 "Status",
//                 "Joined",
//                 "Actions",
//               ].map((h) => (
//                 <th key={h} className="pg-th">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={10} style={{ textAlign: "center", padding: 40 }}>
//                   <div
//                     style={{
//                       width: 24,
//                       height: 24,
//                       border: "2px solid rgba(79,110,247,0.2)",
//                       borderTopColor: "#4f6ef7",
//                       borderRadius: "50%",
//                       animation: "spin 0.7s linear infinite",
//                       margin: "0 auto",
//                     }}
//                   />
//                 </td>
//               </tr>
//             ) : filtered.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={10}
//                   className="pg-td"
//                   style={{ textAlign: "center", color: "#4a5568" }}
//                 >
//                   No influencers found
//                 </td>
//               </tr>
//             ) : (
//               filtered.map((u: any) => {
//                 const id = u._id || u.id;

//                 return (
//                   <tr key={id}>
//                     <td className="pg-td">
//                       <span
//                         style={{
//                           fontFamily: "monospace",
//                           fontSize: 11,
//                           color: "#4a5568",
//                         }}
//                       >
//                         {id?.slice(-6)}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       <span style={{ fontWeight: 600 }}>
//                         {u.name || "—"}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       <span
//                         style={{ color: "#4f6ef7", fontSize: 13 }}
//                       >
//                         @{u.username || "—"}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       <span
//                         style={{
//                           fontSize: 12.5,
//                           color: "#8892b0",
//                         }}
//                       >
//                         {u.email}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       <span
//                         style={{
//                           fontFamily: "monospace",
//                           fontWeight: 600,
//                         }}
//                       >
//                         {u.followers ?? u.followerCount ?? "—"}
//                       </span>
//                     </td>

//                     <td className="pg-td">
//                       {u.categories? (
//                         <span
//                           className="badge"
//                           style={{
//                             background: "rgba(79,110,247,0.12)",
//                             color: "#4f6ef7",
//                             border:
//                               "1px solid rgba(79,110,247,0.25)",
//                           }}
//                         >
//                           {u.categories}
//                         </span>
//                       ) : (
//                         "—"
//                       )}
//                     </td>

//                     <td className="pg-td">
//                       {u.isVerified ? (
//                         <span
//                           className="badge"
//                           style={{
//                             background:
//                               "rgba(0,214,143,0.12)",
//                             color: "#00d68f",
//                             border:
//                               "1px solid rgba(0,214,143,0.25)",
//                           }}
//                         >
//                           ✓ Yes
//                         </span>
//                       ) : (
//                         <span
//                           className="badge"
//                           style={{
//                             background:
//                               "rgba(245,166,35,0.12)",
//                             color: "#f5a623",
//                             border:
//                               "1px solid rgba(245,166,35,0.25)",
//                           }}
//                         >
//                           Pending
//                         </span>
//                       )}
//                     </td>

//                     <td className="pg-td">
//                       <span
//                         className="badge"
//                         style={{
//                           background: u.isBanned
//                             ? "rgba(255,71,87,0.12)"
//                             : "rgba(0,214,143,0.12)",
//                           color: u.isBanned
//                             ? "#ff4757"
//                             : "#00d68f",
//                           border: `1px solid ${
//                             u.isBanned
//                               ? "rgba(255,71,87,0.25)"
//                               : "rgba(0,214,143,0.25)"
//                           }`,
//                         }}
//                       >
//                         {u.isBanned ? "Banned" : "Active"}
//                       </span>
//                     </td>

//                     {/* <td className="pg-td">
//                       <span
//                         style={{
//                           fontSize: 12,
//                           color: "#4a5568",
//                         }}
//                       >
//                         {u.createdAt
//                           ? new Date(
//                               u.createdAt
//                             ).toLocaleDateString("en-IN")
//                           : "—"}
//                       </span>
//                     </td> */}

//                     <td className="pg-td">
//   <span
//     style={{
//       fontSize: 12,
//       color: "#4a5568",
//     }}
//   >
//     {u?.createdAt
//       ? new Date(u.createdAt).toLocaleDateString("en-IN")
//       : "—"}
//   </span>
// </td>

//                     <td className="pg-td">
//                       <div style={{ display: "flex", gap: 5 }}>
//                         <button
//                           className="pg-btn"
//                           disabled={acting === id}
//                           onClick={() =>
//                             handleBan(id, u.isBanned)
//                           }
//                           style={{
//                             color: u.isBanned
//                               ? "#00d68f"
//                               : "#f5a623",
//                             borderColor: u.isBanned
//                               ? "rgba(0,214,143,0.3)"
//                               : "rgba(245,166,35,0.3)",
//                           }}
//                         >
//                           {acting === id
//                             ? "..."
//                             : u.isBanned
//                             ? "Unban"
//                             : "Ban"}
//                         </button>

//                         <button
//                           className="pg-btn"
//                           disabled={acting === id}
//                           onClick={() => handleDelete(id)}
//                           style={{
//                             color: "#ff4757",
//                             borderColor:
//                               "rgba(255,71,87,0.3)",
//                           }}
//                         >
//                           {acting === id ? "..." : "Delete"}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "https://api.collabzy.in/api/admin";
// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
// `;

// export default function AdminInfluencersPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [acting, setActing]   = useState<string | null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/influencers`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.influencers ?? json?.data ?? []);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this influencer?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter(u =>
//     (u.name || u.username || "").toLowerCase().includes(search.toLowerCase()) ||
//     (u.email || "").toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Influencers</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>{loading ? "Loading..." : `${data.length} influencers`}</p>
//         </div>
//         <input className="pg-input" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
//       </div>

//       {msg && <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow: "hidden" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>{["ID","Name","Username","Email","Followers","Category","Verified","Status","Joined","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={10} style={{ textAlign: "center", padding: 40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No influencers found</td></tr>
//             ) : filtered.map((u:any) => {
//               const id = u._id || u.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{u.name||"—"}</span></td>
//                   <td className="pg-td"><span style={{ color:"#4f6ef7",fontSize:13 }}>@{u.username||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12.5,color:"#8892b0" }}>{u.email}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontWeight:600 }}>{u.followers??u.followerCount??"—"}</span></td>
//                   <td className="pg-td">{u.category?<span className="badge" style={{ background:"rgba(79,110,247,0.12)",color:"#4f6ef7",border:"1px solid rgba(79,110,247,0.25)" }}>{u.category}</span>:"—"}</td>
//                   <td className="pg-td">
//                     {u.isVerified
//                       ? <span className="badge" style={{ background:"rgba(0,214,143,0.12)",color:"#00d68f",border:"1px solid rgba(0,214,143,0.25)" }}>✓ Yes</span>
//                       : <span className="badge" style={{ background:"rgba(245,166,35,0.12)",color:"#f5a623",border:"1px solid rgba(245,166,35,0.25)" }}>Pending</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:u.isBanned?"rgba(255,71,87,0.12)":"rgba(0,214,143,0.12)",color:u.isBanned?"#ff4757":"#00d68f",border:`1px solid ${u.isBanned?"rgba(255,71,87,0.25)":"rgba(0,214,143,0.25)"}` }}>
//                       {u.isBanned?"Banned":"Active"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{u.createdAt?new Date(u.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:5 }}>
//                       <button className="pg-btn" disabled={acting===id} onClick={()=>handleBan(id,u.isBanned)}
//                         style={{ color:u.isBanned?"#00d68f":"#f5a623",borderColor:u.isBanned?"rgba(0,214,143,0.3)":"rgba(245,166,35,0.3)" }}>
//                         {acting===id?"...":u.isBanned?"Unban":"Ban"}
//                       </button>
//                       <button className="pg-btn" disabled={acting===id} onClick={()=>handleDelete(id)} style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}>
//                         {acting===id?"...":"Delete"}
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


// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "http://localhost:3001/api/admin";
// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
// `;

// export default function AdminInfluencersPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [acting, setActing]   = useState<string | null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/influencers`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.influencers ?? json?.data ?? []);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this influencer?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter(u =>
//     (u.name || u.username || "").toLowerCase().includes(search.toLowerCase()) ||
//     (u.email || "").toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Influencers</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>{loading ? "Loading..." : `${data.length} influencers`}</p>
//         </div>
//         <input className="pg-input" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
//       </div>

//       {msg && <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow: "hidden" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>{["ID","Name","Username","Email","Followers","Category","Verified","Status","Joined","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={10} style={{ textAlign: "center", padding: 40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No influencers found</td></tr>
//             ) : filtered.map((u:any) => {
//               const id = u._id || u.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{u.name||"—"}</span></td>
//                   <td className="pg-td"><span style={{ color:"#4f6ef7",fontSize:13 }}>@{u.username||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12.5,color:"#8892b0" }}>{u.email}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontWeight:600 }}>{u.followers??u.followerCount??"—"}</span></td>
//                   <td className="pg-td">{u.category?<span className="badge" style={{ background:"rgba(79,110,247,0.12)",color:"#4f6ef7",border:"1px solid rgba(79,110,247,0.25)" }}>{u.category}</span>:"—"}</td>
//                   <td className="pg-td">
//                     {u.isVerified
//                       ? <span className="badge" style={{ background:"rgba(0,214,143,0.12)",color:"#00d68f",border:"1px solid rgba(0,214,143,0.25)" }}>✓ Yes</span>
//                       : <span className="badge" style={{ background:"rgba(245,166,35,0.12)",color:"#f5a623",border:"1px solid rgba(245,166,35,0.25)" }}>Pending</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:u.isBanned?"rgba(255,71,87,0.12)":"rgba(0,214,143,0.12)",color:u.isBanned?"#ff4757":"#00d68f",border:`1px solid ${u.isBanned?"rgba(255,71,87,0.25)":"rgba(0,214,143,0.25)"}` }}>
//                       {u.isBanned?"Banned":"Active"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{u.createdAt?new Date(u.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:5 }}>
//                       <button className="pg-btn" disabled={acting===id} onClick={()=>handleBan(id,u.isBanned)}
//                         style={{ color:u.isBanned?"#00d68f":"#f5a623",borderColor:u.isBanned?"rgba(0,214,143,0.3)":"rgba(245,166,35,0.3)" }}>
//                         {acting===id?"...":u.isBanned?"Unban":"Ban"}
//                       </button>
//                       <button className="pg-btn" disabled={acting===id} onClick={()=>handleDelete(id)} style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}>
//                         {acting===id?"...":"Delete"}
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