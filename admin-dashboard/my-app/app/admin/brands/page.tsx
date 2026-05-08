"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-input:focus{border-color:#4f6ef7;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

export default function AdminBrandsPage() {
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [acting, setActing]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`${BASE}/brand`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { router.push("/login"); return; }
    const json = await res.json();
    setData(Array.isArray(json) ? json : json?.brands ?? json?.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleBan(id: string, isBanned: boolean) {
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/users/${id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ banned: !isBanned }),
    });
    setMsg(isBanned ? "Brand unbanned ✓" : "Brand banned ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setMsg("Deleted ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  const filtered = data.filter(b => {
    const q = search.toLowerCase();
    const ms = (b.name || "").toLowerCase().includes(q) || (b.email || "").toLowerCase().includes(q);
    const mf = filter === "all"
      || (filter === "subscribed" && b.isSubscribed)
      || (filter === "free" && !b.isSubscribed)
      || (filter === "banned" && !b.isActive)
      || (filter === "active" && b.isActive);
    return ms && mf;
  });

  const planBadge = (plan: string) => {
    const isPro  = plan?.includes("pro");
    const isPlus = plan?.includes("plus");
    const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
    const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
    const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
    return <span className="badge" style={{ background:bg,color,border:`1px solid ${border}` }}>{plan || "free"}</span>;
  };

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Brands</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} brands`}</p>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <input
            className="pg-input"
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:220 }}
          />
          <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:140 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="subscribed">Subscribed</option>
            <option value="free">Free Plan</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Total",      color:"#a855f7", count: data.length },
          { label:"Subscribed", color:"#00d68f", count: data.filter(b => b.isSubscribed).length },
          { label:"Free",       color:"#8892b0", count: data.filter(b => !b.isSubscribed).length },
          { label:"Banned",     color:"#ff4757", count: data.filter(b => !b.isActive).length },
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
              {["ID","Name","Email","Campaigns","KYC","Plan","Subscribed","Profile","Joined","Actions"].map(h => (
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
              <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No brands found</td></tr>
            ) : filtered.map((b: any) => {
              const id = b._id || b.id;
              return (
                <tr key={id}>
                  {/* ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
                  </td>

                  {/* Name */}
                  <td className="pg-td">
                    <span style={{ fontWeight:600,fontSize:13 }}>{b.name || "—"}</span>
                  </td>

                  {/* Email */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0" }}>{b.email || "—"}</span>
                  </td>

                  {/* Campaigns Created */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",color:"#4f6ef7",fontWeight:600 }}>
                      {b.campaignsCreated ?? "0"}
                    </span>
                  </td>

                  {/* KYC */}
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                      color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
                      border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
                    }}>
                      {b.kycStatus || "Pending"}
                    </span>
                  </td>

                  {/* Plan */}
                  <td className="pg-td">{planBadge(b.plan)}</td>

                  {/* Subscribed */}
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
                      color:      b.isSubscribed ? "#00d68f" : "#8892b0",
                      border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
                    }}>
                      {b.isSubscribed ? "Yes" : "No"}
                    </span>
                  </td>

                  {/* Profile Status */}
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
                      color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
                      border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
                    }}>
                      {b.profileStatus || "pending"}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#4a5568" }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="pg-td">
                    <div style={{ display:"flex",gap:5 }}>
                      <button
                        className="pg-btn"
                        disabled={acting === id}
                        onClick={() => handleBan(id, !b.isActive)}
                        style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
                      >
                        {acting === id ? "..." : b.isActive ? "Ban" : "Unban"}
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

// const BASE = "http://localhost:3001/api/admin";
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-input:focus{border-color:#4f6ef7;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminBrandsPage() {
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
//     const res = await fetch(`${BASE}/brand`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.brands ?? json?.data ?? []);
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
//     setMsg(isBanned ? "Brand unbanned ✓" : "Brand banned ✓");
//     await load(); setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this brand?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
//     setMsg("Deleted ✓");
//     await load(); setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter(b =>
//     (b.name || b.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
//     (b.email || "").toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Brands</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} brands`}</p>
//         </div>
//         <input className="pg-input" placeholder="Search name or email..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:240 }}/>
//       </div>

//       {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Brand","Email","Industry","Campaigns","Plan","Status","Joined","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={9} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length===0 ? (
//               <tr><td colSpan={9} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No brands found</td></tr>
//             ) : filtered.map((b:any) => {
//               const id = b._id||b.id;
//               const plan = b.subscriptionPlan||"free";
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{b.name||b.companyName||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12.5,color:"#8892b0" }}>{b.email}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:13,color:"#8892b0" }}>{b.industry||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#4f6ef7",fontWeight:600 }}>{b.campaignCount??b.campaigns?.length??"—"}</span></td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:plan.includes("plus")?"rgba(168,85,247,0.12)":plan==="pro"?"rgba(79,110,247,0.12)":"rgba(74,85,104,0.2)",color:plan.includes("plus")?"#a855f7":plan==="pro"?"#4f6ef7":"#8892b0",border:`1px solid ${plan.includes("plus")?"rgba(168,85,247,0.25)":plan==="pro"?"rgba(79,110,247,0.25)":"rgba(74,85,104,0.3)"}` }}>
//                       {plan}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:b.isBanned?"rgba(255,71,87,0.12)":"rgba(0,214,143,0.12)",color:b.isBanned?"#ff4757":"#00d68f",border:`1px solid ${b.isBanned?"rgba(255,71,87,0.25)":"rgba(0,214,143,0.25)"}` }}>
//                       {b.isBanned?"Banned":"Active"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{b.createdAt?new Date(b.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:5 }}>
//                       <button className="pg-btn" disabled={acting===id} onClick={()=>handleBan(id,b.isBanned)} style={{ color:b.isBanned?"#00d68f":"#f5a623",borderColor:b.isBanned?"rgba(0,214,143,0.3)":"rgba(245,166,35,0.3)" }}>
//                         {acting===id?"...":b.isBanned?"Unban":"Ban"}
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