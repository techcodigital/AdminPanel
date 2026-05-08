"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

export default function AdminDisputesPage() {
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [acting, setActing]   = useState<string|null>(null);
  const [msg, setMsg]         = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`${BASE}/disputes`, { headers:{ Authorization:`Bearer ${token}` } });
    if (res.status===401) { router.push("/login"); return; }
    const json = await res.json();
    setData(Array.isArray(json)?json:json?.disputes??json?.data??[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRefund(escrowId: string) {
    if (!confirm("Process refund for this dispute?")) return;
    setActing(escrowId);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/refund/${escrowId}`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}` } });
    setMsg("Refund processed ✓");
    await load(); setActing(null);
    setTimeout(()=>setMsg(""),3000);
  }

  const filtered = filter==="all" ? data : data.filter(d=>(d.status||"").toLowerCase()===filter);
  const openCount = data.filter(d=>["open","pending"].includes((d.status||"").toLowerCase())).length;

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Dispute Resolution</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} disputes`}</p>
        </div>
        <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:160 }}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="under review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alert */}
      {openCount > 0 && (
        <div style={{ background:"rgba(255,71,87,0.08)",border:"1px solid rgba(255,71,87,0.25)",borderRadius:10,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:18 }}>⚠</span>
          <div>
            <div style={{ fontSize:13,fontWeight:600,color:"#ff4757" }}>{openCount} Active Disputes Need Attention</div>
            <div style={{ fontSize:12,color:"#8892b0" }}>Review and resolve pending disputes</div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[
          {label:"Open",         color:"#ff4757",s:"open"        },
          {label:"Under Review", color:"#f5a623",s:"under review"},
          {label:"Resolved",     color:"#00d68f",s:"resolved"    },
          {label:"Total",        color:"#4f6ef7",s:"all"         },
        ].map((x,i)=>(
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
            <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
              {x.s==="all"?data.length:data.filter(d=>(d.status||"").toLowerCase()===x.s).length}
            </span>
          </div>
        ))}
      </div>

      {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

      <div className="pg-card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead><tr>{["ID","Deal","Brand","Influencer","Issue","Status","Date","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
            : filtered.length===0 ? <tr><td colSpan={8} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No disputes found</td></tr>
            : filtered.map((d:any)=>{
              const id=d._id||d.id;
              const escrowId=d.escrow?._id||d.escrowId||id;
              const s=(d.status||"").toLowerCase();
              const isOpen=["open","pending","under review"].includes(s);
              return (
                <tr key={id}>
                  <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
                  <td className="pg-td"><span style={{ fontSize:13 }}>{d.deal?.title||d.dealTitle||d.dealId?.slice?.(-6)||"—"}</span></td>
                  <td className="pg-td"><span style={{ fontWeight:600 }}>{d.brand?.name||d.raisedBy?.name||d.brandName||"—"}</span></td>
                  <td className="pg-td"><span style={{ color:"#a855f7" }}>{d.influencer?.name||d.influencer?.username||d.influencerName||"—"}</span></td>
                  <td className="pg-td"><span style={{ fontSize:12,color:"#8892b0",maxWidth:200,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{d.reason||d.issue||d.description||"—"}</span></td>
                  <td className="pg-td">
                    <span className="badge" style={{ background:s==="resolved"?"rgba(0,214,143,0.12)":s==="under review"?"rgba(79,110,247,0.12)":isOpen?"rgba(255,71,87,0.12)":"rgba(245,166,35,0.12)",color:s==="resolved"?"#00d68f":s==="under review"?"#4f6ef7":isOpen?"#ff4757":"#f5a623",border:`1px solid ${s==="resolved"?"rgba(0,214,143,0.25)":s==="under review"?"rgba(79,110,247,0.25)":isOpen?"rgba(255,71,87,0.25)":"rgba(245,166,35,0.25)"}` }}>
                      {d.status||"Pending"}
                    </span>
                  </td>
                  <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
                  <td className="pg-td">
                    {isOpen && (
                      <button className="pg-btn" disabled={acting===escrowId} onClick={()=>handleRefund(escrowId)} style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}>
                        {acting===escrowId?"...":"Refund"}
                      </button>
                    )}
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

// export default function AdminDisputesPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter]   = useState("all");
//   const [acting, setActing]   = useState<string|null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/disputes`, { headers:{ Authorization:`Bearer ${token}` } });
//     if (res.status===401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json)?json:json?.disputes??json?.data??[]);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleRefund(escrowId: string) {
//     if (!confirm("Process refund for this dispute?")) return;
//     setActing(escrowId);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/refund/${escrowId}`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}` } });
//     setMsg("Refund processed ✓");
//     await load(); setActing(null);
//     setTimeout(()=>setMsg(""),3000);
//   }

