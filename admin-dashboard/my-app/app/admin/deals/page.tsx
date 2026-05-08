"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

export default function AdminDealsPage() {
  const router = useRouter();
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      const res = await fetch(`${BASE}/deals`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push("/login"); return; }
      const json = await res.json();
      setData(Array.isArray(json) ? json : json?.deals ?? json?.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? data : data.filter(d => (d.paymentStatus || "").toLowerCase() === filter);

  const paymentBadge = (s: string) => {
    const map: any = {
      pending:  ["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"],
      released: ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
      refunded: ["rgba(255,71,87,0.12)","#ff4757","rgba(255,71,87,0.25)"],
      held:     ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
    };
    const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
    return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"—"}</span>;
  };

  const workBadge = (s: string) => {
    const map: any = {
      not_started: ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"],
      in_progress: ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
      submitted:   ["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"],
      approved:    ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
      rejected:    ["rgba(255,71,87,0.12)","#ff4757","rgba(255,71,87,0.25)"],
    };
    const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
    return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s?.replace("_"," ")||"—"}</span>;
  };

  // Summary totals
  const totalAmount     = data.reduce((s, d) => s + (d.amount || 0), 0);
  const totalCommission = data.reduce((s, d) => s + (d.platformCommission || 0), 0);
  const totalReleased   = data.filter(d => d.paymentStatus === "released").length;
  const totalPending    = data.filter(d => d.paymentStatus === "pending").length;

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Deals</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} deals`}</p>
        </div>
        <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:150 }}>
          <option value="all">All Payment Status</option>
          <option value="pending">Pending</option>
          <option value="released">Released</option>
          <option value="refunded">Refunded</option>
          <option value="held">Held</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Total Deals",    color:"#a855f7", value: data.length },
          { label:"Pending",        color:"#f5a623", value: totalPending },
          { label:"Released",       color:"#00d68f", value: totalReleased },
          { label:"Platform Earned",color:"#4f6ef7", value: `₹${Math.round(totalCommission).toLocaleString("en-IN")}` },
        ].map((x, i) => (
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
            <span style={{ fontSize:i===3?16:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>{x.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="pg-card" style={{ overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead>
            <tr>
              {["Deal ID","Brand","Influencer","Total Amount","Commission","Creator Gets","Payment","Work Status","Date"].map(h => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign:"center",padding:40 }}>
                <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No deals found</td></tr>
            ) : filtered.map((d: any) => {
              const id         = d._id || d.id;
              const brand      = d.brandId;
              const influencer = d.influencerId;
              return (
                <tr key={id}>
                  {/* Deal ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-8)}</span>
                  </td>

                  {/* Brand */}
                  <td className="pg-td">
                    <span style={{ fontWeight:600,fontSize:13 }}>
                      {brand?.name || brand?.companyName || "—"}
                    </span>
                  </td>

                  {/* Influencer */}
                  <td className="pg-td">
                    <span style={{ color:"#a855f7",fontSize:13 }}>
                      {influencer?.name || influencer?.username || "—"}
                    </span>
                  </td>

                  {/* Total Amount */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>
                      {d.amount != null ? `₹${Number(d.amount).toLocaleString("en-IN")}` : "—"}
                    </span>
                  </td>

                  {/* Platform Commission */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:12,color:"#4f6ef7" }}>
                      {d.platformCommission != null ? `₹${Number(d.platformCommission).toLocaleString("en-IN")}` : "—"}
                    </span>
                  </td>

                  {/* Creator Amount */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:12,color:"#00d68f" }}>
                      {d.creatorAmount != null ? `₹${Number(d.creatorAmount).toLocaleString("en-IN")}` : "—"}
                    </span>
                  </td>

                  {/* Payment Status */}
                  <td className="pg-td">{paymentBadge(d.paymentStatus)}</td>

                  {/* Work Status */}
                  <td className="pg-td">{workBadge(d.workStatus)}</td>

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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminDealsPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter]   = useState("all");

//   useEffect(() => {
//     async function load() {
//       const token = localStorage.getItem("token");
//       if (!token) { router.push("/login"); return; }
//       const res = await fetch(`${BASE}/deals`, { headers: { Authorization: `Bearer ${token}` } });
//       if (res.status === 401) { router.push("/login"); return; }
//       const json = await res.json();
//       setData(Array.isArray(json) ? json : json?.deals ?? json?.data ?? []);
//       setLoading(false);
//     }
//     load();
//   }, []);

//   const filtered = filter === "all" ? data : data.filter(d => (d.status||"").toLowerCase() === filter);

//   const statusBadge = (s: string) => {
//     const map: any = {
//       pending:       ["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"],
//       active:        ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
//       "in progress": ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
//       completed:     ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
//       cancelled:     ["rgba(255,71,87,0.12)","#ff4757","rgba(255,71,87,0.25)"],
//     };
//     const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
//     return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"—"}</span>;
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Deals</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} deals`}</p>
//         </div>
//         <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:150 }}>
//           <option value="all">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="active">Active</option>
//           <option value="completed">Completed</option>
//           <option value="cancelled">Cancelled</option>
//         </select>
//       </div>

//       {/* Summary */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Pending",   color:"#f5a623",s:"pending"  },
//           {label:"Active",    color:"#4f6ef7",s:"active"   },
//           {label:"Completed", color:"#00d68f",s:"completed"},
//           {label:"Cancelled", color:"#ff4757",s:"cancelled"},
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
//           <thead><tr>{["Deal ID","Campaign","Brand","Influencer","Amount","Fee","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={8} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length===0 ? (
//               <tr><td colSpan={8} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No deals found</td></tr>
//             ) : filtered.map((d:any)=>(
//               <tr key={d._id||d.id}>
//                 <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(d._id||d.id)?.slice(-8)}</span></td>
//                 <td className="pg-td"><span style={{ fontSize:13 }}>{d.campaign?.title||d.campaignTitle||"—"}</span></td>
//                 <td className="pg-td"><span style={{ fontWeight:600 }}>{d.brand?.name||d.brandName||"—"}</span></td>
//                 <td className="pg-td"><span style={{ color:"#a855f7" }}>{d.influencer?.name||d.influencer?.username||d.influencerName||"—"}</span></td>
//                 <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{d.amount!=null?`₹${Number(d.amount).toLocaleString("en-IN")}`:"—"}</span></td>
//                 <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:12.5,color:"#8892b0" }}>{d.platformFee!=null?`₹${Number(d.platformFee).toLocaleString("en-IN")}`:"—"}</span></td>
//                 <td className="pg-td">{statusBadge(d.status)}</td>
//                 <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//               </tr>
//             ))}
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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminDealsPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter]   = useState("all");

//   useEffect(() => {
//     async function load() {
//       const token = localStorage.getItem("token");
//       if (!token) { router.push("/login"); return; }
//       const res = await fetch(`${BASE}/deals`, { headers: { Authorization: `Bearer ${token}` } });
//       if (res.status === 401) { router.push("/login"); return; }
//       const json = await res.json();
//       setData(Array.isArray(json) ? json : json?.deals ?? json?.data ?? []);
//       setLoading(false);
//     }
//     load();
//   }, []);

//   const filtered = filter === "all" ? data : data.filter(d => (d.status||"").toLowerCase() === filter);

//   const statusBadge = (s: string) => {
//     const map: any = {
//       pending:       ["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"],
//       active:        ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
//       "in progress": ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
//       completed:     ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
//       cancelled:     ["rgba(255,71,87,0.12)","#ff4757","rgba(255,71,87,0.25)"],
//     };
//     const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
//     return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"—"}</span>;
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Deals</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} deals`}</p>
//         </div>
//         <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:150 }}>
//           <option value="all">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="active">Active</option>
//           <option value="completed">Completed</option>
//           <option value="cancelled">Cancelled</option>
//         </select>
//       </div>

//       {/* Summary */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Pending",   color:"#f5a623",s:"pending"  },
//           {label:"Active",    color:"#4f6ef7",s:"active"   },
//           {label:"Completed", color:"#00d68f",s:"completed"},
//           {label:"Cancelled", color:"#ff4757",s:"cancelled"},
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
//           <thead><tr>{["Deal ID","Campaign","Brand","Influencer","Amount","Fee","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={8} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length===0 ? (
//               <tr><td colSpan={8} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No deals found</td></tr>
//             ) : filtered.map((d:any)=>(
//               <tr key={d._id||d.id}>
//                 <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(d._id||d.id)?.slice(-8)}</span></td>
//                 <td className="pg-td"><span style={{ fontSize:13 }}>{d.campaign?.title||d.campaignTitle||"—"}</span></td>
//                 <td className="pg-td"><span style={{ fontWeight:600 }}>{d.brand?.name||d.brandName||"—"}</span></td>
//                 <td className="pg-td"><span style={{ color:"#a855f7" }}>{d.influencer?.name||d.influencer?.username||d.influencerName||"—"}</span></td>
//                 <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{d.amount!=null?`₹${Number(d.amount).toLocaleString("en-IN")}`:"—"}</span></td>
//                 <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:12.5,color:"#8892b0" }}>{d.platformFee!=null?`₹${Number(d.platformFee).toLocaleString("en-IN")}`:"—"}</span></td>
//                 <td className="pg-td">{statusBadge(d.status)}</td>
//                 <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{d.createdAt?new Date(d.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }