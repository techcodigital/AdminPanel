"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

export default function AdminDeliverablesPage() {
  const router = useRouter();
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      const res = await fetch(`${BASE}/deliverables`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push("/login"); return; }
      const json = await res.json();
      setData(Array.isArray(json) ? json : json?.deliverables ?? json?.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? data : data.filter(d => (d.status || "").toLowerCase() === filter);

  const statusBadge = (s: string) => {
    const map: any = {
      submitted: ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
      approved:  ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
      rejected:  ["rgba(255,71,87,0.12)","#ff4757","rgba(255,71,87,0.25)"],
      pending:   ["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"],
    };
    const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
    return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"Pending"}</span>;
  };

  // Summary totals
  const paymentReleased = data.filter(d => d.dealId?.paymentStatus === "released").length;
  const totalAmount     = data.reduce((s, d) => s + (d.dealId?.amount || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Deliverables</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} deliverables`}</p>
        </div>
        <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:150 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Total",            color:"#a855f7", value: data.length },
          { label:"Pending",          color:"#f5a623", value: data.filter(d=>(d.status||"").toLowerCase()==="pending").length },
          { label:"Submitted",        color:"#4f6ef7", value: data.filter(d=>(d.status||"").toLowerCase()==="submitted").length },
          { label:"Approved",         color:"#00d68f", value: data.filter(d=>(d.status||"").toLowerCase()==="approved").length },
          { label:"Rejected",         color:"#ff4757", value: data.filter(d=>(d.status||"").toLowerCase()==="rejected").length },
        ].map((x, i) => (
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
            <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>{x.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="pg-card" style={{ overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead>
            <tr>
              {["ID","Deal Amount","Payment","Note","Links","Status","Date"].map(h => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}>
                <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No deliverables found</td></tr>
            ) : filtered.map((d: any) => {
              const id    = d._id || d.id;
              const deal  = d.dealId;
              const links = Array.isArray(d.links) ? d.links : d.links ? [d.links] : [];
              return (
                <tr key={id}>
                  {/* ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
                  </td>

                  {/* Deal Amount */}
                  <td className="pg-td">
                    <div style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>
                      {deal?.amount != null ? `₹${Number(deal.amount).toLocaleString("en-IN")}` : "—"}
                    </div>
                    <div style={{ fontSize:11,color:"#4a5568",marginTop:2 }}>
                      Creator: {deal?.creatorAmount != null ? `₹${Number(deal.creatorAmount).toLocaleString("en-IN")}` : "—"}
                    </div>
                  </td>

                  {/* Payment Status */}
                  <td className="pg-td">
                    {deal?.paymentStatus ? (
                      <span className="badge" style={{
                        background: deal.paymentStatus === "released" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                        color:      deal.paymentStatus === "released" ? "#00d68f" : "#f5a623",
                        border:     `1px solid ${deal.paymentStatus === "released" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
                      }}>
                        {deal.paymentStatus}
                      </span>
                    ) : "—"}
                  </td>

                  {/* Note */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0",maxWidth:180,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {d.note || "—"}
                    </span>
                  </td>

                  {/* Links */}
                  <td className="pg-td">
                    <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                      {links.length > 0 ? links.map((link: string, i: number) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                          style={{ color:"#4f6ef7",fontSize:12,textDecoration:"underline",display:"block",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          Link {i+1} ↗
                        </a>
                      )) : "—"}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="pg-td">{statusBadge(d.status)}</td>

                  {/* Date */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#4a5568" }}>
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "—"}
                    </span>
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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminDeliverablesPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       const token = localStorage.getItem("token");
//       if (!token) { router.push("/login"); return; }
//       const res = await fetch(`${BASE}/deliverables`, { headers:{ Authorization:`Bearer ${token}` } });
//       if (res.status===401) { router.push("/login"); return; }
//       const json = await res.json();
//       setData(Array.isArray(json)?json:json?.deliverables??json?.data??[]);
//       setLoading(false);
//     }
//     load();
//   }, []);

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ marginBottom:20 }}>
//         <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Deliverables</h1>
//         <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} deliverables`}</p>
//       </div>