//   const filtered = filter==="all" ? data : data.filter(d=>(d.status||"").toLowerCase()===filter);
//   const openCount = data.filter(d=>["open","pending"].includes((d.status||"").toLowerCase())).length;

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Dispute Resolution</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} disputes`}</p>
//         </div>
//         <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:160 }}>
//           <option value="all">All Status</option>
//           <option value="open">Open</option>
//           <option value="pending">Pending</option>
//           <option value="under review">Under Review</option>
//           <option value="resolved">Resolved</option>
//         </select>
//       </div>

//       {/* Alert */}
//       {openCount > 0 && (
//         <div style={{ background:"rgba(255,71,87,0.08)",border:"1px solid rgba(255,71,87,0.25)",borderRadius:10,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:10 }}>
//           <span style={{ fontSize:18 }}>⚠</span>
//           <div>
//             <div style={{ fontSize:13,fontWeight:600,color:"#ff4757" }}>{openCount} Active Disputes Need Attention</div>
//             <div style={{ fontSize:12,color:"#8892b0" }}>Review and resolve pending disputes</div>
//           </div>
//         </div>
//       )}

//       {/* Summary */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Open",         color:"#ff4757",s:"open"        },
//           {label:"Under Review", color:"#f5a623",s:"under review"},
//           {label:"Resolved",     color:"#00d68f",s:"resolved"    },
//           {label:"Total",        color:"#4f6ef7",s:"all"         },
//         ].map((x,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
//               {x.s==="all"?data.length:data.filter(d=>(d.status||"").toLowerCase()===x.s).length}
//             </span>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Deal","Brand","Influencer","Issue","Status","Date","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? <tr><td colSpan={8} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             : filtered.length===0 ? <tr><td colSpan={8} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No disputes found</td></tr>
//             : filtered.map((d:any)=>{
//               const id=d._id||d.id;
//               const escrowId=d.escrow?._id||d.escrowId||id;
//               const s=(d.status||"").toLowerCase();
//               const isOpen=["open","pending","under review"].includes(s);
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:13 }}>{d.deal?.title||d.dealTitle||d.dealId?.slice?.(-6)||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{d.brand?.name||d.raisedBy?.name||d.brandName||"—"}</span></td>
//                   <td className="pg-td"><span style={{ color:"#a855f7" }}>{d.influencer?.name||d.influencer?.username||d.influencerName||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#8892b0",maxWidth:200,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{d.reason||d.issue||d.description||"—"}</span></td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:s==="resolved"?"rgba(0,214,143,0.12)":s==="under review"?"rgba(79,110,247,0.12)":isOpen?"rgba(255,71,87,0.12)":"rgba(245,166,35,0.12)",color:s==="resolved"?"#00d68f":s==="under review"?"#4f6ef7":isOpen?"#ff4757":"#f5a623",border:`1px solid ${s==="resolved"?"rgba(0,214,143,0.25)":s==="under review"?"rgba(79,110,247,0.25)":isOpen?"rgba(255,71,87,0.25)":"rgba(245,166,35,0.25)"}` }}>
//                       {d.status||"Pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   <td className="pg-td">
//                     {isOpen && (
//                       <button className="pg-btn" disabled={acting===escrowId} onClick={()=>handleRefund(escrowId)} style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}>
//                         {acting===escrowId?"...":"Refund"}
//                       </button>
//                     )}
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