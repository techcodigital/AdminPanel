"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-btn{background:transparent;border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}`;

export default function AdminReviewsPage() {
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [acting, setActing]   = useState<string|null>(null);
  const [msg, setMsg]         = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`${BASE}/reviews`, { headers:{ Authorization:`Bearer ${token}` } });
    if (res.status===401) { router.push("/login"); return; }
    const json = await res.json();
    setData(Array.isArray(json)?json:json?.reviews??json?.data??[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/reviews/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    setMsg("Review deleted ✓");
    await load(); setActing(null);
    setTimeout(()=>setMsg(""),3000);
  }

  const filtered = data.filter(r =>
    (r.reviewer?.name||r.reviewerName||"").toLowerCase().includes(search.toLowerCase()) ||
    (r.target?.name||r.targetName||"").toLowerCase().includes(search.toLowerCase())
  );

  const avg = data.length > 0 ? (data.reduce((a,r)=>a+(r.rating||0),0)/data.length).toFixed(1) : "—";

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Reviews & Ratings</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} reviews`}</p>
        </div>
        <input className="pg-input" placeholder="Search reviewer or target..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:240 }}/>
      </div>

      {/* Summary */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[
          {label:"Total",   value:data.length,                                      color:"#4f6ef7"},
          {label:"Avg Rating",value:avg,                                            color:"#f5a623"},
          {label:"5 Star",  value:data.filter(r=>r.rating===5).length,             color:"#00d68f"},
          {label:"1-2 Star",value:data.filter(r=>r.rating<=2&&r.rating>0).length,  color:"#ff4757"},
        ].map((s,i)=>(
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{s.label}</span>
            <span style={{ fontSize:22,fontWeight:700,color:s.color,fontFamily:"monospace" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

      <div className="pg-card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead><tr>{["ID","Reviewer","Target","Rating","Comment","Date","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
            : filtered.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No reviews found</td></tr>
            : filtered.map((r:any)=>{
              const id=r._id||r.id;
              return (
                <tr key={id}>
                  <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
                  <td className="pg-td"><span style={{ fontWeight:600 }}>{r.reviewer?.name||r.reviewer?.username||r.reviewerName||"—"}</span></td>
                  <td className="pg-td"><span style={{ color:"#4f6ef7" }}>{r.target?.name||r.target?.username||r.targetName||"—"}</span></td>
                  <td className="pg-td">
                    <div style={{ display:"flex",gap:2 }}>
                      {Array.from({length:5},(_,i)=>(
                        <span key={i} style={{ color:i<(r.rating||0)?"#f5a623":"#1a2240",fontSize:15 }}>★</span>
                      ))}
                    </div>
                  </td>
                  <td className="pg-td"><span style={{ fontSize:12.5,color:"#8892b0",maxWidth:240,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.comment||r.review||"—"}</span></td>
                  <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{r.createdAt?new Date(r.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
                  <td className="pg-td">
                    <button className="pg-btn" disabled={acting===id} onClick={()=>handleDelete(id)}>
                      {acting===id?"...":"Delete"}
                    </button>
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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-btn{background:transparent;border:1px solid rgba(255,71,87,0.3);color:#ff4757;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}`;

// export default function AdminReviewsPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [acting, setActing]   = useState<string|null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/reviews`, { headers:{ Authorization:`Bearer ${token}` } });
//     if (res.status===401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json)?json:json?.reviews??json?.data??[]);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this review?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/reviews/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
//     setMsg("Review deleted ✓");
//     await load(); setActing(null);
//     setTimeout(()=>setMsg(""),3000);
//   }

//   const filtered = data.filter(r =>
//     (r.reviewer?.name||r.reviewerName||"").toLowerCase().includes(search.toLowerCase()) ||
//     (r.target?.name||r.targetName||"").toLowerCase().includes(search.toLowerCase())
//   );

//   const avg = data.length > 0 ? (data.reduce((a,r)=>a+(r.rating||0),0)/data.length).toFixed(1) : "—";

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Reviews & Ratings</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} reviews`}</p>
//         </div>
//         <input className="pg-input" placeholder="Search reviewer or target..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:240 }}/>
//       </div>

//       {/* Summary */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Total",   value:data.length,                                      color:"#4f6ef7"},
//           {label:"Avg Rating",value:avg,                                            color:"#f5a623"},
//           {label:"5 Star",  value:data.filter(r=>r.rating===5).length,             color:"#00d68f"},
//           {label:"1-2 Star",value:data.filter(r=>r.rating<=2&&r.rating>0).length,  color:"#ff4757"},
//         ].map((s,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{s.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:s.color,fontFamily:"monospace" }}>{s.value}</span>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Reviewer","Target","Rating","Comment","Date","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             : filtered.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No reviews found</td></tr>
//             : filtered.map((r:any)=>{
//               const id=r._id||r.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{r.reviewer?.name||r.reviewer?.username||r.reviewerName||"—"}</span></td>
//                   <td className="pg-td"><span style={{ color:"#4f6ef7" }}>{r.target?.name||r.target?.username||r.targetName||"—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:2 }}>
//                       {Array.from({length:5},(_,i)=>(
//                         <span key={i} style={{ color:i<(r.rating||0)?"#f5a623":"#1a2240",fontSize:15 }}>★</span>
//                       ))}
//                     </div>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12.5,color:"#8892b0",maxWidth:240,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.comment||r.review||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{r.createdAt?new Date(r.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   <td className="pg-td">
//                     <button className="pg-btn" disabled={acting===id} onClick={()=>handleDelete(id)}>
//                       {acting===id?"...":"Delete"}
//                     </button>
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