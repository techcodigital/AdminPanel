"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;}`;

export default function AdminCampaignsPage() {
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
    const res = await fetch(`${BASE}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { router.push("/login"); return; }
    const json = await res.json();
    setData(Array.isArray(json) ? json : json?.data ?? json?.campaigns ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handlePause(id: string) {
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/campaigns/${id}/pause`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setMsg("Campaign paused ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setMsg("Deleted ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  const filtered = data.filter(c => {
    const q = search.toLowerCase();
    const ms = (c.title||"").toLowerCase().includes(q) || (c.brand?.name||c.brandName||"").toLowerCase().includes(q);
    const mf = filter === "all" || (c.status||"").toLowerCase() === filter;
    return ms && mf;
  });

  const statusBadge = (s: string) => {
    const map: any = {
      open:      ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
      completed: ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
    };
    const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
    return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"—"}</span>;
  };

  const tagBadge = (label: string, color: string, bg: string, border: string) => (
    <span className="badge" style={{ background:bg,color,border:`1px solid ${border}`,marginRight:3,marginBottom:2,textTransform:"none" as any }}>
      {label}
    </span>
  );

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Campaigns</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} campaigns`}</p>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <input
            className="pg-input"
            placeholder="Search title or brand..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ width:200 }}
          />
          <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:130 }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Open",      color:"#00d68f", s:"open"      },
          { label:"Completed", color:"#4f6ef7", s:"completed" },
          { label:"Total",     color:"#a855f7", s:"all"       },
        ].map((x,i) => (
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
            <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
              {x.s === "all" ? data.length : data.filter(c=>(c.status||"").toLowerCase()===x.s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Toast */}
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
              {["ID","Title","Budget","Category","Sub-Category","City","Applicants","Status","Created","Actions"].map(h=>(
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
              <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No campaigns found</td></tr>
            ) : filtered.map((c:any) => {
              const id      = c._id || c.id;
              const cats    = Array.isArray(c.categories)    ? c.categories    : c.categories    ? [c.categories]    : [];
              const subCats = Array.isArray(c.subCategories) ? c.subCategories : c.subCategories ? [c.subCategories] : [];
              return (
                <tr key={id}>
                  {/* ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
                  </td>

                  {/* Title */}
                  <td className="pg-td">
                    <span style={{ fontWeight:600,fontSize:13 }}>{c.title}</span>
                  </td>

                  {/* Budget */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>
                      {c.budget != null ? `₹${Number(c.budget).toLocaleString("en-IN")}` : "—"}
                    </span>
                  </td>

                  {/* Categories */}
                  <td className="pg-td">
                    <div style={{ display:"flex",flexWrap:"wrap",gap:2 }}>
                      {cats.length ? cats.map((cat:string, i:number) =>
                        <span key={i}>{tagBadge(cat,"#00d4ff","rgba(0,212,255,0.12)","rgba(0,212,255,0.25)")}</span>
                      ) : "—"}
                    </div>
                  </td>

                  {/* Sub-Categories */}
                  <td className="pg-td">
                    <div style={{ display:"flex",flexWrap:"wrap",gap:2 }}>
                      {subCats.length ? subCats.map((sc:string, i:number) =>
                        <span key={i}>{tagBadge(sc,"#a78bfa","rgba(167,139,250,0.12)","rgba(167,139,250,0.25)")}</span>
                      ) : "—"}
                    </div>
                  </td>

                  {/* City */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0" }}>{c.city || "—"}</span>
                  </td>

                  {/* Applicants */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",color:"#4f6ef7",fontWeight:600 }}>
                      {c.applicationsCount ?? c.applicants?.length ?? "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="pg-td">{statusBadge(c.status)}</td>

                  {/* Created */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#4a5568" }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="pg-td">
                    <div style={{ display:"flex",gap:5 }}>
                      {c.status !== "completed" && (
                        <button
                          className="pg-btn"
                          disabled={acting === id}
                          onClick={()=>handlePause(id)}
                          style={{ color:"#f5a623",borderColor:"rgba(245,166,35,0.3)" }}
                        >
                          {acting === id ? "..." : "Pause"}
                        </button>
                      )}
                      <button
                        className="pg-btn"
                        disabled={acting === id}
                        onClick={()=>handleDelete(id)}
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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminCampaignsPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [filter, setFilter]   = useState("all");
//   const [acting, setActing]   = useState<string | null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.campaigns ?? json?.data ?? []);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handlePause(id: string) {
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/campaigns/${id}/pause`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
//     setMsg("Campaign paused ✓");
//     await load(); setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this campaign?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
//     setMsg("Deleted ✓");
//     await load(); setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter(c => {
//     const q = search.toLowerCase();
//     const ms = (c.title||"").toLowerCase().includes(q) || (c.brand?.name||c.brandName||"").toLowerCase().includes(q);
//     const mf = filter==="all" || (c.status||"").toLowerCase()===filter;
//     return ms && mf;
//   });

//   const statusBadge = (s: string) => {
//     const map: any = { active:["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"], paused:["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"], completed:["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"] };
//     const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
//     return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"—"}</span>;
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Campaigns</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} campaigns`}</p>
//         </div>
//         <div style={{ display:"flex",gap:10 }}>
//           <input className="pg-input" placeholder="Search title or brand..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:200 }}/>
//           <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:130 }}>
//             <option value="all">All Status</option>
//             <option value="active">Active</option>
//             <option value="paused">Paused</option>
//             <option value="completed">Completed</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary cards */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Active",    color:"#00d68f", s:"active"   },
//           {label:"Paused",    color:"#f5a623", s:"paused"   },
//           {label:"Completed", color:"#4f6ef7", s:"completed"},
//           {label:"Total",     color:"#a855f7", s:"all"      },
//         ].map((x,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
//               {x.s==="all"?data.length:data.filter(c=>(c.status||"").toLowerCase()===x.s).length}
//             </span>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Title","Brand","Budget","Category","Applicants","Status","Created","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={9} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length===0 ? (
//               <tr><td colSpan={9} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No campaigns found</td></tr>
//             ) : filtered.map((c:any)=>{
//               const id=c._id||c.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600,fontSize:13 }}>{c.title}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:13 }}>{c.brand?.name||c.brandName||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{c.budget!=null?`₹${Number(c.budget).toLocaleString("en-IN")}` :"—"}</span></td>
//                   <td className="pg-td">{c.category?<span className="badge" style={{ background:"rgba(0,212,255,0.12)",color:"#00d4ff",border:"1px solid rgba(0,212,255,0.25)" }}>{c.category}</span>:"—"}</td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#4f6ef7" }}>{c.applicationCount??c.applicants?.length??"—"}</span></td>
//                   <td className="pg-td">{statusBadge(c.status)}</td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{c.createdAt?new Date(c.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:5 }}>
//                       {c.status!=="paused"&&c.status!=="completed"&&(
//                         <button className="pg-btn" disabled={acting===id} onClick={()=>handlePause(id)} style={{ color:"#f5a623",borderColor:"rgba(245,166,35,0.3)" }}>
//                           {acting===id?"...":"Pause"}
//                         </button>
//                       )}
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