//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Pending",  color:"#f5a623",s:"pending"  },
//           {label:"Submitted",color:"#4f6ef7",s:"submitted"},
//           {label:"Approved", color:"#00d68f",s:"approved" },
//           {label:"Rejected", color:"#ff4757",s:"rejected" },
//         ].map((x,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
//               {data.filter(d=>(d.status||"").toLowerCase()===x.s).length}
//             </span>
//           </div>
//         ))}
//       </div>

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Deal","Influencer","Type","Content","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             : data.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No deliverables found</td></tr>
//             : data.map((d:any)=>{
//               const s=(d.status||"").toLowerCase();
//               return (
//                 <tr key={d._id||d.id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(d._id||d.id)?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:13 }}>{d.deal?.title||d.dealTitle||d.dealId?.slice?.(-6)||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{d.influencer?.name||d.influencer?.username||d.submittedBy?.name||"—"}</span></td>
//                   <td className="pg-td">{d.type||d.contentType?<span className="badge" style={{ background:"rgba(0,212,255,0.12)",color:"#00d4ff",border:"1px solid rgba(0,212,255,0.25)" }}>{d.type||d.contentType}</span>:"—"}</td>
//                   <td className="pg-td">
//                     {d.url||d.link||d.fileUrl
//                       ? <a href={d.url||d.link||d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color:"#4f6ef7",fontSize:12,textDecoration:"underline" }}>View ↗</a>
//                       : <span style={{ fontSize:12,color:"#4a5568" }}>{d.description||"No link"}</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:s==="approved"?"rgba(0,214,143,0.12)":s==="submitted"?"rgba(79,110,247,0.12)":s==="rejected"?"rgba(255,71,87,0.12)":"rgba(245,166,35,0.12)",color:s==="approved"?"#00d68f":s==="submitted"?"#4f6ef7":s==="rejected"?"#ff4757":"#f5a623",border:`1px solid ${s==="approved"?"rgba(0,214,143,0.25)":s==="submitted"?"rgba(79,110,247,0.25)":s==="rejected"?"rgba(255,71,87,0.25)":"rgba(245,166,35,0.25)"}` }}>
//                       {d.status||"Pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminDeliverablesPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       const token = localStorage.getItem("token");
//       if (!token) { router.push("/login"); return; }
//       const res = await fetch(`${BASE}/deliverables`, { headers:{ Authorization:`Bearer ${token}` } });
//       if (res.status===401) { router.push("/login"); return; }
//       const json = await res.json();
//       setData(Array.isArray(json)?json:json?.deliverables??json?.data??[]);
//       setLoading(false);
//     }
//     load();
//   }, []);

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ marginBottom:20 }}>
//         <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Deliverables</h1>
//         <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} deliverables`}</p>
//       </div>

//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Pending",  color:"#f5a623",s:"pending"  },
//           {label:"Submitted",color:"#4f6ef7",s:"submitted"},
//           {label:"Approved", color:"#00d68f",s:"approved" },
//           {label:"Rejected", color:"#ff4757",s:"rejected" },
//         ].map((x,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
//               {data.filter(d=>(d.status||"").toLowerCase()===x.s).length}
//             </span>
//           </div>
//         ))}
//       </div>

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Deal","Influencer","Type","Content","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             : data.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No deliverables found</td></tr>
//             : data.map((d:any)=>{
//               const s=(d.status||"").toLowerCase();
//               return (
//                 <tr key={d._id||d.id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(d._id||d.id)?.slice(-6)}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:13 }}>{d.deal?.title||d.dealTitle||d.dealId?.slice?.(-6)||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{d.influencer?.name||d.influencer?.username||d.submittedBy?.name||"—"}</span></td>
//                   <td className="pg-td">{d.type||d.contentType?<span className="badge" style={{ background:"rgba(0,212,255,0.12)",color:"#00d4ff",border:"1px solid rgba(0,212,255,0.25)" }}>{d.type||d.contentType}</span>:"—"}</td>
//                   <td className="pg-td">
//                     {d.url||d.link||d.fileUrl
//                       ? <a href={d.url||d.link||d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color:"#4f6ef7",fontSize:12,textDecoration:"underline" }}>View ↗</a>
//                       : <span style={{ fontSize:12,color:"#4a5568" }}>{d.description||"No link"}</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:s==="approved"?"rgba(0,214,143,0.12)":s==="submitted"?"rgba(79,110,247,0.12)":s==="rejected"?"rgba(255,71,87,0.12)":"rgba(245,166,35,0.12)",color:s==="approved"?"#00d68f":s==="submitted"?"#4f6ef7":s==="rejected"?"#ff4757":"#f5a623",border:`1px solid ${s==="approved"?"rgba(0,214,143,0.25)":s==="submitted"?"rgba(79,110,247,0.25)":s==="rejected"?"rgba(255,71,87,0.25)":"rgba(245,166,35,0.25)"}` }}>
//                       {d.status||"Pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }