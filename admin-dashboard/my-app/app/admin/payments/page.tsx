"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";
const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [escrows, setEscrows]           = useState<any[]>([]);
  const [tab, setTab]                   = useState<"transactions"|"escrows">("transactions");
  const [loading, setLoading]           = useState(true);
  const [acting, setActing]             = useState<string|null>(null);
  const [msg, setMsg]                   = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const [tRes, eRes] = await Promise.all([
      fetch(`${BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${BASE}/escrows`,      { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (tRes.status === 401) { router.push("/login"); return; }
    const tJson = await tRes.json();
    const eJson = await eRes.json();
    setTransactions(Array.isArray(tJson) ? tJson : tJson?.transactions ?? tJson?.data ?? []);
    setEscrows(Array.isArray(eJson) ? eJson : eJson?.escrows ?? eJson?.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRelease(id: string) {
    if (!confirm("Release payment from escrow?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/escrows/${id}/release`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setMsg("Payment released ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleRefund(id: string) {
    if (!confirm("Refund this escrow?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/refund/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setMsg("Refund processed ✓");
    await load(); setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  // Summary calculations
  const totalTxnAmount    = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const totalCommission   = transactions.reduce((s, t) => s + (t.commission || 0), 0);
  const releasedEscrows   = escrows.filter(e => (e.status || "").toLowerCase() === "released").length;
  const pendingEscrows    = escrows.filter(e => ["funded","holding","pending"].includes((e.status||"").toLowerCase())).length;

  const txnStatusBadge = (s: string) => {
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
        <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Payments</h1>
        <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>Transactions and escrow management</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20 }}>
        {[
          { label:"Total Volume",      color:"#f5a623", value: `₹${Math.round(totalTxnAmount).toLocaleString("en-IN")}` },
          { label:"Platform Earned",   color:"#4f6ef7", value: `₹${Math.round(totalCommission).toLocaleString("en-IN")}` },
          { label:"Escrows Released",  color:"#00d68f", value: releasedEscrows },
          { label:"Escrows Pending",   color:"#f5a623", value: pendingEscrows },
        ].map((s, i) => (
          <div key={i} className="pg-card" style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:11,color:"#4a5568",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:i<2?18:26,fontWeight:700,color:s.color,fontFamily:"monospace" }}>{loading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        {(["transactions","escrows"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"7px 20px",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",
            fontFamily:"inherit",
            background: tab===t ? "#4f6ef7" : "#141b30",
            color:      tab===t ? "white"   : "#8892b0",
            border:     tab===t ? "none"    : "1px solid rgba(79,110,247,0.2)",
          }}>
            {t.charAt(0).toUpperCase()+t.slice(1)} ({t==="transactions" ? transactions.length : escrows.length})
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="pg-card" style={{ overflow:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
            <thead>
              <tr>
                {["Txn ID","Brand","Order ID","Payment ID","Amount","Commission","Creator Gets","Status","Payout","Date"].map(h => (
                  <th key={h} className="pg-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign:"center",padding:40 }}>
                  <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No transactions</td></tr>
              ) : transactions.map((t: any) => (
                <tr key={t._id||t.id}>
                  {/* Txn ID */}
                  <td className="pg-td">
                    <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(t._id||t.id)?.slice(-8)}</span>
                  </td>

                  {/* Brand */}
                  <td className="pg-td">
                    <span style={{ fontWeight:600,fontSize:13 }}>
                      {t.brandId?.name || "—"}
                    </span>
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
                  <td className="pg-td">{txnStatusBadge(t.status)}</td>

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
      )}

      {/* Escrows Tab */}
      {tab === "escrows" && (
        <div className="pg-card" style={{ overflow:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
            <thead>
              <tr>
                {["Escrow ID","Brand","Order ID","Payment ID","Amount","Commission","Creator Gets","Status","Payout","Released On","Actions"].map(h => (
                  <th key={h} className="pg-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign:"center",padding:40 }}>
                  <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
                </td></tr>
              ) : escrows.length === 0 ? (
                <tr><td colSpan={11} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No escrows</td></tr>
              ) : escrows.map((e: any) => {
                const id = e._id || e.id;
                const s  = (e.status || "").toLowerCase();
                const isActionable = ["funded","holding","pending"].includes(s);
                return (
                  <tr key={id}>
                    {/* Escrow ID */}
                    <td className="pg-td">
                      <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-8)}</span>
                    </td>

                    {/* Brand */}
                    <td className="pg-td">
                      <span style={{ fontWeight:600,fontSize:13 }}>{e.brandId?.name || "—"}</span>
                    </td>

                    {/* Order ID */}
                    <td className="pg-td">
                      <span style={{ fontFamily:"monospace",fontSize:11,color:"#8892b0" }}>{e.orderId?.slice(-10) || "—"}</span>
                    </td>

                    {/* Payment ID */}
                    <td className="pg-td">
                      <span style={{ fontFamily:"monospace",fontSize:11,color:"#a855f7" }}>{e.paymentId?.slice(-10) || "—"}</span>
                    </td>

                    {/* Amount */}
                    <td className="pg-td">
                      <span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>
                        {e.amount != null ? `₹${Number(e.amount).toLocaleString("en-IN")}` : "—"}
                      </span>
                    </td>

                    {/* Commission */}
                    <td className="pg-td">
                      <span style={{ fontFamily:"monospace",color:"#4f6ef7",fontSize:12 }}>
                        {e.commission != null ? `₹${Number(e.commission).toLocaleString("en-IN")}` : "—"}
                      </span>
                    </td>

                    {/* Creator Gets */}
                    <td className="pg-td">
                      <span style={{ fontFamily:"monospace",color:"#00d68f",fontSize:12 }}>
                        {e.creatorAmount != null ? `₹${Number(e.creatorAmount).toLocaleString("en-IN")}` : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="pg-td">{txnStatusBadge(e.status)}</td>

                    {/* Payout Status */}
                    <td className="pg-td">
                      <span className="badge" style={{
                        background: e.payoutStatus === "completed" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                        color:      e.payoutStatus === "completed" ? "#00d68f" : "#f5a623",
                        border:     `1px solid ${e.payoutStatus === "completed" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
                      }}>
                        {e.payoutStatus || "pending"}
                      </span>
                    </td>

                    {/* Released On */}
                    <td className="pg-td">
                      <span style={{ fontSize:12,color:"#4a5568" }}>
                        {e.releaseDate ? new Date(e.releaseDate).toLocaleDateString("en-IN") : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="pg-td">
                      {isActionable ? (
                        <div style={{ display:"flex",gap:5 }}>
                          <button className="pg-btn" disabled={acting===id} onClick={() => handleRelease(id)}
                            style={{ color:"#00d68f",borderColor:"rgba(0,214,143,0.3)" }}>
                            {acting===id ? "..." : "Release"}
                          </button>
                          <button className="pg-btn" disabled={acting===id} onClick={() => handleRefund(id)}
                            style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}>
                            {acting===id ? "..." : "Refund"}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize:12,color:"#4a5568" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "http://localhost:3001/api/admin";
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminPaymentsPage() {
//   const router = useRouter();
//   const [transactions, setTransactions] = useState<any[]>([]);
//   const [escrows, setEscrows]           = useState<any[]>([]);
//   const [tab, setTab]                   = useState<"transactions"|"escrows">("transactions");
//   const [loading, setLoading]           = useState(true);
//   const [acting, setActing]             = useState<string|null>(null);
//   const [msg, setMsg]                   = useState("");

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const [tRes, eRes] = await Promise.all([
//       fetch(`${BASE}/transactions`, { headers:{ Authorization:`Bearer ${token}` } }),
//       fetch(`${BASE}/escrows`,      { headers:{ Authorization:`Bearer ${token}` } }),
//     ]);
//     if (tRes.status===401) { router.push("/login"); return; }
//     const tJson = await tRes.json();
//     const eJson = await eRes.json();
//     setTransactions(Array.isArray(tJson)?tJson:tJson?.transactions??tJson?.data??[]);
//     setEscrows(Array.isArray(eJson)?eJson:eJson?.escrows??eJson?.data??[]);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleRelease(id: string) {
//     if (!confirm("Release payment from escrow?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/escrows/${id}/release`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}` } });
//     setMsg("Payment released ✓");
//     await load(); setActing(null);
//     setTimeout(()=>setMsg(""),3000);
//   }

//   async function handleRefund(id: string) {
//     if (!confirm("Refund this escrow?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/refund/${id}`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}` } });
//     setMsg("Refund processed ✓");
//     await load(); setActing(null);
//     setTimeout(()=>setMsg(""),3000);
//   }

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>
//       <div style={{ marginBottom:20 }}>
//         <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Payments</h1>
//         <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>Transactions and escrow management</p>
//       </div>

//       {/* Summary */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20 }}>
//         {[
//           {label:"Total Transactions",value:transactions.length,                                                                          color:"#4f6ef7"},
//           {label:"Escrows Holding",   value:escrows.filter(e=>["holding","pending"].includes((e.status||"").toLowerCase())).length,       color:"#f5a623"},
//           {label:"Released",          value:escrows.filter(e=>(e.status||"").toLowerCase()==="released").length,                         color:"#00d68f"},
//         ].map((s,i)=>(
//           <div key={i} className="pg-card" style={{ padding:"18px 20px" }}>
//             <div style={{ fontSize:11,color:"#4a5568",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8 }}>{s.label}</div>
//             <div style={{ fontSize:26,fontWeight:700,color:s.color,fontFamily:"monospace" }}>{loading?"—":s.value}</div>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>{msg}</div>}

//       {/* Tab */}
//       <div style={{ display:"flex",gap:8,marginBottom:16 }}>
//         {(["transactions","escrows"] as const).map(t=>(
//           <button key={t} onClick={()=>setTab(t)}
//             style={{ padding:"7px 20px",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"none",background:tab===t?"#4f6ef7":"#141b30",color:tab===t?"white":"#8892b0",border:tab===t?"none":"1px solid rgba(79,110,247,0.2)" }}>
//             {t.charAt(0).toUpperCase()+t.slice(1)} ({t==="transactions"?transactions.length:escrows.length})
//           </button>
//         ))}
//       </div>

//       {/* Transactions */}
//       {tab==="transactions" && (
//         <div className="pg-card" style={{ overflow:"hidden" }}>
//           <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//             <thead><tr>{["Txn ID","From","To","Amount","Type","Status","Date"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//             <tbody>
//               {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//               : transactions.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No transactions</td></tr>
//               : transactions.map((t:any)=>{
//                 const s=(t.status||"").toLowerCase();
//                 return (
//                   <tr key={t._id||t.id}>
//                     <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{(t._id||t.id)?.slice(-8)}</span></td>
//                     <td className="pg-td"><span style={{ fontWeight:600 }}>{t.from?.name||t.from?.email||t.fromUser||"—"}</span></td>
//                     <td className="pg-td"><span style={{ color:"#4f6ef7" }}>{t.to?.name||t.to?.email||t.toUser||"—"}</span></td>
//                     <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{t.amount!=null?`₹${Number(t.amount).toLocaleString("en-IN")}`:"—"}</span></td>
//                     <td className="pg-td"><span className="badge" style={{ background:"rgba(79,110,247,0.12)",color:"#4f6ef7",border:"1px solid rgba(79,110,247,0.25)" }}>{t.type||t.transactionType||"—"}</span></td>
//                     <td className="pg-td"><span className="badge" style={{ background:["completed","success"].includes(s)?"rgba(0,214,143,0.12)":s==="pending"?"rgba(245,166,35,0.12)":"rgba(255,71,87,0.12)",color:["completed","success"].includes(s)?"#00d68f":s==="pending"?"#f5a623":"#ff4757",border:`1px solid ${["completed","success"].includes(s)?"rgba(0,214,143,0.25)":s==="pending"?"rgba(245,166,35,0.25)":"rgba(255,71,87,0.25)"}` }}>{t.status||"—"}</span></td>
//                     <td className="pg-td"><span style={{ fontSize:12,color:"#4a5568" }}>{t.createdAt?new Date(t.createdAt).toLocaleDateString("en-IN"):"—"}</span></td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Escrows */}
//       {tab==="escrows" && (
//         <div className="pg-card" style={{ overflow:"hidden" }}>
//           <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//             <thead><tr>{["Escrow ID","Deal","Brand","Influencer","Amount","Status","Actions"].map(h=><th key={h} className="pg-th">{h}</th>)}</tr></thead>
//             <tbody>
//               {loading ? <tr><td colSpan={7} style={{ textAlign:"center",padding:40 }}><div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/></td></tr>
//               : escrows.length===0 ? <tr><td colSpan={7} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No escrows</td></tr>
//               : escrows.map((e:any)=>{
//                 const id=e._id||e.id;
//                 const s=(e.status||"").toLowerCase();
//                 const isHolding=["holding","pending"].includes(s);
//                 return (
//                   <tr key={id}>
//                     <td className="pg-td"><span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-8)}</span></td>
//                     <td className="pg-td"><span style={{ fontSize:13 }}>{e.deal?.title||e.dealId?.slice?.(-6)||"—"}</span></td>
//                     <td className="pg-td"><span style={{ fontWeight:600 }}>{e.brand?.name||e.brandName||"—"}</span></td>
//                     <td className="pg-td"><span style={{ color:"#a855f7" }}>{e.influencer?.name||e.influencerName||"—"}</span></td>
//                     <td className="pg-td"><span style={{ fontFamily:"monospace",color:"#f5a623",fontWeight:600 }}>{e.amount!=null?`₹${Number(e.amount).toLocaleString("en-IN")}`:"—"}</span></td>
//                     <td className="pg-td"><span className="badge" style={{ background:isHolding?"rgba(245,166,35,0.12)":s==="released"?"rgba(0,214,143,0.12)":"rgba(255,71,87,0.12)",color:isHolding?"#f5a623":s==="released"?"#00d68f":"#ff4757",border:`1px solid ${isHolding?"rgba(245,166,35,0.25)":s==="released"?"rgba(0,214,143,0.25)":"rgba(255,71,87,0.25)"}` }}>{e.status||"—"}</span></td>
//                     <td className="pg-td">
//                       {isHolding && (
//                         <div style={{ display:"flex",gap:5 }}>
//                           <button className="pg-btn" disabled={acting===id} onClick={()=>handleRelease(id)} style={{ color:"#00d68f",borderColor:"rgba(0,214,143,0.3)" }}>{acting===id?"...":"Release"}</button>
//                           <button className="pg-btn" disabled={acting===id} onClick={()=>handleRefund(id)} style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}>{acting===id?"...":"Refund"}</button>
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }