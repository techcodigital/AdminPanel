"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

const PACKAGES = [
  { tokens: 100,  price: 99,   popular: false },
  { tokens: 500,  price: 399,  popular: true  },
  { tokens: 1000, price: 699,  popular: false },
  { tokens: 5000, price: 2999, popular: false },
];

export default function AdminTokensPage() {
  const router = useRouter();
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      const res = await fetch(`${BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push("/login"); return; }
      const json = await res.json();
      setData(Array.isArray(json) ? json : json?.transactions ?? json?.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? data : data.filter(t => (t.status || "").toLowerCase() === filter);

  // Summary
  const totalVolume     = data.reduce((s, t) => s + (t.amount || 0), 0);
  const totalCommission = data.reduce((s, t) => s + (t.commission || 0), 0);
  const totalCreator    = data.reduce((s, t) => s + (t.creatorAmount || 0), 0);
  const releasedCount   = data.filter(t => (t.status || "").toLowerCase() === "released").length;

  const statusBadge = (s: string) => {
    const map: any = {
      released: ["rgba(0,214,143,0.12)","#00d68f","rgba(0,214,143,0.25)"],
      funded:   ["rgba(79,110,247,0.12)","#4f6ef7","rgba(79,110,247,0.25)"],
      pending:  ["rgba(245,166,35,0.12)","#f5a623","rgba(245,166,35,0.25)"],
      refunded: ["rgba(255,71,87,0.12)","#ff4757","rgba(255,71,87,0.25)"],
    };
    const [bg,c,br] = map[(s||"").toLowerCase()] || ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
    return <span className="badge" style={{ background:bg,color:c,border:`1px solid ${br}` }}>{s||"—"}</span>;
  };

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Token System</h1>
        <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>Platform token packages and transaction history</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
        {[
          { label:"Total Transactions", color:"#4f6ef7", value: data.length },
          { label:"Total Volume",       color:"#f5a623", value: `₹${Math.round(totalVolume).toLocaleString("en-IN")}` },
          { label:"Platform Earned",    color:"#a855f7", value: `₹${Math.round(totalCommission).toLocaleString("en-IN")}` },
          { label:"Released",           color:"#00d68f", value: releasedCount },
        ].map((s, i) => (
          <div key={i} className="pg-card" style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:11,color:"#4a5568",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:i===0||i===3?26:18,fontWeight:700,color:s.color,fontFamily:"monospace" }}>
              {loading ? "—" : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Token Packages */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:14,fontWeight:600,color:"#8892b0",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.5px" }}>
          Token Packages
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
          {PACKAGES.map((pkg, i) => (
            <div key={i} className="pg-card" style={{
              padding:20,position:"relative",
              border: pkg.popular ? "1px solid rgba(79,110,247,0.5)" : undefined,
            }}>
              {pkg.popular && (
                <div style={{ position:"absolute",top:-1,right:14,background:"#4f6ef7",color:"white",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:"0 0 6px 6px" }}>
                  POPULAR
                </div>
              )}
              <div style={{ fontSize:28,fontWeight:700,color:"#4f6ef7",fontFamily:"monospace",marginBottom:2 }}>{pkg.tokens}</div>
              <div style={{ fontSize:12,color:"#4a5568",marginBottom:10 }}>tokens</div>
              <div style={{ fontSize:20,fontWeight:700,color:"#f5a623",fontFamily:"monospace" }}>₹{pkg.price}</div>
              <div style={{ fontSize:11,color:"#4a5568",marginTop:4 }}>₹{(pkg.price/pkg.tokens).toFixed(2)} per token</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="pg-card" style={{ overflow:"auto" }}>
        <div style={{ padding:"14px 18px",borderBottom:"1px solid rgba(79,110,247,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span style={{ fontSize:14,fontWeight:600,color:"#e8eaf6" }}>Transaction History</span>
          <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:140 }}>
            <option value="all">All Status</option>
            <option value="funded">Funded</option>
            <option value="released">Released</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
          <thead>
            <tr>
              {["ID","Brand","Order ID","Payment ID","Amount","Commission","Creator Gets","Status","Payout","Date"].map(h => (
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
              <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No transactions found</td></tr>
            ) : filtered.map((t: any) => (
              <tr key={t._id||t.id}>
                {/* ID */}
                <td className="pg-td">
                  <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(t._id||t.id)?.slice(-8)}</span>
                </td>

                {/* Brand */}
                <td className="pg-td">
                  <span style={{ fontWeight:600,fontSize:13 }}>{t.brandId?.name || "—"}</span>
                </td>

                {/* Order ID */}
                <td className="pg-td">
                  <span style={{ fontFamily:"monospace",fontSize:11,color:"#8892b0" }}>{t.orderId?.slice(-10) || "—"}</span>
                </td>

                {/* Payment ID */}
                <td className="pg-td">
                  <span style={{ fontFamily:"monospace",fontSize:11,color:"#a855f7" }}>{t.paymentId?.slice(-10) || "—"}</span>
                </td>

                {/* Amount */}
                <td className="pg-td">
                  <span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>
                    {t.amount != null ? `₹${Number(t.amount).toLocaleString("en-IN")}` : "—"}
                  </span>
                </td>

                {/* Commission */}
                <td className="pg-td">
                  <span style={{ fontFamily:"monospace",color:"#4f6ef7",fontSize:12 }}>
                    {t.commission != null ? `₹${Number(t.commission).toLocaleString("en-IN")}` : "—"}
                  </span>
                </td>

                {/* Creator Gets */}
                <td className="pg-td">
                  <span style={{ fontFamily:"monospace",color:"#00d68f",fontSize:12 }}>
                    {t.creatorAmount != null ? `₹${Number(t.creatorAmount).toLocaleString("en-IN")}` : "—"}
                  </span>
                </td>

                {/* Status */}
                <td className="pg-td">{statusBadge(t.status)}</td>

                {/* Payout Status */}
                <td className="pg-td">
                  <span className="badge" style={{
                    background: t.payoutStatus === "completed" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                    color:      t.payoutStatus === "completed" ? "#00d68f" : "#f5a623",
                    border:     `1px solid ${t.payoutStatus === "completed" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
                  }}>
                    {t.payoutStatus || "pending"}
                  </span>
                </td>

                {/* Date */}
                <td className="pg-td">
                  <span style={{ fontSize:12,color:"#4a5568" }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "—"}
                  </span>
                </td>
              </tr>
            ))}
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
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// const PACKAGES = [
//   { tokens: 100,  price: 99,   popular: false },
//   { tokens: 500,  price: 399,  popular: true  },
//   { tokens: 1000, price: 699,  popular: false },
//   { tokens: 5000, price: 2999, popular: false },
// ];

// export default function AdminTokensPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       const token = localStorage.getItem("token");
//       if (!token) { router.push("/login"); return; }
//       const res = await fetch(`${BASE}/transactions`, { headers:{ Authorization:`Bearer ${token}` } });
//       if (res.status===401) { router.push("/login"); return; }
//       const json = await res.json();
//       const all = Array.isArray(json)?json:json?.transactions??json?.data??[];
//       const tokenTxns = all.filter((t:any)=>(t.type||t.transactionType||"").toLowerCase().includes("token"));
//       setData(tokenTxns.length>0?tokenTxns:all);
//       setLoading(false);
//     }
//     load();
//   }, []);

//   const totalRev    = data.reduce((a,t)=>a+(t.amount||0),0);
//   const totalTokens = data.reduce((a,t)=>a+(t.tokens||t.tokenAmount||0),0);

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ marginBottom:20 }}>
//         <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Token System</h1>
//         <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>Token purchases and usage</p>
//       </div>

//       {/* Stats */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24 }}>
//         {[
//           {label:"Token Transactions",value:data.length,                                                              color:"#4f6ef7"},
//           {label:"Tokens Sold",       value:totalTokens>0?totalTokens.toLocaleString("en-IN"):"—",                   color:"#a855f7"},
//           {label:"Token Revenue",     value:totalRev>0?`₹${totalRev.toLocaleString("en-IN")}`:"—",                   color:"#f5a623"},
//         ].map((s,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"18px 20px" }}>
//             <div style={{ fontSize:11,color:"#4a5568",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8 }}>{s.label}</div>
//             <div style={{ fontSize:26,fontWeight:700,color:s.color,fontFamily:"monospace" }}>{loading?"—":s.value}</div>
//           </div>
//         ))}
//       </div>

//       {/* Packages */}
//       <div style={{ marginBottom:24 }}>
//         <div style={{ fontSize:14,fontWeight:600,color:"#8892b0",marginBottom:14 }}>Token Packages</div>
//         <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
//           {PACKAGES.map((pkg,i)=>(
//             <div key={i} className="pg-card" style={{ padding:20,position:"relative",border:pkg.popular?"1px solid rgba(79,110,247,0.5)":undefined }}>
//               {pkg.popular&&<div style={{ position:"absolute",top:-1,right:14,background:"#4f6ef7",color:"white",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:"0 0 6px 6px" }}>POPULAR</div>}
//               <div style={{ fontSize:28,fontWeight:700,color:"#4f6ef7",fontFamily:"monospace",marginBottom:2 }}>{pkg.tokens}</div>
//               <div style={{ fontSize:12,color:"#4a5568",marginBottom:10 }}>tokens</div>
//               <div style={{ fontSize:20,fontWeight:700,color:"#f5a623",fontFamily:"monospace" }}>₹{pkg.price}</div>
//               <div style={{ fontSize:11,color:"#4a5568",marginTop:4 }}>₹{(pkg.price/pkg.tokens).toFixed(2)} per token</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* History */}
//       <div className="pg-card" style={{ overflow:"hidden" }}>
//         <div style={{ padding:"14px 18px",borderBottom:"1px solid rgba(79,110,247,0.1)",fontSize:14,fontWeight:600,color:"#e8eaf6" }}>Purchase History</div>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead><tr>{["ID","User","Tokens","Amount","Type","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//           <tbody>
//             {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//             : data.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No token transactions found</td></tr>
//             : data.map((t:any)=>{
//               const s=(t.status||"").toLowerCase();
//               return (
//                 <tr key={t._id||t.id}>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(t._id||t.id)?.slice(-8)}</span></td>
//                   <td className="pg-td"><span style={{ fontWeight:600 }}>{t.user?.name||t.user?.email||t.userName||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#4f6ef7",fontWeight:600 }}>+{t.tokens||t.tokenAmount||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{t.amount!=null?`₹${Number(t.amount).toLocaleString("en-IN")}`:"—"}</span></td>
//                   <td className="pg-td"><span className="badge" style={{ background:"rgba(168,85,247,0.12)",color:"#a855f7",border:"1px solid rgba(168,85,247,0.25)" }}>{t.type||t.transactionType||"—"}</span></td>
//                   <td className="pg-td"><span className="badge" style={{ background:["completed","success"].includes(s)?"rgba(0,214,143,0.12)":s==="pending"?"rgba(245,166,35,0.12)":"rgba(255,71,87,0.12)",color:["completed","success"].includes(s)?"#00d68f":s==="pending"?"#f5a623":"#ff4757",border:`1px solid ${["completed","success"].includes(s)?"rgba(0,214,143,0.25)":s==="pending"?"rgba(245,166,35,0.25)":"rgba(255,71,87,0.25)"}` }}>{t.status||"—"}</span></td>
//                   <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{t.createdAt?new Date(t.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }