"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://api.collabzy.in/api/admin";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  return res.json();
}

async function apiAction(path: string, method = "PATCH", body?: any) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  return res.json();
}

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats]             = useState<any>(null);
  const [revenue, setRevenue]         = useState<any[]>([]);
  const [users, setUsers]             = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [brands, setBrands]           = useState<any[]>([]);
  const [campaigns, setCampaigns]     = useState<any[]>([]);
  const [deals, setDeals]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    async function load() {
      try {
        const [s, r, u, inf, b, c, d] = await Promise.all([
          apiFetch("/dashboard"),
          apiFetch("/revenue"),
          apiFetch("/users"),
          apiFetch("/influencers"),
          apiFetch("/brand"),
          apiFetch("/campaigns"),
          apiFetch("/deals"),
        ]);
        setStats(s?.stats ?? s);
        setRevenue(Array.isArray(r) ? r : r?.data ?? []);
        setUsers(Array.isArray(u) ? u : u?.data ?? u?.users ?? []);
        setInfluencers(Array.isArray(inf) ? inf : inf?.data ?? inf?.influencers ?? []);
        setBrands(Array.isArray(b) ? b : b?.data ?? b?.brands ?? []);
        setCampaigns(Array.isArray(c) ? c : c?.data ?? c?.campaigns ?? []);
        setDeals(Array.isArray(d) ? d : d?.data ?? d?.deals ?? []);
      } catch (e: any) {
        if (e.message === "UNAUTHORIZED") { router.push("/login"); return; }
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleBan(id: string, isBanned: boolean) {
    try {
      await apiAction(`/users/${id}/ban`, "PATCH", { banned: !isBanned });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned: !isBanned } : u));
    } catch { setError("Ban action failed"); }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    try {
      await apiAction(`/users/${id}`, "DELETE");
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch { setError("Delete failed"); }
  }

  async function handlePauseCampaign(id: string) {
    try {
      await apiAction(`/campaigns/${id}/pause`, "PATCH");
      setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status: "paused" } : c));
    } catch { setError("Pause failed"); }
  }

  async function handleDeleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await apiAction(`/campaigns/${id}`, "DELETE");
      setCampaigns(prev => prev.filter(c => c._id !== id));
    } catch { setError("Delete failed"); }
  }

  const inr    = (n: any)  => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
  const fmt    = (v: any)  => v ?? "—";
  const dateStr = (v: any) => v ? new Date(v).toLocaleDateString("en-IN") : "—";

  const thStyle: React.CSSProperties = {
    textAlign: "left", padding: "10px 14px", fontSize: 11, color: "#4a5568",
    textTransform: "uppercase", letterSpacing: "1px",
    borderBottom: "1px solid rgba(79,110,247,0.1)",
  };
  const tdStyle: React.CSSProperties = { padding: "11px 14px", color: "#8892b0", fontSize: 13, verticalAlign: "middle" };
  const trStyle: React.CSSProperties = { borderBottom: "1px solid rgba(79,110,247,0.05)" };

  const badge = (label: string, color: string) => (
    <span style={{ background: `${color}22`, color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase" as const }}>{label}</span>
  );
  const btn = (label: string, color: string, onClick: () => void) => (
    <button onClick={onClick} style={{ background: `${color}18`, color, border: `1px solid ${color}44`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, marginRight: 6 }}>{label}</button>
  );
  const cardStyle: React.CSSProperties = {
    background: "#141b30", border: "1px solid rgba(79,110,247,0.15)", borderRadius: 12, padding: 20, marginBottom: 20,
  };
  const sectionTitle = (title: string, count: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf6", margin: 0 }}>{title}</h2>
      <span style={{ background: "rgba(79,110,247,0.18)", color: "#4f6ef7", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>{count}</span>
    </div>
  );

  const statCards = [
    { label: "Total Users",       key: "users",        icon: "👥", color: "#4f6ef7" },
    { label: "Total Influencers", key: "influencers",  icon: "✨", color: "#a855f7", value: influencers.length },
    { label: "Total Brands",      key: "brands",       icon: "🏢", color: "#00d4ff", value: brands.length },
    { label: "Active Campaigns",  key: "campaigns",    icon: "📣", color: "#00d68f" },
    { label: "Total Deals",       key: "deals",        icon: "🤝", color: "#00d68f" },
    { label: "Total Revenue",     key: "revenue",      icon: "💰", color: "#f5a623", prefix: "₹" },
    { label: "Deliverables",      key: "deliverables", icon: "📦", color: "#00d4ff" },
    { label: "Open Disputes",     key: "openDisputes", icon: "⚠",  color: "#ff4757" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: "#4a5568", fontSize: 14 }}>Loading dashboard...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 10, padding: "16px 20px", color: "#ff4757" }}>⚠ {error}</div>
    </div>
  );

  return (
    <div style={{ padding: 24, animation: "fadeIn 0.3s ease" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .stat-card { background:#141b30; border:1px solid rgba(79,110,247,0.15); border-radius:12px; padding:18px 20px; transition:all 0.2s; cursor:default; position:relative; overflow:hidden; }
        .stat-card:hover { border-color:rgba(79,110,247,0.35); box-shadow:0 0 20px rgba(79,110,247,0.15); }
        tr:hover td { background: rgba(79,110,247,0.03); }
        button:hover { opacity: 0.8; }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Dashboard Overview</h1>
        <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>Welcome back, Admin</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {statCards.map((s) => (
          <div key={s.key} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#e8eaf6", fontFamily: "monospace" }}>
              {(s as any).value != null ? Number((s as any).value).toLocaleString("en-IN") : stats?.[s.key] != null ? `${(s as any).prefix ?? ""}${Number(stats[s.key]).toLocaleString("en-IN")}` : "—"}
            </div>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: 2, marginTop: 10, opacity: 0.5 }} />
          </div>
        ))}
      </div>

      {/* Revenue Table */}
      {revenue.length > 0 && (
        <div style={cardStyle}>
          {sectionTitle("Revenue by Month", revenue.length)}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Month","Revenue","Campaigns"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {revenue.map((r: any, i: number) => (
                <tr key={i} style={trStyle}>
                  <td style={tdStyle}>{r.month || r._id || "—"}</td>
                  <td style={{ ...tdStyle, color: "#f5a623", fontFamily: "monospace", fontWeight: 600 }}>{inr(r.revenue)}</td>
                  <td style={{ ...tdStyle, color: "#4f6ef7", fontFamily: "monospace" }}>{fmt(r.campaigns)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Table */}
      <div style={cardStyle}>
        {sectionTitle("Users", users.length)}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Name","Email","Role","Status","Joined","Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {users.length === 0
                ? <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center" }}>No users found</td></tr>
                : users.map((u: any) => (
                  <tr key={u._id} style={trStyle}>
                    <td style={{ ...tdStyle, color: "#e8eaf6", fontWeight: 500 }}>{fmt(u.name || u.fullName)}</td>
                    <td style={tdStyle}>{fmt(u.email)}</td>
                    <td style={tdStyle}>{badge(u.role ?? "user", u.role === "admin" ? "#ff4757" : u.role === "influencer" ? "#a855f7" : "#4f6ef7")}</td>
                    <td style={tdStyle}>{badge(u.isBanned ? "Banned" : "Active", u.isBanned ? "#ff4757" : "#00d68f")}</td>
                    <td style={tdStyle}>{dateStr(u.createdAt)}</td>
                    <td style={tdStyle}>
                      {btn(u.isBanned ? "Unban" : "Ban", u.isBanned ? "#00d68f" : "#f5a623", () => handleBan(u._id, u.isBanned))}
                      {btn("Delete", "#ff4757", () => handleDeleteUser(u._id))}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Influencers Table */}
      <div style={cardStyle}>
        {sectionTitle("Influencers", influencers.length)}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Name","Email","Niche","Followers","Rating","Joined"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {influencers.length === 0
                ? <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center" }}>No influencers found</td></tr>
                : influencers.map((inf: any, i: number) => (
                  <tr key={inf._id ?? i} style={trStyle}>
                    <td style={{ ...tdStyle, color: "#e8eaf6", fontWeight: 500 }}>{fmt(inf.name || inf.fullName || inf.user?.name)}</td>
                    <td style={tdStyle}>{fmt(inf.email || inf.user?.email)}</td>
                    <td style={tdStyle}>{fmt(inf.niche)}</td>
                    <td style={{ ...tdStyle, color: "#a855f7", fontFamily: "monospace" }}>{fmt(inf.followers)}</td>
                    <td style={{ ...tdStyle, color: "#f5a623" }}>{inf.rating != null ? `⭐ ${inf.rating}` : "—"}</td>
                    <td style={tdStyle}>{dateStr(inf.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brands Table */}
      <div style={cardStyle}>
        {sectionTitle("Brands", brands.length)}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Brand Name","Email","Industry","Website","Joined"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {brands.length === 0
                ? <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center" }}>No brands found</td></tr>
                : brands.map((b: any, i: number) => (
                  <tr key={b._id ?? i} style={trStyle}>
                    <td style={{ ...tdStyle, color: "#e8eaf6", fontWeight: 500 }}>{fmt(b.brandName || b.name || b.user?.name)}</td>
                    <td style={tdStyle}>{fmt(b.email || b.user?.email)}</td>
                    <td style={tdStyle}>{fmt(b.industry)}</td>
                    <td style={tdStyle}>
                      {b.website ? <a href={b.website} target="_blank" rel="noreferrer" style={{ color: "#4f6ef7", textDecoration: "none" }}>🔗 Visit</a> : "—"}
                    </td>
                    <td style={tdStyle}>{dateStr(b.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns Table */}
      <div style={cardStyle}>
        {sectionTitle("Campaigns", campaigns.length)}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Title","Brand","Budget","Status","Created","Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {campaigns.length === 0
                ? <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center" }}>No campaigns found</td></tr>
                : campaigns.map((c: any) => (
                  <tr key={c._id} style={trStyle}>
                    <td style={{ ...tdStyle, color: "#e8eaf6", fontWeight: 500 }}>{fmt(c.title)}</td>
                    <td style={tdStyle}>{fmt(c.brand?.name || c.brandName)}</td>
                    <td style={{ ...tdStyle, color: "#f5a623", fontFamily: "monospace" }}>{inr(c.budget)}</td>
                    <td style={tdStyle}>{badge(c.status ?? "active", c.status === "paused" ? "#f5a623" : c.status === "completed" ? "#00d68f" : "#4f6ef7")}</td>
                    <td style={tdStyle}>{dateStr(c.createdAt)}</td>
                    <td style={tdStyle}>
                      {btn("Pause", "#f5a623", () => handlePauseCampaign(c._id))}
                      {btn("Delete", "#ff4757", () => handleDeleteCampaign(c._id))}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deals Table */}
      <div style={cardStyle}>
        {sectionTitle("Deals", deals.length)}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Deal ID","Brand","Influencer","Amount","Status","Created"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {deals.length === 0
                ? <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center" }}>No deals found</td></tr>
                : deals.map((d: any, i: number) => (
                  <tr key={d._id ?? i} style={trStyle}>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{d._id?.slice(-8) ?? "—"}</td>
                    <td style={tdStyle}>{fmt(d.brand?.name || d.brandName)}</td>
                    <td style={tdStyle}>{fmt(d.influencer?.name || d.influencerName)}</td>
                    <td style={{ ...tdStyle, color: "#f5a623", fontFamily: "monospace" }}>{inr(d.amount)}</td>
                    <td style={tdStyle}>{badge(d.status ?? "pending", d.status === "completed" ? "#00d68f" : d.status === "cancelled" ? "#ff4757" : "#4f6ef7")}</td>
                    <td style={tdStyle}>{dateStr(d.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



// "use client";
// import { useEffect, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";

// const API = "https://api.collabzy.in/api/admin";

// function getToken() {
//   return typeof window !== "undefined" ? localStorage.getItem("token") : null;
// }

// async function apiFetch(path: string) {
//   const token = getToken();
//   const res = await fetch(`${API}${path}`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   if (res.status === 401) throw new Error("UNAUTHORIZED");
//   return res.json();
// }

// // ─── Types ───────────────────────────────────────────────────────────────────
// type Stats = {
//   totalUsers?: number; totalInfluencers?: number; totalBrands?: number;
//   activeCampaigns?: number; totalDeals?: number; totalRevenue?: number;
//   pendingEscrows?: number; openDisputes?: number;
// };

// // ─── Sub-components ──────────────────────────────────────────────────────────
// function Spinner() {
//   return (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
//       <div style={{ width: 36, height: 36, border: "3px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
//       <span style={{ color: "#6b7280", fontSize: 14, fontFamily: "monospace" }}>loading...</span>
//     </div>
//   );
// }

// function ErrorBox({ msg }: { msg: string }) {
//   return (
//     <div style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)", borderRadius: 10, padding: "14px 18px", color: "#ff4757", fontSize: 13, marginBottom: 16 }}>
//       ⚠ {msg}
//     </div>
//   );
// }

// function SectionHeader({ title, count }: { title: string; count?: number }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
//       <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf6", margin: 0 }}>{title}</h2>
//       {count !== undefined && (
//         <span style={{ background: "rgba(79,110,247,0.18)", color: "#4f6ef7", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>{count}</span>
//       )}
//     </div>
//   );
// }

// function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
//   return (
//     <div style={{ overflowX: "auto" }}>
//       <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//         <thead>
//           <tr>
//             {headers.map(h => (
//               <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(79,110,247,0.1)", whiteSpace: "nowrap" }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.length === 0 ? (
//             <tr><td colSpan={headers.length} style={{ padding: "24px 14px", color: "#4a5568", textAlign: "center", fontSize: 13 }}>No data found</td></tr>
//           ) : rows.map((row, i) => (
//             <tr key={i} style={{ borderBottom: "1px solid rgba(79,110,247,0.05)" }}>
//               {row.map((cell, j) => (
//                 <td key={j} style={{ padding: "11px 14px", color: "#8892b0", verticalAlign: "middle" }}>{cell}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function Badge({ label, color }: { label: string; color: string }) {
//   return (
//     <span style={{ background: `${color}22`, color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
//       {label}
//     </span>
//   );
// }

// function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
//   return (
//     <div style={{ background: "#141b30", border: "1px solid rgba(79,110,247,0.13)", borderRadius: 12, padding: 20, marginBottom: 18, ...style }}>
//       {children}
//     </div>
//   );
// }

// // ─── Nav tabs ─────────────────────────────────────────────────────────────────
// const TABS = [
//   { id: "overview",      label: "Overview",      icon: "📊" },
//   { id: "users",         label: "Users",         icon: "👥" },
//   { id: "influencers",   label: "Influencers",   icon: "✨" },
//   { id: "brands",        label: "Brands",        icon: "🏢" },
//   { id: "campaigns",     label: "Campaigns",     icon: "📣" },
//   { id: "deals",         label: "Deals",         icon: "🤝" },
//   { id: "applications",  label: "Applications",  icon: "📋" },
//   { id: "escrows",       label: "Escrows",       icon: "🔒" },
//   { id: "deliverables",  label: "Deliverables",  icon: "📦" },
//   { id: "transactions",  label: "Transactions",  icon: "💳" },
//   { id: "revenue",       label: "Revenue",       icon: "💰" },
//   { id: "disputes",      label: "Disputes",      icon: "⚠" },
//   { id: "reviews",       label: "Reviews",       icon: "⭐" },
// ];

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function AdminDashboard() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState("overview");
//   const [stats, setStats] = useState<Stats | null>(null);
//   const [revenue, setRevenue] = useState<any[]>([]);
//   const [users, setUsers] = useState<any[]>([]);
//   const [influencers, setInfluencers] = useState<any[]>([]);
//   const [brands, setBrands] = useState<any[]>([]);
//   const [campaigns, setCampaigns] = useState<any[]>([]);
//   const [deals, setDeals] = useState<any[]>([]);
//   const [applications, setApplications] = useState<any[]>([]);
//   const [escrows, setEscrows] = useState<any[]>([]);
//   const [deliverables, setDeliverables] = useState<any[]>([]);
//   const [transactions, setTransactions] = useState<any[]>([]);
//   const [disputes, setDisputes] = useState<any[]>([]);
//   const [reviews, setReviews] = useState<any[]>([]);
//   const [loadingMain, setLoadingMain] = useState(true);
//   const [tabLoading, setTabLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [actionMsg, setActionMsg] = useState("");
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   // ── Initial load ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     const token = getToken();
//     if (!token) { router.push("/login"); return; }
//     Promise.all([
//       apiFetch("/dashboard"),
//       apiFetch("/revenue"),
//     ])
//       .then(([s, r]) => {
//         setStats(s);
//         setRevenue(Array.isArray(r) ? r : r?.data ?? []);
//       })
//       .catch(e => {
//         if (e.message === "UNAUTHORIZED") router.push("/login");
//         else setError("Failed to load dashboard");
//       })
//       .finally(() => setLoadingMain(false));
//   }, []);

//   // ── Tab data loader ───────────────────────────────────────────────────────
//   const loadTab = useCallback(async (tab: string) => {
//     setActiveTab(tab);
//     if (tab === "overview" || tab === "revenue") return;
//     setTabLoading(true);
//     try {
//       const pathMap: Record<string, string> = {
//         users: "/users",
//         influencers: "/influencers",
//         brands: "/brand",
//         campaigns: "/campaigns",
//         deals: "/deals",
//         applications: "/applications",
//         escrows: "/escrows",
//         deliverables: "/deliverables",
//         transactions: "/transactions",
//         disputes: "/disputes",
//         reviews: "/reviews",
//       };
//       const data = await apiFetch(pathMap[tab]);
//       const list = Array.isArray(data) ? data : data?.data ?? data?.users ?? data?.campaigns ?? data?.deals ?? data?.escrows ?? data?.transactions ?? data?.disputes ?? data?.reviews ?? [];
//       if (tab === "users") setUsers(list);
//       else if (tab === "influencers") setInfluencers(list);
//       else if (tab === "brands") setBrands(list);
//       else if (tab === "campaigns") setCampaigns(list);
//       else if (tab === "deals") setDeals(list);
//       else if (tab === "applications") setApplications(list);
//       else if (tab === "escrows") setEscrows(list);
//       else if (tab === "deliverables") setDeliverables(list);
//       else if (tab === "transactions") setTransactions(list);
//       else if (tab === "disputes") setDisputes(list);
//       else if (tab === "reviews") setReviews(list);
//     } catch (e: any) {
//       if (e.message === "UNAUTHORIZED") router.push("/login");
//       setError("Failed to load data");
//     } finally {
//       setTabLoading(false);
//     }
//   }, []);

//   // ── Actions ───────────────────────────────────────────────────────────────
//   async function banUser(id: string, banned: boolean) {
//     try {
//       await fetch(`${API}/users/${id}/ban`, {
//         method: "PATCH",
//         headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
//         body: JSON.stringify({ banned: !banned }),
//       });
//       setActionMsg(`User ${banned ? "unbanned" : "banned"} successfully`);
//       loadTab("users");
//     } catch { setActionMsg("Action failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   async function deleteUser(id: string) {
//     if (!confirm("Delete this user?")) return;
//     try {
//       await fetch(`${API}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
//       setActionMsg("User deleted");
//       loadTab("users");
//     } catch { setActionMsg("Delete failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   async function deleteCampaign(id: string) {
//     if (!confirm("Delete this campaign?")) return;
//     try {
//       await fetch(`${API}/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
//       setActionMsg("Campaign deleted");
//       loadTab("campaigns");
//     } catch { setActionMsg("Delete failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   async function pauseCampaign(id: string) {
//     try {
//       await fetch(`${API}/campaigns/${id}/pause`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } });
//       setActionMsg("Campaign paused");
//       loadTab("campaigns");
//     } catch { setActionMsg("Action failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   async function deleteReview(id: string) {
//     if (!confirm("Delete this review?")) return;
//     try {
//       await fetch(`${API}/reviews/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
//       setActionMsg("Review deleted");
//       loadTab("reviews");
//     } catch { setActionMsg("Delete failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   async function refundEscrow(id: string) {
//     if (!confirm("Refund this escrow?")) return;
//     try {
//       await fetch(`${API}/refund/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } });
//       setActionMsg("Escrow refunded");
//       loadTab("escrows");
//     } catch { setActionMsg("Action failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   async function releasePayment(id: string) {
//     if (!confirm("Release payment?")) return;
//     try {
//       await fetch(`${API}/escrows/${id}/release`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } });
//       setActionMsg("Payment released");
//       loadTab("escrows");
//     } catch { setActionMsg("Action failed"); }
//     setTimeout(() => setActionMsg(""), 3000);
//   }

//   // ── Helpers ───────────────────────────────────────────────────────────────
//   const inr = (n: any) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
//   const fmt = (v: any) => v ?? "—";
//   const dateStr = (v: any) => v ? new Date(v).toLocaleDateString("en-IN") : "—";
//   const btnStyle = (color: string): React.CSSProperties => ({
//     background: `${color}18`, color, border: `1px solid ${color}44`, borderRadius: 6,
//     padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" as const,
//   });

//   // ── Stat cards config ─────────────────────────────────────────────────────
//   const statCards = [
//     { label: "Total Users",       key: "totalUsers",       icon: "👥", color: "#4f6ef7" },
//     { label: "Total Influencers", key: "totalInfluencers", icon: "✨", color: "#a855f7" },
//     { label: "Total Brands",      key: "totalBrands",      icon: "🏢", color: "#00d4ff" },
//     { label: "Active Campaigns",  key: "activeCampaigns",  icon: "📣", color: "#00d68f" },
//     { label: "Total Deals",       key: "totalDeals",       icon: "🤝", color: "#00d68f" },
//     { label: "Total Revenue",     key: "totalRevenue",     icon: "💰", color: "#f5a623", prefix: "₹" },
//     { label: "Pending Escrows",   key: "pendingEscrows",   icon: "⏳", color: "#f5a623" },
//     { label: "Open Disputes",     key: "openDisputes",     icon: "⚠", color: "#ff4757" },
//   ];

//   if (loadingMain) return (
//     <>
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       <Spinner />
//     </>
//   );

//   // ── Render tab content ────────────────────────────────────────────────────
//   function renderTabContent() {
//     if (tabLoading) return <Spinner />;
//     if (activeTab === "overview") return renderOverview();
//     if (activeTab === "revenue") return renderRevenue();
//     if (activeTab === "users") return renderUsers();
//     if (activeTab === "influencers") return renderInfluencers();
//     if (activeTab === "brands") return renderBrands();
//     if (activeTab === "campaigns") return renderCampaigns();
//     if (activeTab === "deals") return renderDeals();
//     if (activeTab === "applications") return renderApplications();
//     if (activeTab === "escrows") return renderEscrows();
//     if (activeTab === "deliverables") return renderDeliverables();
//     if (activeTab === "transactions") return renderTransactions();
//     if (activeTab === "disputes") return renderDisputes();
//     if (activeTab === "reviews") return renderReviews();
//     return null;
//   }

//   function renderOverview() {
//     return (
//       <>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
//           {statCards.map((s) => (
//             <div key={s.key} className="stat-card" onClick={() => {
//               const tabMap: Record<string, string> = {
//                 totalUsers: "users", totalInfluencers: "influencers", totalBrands: "brands",
//                 activeCampaigns: "campaigns", totalDeals: "deals", totalRevenue: "revenue",
//                 pendingEscrows: "escrows", openDisputes: "disputes",
//               };
//               if (tabMap[s.key]) loadTab(tabMap[s.key]);
//             }} style={{ cursor: "pointer" }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//                 <span style={{ fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{s.label}</span>
//                 <span style={{ fontSize: 18 }}>{s.icon}</span>
//               </div>
//               <div style={{ fontSize: 24, fontWeight: 700, color: "#e8eaf6", fontFamily: "monospace" }}>
//                 {stats?.[s.key as keyof Stats] != null ? `${s.prefix ?? ""}${Number(stats![s.key as keyof Stats]).toLocaleString("en-IN")}` : "—"}
//               </div>
//               <div style={{ height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: 2, marginTop: 10, opacity: 0.5 }} />
//             </div>
//           ))}
//         </div>
//         {revenue.length > 0 && renderRevenue()}
//       </>
//     );
//   }

//   function renderRevenue() {
//     return (
//       <Card>
//         <SectionHeader title="Revenue by Month" count={revenue.length} />
//         <Table
//           headers={["Month", "Revenue", "Campaigns"]}
//           rows={revenue.map((r: any) => [
//             <span style={{ color: "#e8eaf6" }}>{r.month || r._id || "—"}</span>,
//             <span style={{ color: "#f5a623", fontFamily: "monospace", fontWeight: 600 }}>{inr(r.revenue)}</span>,
//             <span style={{ color: "#4f6ef7", fontFamily: "monospace" }}>{fmt(r.campaigns)}</span>,
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderUsers() {
//     return (
//       <Card>
//         <SectionHeader title="All Users" count={users.length} />
//         <Table
//           headers={["Name", "Email", "Role", "Status", "Joined", "Actions"]}
//           rows={users.map((u: any) => [
//             <span style={{ color: "#e8eaf6", fontWeight: 500 }}>{fmt(u.name || u.fullName)}</span>,
//             <span>{fmt(u.email)}</span>,
//             <Badge label={u.role ?? "user"} color={u.role === "admin" ? "#ff4757" : u.role === "influencer" ? "#a855f7" : "#4f6ef7"} />,
//             <Badge label={u.isBanned ? "Banned" : "Active"} color={u.isBanned ? "#ff4757" : "#00d68f"} />,
//             dateStr(u.createdAt),
//             <div style={{ display: "flex", gap: 6 }}>
//               <button style={btnStyle(u.isBanned ? "#00d68f" : "#f5a623")} onClick={() => banUser(u._id, u.isBanned)}>{u.isBanned ? "Unban" : "Ban"}</button>
//               <button style={btnStyle("#ff4757")} onClick={() => deleteUser(u._id)}>Delete</button>
//             </div>,
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderInfluencers() {
//     return (
//       <Card>
//         <SectionHeader title="Influencers" count={influencers.length} />
//         <Table
//           headers={["Name", "Email", "Niche", "Followers", "Rating", "Joined"]}
//           rows={influencers.map((inf: any) => [
//             <span style={{ color: "#e8eaf6", fontWeight: 500 }}>{fmt(inf.name || inf.fullName || inf.user?.name)}</span>,
//             fmt(inf.email || inf.user?.email),
//             fmt(inf.niche),
//             <span style={{ fontFamily: "monospace", color: "#a855f7" }}>{fmt(inf.followers)}</span>,
//             <span style={{ color: "#f5a623" }}>{inf.rating != null ? `⭐ ${inf.rating}` : "—"}</span>,
//             dateStr(inf.createdAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderBrands() {
//     return (
//       <Card>
//         <SectionHeader title="Brands" count={brands.length} />
//         <Table
//           headers={["Brand Name", "Email", "Industry", "Website", "Joined"]}
//           rows={brands.map((b: any) => [
//             <span style={{ color: "#e8eaf6", fontWeight: 500 }}>{fmt(b.brandName || b.name || b.user?.name)}</span>,
//             fmt(b.email || b.user?.email),
//             fmt(b.industry),
//             b.website ? <a href={b.website} target="_blank" rel="noreferrer" style={{ color: "#4f6ef7", textDecoration: "none" }}>🔗 Visit</a> : "—",
//             dateStr(b.createdAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderCampaigns() {
//     return (
//       <Card>
//         <SectionHeader title="Campaigns" count={campaigns.length} />
//         <Table
//           headers={["Title", "Brand", "Budget", "Status", "Created", "Actions"]}
//           rows={campaigns.map((c: any) => [
//             <span style={{ color: "#e8eaf6", fontWeight: 500 }}>{fmt(c.title)}</span>,
//             fmt(c.brand?.name || c.brandName),
//             <span style={{ fontFamily: "monospace", color: "#f5a623" }}>{inr(c.budget)}</span>,
//             <Badge label={c.status ?? "active"} color={c.status === "paused" ? "#f5a623" : c.status === "completed" ? "#00d68f" : "#4f6ef7"} />,
//             dateStr(c.createdAt),
//             <div style={{ display: "flex", gap: 6 }}>
//               <button style={btnStyle("#f5a623")} onClick={() => pauseCampaign(c._id)}>Pause</button>
//               <button style={btnStyle("#ff4757")} onClick={() => deleteCampaign(c._id)}>Delete</button>
//             </div>,
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderDeals() {
//     return (
//       <Card>
//         <SectionHeader title="Deals" count={deals.length} />
//         <Table
//           headers={["Deal ID", "Brand", "Influencer", "Amount", "Status", "Created"]}
//           rows={deals.map((d: any) => [
//             <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{d._id?.slice(-8)}</span>,
//             fmt(d.brand?.name || d.brandName),
//             fmt(d.influencer?.name || d.influencerName),
//             <span style={{ fontFamily: "monospace", color: "#f5a623" }}>{inr(d.amount)}</span>,
//             <Badge label={d.status ?? "pending"} color={d.status === "completed" ? "#00d68f" : d.status === "cancelled" ? "#ff4757" : "#4f6ef7"} />,
//             dateStr(d.createdAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderApplications() {
//     return (
//       <Card>
//         <SectionHeader title="Applications" count={applications.length} />
//         <Table
//           headers={["Campaign", "Influencer", "Status", "Proposed Rate", "Applied"]}
//           rows={applications.map((a: any) => [
//             fmt(a.campaign?.title || a.campaignTitle),
//             fmt(a.influencer?.name || a.influencerName),
//             <Badge label={a.status ?? "pending"} color={a.status === "accepted" ? "#00d68f" : a.status === "rejected" ? "#ff4757" : "#f5a623"} />,
//             <span style={{ fontFamily: "monospace", color: "#f5a623" }}>{inr(a.proposedRate)}</span>,
//             dateStr(a.createdAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderEscrows() {
//     return (
//       <Card>
//         <SectionHeader title="Escrows" count={escrows.length} />
//         <Table
//           headers={["Escrow ID", "Deal", "Amount", "Status", "Actions"]}
//           rows={escrows.map((e: any) => [
//             <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{e._id?.slice(-8)}</span>,
//             fmt(e.deal?._id?.slice(-8) || e.dealId?.slice(-8)),
//             <span style={{ fontFamily: "monospace", color: "#f5a623" }}>{inr(e.amount)}</span>,
//             <Badge label={e.status ?? "pending"} color={e.status === "released" ? "#00d68f" : e.status === "refunded" ? "#a855f7" : "#f5a623"} />,
//             <div style={{ display: "flex", gap: 6 }}>
//               <button style={btnStyle("#a855f7")} onClick={() => refundEscrow(e._id)}>Refund</button>
//               <button style={btnStyle("#00d68f")} onClick={() => releasePayment(e._id)}>Release</button>
//             </div>,
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderDeliverables() {
//     return (
//       <Card>
//         <SectionHeader title="Deliverables" count={deliverables.length} />
//         <Table
//           headers={["Title", "Deal", "Type", "Status", "Due Date", "Submitted"]}
//           rows={deliverables.map((d: any) => [
//             <span style={{ color: "#e8eaf6" }}>{fmt(d.title)}</span>,
//             fmt(d.deal?._id?.slice(-8) || d.dealId?.slice(-8)),
//             fmt(d.type),
//             <Badge label={d.status ?? "pending"} color={d.status === "approved" ? "#00d68f" : d.status === "rejected" ? "#ff4757" : "#f5a623"} />,
//             dateStr(d.dueDate),
//             dateStr(d.submittedAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderTransactions() {
//     return (
//       <Card>
//         <SectionHeader title="Transactions" count={transactions.length} />
//         <Table
//           headers={["Txn ID", "Type", "Amount", "From", "To", "Status", "Date"]}
//           rows={transactions.map((t: any) => [
//             <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{t._id?.slice(-8)}</span>,
//             fmt(t.type),
//             <span style={{ fontFamily: "monospace", color: "#f5a623" }}>{inr(t.amount)}</span>,
//             fmt(t.from?.name || t.fromUser),
//             fmt(t.to?.name || t.toUser),
//             <Badge label={t.status ?? "completed"} color={t.status === "failed" ? "#ff4757" : "#00d68f"} />,
//             dateStr(t.createdAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderDisputes() {
//     return (
//       <Card>
//         <SectionHeader title="Disputes" count={disputes.length} />
//         <Table
//           headers={["Dispute ID", "Deal", "Raised By", "Reason", "Status", "Opened"]}
//           rows={disputes.map((d: any) => [
//             <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{d._id?.slice(-8)}</span>,
//             fmt(d.deal?._id?.slice(-8) || d.dealId?.slice(-8)),
//             fmt(d.raisedBy?.name || d.raisedByName),
//             <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{fmt(d.reason)}</span>,
//             <Badge label={d.status ?? "open"} color={d.status === "resolved" ? "#00d68f" : d.status === "open" ? "#ff4757" : "#f5a623"} />,
//             dateStr(d.createdAt),
//           ])}
//         />
//       </Card>
//     );
//   }

//   function renderReviews() {
//     return (
//       <Card>
//         <SectionHeader title="Reviews" count={reviews.length} />
//         <Table
//           headers={["Reviewer", "Target", "Rating", "Comment", "Date", "Actions"]}
//           rows={reviews.map((r: any) => [
//             fmt(r.reviewer?.name || r.reviewerName),
//             fmt(r.target?.name || r.targetName),
//             <span style={{ color: "#f5a623" }}>{"⭐".repeat(Math.min(r.rating ?? 0, 5))}</span>,
//             <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{fmt(r.comment)}</span>,
//             dateStr(r.createdAt),
//             <button style={btnStyle("#ff4757")} onClick={() => deleteReview(r._id)}>Delete</button>,
//           ])}
//         />
//       </Card>
//     );
//   }

//   // ── Layout ────────────────────────────────────────────────────────────────
//   return (
//     <div style={{ display: "flex", minHeight: "100vh", background: "#0d1117", color: "#e8eaf6" }}>
//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
//         .stat-card { background:#141b30; border:1px solid rgba(79,110,247,0.13); border-radius:12px; padding:16px 18px; transition:all 0.2s; }
//         .stat-card:hover { border-color:rgba(79,110,247,0.35); box-shadow:0 0 18px rgba(79,110,247,0.12); transform:translateY(-1px); }
//         .nav-tab { display:flex; align-items:center; gap:9px; padding:9px 14px; border-radius:8px; cursor:pointer; font-size:13px; transition:all 0.15s; color:#4a5568; font-weight:500; border:none; background:none; width:100%; text-align:left; }
//         .nav-tab:hover { background:rgba(79,110,247,0.08); color:#8892b0; }
//         .nav-tab.active { background:rgba(79,110,247,0.15); color:#4f6ef7; }
//         tr:hover td { background:rgba(79,110,247,0.03); }
//         button:hover { opacity:0.85; }
//       `}</style>

//       {/* Sidebar */}
//       <div style={{ width: sidebarOpen ? 220 : 64, background: "#0f1623", borderRight: "1px solid rgba(79,110,247,0.1)", transition: "width 0.2s", flexShrink: 0, display: "flex", flexDirection: "column" }}>
//         <div style={{ padding: "18px 16px", borderBottom: "1px solid rgba(79,110,247,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//           {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf6", letterSpacing: "0.5px" }}>⚡ Admin</span>}
//           <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "none", border: "none", color: "#4a5568", cursor: "pointer", fontSize: 16, padding: 4 }}>
//             {sidebarOpen ? "◀" : "▶"}
//           </button>
//         </div>
//         <nav style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
//           {TABS.map(tab => (
//             <button
//               key={tab.id}
//               className={`nav-tab${activeTab === tab.id ? " active" : ""}`}
//               onClick={() => loadTab(tab.id)}
//               title={!sidebarOpen ? tab.label : undefined}
//             >
//               <span style={{ fontSize: 16, flexShrink: 0 }}>{tab.icon}</span>
//               {sidebarOpen && <span>{tab.label}</span>}
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Main */}
//       <div style={{ flex: 1, overflow: "auto" }}>
//         {/* Topbar */}
//         <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(79,110,247,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f1623", position: "sticky", top: 0, zIndex: 10 }}>
//           <div>
//             <h1 style={{ fontSize: 16, fontWeight: 700, color: "#e8eaf6", margin: 0 }}>
//               {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
//             </h1>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             {actionMsg && (
//               <span style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.3)", color: "#00d68f", fontSize: 12, padding: "4px 12px", borderRadius: 20, animation: "fadeIn 0.2s ease" }}>
//                 ✓ {actionMsg}
//               </span>
//             )}
//             <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4f6ef7, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>A</div>
//           </div>
//         </div>

//         {/* Content */}
//         <div style={{ padding: 24, animation: "fadeIn 0.25s ease" }}>
//           {error && <ErrorBox msg={error} />}
//           {renderTabContent()}
//         </div>
//       </div>
//     </div>
//   );
// }


// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function AdminDashboard() {
//   const router = useRouter();
//   const [stats, setStats] = useState<any>(null);
//   const [revenue, setRevenue] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }

//     async function load() {
//       const token = localStorage.getItem("token");
//       try {
//         const [s, r] = await Promise.all([
//           fetch("https://api.collabzy.in/api/admin/dashboard", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           fetch("https://api.collabzy.in/api/admin/revenue", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//         ]);
//         if (s.status === 401) { router.push("/login"); return; }
//         const statsData   = await s.json();
//         const revenueData = await r.json();
//         setStats(statsData);
//         setRevenue(Array.isArray(revenueData) ? revenueData : revenueData?.data ?? []);
//       } catch {
//         setError("Failed to load dashboard");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   const statCards = [
//     { label: "Total Users",       key: "totalUsers",       icon: "👥", color: "#4f6ef7" },
//     { label: "Total Influencers", key: "totalInfluencers", icon: "✨", color: "#a855f7" },
//     { label: "Total Brands",      key: "totalBrands",      icon: "🏢", color: "#00d4ff" },
//     { label: "Active Campaigns",  key: "activeCampaigns",  icon: "📣", color: "#00d68f" },
//     { label: "Total Deals",       key: "totalDeals",       icon: "🤝", color: "#00d68f" },
//     { label: "Total Revenue",     key: "totalRevenue",     icon: "💰", color: "#f5a623", prefix: "₹" },
//     { label: "Pending Escrows",   key: "pendingEscrows",   icon: "⏳", color: "#f5a623" },
//     { label: "Open Disputes",     key: "openDisputes",     icon: "⚠", color: "#ff4757" },
//   ];

//   if (loading) return (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
//       <div style={{ width: 36, height: 36, border: "3px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
//       <span style={{ color: "#4a5568", fontSize: 14 }}>Loading dashboard...</span>
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   );

//   if (error) return (
//     <div style={{ padding: 24 }}>
//       <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 10, padding: "16px 20px", color: "#ff4757" }}>⚠ {error}</div>
//     </div>
//   );

//   return (
//     <div style={{ padding: 24, animation: "fadeIn 0.3s ease" }}>
//       <style>{`
//         @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
//         @keyframes spin { to { transform: rotate(360deg); } }
//         .stat-card { background:#141b30; border:1px solid rgba(79,110,247,0.15); border-radius:12px; padding:18px 20px; transition:all 0.2s; cursor:default; position:relative; overflow:hidden; }
//         .stat-card:hover { border-color:rgba(79,110,247,0.35); box-shadow:0 0 20px rgba(79,110,247,0.15); }
//       `}</style>

//       <div style={{ marginBottom: 20 }}>
//         <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Dashboard Overview</h1>
//         <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>Welcome back, Admin</p>
//       </div>

//       {/* Stats Grid */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
//         {statCards.map((s) => (
//           <div key={s.key} className="stat-card">
//             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//               <span style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{s.label}</span>
//               <span style={{ fontSize: 20 }}>{s.icon}</span>
//             </div>
//             <div style={{ fontSize: 26, fontWeight: 700, color: "#e8eaf6", fontFamily: "monospace" }}>
//               {stats?.[s.key] != null ? `${s.prefix ?? ""}${Number(stats[s.key]).toLocaleString("en-IN")}` : "—"}
//             </div>
//             <div style={{ height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: 2, marginTop: 10, opacity: 0.5 }} />
//           </div>
//         ))}
//       </div>

//       {/* Revenue Table if no chart library */}
//       {revenue.length > 0 && (
//         <div style={{ background: "#141b30", border: "1px solid rgba(79,110,247,0.15)", borderRadius: 12, padding: 20 }}>
//           <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf6", marginBottom: 16 }}>Revenue by Month</div>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 {["Month", "Revenue", "Campaigns"].map(h => (
//                   <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(79,110,247,0.1)" }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {revenue.map((r: any, i: number) => (
//                 <tr key={i} style={{ borderBottom: "1px solid rgba(79,110,247,0.05)" }}>
//                   <td style={{ padding: "12px 14px", color: "#8892b0", fontSize: 13 }}>{r.month || r._id || "—"}</td>
//                   <td style={{ padding: "12px 14px", color: "#f5a623", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>
//                     {r.revenue != null ? `₹${Number(r.revenue).toLocaleString("en-IN")}` : "—"}
//                   </td>
//                   <td style={{ padding: "12px 14px", color: "#4f6ef7", fontSize: 13, fontFamily: "monospace" }}>{r.campaigns ?? "—"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }



// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function AdminDashboard() {
//   const router = useRouter();
//   const [stats, setStats] = useState<any>(null);
//   const [revenue, setRevenue] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }

//     async function load() {
//       const token = localStorage.getItem("token");
//       try {
//         const [s, r] = await Promise.all([
//           fetch("http://localhost:3001/api/admin/dashboard", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           fetch("http://localhost:3001/api/admin/revenue", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//         ]);
//         if (s.status === 401) { router.push("/login"); return; }
//         const statsData   = await s.json();
//         const revenueData = await r.json();
//         setStats(statsData);
//         setRevenue(Array.isArray(revenueData) ? revenueData : revenueData?.data ?? []);
//       } catch {
//         setError("Failed to load dashboard");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   const statCards = [
//     { label: "Total Users",       key: "totalUsers",       icon: "👥", color: "#4f6ef7" },
//     { label: "Total Influencers", key: "totalInfluencers", icon: "✨", color: "#a855f7" },
//     { label: "Total Brands",      key: "totalBrands",      icon: "🏢", color: "#00d4ff" },
//     { label: "Active Campaigns",  key: "activeCampaigns",  icon: "📣", color: "#00d68f" },
//     { label: "Total Deals",       key: "totalDeals",       icon: "🤝", color: "#00d68f" },
//     { label: "Total Revenue",     key: "totalRevenue",     icon: "💰", color: "#f5a623", prefix: "₹" },
//     { label: "Pending Escrows",   key: "pendingEscrows",   icon: "⏳", color: "#f5a623" },
//     { label: "Open Disputes",     key: "openDisputes",     icon: "⚠", color: "#ff4757" },
//   ];

//   if (loading) return (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
//       <div style={{ width: 36, height: 36, border: "3px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
//       <span style={{ color: "#4a5568", fontSize: 14 }}>Loading dashboard...</span>
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   );

//   if (error) return (
//     <div style={{ padding: 24 }}>
//       <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 10, padding: "16px 20px", color: "#ff4757" }}>⚠ {error}</div>
//     </div>
//   );

//   return (
//     <div style={{ padding: 24, animation: "fadeIn 0.3s ease" }}>
//       <style>{`
//         @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
//         @keyframes spin { to { transform: rotate(360deg); } }
//         .stat-card { background:#141b30; border:1px solid rgba(79,110,247,0.15); border-radius:12px; padding:18px 20px; transition:all 0.2s; cursor:default; position:relative; overflow:hidden; }
//         .stat-card:hover { border-color:rgba(79,110,247,0.35); box-shadow:0 0 20px rgba(79,110,247,0.15); }
//       `}</style>

//       <div style={{ marginBottom: 20 }}>
//         <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Dashboard Overview</h1>
//         <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>Welcome back, Admin</p>
//       </div>

//       {/* Stats Grid */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
//         {statCards.map((s) => (
//           <div key={s.key} className="stat-card">
//             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//               <span style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{s.label}</span>
//               <span style={{ fontSize: 20 }}>{s.icon}</span>
//             </div>
//             <div style={{ fontSize: 26, fontWeight: 700, color: "#e8eaf6", fontFamily: "monospace" }}>
//               {stats?.[s.key] != null ? `${s.prefix ?? ""}${Number(stats[s.key]).toLocaleString("en-IN")}` : "—"}
//             </div>
//             <div style={{ height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: 2, marginTop: 10, opacity: 0.5 }} />
//           </div>
//         ))}
//       </div>

//       {/* Revenue Table if no chart library */}
//       {revenue.length > 0 && (
//         <div style={{ background: "#141b30", border: "1px solid rgba(79,110,247,0.15)", borderRadius: 12, padding: 20 }}>
//           <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf6", marginBottom: 16 }}>Revenue by Month</div>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead>
//               <tr>
//                 {["Month", "Revenue", "Campaigns"].map(h => (
//                   <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(79,110,247,0.1)" }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {revenue.map((r: any, i: number) => (
//                 <tr key={i} style={{ borderBottom: "1px solid rgba(79,110,247,0.05)" }}>
//                   <td style={{ padding: "12px 14px", color: "#8892b0", fontSize: 13 }}>{r.month || r._id || "—"}</td>
//                   <td style={{ padding: "12px 14px", color: "#f5a623", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>
//                     {r.revenue != null ? `₹${Number(r.revenue).toLocaleString("en-IN")}` : "—"}
//                   </td>
//                   <td style={{ padding: "12px 14px", color: "#4f6ef7", fontSize: 13, fontFamily: "monospace" }}>{r.campaigns ?? "—"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }