"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      const res = await fetch(`${BASE}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push("/login"); return; }
      const json = await res.json();
      setData(Array.isArray(json) ? json : json?.applications ?? json?.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const name = (a.influencerId?.name || "").toLowerCase();
    const email = (a.influencerId?.email || "").toLowerCase();
    const campaign = (a.campaignId?.title || "").toLowerCase();
    const ms = name.includes(q) || email.includes(q) || campaign.includes(q);
    const mf = filter === "all" || (a.status || "").toLowerCase() === filter;
    return ms && mf;
  });

  const statusBadge = (s: string) => {
    const map: any = {
      accepted: ["rgba(0,214,143,0.12)", "#00d68f", "rgba(0,214,143,0.25)"],
      pending:  ["rgba(245,166,35,0.12)", "#f5a623", "rgba(245,166,35,0.25)"],
      rejected: ["rgba(255,71,87,0.12)", "#ff4757", "rgba(255,71,87,0.25)"],
    };
    const [bg, c, br] = map[(s || "").toLowerCase()] || ["rgba(74,85,104,0.2)", "#8892b0", "rgba(74,85,104,0.3)"];
    return <span className="badge" style={{ background: bg, color: c, border: `1px solid ${br}` }}>{s || "—"}</span>;
  };

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Applications</h1>
          <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} applications`}</p>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <input
            className="pg-input"
            placeholder="Search name, email, campaign..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:220 }}
          />
          <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:140 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Total",    color:"#a855f7", s:"all"      },
          { label:"Pending",  color:"#f5a623", s:"pending"  },
          { label:"Accepted", color:"#00d68f", s:"accepted" },
          { label:"Rejected", color:"#ff4757", s:"rejected" },
        ].map((x, i) => (
          <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
            <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
              {x.s === "all" ? data.length : data.filter(a => (a.status||"").toLowerCase() === x.s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="pg-card" style={{ overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead>
            <tr>
              {["ID","Influencer","Email","Campaign","Proposal","Bid Amount","Status","Date"].map(h => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:"center",padding:40 }}>
                <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No applications found</td></tr>
            ) : filtered.map((a: any) => {
              const id         = a._id || a.id;
              const influencer = a.influencerId;
              const campaign   = a.campaignId;
              return (
                <tr key={id}>
                  {/* ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
                  </td>

                  {/* Influencer Name */}
                  <td className="pg-td">
                    <div style={{ fontWeight:600,fontSize:13 }}>{influencer?.name || "—"}</div>
                    <div style={{ fontSize:11,color:"#4a5568",marginTop:2 }}>{influencer?.plan || ""}</div>
                  </td>

                  {/* Email */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0" }}>{influencer?.email || "—"}</span>
                  </td>

                  {/* Campaign */}
                  <td className="pg-td">
                    {campaign ? (
                      <span style={{ color:"#4f6ef7",fontSize:13,fontWeight:500 }}>{campaign.title}</span>
                    ) : (
                      <span style={{ color:"#4a5568",fontSize:12 }}>No Campaign</span>
                    )}
                  </td>

                  {/* Proposal */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#8892b0",maxWidth:200,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {a.proposal || "—"}
                    </span>
                  </td>

                  {/* Bid Amount */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>
                      {a.bidAmount != null ? `₹${Number(a.bidAmount).toLocaleString("en-IN")}` : "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="pg-td">{statusBadge(a.status)}</td>

                  {/* Date */}
                  <td className="pg-td">
                    <span style={{ fontSize:12,color:"#4a5568" }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : "—"}
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

// const BASE = "http://localhost:3001/api/admin";
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminApplicationsPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter]   = useState("all");

//   useEffect(() => {
//     async function load() {
//       const token = localStorage.getItem("token");
//       if (!token) { router.push("/login"); return; }
//       const res = await fetch(`${BASE}/applications`, { headers: { Authorization: `Bearer ${token}` } });
//       if (res.status === 401) { router.push("/login"); return; }
//       const json = await res.json();
//       setData(Array.isArray(json) ? json : json?.applications ?? json?.data ?? []);
//       setLoading(false);
//     }
//     load();
//   }, []);

//   const filtered = filter === "all" ? data : data.filter(a => (a.status||"").toLowerCase() === filter);

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Applications</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading?"Loading...":`${data.length} applications`}</p>
//         </div>
//         <select className="pg-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ width:140 }}>
//           <option value="all">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="accepted">Accepted</option>
//           <option value="rejected">Rejected</option>
//         </select>
//       </div>

//       <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           {label:"Pending",  color:"#f5a623",s:"pending" },
//           {label:"Accepted", color:"#00d68f",s:"accepted"},
//           {label:"Rejected", color:"#ff4757",s:"rejected"},
//         ].map((x,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>
//               {data.filter(a=>(a.status||"").toLowerCase()===x.s).length}
//             </span>
//           </div>
//         ))}
//       </div>

//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","Influencer","Campaign","Proposal","Quote","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             ) : filtered.length===0 ? (
//               <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No applications found</td></tr>
//             ) : filtered.map((a:any)=>{
//               const s = (a.status||"").toLowerCase();
//               return (
//                 <tr key={a._id||a.id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(a._id||a.id)?.slice(-6)}</span></td>
//                   <td className="pg-td">
//                     <div style={{ fontWeight:600 }}>{a.influencer?.name||a.influencer?.username||a.influencerName||"—"}</div>
//                     {a.influencer?.email&&<div style={{ fontSize:11,color:"#4a5568" }}>{a.influencer.email}</div>}
//                   </td>
//                   <td className="pg-td"><span style={{ color:"#4f6ef7",fontSize:13 }}>{a.campaign?.title||a.campaignTitle||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#8892b0",maxWidth:200,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.proposal||a.message||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{(a.proposedBudget??a.quote)!=null?`₹${Number(a.proposedBudget??a.quote).toLocaleString("en-IN")}`:"—"}</span></td>
//                   <td className="pg-td">
//                     <span className="badge" style={{ background:s==="accepted"?"rgba(0,214,143,0.12)":s==="rejected"?"rgba(255,71,87,0.12)":"rgba(245,166,35,0.12)",color:s==="accepted"?"#00d68f":s==="rejected"?"#ff4757":"#f5a623",border:`1px solid ${s==="accepted"?"rgba(0,214,143,0.25)":s==="rejected"?"rgba(255,71,87,0.25)":"rgba(245,166,35,0.25)"}` }}>
//                       {a.status||"Pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{a.createdAt?new Date(a.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }