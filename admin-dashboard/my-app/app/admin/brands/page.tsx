"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";

const S = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
  .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
  .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
  .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
  tr:hover .pg-td{background:rgba(79,110,247,0.03);}
  .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
  .pg-input:focus{border-color:#4f6ef7;}
  .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
  .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
  .modal-overlay{position:fixed;inset:0;background:rgba(5,8,20,0.85);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
  .modal-box{background:#141b30;border:1px solid rgba(79,110,247,0.2);border-radius:16px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;animation:modalIn 0.22s ease;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
  .modal-header{padding:20px 24px 16px;border-bottom:1px solid rgba(79,110,247,0.1);display:flex;align-items:center;justify-content:space-between;}
  .modal-body{padding:24px;}
  .profile-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;font-size:13px;}
  .profile-label{color:#4a5568;min-width:140px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding-top:1px;}
  .profile-val{color:#e8eaf6;flex:1;word-break:break-word;}
  .close-btn{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.25);color:#ff4757;width:28px;height:28px;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
  .section-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6ef7;margin:16px 0 10px;border-left:2px solid #4f6ef7;padding-left:8px;}
  .avatar-big{width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid rgba(79,110,247,0.3);}
  .avatar-placeholder{width:72px;height:72px;border-radius:12px;background:rgba(79,110,247,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;color:#4f6ef7;border:2px solid rgba(79,110,247,0.2);}
`;

export default function AdminBrandsPage() {
  const router = useRouter();
  const [data, setData]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [acting, setActing]         = useState<string | null>(null);
  const [msg, setMsg]               = useState("");
  const [viewBrand, setViewBrand]   = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    try {
      const [brandsRes, usersRes] = await Promise.all([
        fetch(`${BASE}/brand`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (brandsRes.status === 401 || usersRes.status === 401) {
        router.push("/login");
        return;
      }

      const brandsJson = await brandsRes.json();
      const usersJson  = await usersRes.json();

      const brandsArr: any[] = Array.isArray(brandsJson)
        ? brandsJson
        : brandsJson?.brands ?? brandsJson?.data ?? [];

      const usersArr: any[] = Array.isArray(usersJson)
        ? usersJson
        : usersJson?.users ?? usersJson?.data ?? [];

      const userMap = new Map(
        usersArr.map((u: any) => [u._id || u.id, u])
      );

      const validBrands = brandsArr.filter((b: any) => !!(b._id || b.id));
      const brandApiIds = new Set(validBrands.map((b: any) => b._id || b.id));

      const enrichedBrands = validBrands.map((b: any) => {
        const uid = b._id || b.id || b.user?._id || b.user?.id;
        const u = userMap.get(uid);
        return {
          ...b,
          campaignsCreated: b.campaignsCreated ?? u?.campaignsCreated ?? 0,
          createdAt:        b.createdAt        ?? u?.createdAt        ?? null,
          email:            b.email            ?? u?.email            ?? "",
          isActive:         b.isActive         ?? u?.isActive         ?? true,
          isSubscribed:     b.isSubscribed      ?? u?.isSubscribed    ?? false,
          plan:             b.plan             ?? u?.plan             ?? "free",
          kycStatus:        b.kycStatus        ?? u?.kycStatus        ?? "Pending",
          profileStatus:    b.profileStatus    ?? u?.profileStatus    ?? "pending",
        };
      });

      const missingBrands = usersArr
        .filter((u: any) => u.role === "brand")
        .filter((u: any) => {
          const uid = u._id || u.id;
          return uid && !brandApiIds.has(uid);
        })
        .map((u: any) => ({
          _id:              u._id || u.id,
          id:               u._id || u.id,
          name:             u.profile?.name        || u.name,
          email:            u.email,
          isActive:         u.isActive,
          isSubscribed:     u.isSubscribed,
          plan:             u.plan,
          kycStatus:        u.kycStatus,
          profileStatus:    u.profileStatus,
          campaignsCreated: u.campaignsCreated     ?? 0,
          createdAt:        u.createdAt,
          bio:              u.profile?.bio          || "",
          location:         u.profile?.location     || "",
          phone:            u.profile?.phone        || "",
          website:          u.profile?.website      || "",
          platform:         u.profile?.platform     || "",
          companyName:      u.profile?.companyName  || "",
          profileImage:     u.profile?.profileImage || "",
          categories:       u.profile?.categories   || [],
          subCategories:    u.profile?.subCategories || [],
          followers:        u.profile?.followers    || 0,
        }));

      setData([...enrichedBrands, ...missingBrands]);

    } catch (err) {
      console.error("Failed to load brands:", err);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleView(b: any) {
    setProfileLoading(true);
    setViewBrand(b);
    try {
      const token = localStorage.getItem("token");
      const id = b._id || b.id;
      if (!id) return;
      const res = await fetch(`${BASE}/brand/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const profile = json?.profile ?? json?.data ?? json;
        setViewBrand({ ...b, ...profile, user: profile?.user ?? b?.user });
      }
    } catch (_) {}
    setProfileLoading(false);
  }

  async function handleBan(id: string, isBanned: boolean) {
    if (!id) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/users/${id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ banned: !isBanned }),
    });
    setMsg(isBanned ? "Brand unbanned ✓" : "Brand banned ✓");
    await load();
    setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!id) return;
    if (!confirm("Delete this brand?")) return;
    setActing(id);
    const token = localStorage.getItem("token");
    await fetch(`${BASE}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMsg("Deleted ✓");
    await load();
    setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  const filtered = data.filter((b) => {
    const q = search.toLowerCase();
    const ms =
      (b.name        || "").toLowerCase().includes(q) ||
      (b.email       || "").toLowerCase().includes(q) ||
      (b.phone       || "").toLowerCase().includes(q) ||
      (b.companyName || "").toLowerCase().includes(q) ||
      (b.website     || "").toLowerCase().includes(q);
    const mf =
      filter === "all" ||
      (filter === "subscribed" && b.isSubscribed)  ||
      (filter === "free"       && !b.isSubscribed) ||
      (filter === "banned"     && !b.isActive)     ||
      (filter === "active"     && b.isActive);
    return ms && mf;
  });

  const planBadge = (plan: string) => {
    const isPro  = plan?.includes("pro");
    const isPlus = plan?.includes("plus");
    const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
    const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
    const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
    return (
      <span className="badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
        {plan || "free"}
      </span>
    );
  };

  const ProfileModal = ({ b }: { b: any }) => {
    const id  = b._id || b.id;
    const uid = b.user?._id || b.user?.id || id;
    const cats = Array.isArray(b.categories)    ? b.categories    : b.categories    ? [b.categories]    : [];
    const subs = Array.isArray(b.subCategories) ? b.subCategories : b.subCategories ? [b.subCategories] : [];

    const Row = ({ label, val }: { label: string; val: React.ReactNode }) => (
      <div className="profile-row">
        <span className="profile-label">{label}</span>
        <span className="profile-val">{val ?? <span style={{ color: "#4a5568" }}>—</span>}</span>
      </div>
    );

    return (
      <div className="modal-overlay" onClick={() => setViewBrand(null)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>

          <div className="modal-header">
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {b.profileImage
                ? <img src={b.profileImage} alt="" className="avatar-big" />
                : <div className="avatar-placeholder">🏢</div>
              }
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#e8eaf6" }}>{b.name || "—"}</div>
                {b.companyName && (
                  <div style={{ fontSize: 12, color: "#4f6ef7", marginTop: 2 }}>🏢 {b.companyName}</div>
                )}
                <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>{b.user?.email || b.email || "—"}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <span className="badge" style={{
                    background: b.isActive ? "rgba(0,214,143,0.12)" : "rgba(255,71,87,0.12)",
                    color:      b.isActive ? "#00d68f" : "#ff4757",
                    border:     `1px solid ${b.isActive ? "rgba(0,214,143,0.25)" : "rgba(255,71,87,0.25)"}`,
                  }}>
                    {b.isActive ? "Active" : "Banned"}
                  </span>
                  {planBadge(b.plan)}
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setViewBrand(null)}>✕</button>
          </div>

          {profileLoading && (
            <div style={{ padding: "12px 24px", background: "rgba(79,110,247,0.05)", fontSize: 12, color: "#4f6ef7", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Loading full profile...
            </div>
          )}

          <div className="modal-body">
            <div className="section-title">Basic Info</div>
            <Row label="Profile ID" val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id}</span>} />
            <Row label="User ID"    val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{uid}</span>} />
            <Row label="Email"      val={<span style={{ color: "#8892b0" }}>{b.user?.email || b.email || "—"}</span>} />
            <Row label="Name"       val={<span style={{ fontWeight: 600 }}>{b.name}</span>} />
            <Row label="Company"    val={<span style={{ color: "#a855f7", fontWeight: 600 }}>{b.companyName}</span>} />
            <Row label="Location"   val={b.location} />
            <Row label="Bio"        val={<span style={{ color: "#8892b0", fontSize: 12, whiteSpace: "pre-line" }}>{b.bio}</span>} />

            <div className="section-title">Contact</div>
            <Row label="Phone" val={
              b.phone
                ? <a href={`tel:${b.phone}`} style={{ color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
                : null
            } />
            <Row label="Website" val={
              b.website
                ? <a href={b.website.startsWith("http") ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff", textDecoration: "none" }}>{b.website}</a>
                : null
            } />
            <Row label="Platform" val={
              b.platform
                ? <a href={b.platform} target="_blank" rel="noopener noreferrer" style={{ color: "#00d4ff", textDecoration: "none", fontSize: 12, wordBreak: "break-all" }}>{b.platform}</a>
                : null
            } />

            <div className="section-title">Subscription & KYC</div>
            <Row label="Plan" val={planBadge(b.plan)} />
            <Row label="Subscribed" val={
              <span className="badge" style={{
                background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
                color:      b.isSubscribed ? "#00d68f" : "#8892b0",
                border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
              }}>
                {b.isSubscribed ? "Yes" : "No"}
              </span>
            } />
            <Row label="KYC Status" val={
              <span className="badge" style={{
                background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
                border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
              }}>
                {b.kycStatus || "Pending"}
              </span>
            } />
            <Row label="Profile Status" val={
              <span className="badge" style={{
                background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
                color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
                border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
              }}>
                {b.profileStatus || "pending"}
              </span>
            } />
            <Row label="Campaigns" val={
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4f6ef7", fontSize: 15 }}>
                {b.campaignsCreated ?? "0"}
              </span>
            } />
            <Row label="Joined" val={
              b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : null
            } />

            {cats.length > 0 && (
              <>
                <div className="section-title">Categories</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {cats.map((c: string, i: number) => (
                    <span key={i} className="badge" style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>{c}</span>
                  ))}
                </div>
              </>
            )}

            {subs.length > 0 && (
              <>
                <div className="section-title">Sub-Categories</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {subs.map((sc: string, i: number) => (
                    <span key={i} className="badge" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>{sc}</span>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(79,110,247,0.1)", display: "flex", gap: 8 }}>
              <button
                className="pg-btn"
                disabled={acting === id}
                onClick={() => { handleBan(id, !b.isActive); setViewBrand(null); }}
                style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)", padding: "6px 14px" }}
              >
                {b.isActive ? "Ban Brand" : "Unban Brand"}
              </button>
              <button
                className="pg-btn"
                disabled={acting === id}
                onClick={() => { handleDelete(id); setViewBrand(null); }}
                style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)", padding: "6px 14px" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>

      {viewBrand && <ProfileModal b={viewBrand} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Brands</h1>
          <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>
            {loading ? "Loading..." : `${data.length} brands`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="pg-input"
            placeholder="Search name, email, phone, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <select className="pg-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="subscribed">Subscribed</option>
            <option value="free">Free Plan</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",      color: "#a855f7", count: data.length },
          { label: "Subscribed", color: "#00d68f", count: data.filter((b) => b.isSubscribed).length },
          { label: "Free",       color: "#8892b0", count: data.filter((b) => !b.isSubscribed).length },
          { label: "Banned",     color: "#ff4757", count: data.filter((b) => !b.isActive).length },
        ].map((x, i) => (
          <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#8892b0" }}>{x.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: x.color, fontFamily: "monospace" }}>{x.count}</span>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>
          {msg}
        </div>
      )}

      <div className="pg-card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {["ID", "Name", "Email", "Phone", "Company", "Website", "Campaigns", "KYC", "Plan", "Subscribed", "Profile", "Joined", "Actions"].map((h) => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No brands found</td>
              </tr>
            ) : filtered.map((b: any) => {
              const id = b._id || b.id;
              if (!id) return null;
              return (
                <tr key={id}>
                  <td className="pg-td">
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span>
                  </td>
                  <td className="pg-td">
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name || "—"}</span>
                  </td>
                  <td className="pg-td">
                    <span style={{ fontSize: 12, color: "#8892b0" }}>{b.email || "—"}</span>
                  </td>
                  <td className="pg-td">
                    {b.phone
                      ? <a href={`tel:${b.phone}`} style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
                      : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
                    }
                  </td>
                  <td className="pg-td">
                    <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 600 }}>{b.companyName || "—"}</span>
                  </td>
                  <td className="pg-td">
                    {b.website
                      ? <a href={b.website.startsWith("http") ? b.website : `https://${b.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}>{b.website}</a>
                      : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
                    }
                  </td>
                  <td className="pg-td">
                    <span style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600 }}>
                      {b.campaignsCreated ?? "0"}
                    </span>
                  </td>
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
                      color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
                      border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
                    }}>
                      {b.kycStatus || "Pending"}
                    </span>
                  </td>
                  <td className="pg-td">{planBadge(b.plan)}</td>
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
                      color:      b.isSubscribed ? "#00d68f" : "#8892b0",
                      border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
                    }}>
                      {b.isSubscribed ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="pg-td">
                    <span className="badge" style={{
                      background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
                      color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
                      border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
                    }}>
                      {b.profileStatus || "pending"}
                    </span>
                  </td>
                  <td className="pg-td">
                    <span style={{ fontSize: 12, color: "#4a5568" }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
                    </span>
                  </td>
                  <td className="pg-td">
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="pg-btn" onClick={() => handleView(b)} style={{ color: "#4f6ef7", borderColor: "rgba(79,110,247,0.3)" }}>
                        View
                      </button>
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
                        style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}
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

// const BASE = "https://api.collabzy.in/api/admin";

// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
//   .modal-overlay{position:fixed;inset:0;background:rgba(5,8,20,0.85);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
//   .modal-box{background:#141b30;border:1px solid rgba(79,110,247,0.2);border-radius:16px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;animation:modalIn 0.22s ease;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
//   .modal-header{padding:20px 24px 16px;border-bottom:1px solid rgba(79,110,247,0.1);display:flex;align-items:center;justify-content:space-between;}
//   .modal-body{padding:24px;}
//   .profile-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;font-size:13px;}
//   .profile-label{color:#4a5568;min-width:140px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding-top:1px;}
//   .profile-val{color:#e8eaf6;flex:1;word-break:break-word;}
//   .close-btn{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.25);color:#ff4757;width:28px;height:28px;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
//   .section-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6ef7;margin:16px 0 10px;border-left:2px solid #4f6ef7;padding-left:8px;}
//   .avatar-big{width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid rgba(79,110,247,0.3);}
//   .avatar-placeholder{width:72px;height:72px;border-radius:12px;background:rgba(79,110,247,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;color:#4f6ef7;border:2px solid rgba(79,110,247,0.2);}
// `;

// export default function AdminBrandsPage() {
//   const router = useRouter();
//   const [data, setData]             = useState<any[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [search, setSearch]         = useState("");
//   const [filter, setFilter]         = useState("all");
//   const [acting, setActing]         = useState<string | null>(null);
//   const [msg, setMsg]               = useState("");
//   const [viewBrand, setViewBrand]   = useState<any | null>(null);
//   const [profileLoading, setProfileLoading] = useState(false);

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     try {
//       // ✅ FIX: Dono APIs ek saath call karo
//       const [brandsRes, usersRes] = await Promise.all([
//         fetch(`${BASE}/brand`, { headers: { Authorization: `Bearer ${token}` } }),
//         fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } }),
//       ]);

//       if (brandsRes.status === 401 || usersRes.status === 401) {
//         router.push("/login");
//         return;
//       }

//       const brandsJson = await brandsRes.json();
//       const usersJson  = await usersRes.json();

//       // Brands API se data
//       const brandsArr: any[] = Array.isArray(brandsJson)
//         ? brandsJson
//         : brandsJson?.brands ?? brandsJson?.data ?? [];

//       // Users API se data
//       const usersArr: any[] = Array.isArray(usersJson)
//         ? usersJson
//         : usersJson?.users ?? usersJson?.data ?? [];

//       // ✅ FIX: Ghost brands filter — sirf valid _id wale lo
//       const validBrands = brandsArr.filter((b: any) => !!(b._id || b.id));

//       // Brands API mein jo IDs hain unka Set banao
//       const brandApiIds = new Set(validBrands.map((b: any) => b._id || b.id));

//       // ✅ FIX: Users API se role:"brand" wale lo jo brands API mein missing hain
//       const missingBrands = usersArr
//         .filter((u: any) => u.role === "brand")
//         .filter((u: any) => {
//           const uid = u._id || u.id;
//           return uid && !brandApiIds.has(uid);
//         })
//         .map((u: any) => ({
//           _id:              u._id || u.id,
//           id:               u._id || u.id,
//           name:             u.profile?.name     || u.name,
//           email:            u.email,
//           isActive:         u.isActive,
//           isSubscribed:     u.isSubscribed,
//           plan:             u.plan,
//           kycStatus:        u.kycStatus,
//           profileStatus:    u.profileStatus,
//           campaignsCreated: u.campaignsCreated,
//           createdAt:        u.createdAt,
//           bio:              u.profile?.bio         || "",
//           location:         u.profile?.location    || "",
//           phone:            u.profile?.phone       || "",
//           website:          u.profile?.website     || "",
//           platform:         u.profile?.platform    || "",
//           companyName:      u.profile?.companyName || "",
//           profileImage:     u.profile?.profileImage|| "",
//           categories:       u.profile?.categories  || [],
//           subCategories:    u.profile?.subCategories || [],
//           followers:        u.profile?.followers   || 0,
//         }));

//       // ✅ Merge: brands API + missing brands from users API
//       setData([...validBrands, ...missingBrands]);

//       const userCampaignMap = new Map(
//   usersArr.map((u: any) => [u._id || u.id, u.campaignsCreated ?? 0])
// );

// const enrichedBrands = validBrands.map((b: any) => {
//   const uid = b._id || b.id || b.user?._id || b.user?.id;
//   return {
//     ...b,
//     campaignsCreated: b.campaignsCreated ?? userCampaignMap.get(uid) ?? 0,
//   };
// });

// setData([...enrichedBrands, ...missingBrands]);


//     } catch (err) {
//       console.error("Failed to load brands:", err);
//     }
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleView(b: any) {
//     setProfileLoading(true);
//     setViewBrand(b);
//     try {
//       const token = localStorage.getItem("token");
//       const id = b._id || b.id;
//       if (!id) return;
//       const res = await fetch(`${BASE}/brand/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (res.ok) {
//         const json = await res.json();
//         const profile = json?.profile ?? json?.data ?? json;
//         setViewBrand({ ...b, ...profile, user: profile?.user ?? b?.user });
//       }
//     } catch (_) {}
//     setProfileLoading(false);
//   }

//   async function handleBan(id: string, isBanned: boolean) {
//     if (!id) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "Brand unbanned ✓" : "Brand banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!id) return;
//     if (!confirm("Delete this brand?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter((b) => {
//     const q = search.toLowerCase();
//     const ms =
//       (b.name        || "").toLowerCase().includes(q) ||
//       (b.email       || "").toLowerCase().includes(q) ||
//       (b.phone       || "").toLowerCase().includes(q) ||
//       (b.companyName || "").toLowerCase().includes(q) ||
//       (b.website     || "").toLowerCase().includes(q);
//     const mf =
//       filter === "all" ||
//       (filter === "subscribed" && b.isSubscribed)  ||
//       (filter === "free"       && !b.isSubscribed) ||
//       (filter === "banned"     && !b.isActive)     ||
//       (filter === "active"     && b.isActive);
//     return ms && mf;
//   });

//   const planBadge = (plan: string) => {
//     const isPro  = plan?.includes("pro");
//     const isPlus = plan?.includes("plus");
//     const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
//     const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
//     const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
//     return (
//       <span className="badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
//         {plan || "free"}
//       </span>
//     );
//   };

//   /* ── Profile Modal ── */
//   const ProfileModal = ({ b }: { b: any }) => {
//     const id   = b._id || b.id;
//     const uid  = b.user?._id || b.user?.id || id;
//     const cats = Array.isArray(b.categories)    ? b.categories    : b.categories    ? [b.categories]    : [];
//     const subs = Array.isArray(b.subCategories) ? b.subCategories : b.subCategories ? [b.subCategories] : [];

//     const Row = ({ label, val }: { label: string; val: React.ReactNode }) => (
//       <div className="profile-row">
//         <span className="profile-label">{label}</span>
//         <span className="profile-val">{val ?? <span style={{ color: "#4a5568" }}>—</span>}</span>
//       </div>
//     );

//     return (
//       <div className="modal-overlay" onClick={() => setViewBrand(null)}>
//         <div className="modal-box" onClick={(e) => e.stopPropagation()}>

//           <div className="modal-header">
//             <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
//               {b.profileImage
//                 ? <img src={b.profileImage} alt="" className="avatar-big" />
//                 : <div className="avatar-placeholder">🏢</div>
//               }
//               <div>
//                 <div style={{ fontWeight: 700, fontSize: 17, color: "#e8eaf6" }}>{b.name || "—"}</div>
//                 {b.companyName && (
//                   <div style={{ fontSize: 12, color: "#4f6ef7", marginTop: 2 }}>🏢 {b.companyName}</div>
//                 )}
//                 <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>{b.user?.email || b.email || "—"}</div>
//                 <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
//                   <span className="badge" style={{
//                     background: b.isActive ? "rgba(0,214,143,0.12)" : "rgba(255,71,87,0.12)",
//                     color:      b.isActive ? "#00d68f" : "#ff4757",
//                     border:     `1px solid ${b.isActive ? "rgba(0,214,143,0.25)" : "rgba(255,71,87,0.25)"}`,
//                   }}>
//                     {b.isActive ? "Active" : "Banned"}
//                   </span>
//                   {planBadge(b.plan)}
//                 </div>
//               </div>
//             </div>
//             <button className="close-btn" onClick={() => setViewBrand(null)}>✕</button>
//           </div>

//           {profileLoading && (
//             <div style={{ padding: "12px 24px", background: "rgba(79,110,247,0.05)", fontSize: 12, color: "#4f6ef7", display: "flex", alignItems: "center", gap: 8 }}>
//               <div style={{ width: 12, height: 12, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
//               Loading full profile...
//             </div>
//           )}

//           <div className="modal-body">
//             <div className="section-title">Basic Info</div>
//             <Row label="Profile ID"     val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id}</span>} />
//             <Row label="User ID"        val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{uid}</span>} />
//             <Row label="Email"          val={<span style={{ color: "#8892b0" }}>{b.user?.email || b.email || "—"}</span>} />
//             <Row label="Name"           val={<span style={{ fontWeight: 600 }}>{b.name}</span>} />
//             <Row label="Company"        val={<span style={{ color: "#a855f7", fontWeight: 600 }}>{b.companyName}</span>} />
//             <Row label="Location"       val={b.location} />
//             <Row label="Bio"            val={<span style={{ color: "#8892b0", fontSize: 12, whiteSpace: "pre-line" }}>{b.bio}</span>} />

//             <div className="section-title">Contact</div>
//             <Row label="Phone" val={
//               b.phone
//                 ? <a href={`tel:${b.phone}`} style={{ color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
//                 : null
//             } />
//             <Row label="Website" val={
//               b.website
//                 ? <a
//                     href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
//                     target="_blank" rel="noopener noreferrer"
//                     style={{ color: "#00d4ff", textDecoration: "none" }}
//                   >{b.website}</a>
//                 : null
//             } />
//             <Row label="Platform" val={
//               b.platform
//                 ? <a href={b.platform} target="_blank" rel="noopener noreferrer"
//                     style={{ color: "#00d4ff", textDecoration: "none", fontSize: 12, wordBreak: "break-all" }}>
//                     {b.platform}
//                   </a>
//                 : null
//             } />

//             <div className="section-title">Subscription & KYC</div>
//             <Row label="Plan"           val={planBadge(b.plan)} />
//             <Row label="Subscribed"     val={
//               <span className="badge" style={{
//                 background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                 color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                 border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//               }}>
//                 {b.isSubscribed ? "Yes" : "No"}
//               </span>
//             } />
//             <Row label="KYC Status"     val={
//               <span className="badge" style={{
//                 background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                 color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                 border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//               }}>
//                 {b.kycStatus || "Pending"}
//               </span>
//             } />
//             <Row label="Profile Status" val={
//               <span className="badge" style={{
//                 background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                 color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                 border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//               }}>
//                 {b.profileStatus || "pending"}
//               </span>
//             } />
//             <Row label="Campaigns"      val={
//               <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4f6ef7", fontSize: 15 }}>
//                 {b.campaignsCreated ?? "0"}
//               </span>
//             } />
//             <Row label="Joined" val={
//               b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : null
//             } />

//             {cats.length > 0 && (
//               <>
//                 <div className="section-title">Categories</div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//                   {cats.map((c: string, i: number) => (
//                     <span key={i} className="badge" style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>{c}</span>
//                   ))}
//                 </div>
//               </>
//             )}

//             {subs.length > 0 && (
//               <>
//                 <div className="section-title">Sub-Categories</div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//                   {subs.map((sc: string, i: number) => (
//                     <span key={i} className="badge" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>{sc}</span>
//                   ))}
//                 </div>
//               </>
//             )}

//             <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(79,110,247,0.1)", display: "flex", gap: 8 }}>
//               <button
//                 className="pg-btn"
//                 disabled={acting === id}
//                 onClick={() => { handleBan(id, !b.isActive); setViewBrand(null); }}
//                 style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)", padding: "6px 14px" }}
//               >
//                 {b.isActive ? "Ban Brand" : "Unban Brand"}
//               </button>
//               <button
//                 className="pg-btn"
//                 disabled={acting === id}
//                 onClick={() => { handleDelete(id); setViewBrand(null); }}
//                 style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)", padding: "6px 14px" }}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       {viewBrand && <ProfileModal b={viewBrand} />}

//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Brands</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>
//             {loading ? "Loading..." : `${data.length} brands`}
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input
//             className="pg-input"
//             placeholder="Search name, email, phone, company..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             style={{ width: 260 }}
//           />
//           <select className="pg-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 140 }}>
//             <option value="all">All</option>
//             <option value="active">Active</option>
//             <option value="banned">Banned</option>
//             <option value="subscribed">Subscribed</option>
//             <option value="free">Free Plan</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
//         {[
//           { label: "Total",      color: "#a855f7", count: data.length },
//           { label: "Subscribed", color: "#00d68f", count: data.filter((b) => b.isSubscribed).length },
//           { label: "Free",       color: "#8892b0", count: data.filter((b) => !b.isSubscribed).length },
//           { label: "Banned",     color: "#ff4757", count: data.filter((b) => !b.isActive).length },
//         ].map((x, i) => (
//           <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <span style={{ fontSize: 13, color: "#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize: 22, fontWeight: 700, color: x.color, fontFamily: "monospace" }}>{x.count}</span>
//           </div>
//         ))}
//       </div>

//       {msg && (
//         <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>
//           {msg}
//         </div>
//       )}

//       {/* Table */}
//       <div className="pg-card" style={{ overflow: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>
//               {["ID", "Name", "Email", "Phone", "Company", "Website", "Campaigns", "KYC", "Plan", "Subscribed", "Profile", "Joined", "Actions"].map((h) => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={13} style={{ textAlign: "center", padding: 40 }}>
//                 <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={13} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No brands found</td></tr>
//             ) : filtered.map((b: any) => {
//               const id = b._id || b.id;
//               if (!id) return null; // ✅ ghost brand skip

//               return (
//                 <tr key={id}>
//                   <td className="pg-td">
//                     <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span>
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name || "—"}</span>
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#8892b0" }}>{b.email || "—"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {b.phone
//                       ? <a href={`tel:${b.phone}`} style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
//                       : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
//                     }
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 600 }}>{b.companyName || "—"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {b.website
//                       ? <a
//                           href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
//                           target="_blank" rel="noopener noreferrer"
//                           style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}
//                         >{b.website}</a>
//                       : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
//                     }
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600 }}>
//                       {b.campaignsCreated ?? "0"}
//                     </span>
//                   </td>
                  
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                       border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.kycStatus || "Pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td">{planBadge(b.plan)}</td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                       color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                       border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>
//                       {b.isSubscribed ? "Yes" : "No"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                       border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.profileStatus || "pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#4a5568" }}>
//                       {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button
//                         className="pg-btn"
//                         onClick={() => handleView(b)}
//                         style={{ color: "#4f6ef7", borderColor: "rgba(79,110,247,0.3)" }}
//                       >
//                         View
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleBan(id, !b.isActive)}
//                         style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
//                       >
//                         {acting === id ? "..." : b.isActive ? "Ban" : "Unban"}
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleDelete(id)}
//                         style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}
//                       >
//                         {acting === id ? "..." : "Delete"}
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


// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "https://api.collabzy.in/api/admin";
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-input:focus{border-color:#4f6ef7;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminBrandsPage() {
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

//   const filtered = data.filter(b => {
//     const q = search.toLowerCase();
//     const ms = (b.name || "").toLowerCase().includes(q) || (b.email || "").toLowerCase().includes(q);
//     const mf = filter === "all"
//       || (filter === "subscribed" && b.isSubscribed)
//       || (filter === "free" && !b.isSubscribed)
//       || (filter === "banned" && !b.isActive)
//       || (filter === "active" && b.isActive);
//     return ms && mf;
//   });

//   const planBadge = (plan: string) => {
//     const isPro  = plan?.includes("pro");
//     const isPlus = plan?.includes("plus");
//     const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
//     const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
//     const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
//     return <span className="badge" style={{ background:bg,color,border:`1px solid ${border}` }}>{plan || "free"}</span>;
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       {/* Header */}
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Brands</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} brands`}</p>
//         </div>
//         <div style={{ display:"flex",gap:10 }}>
//           <input
//             className="pg-input"
//             placeholder="Search name or email..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             style={{ width:220 }}
//           />
//           <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:140 }}>
//             <option value="all">All</option>
//             <option value="active">Active</option>
//             <option value="banned">Banned</option>
//             <option value="subscribed">Subscribed</option>
//             <option value="free">Free Plan</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           { label:"Total",      color:"#a855f7", count: data.length },
//           { label:"Subscribed", color:"#00d68f", count: data.filter(b => b.isSubscribed).length },
//           { label:"Free",       color:"#8892b0", count: data.filter(b => !b.isSubscribed).length },
//           { label:"Banned",     color:"#ff4757", count: data.filter(b => !b.isActive).length },
//         ].map((x, i) => (
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>{x.count}</span>
//           </div>
//         ))}
//       </div>

//       {msg && (
//         <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>
//           {msg}
//         </div>
//       )}

//       {/* Table */}
//       <div className="pg-card" style={{ overflow:"auto" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead>
//             <tr>
//               {["ID","Name","Email","Campaigns","KYC","Plan","Subscribed","Profile","Joined","Actions"].map(h => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={10} style={{ textAlign:"center",padding:40 }}>
//                 <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No brands found</td></tr>
//             ) : filtered.map((b: any) => {
//               const id = b._id || b.id;
//               return (
//                 <tr key={id}>
//                   {/* ID */}
//                   <td className="pg-td">
//                     <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
//                   </td>

//                   {/* Name */}
//                   <td className="pg-td">
//                     <span style={{ fontWeight:600,fontSize:13 }}>{b.name || "—"}</span>
//                   </td>

//                   {/* Email */}
//                   <td className="pg-td">
//                     <span style={{ fontSize:12,color:"#8892b0" }}>{b.email || "—"}</span>
//                   </td>

//                   {/* Campaigns Created */}
//                   <td className="pg-td">
//                     <span style={{ fontFamily:"monospace",color:"#4f6ef7",fontWeight:600 }}>
//                       {b.campaignsCreated ?? "0"}
//                     </span>
//                   </td>

//                   {/* KYC */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                       border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.kycStatus || "Pending"}
//                     </span>
//                   </td>

//                   {/* Plan */}
//                   <td className="pg-td">{planBadge(b.plan)}</td>

//                   {/* Subscribed */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                       color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                       border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>
//                       {b.isSubscribed ? "Yes" : "No"}
//                     </span>
//                   </td>

//                   {/* Profile Status */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                       border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.profileStatus || "pending"}
//                     </span>
//                   </td>

//                   {/* Joined */}
//                   <td className="pg-td">
//                     <span style={{ fontSize:12,color:"#4a5568" }}>
//                       {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
//                     </span>
//                   </td>

//                   {/* Actions */}
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:5 }}>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleBan(id, !b.isActive)}
//                         style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
//                       >
//                         {acting === id ? "..." : b.isActive ? "Ban" : "Unban"}
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleDelete(id)}
//                         style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}
//                       >
//                         {acting === id ? "..." : "Delete"}
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



// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "https://api.collabzy.in/api/admin";
// const S = `@keyframes spin{to{transform:rotate(360deg)}}.pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}.pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}.pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}tr:hover .pg-td{background:rgba(79,110,247,0.03);}.pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}.pg-input:focus{border-color:#4f6ef7;}.pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}.pg-btn:disabled{opacity:0.4;cursor:not-allowed;}.badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}`;

// export default function AdminBrandsPage() {
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

//   const filtered = data.filter(b => {
//     const q = search.toLowerCase();
//     const ms = (b.name || "").toLowerCase().includes(q) || (b.email || "").toLowerCase().includes(q);
//     const mf = filter === "all"
//       || (filter === "subscribed" && b.isSubscribed)
//       || (filter === "free" && !b.isSubscribed)
//       || (filter === "banned" && !b.isActive)
//       || (filter === "active" && b.isActive);
//     return ms && mf;
//   });

//   const planBadge = (plan: string) => {
//     const isPro  = plan?.includes("pro");
//     const isPlus = plan?.includes("plus");
//     const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
//     const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
//     const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
//     return <span className="badge" style={{ background:bg,color,border:`1px solid ${border}` }}>{plan || "free"}</span>;
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       {/* Header */}
//       <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
//         <div>
//           <h1 style={{ fontSize:20,fontWeight:700,color:"#e8eaf6" }}>Brands</h1>
//           <p style={{ fontSize:13,color:"#4a5568",marginTop:3 }}>{loading ? "Loading..." : `${data.length} brands`}</p>
//         </div>
//         <div style={{ display:"flex",gap:10 }}>
//           <input
//             className="pg-input"
//             placeholder="Search name or email..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             style={{ width:220 }}
//           />
//           <select className="pg-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width:140 }}>
//             <option value="all">All</option>
//             <option value="active">Active</option>
//             <option value="banned">Banned</option>
//             <option value="subscribed">Subscribed</option>
//             <option value="free">Free Plan</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
//         {[
//           { label:"Total",      color:"#a855f7", count: data.length },
//           { label:"Subscribed", color:"#00d68f", count: data.filter(b => b.isSubscribed).length },
//           { label:"Free",       color:"#8892b0", count: data.filter(b => !b.isSubscribed).length },
//           { label:"Banned",     color:"#ff4757", count: data.filter(b => !b.isActive).length },
//         ].map((x, i) => (
//           <div key={i} className="pg-card" style={{ padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
//             <span style={{ fontSize:13,color:"#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize:22,fontWeight:700,color:x.color,fontFamily:"monospace" }}>{x.count}</span>
//           </div>
//         ))}
//       </div>

//       {msg && (
//         <div style={{ background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f" }}>
//           {msg}
//         </div>
//       )}

//       {/* Table */}
//       <div className="pg-card" style={{ overflow:"auto" }}>
//         <table style={{ width:"100%",borderCollapse:"separate",borderSpacing:0 }}>
//           <thead>
//             <tr>
//               {["ID","Name","Email","Campaigns","KYC","Plan","Subscribed","Profile","Joined","Actions"].map(h => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={10} style={{ textAlign:"center",padding:40 }}>
//                 <div style={{ width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto" }}/>
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={10} className="pg-td" style={{ textAlign:"center",color:"#4a5568" }}>No brands found</td></tr>
//             ) : filtered.map((b: any) => {
//               const id = b._id || b.id;
//               return (
//                 <tr key={id}>
//                   {/* ID */}
//                   <td className="pg-td">
//                     <span style={{ fontFamily:"monospace",fontSize:11,color:"#4a5568" }}>{id?.slice(-6)}</span>
//                   </td>

//                   {/* Name */}
//                   <td className="pg-td">
//                     <span style={{ fontWeight:600,fontSize:13 }}>{b.name || "—"}</span>
//                   </td>

//                   {/* Email */}
//                   <td className="pg-td">
//                     <span style={{ fontSize:12,color:"#8892b0" }}>{b.email || "—"}</span>
//                   </td>

//                   {/* Campaigns Created */}
//                   <td className="pg-td">
//                     <span style={{ fontFamily:"monospace",color:"#4f6ef7",fontWeight:600 }}>
//                       {b.campaignsCreated ?? "0"}
//                     </span>
//                   </td>

//                   {/* KYC */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                       border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.kycStatus || "Pending"}
//                     </span>
//                   </td>

//                   {/* Plan */}
//                   <td className="pg-td">{planBadge(b.plan)}</td>

//                   {/* Subscribed */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                       color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                       border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>
//                       {b.isSubscribed ? "Yes" : "No"}
//                     </span>
//                   </td>

//                   {/* Profile Status */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                       border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.profileStatus || "pending"}
//                     </span>
//                   </td>

//                   {/* Joined */}
//                   <td className="pg-td">
//                     <span style={{ fontSize:12,color:"#4a5568" }}>
//                       {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
//                     </span>
//                   </td>

//                   {/* Actions */}
//                   <td className="pg-td">
//                     <div style={{ display:"flex",gap:5 }}>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleBan(id, !b.isActive)}
//                         style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
//                       >
//                         {acting === id ? "..." : b.isActive ? "Ban" : "Unban"}
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleDelete(id)}
//                         style={{ color:"#ff4757",borderColor:"rgba(255,71,87,0.3)" }}
//                       >
//                         {acting === id ? "..." : "Delete"}
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


// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "https://api.collabzy.in/api/admin";

// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}

//   /* Modal */
//   .modal-overlay{position:fixed;inset:0;background:rgba(5,8,20,0.85);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
//   .modal-box{background:#141b30;border:1px solid rgba(79,110,247,0.2);border-radius:16px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;animation:modalIn 0.22s ease;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
//   .modal-header{padding:20px 24px 16px;border-bottom:1px solid rgba(79,110,247,0.1);display:flex;align-items:center;justify-content:space-between;}
//   .modal-body{padding:24px;}
//   .profile-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;font-size:13px;}
//   .profile-label{color:#4a5568;min-width:140px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding-top:1px;}
//   .profile-val{color:#e8eaf6;flex:1;word-break:break-word;}
//   .close-btn{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.25);color:#ff4757;width:28px;height:28px;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
//   .section-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6ef7;margin:16px 0 10px;border-left:2px solid #4f6ef7;padding-left:8px;}
//   .avatar-big{width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid rgba(79,110,247,0.3);}
//   .avatar-placeholder{width:72px;height:72px;border-radius:12px;background:rgba(79,110,247,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;color:#4f6ef7;border:2px solid rgba(79,110,247,0.2);}
// `;

// export default function AdminBrandsPage() {
//   const router = useRouter();
//   const [data, setData]           = useState<any[]>([]);
//   const [loading, setLoading]     = useState(true);
//   const [search, setSearch]       = useState("");
//   const [filter, setFilter]       = useState("all");
//   const [acting, setActing]       = useState<string | null>(null);
//   const [msg, setMsg]             = useState("");
//   const [viewBrand, setViewBrand] = useState<any | null>(null);
//   const [profileLoading, setProfileLoading] = useState(false);

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     try {
//       const res = await fetch(`${BASE}/brand`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (res.status === 401) { router.push("/login"); return; }
//       const json = await res.json();
//       const raw: any[] = Array.isArray(json)
//         ? json
//         : json?.brands ?? json?.data ?? [];

//       // ✅ FIX: Only keep brands that have a valid _id (no ghost/orphan profiles)
//       const valid = raw.filter((b: any) => {
//         const id = b._id || b.id;
//         return !!id;
//       });

//       setData(valid);
//     } catch (err) {
//       console.error("Failed to load brands:", err);
//     }
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   // Fetch full profile for modal
//   async function handleView(b: any) {
//     setProfileLoading(true);
//     setViewBrand(b);
//     try {
//       const token = localStorage.getItem("token");
//       const id = b._id || b.id;
//       if (!id) return; // ✅ FIX: guard — don't fetch if no id
//       const res = await fetch(`${BASE}/brand/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (res.ok) {
//         const json = await res.json();
//         const profile = json?.profile ?? json?.data ?? json;
//         setViewBrand({ ...b, ...profile, user: profile?.user ?? b?.user });
//       }
//     } catch (_) {
//       // fallback to basic data already set
//     }
//     setProfileLoading(false);
//   }

//   async function handleBan(id: string, isBanned: boolean) {
//     if (!id) return; // ✅ FIX: guard
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "Brand unbanned ✓" : "Brand banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!id) return; // ✅ FIX: guard
//     if (!confirm("Delete this brand?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter((b) => {
//     const q = search.toLowerCase();
//     const ms =
//       (b.name || "").toLowerCase().includes(q) ||
//       (b.email || "").toLowerCase().includes(q) ||
//       (b.phone || "").toLowerCase().includes(q) ||
//       (b.companyName || "").toLowerCase().includes(q) ||
//       (b.website || "").toLowerCase().includes(q);
//     const mf =
//       filter === "all" ||
//       (filter === "subscribed" && b.isSubscribed) ||
//       (filter === "free" && !b.isSubscribed) ||
//       (filter === "banned" && !b.isActive) ||
//       (filter === "active" && b.isActive);
//     return ms && mf;
//   });

//   const planBadge = (plan: string) => {
//     const isPro  = plan?.includes("pro");
//     const isPlus = plan?.includes("plus");
//     const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
//     const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
//     const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
//     return (
//       <span className="badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
//         {plan || "free"}
//       </span>
//     );
//   };

//   /* ── Profile Modal ── */
//   const ProfileModal = ({ b }: { b: any }) => {
//     const id   = b._id || b.id;
//     const uid  = b.user?._id || b.user?.id || id;
//     const cats = Array.isArray(b.categories) ? b.categories : b.categories ? [b.categories] : [];
//     const subs = Array.isArray(b.subCategories) ? b.subCategories : [];

//     const Row = ({ label, val }: { label: string; val: React.ReactNode }) => (
//       <div className="profile-row">
//         <span className="profile-label">{label}</span>
//         <span className="profile-val">{val ?? <span style={{ color: "#4a5568" }}>—</span>}</span>
//       </div>
//     );

//     return (
//       <div className="modal-overlay" onClick={() => setViewBrand(null)}>
//         <div className="modal-box" onClick={(e) => e.stopPropagation()}>

//           {/* Header */}
//           <div className="modal-header">
//             <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
//               {b.profileImage
//                 ? <img src={b.profileImage} alt="" className="avatar-big" />
//                 : <div className="avatar-placeholder">🏢</div>
//               }
//               <div>
//                 <div style={{ fontWeight: 700, fontSize: 17, color: "#e8eaf6" }}>{b.name || "—"}</div>
//                 {b.companyName && (
//                   <div style={{ fontSize: 12, color: "#4f6ef7", marginTop: 2 }}>🏢 {b.companyName}</div>
//                 )}
//                 <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>{b.user?.email || b.email || "—"}</div>
//                 <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
//                   <span className="badge" style={{
//                     background: b.isActive ? "rgba(0,214,143,0.12)" : "rgba(255,71,87,0.12)",
//                     color:      b.isActive ? "#00d68f" : "#ff4757",
//                     border:     `1px solid ${b.isActive ? "rgba(0,214,143,0.25)" : "rgba(255,71,87,0.25)"}`,
//                   }}>
//                     {b.isActive ? "Active" : "Banned"}
//                   </span>
//                   {planBadge(b.plan)}
//                 </div>
//               </div>
//             </div>
//             <button className="close-btn" onClick={() => setViewBrand(null)}>✕</button>
//           </div>

//           {/* Loading shimmer */}
//           {profileLoading && (
//             <div style={{ padding: "12px 24px", background: "rgba(79,110,247,0.05)", fontSize: 12, color: "#4f6ef7", display: "flex", alignItems: "center", gap: 8 }}>
//               <div style={{ width: 12, height: 12, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
//               Loading full profile...
//             </div>
//           )}

//           {/* Body */}
//           <div className="modal-body">

//             <div className="section-title">Basic Info</div>
//             <Row label="Profile ID" val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id}</span>} />
//             <Row label="User ID"    val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{uid}</span>} />
//             <Row label="User Email" val={<span style={{ color: "#8892b0" }}>{b.user?.email || b.email || "—"}</span>} />
//             <Row label="Name"       val={<span style={{ fontWeight: 600 }}>{b.name}</span>} />
//             <Row label="Company"    val={<span style={{ color: "#a855f7", fontWeight: 600 }}>{b.companyName}</span>} />
//             <Row label="Location"   val={b.location} />
//             <Row label="Bio"        val={<span style={{ color: "#8892b0", fontSize: 12, whiteSpace: "pre-line" }}>{b.bio}</span>} />

//             <div className="section-title">Contact</div>
//             <Row label="Phone" val={
//               b.phone
//                 ? <a href={`tel:${b.phone}`} style={{ color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
//                 : null
//             } />
//             <Row label="Website" val={
//               b.website
//                 ? <a
//                     href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
//                     target="_blank" rel="noopener noreferrer"
//                     style={{ color: "#00d4ff", textDecoration: "none" }}
//                   >{b.website}</a>
//                 : null
//             } />
//             <Row label="Platform" val={
//               b.platform
//                 ? <a href={b.platform} target="_blank" rel="noopener noreferrer"
//                     style={{ color: "#00d4ff", textDecoration: "none", fontSize: 12, wordBreak: "break-all" }}>
//                     {b.platform}
//                   </a>
//                 : null
//             } />

//             <div className="section-title">Subscription & KYC</div>
//             <Row label="Plan"           val={planBadge(b.plan)} />
//             <Row label="Subscribed"     val={
//               <span className="badge" style={{
//                 background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                 color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                 border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//               }}>
//                 {b.isSubscribed ? "Yes" : "No"}
//               </span>
//             } />
//             <Row label="KYC Status" val={
//               <span className="badge" style={{
//                 background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                 color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                 border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//               }}>
//                 {b.kycStatus || "Pending"}
//               </span>
//             } />
//             <Row label="Profile Status" val={
//               <span className="badge" style={{
//                 background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                 color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                 border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//               }}>
//                 {b.profileStatus || "pending"}
//               </span>
//             } />
//             <Row label="Campaigns" val={
//               <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4f6ef7", fontSize: 15 }}>
//                 {b.campaignsCreated ?? "0"}
//               </span>
//             } />
//             <Row label="Joined" val={
//               b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : null
//             } />

//             {cats.length > 0 && (
//               <>
//                 <div className="section-title">Categories</div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//                   {cats.map((c: string, i: number) => (
//                     <span key={i} className="badge" style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>{c}</span>
//                   ))}
//                 </div>
//               </>
//             )}

//             {subs.length > 0 && (
//               <>
//                 <div className="section-title">Sub-Categories</div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//                   {subs.map((sc: string, i: number) => (
//                     <span key={i} className="badge" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>{sc}</span>
//                   ))}
//                 </div>
//               </>
//             )}

//             {/* Quick Actions */}
//             <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(79,110,247,0.1)", display: "flex", gap: 8 }}>
//               <button
//                 className="pg-btn"
//                 disabled={acting === id}
//                 onClick={() => { handleBan(id, !b.isActive); setViewBrand(null); }}
//                 style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)", padding: "6px 14px" }}
//               >
//                 {b.isActive ? "Ban Brand" : "Unban Brand"}
//               </button>
//               <button
//                 className="pg-btn"
//                 disabled={acting === id}
//                 onClick={() => { handleDelete(id); setViewBrand(null); }}
//                 style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)", padding: "6px 14px" }}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       {/* Modal */}
//       {viewBrand && <ProfileModal b={viewBrand} />}

//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Brands</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>
//             {loading ? "Loading..." : `${data.length} brands`}
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input
//             className="pg-input"
//             placeholder="Search name, email, phone, company..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             style={{ width: 260 }}
//           />
//           <select className="pg-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 140 }}>
//             <option value="all">All</option>
//             <option value="active">Active</option>
//             <option value="banned">Banned</option>
//             <option value="subscribed">Subscribed</option>
//             <option value="free">Free Plan</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
//         {[
//           { label: "Total",      color: "#a855f7", count: data.length },
//           { label: "Subscribed", color: "#00d68f", count: data.filter((b) => b.isSubscribed).length },
//           { label: "Free",       color: "#8892b0", count: data.filter((b) => !b.isSubscribed).length },
//           { label: "Banned",     color: "#ff4757", count: data.filter((b) => !b.isActive).length },
//         ].map((x, i) => (
//           <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <span style={{ fontSize: 13, color: "#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize: 22, fontWeight: 700, color: x.color, fontFamily: "monospace" }}>{x.count}</span>
//           </div>
//         ))}
//       </div>

//       {msg && (
//         <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>
//           {msg}
//         </div>
//       )}

//       {/* Table */}
//       <div className="pg-card" style={{ overflow: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>
//               {["ID", "Name", "Email", "Phone", "Company", "Website", "Campaigns", "KYC", "Plan", "Subscribed", "Profile", "Joined", "Actions"].map((h) => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={13} style={{ textAlign: "center", padding: 40 }}>
//                 <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={13} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No brands found</td></tr>
//             ) : filtered.map((b: any) => {
//               const id = b._id || b.id;

//               // ✅ FIX: Skip rendering rows with no valid ID (ghost/orphan profiles)
//               if (!id) return null;

//               return (
//                 <tr key={id}>
//                   {/* ID */}
//                   <td className="pg-td">
//                     <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span>
//                   </td>

//                   {/* Name */}
//                   <td className="pg-td">
//                     <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name || "—"}</span>
//                   </td>

//                   {/* Email */}
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#8892b0" }}>{b.email || "—"}</span>
//                   </td>

//                   {/* Phone */}
//                   <td className="pg-td">
//                     {b.phone
//                       ? <a href={`tel:${b.phone}`} style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
//                       : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
//                     }
//                   </td>

//                   {/* Company */}
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 600 }}>{b.companyName || "—"}</span>
//                   </td>

//                   {/* Website */}
//                   <td className="pg-td">
//                     {b.website
//                       ? <a
//                           href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
//                           target="_blank" rel="noopener noreferrer"
//                           style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}
//                         >{b.website}</a>
//                       : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
//                     }
//                   </td>

//                   {/* Campaigns */}
//                   <td className="pg-td">
//                     <span style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600 }}>
//                       {b.campaignsCreated ?? "0"}
//                     </span>
//                   </td>

//                   {/* KYC */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                       border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.kycStatus || "Pending"}
//                     </span>
//                   </td>

//                   {/* Plan */}
//                   <td className="pg-td">{planBadge(b.plan)}</td>

//                   {/* Subscribed */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                       color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                       border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>
//                       {b.isSubscribed ? "Yes" : "No"}
//                     </span>
//                   </td>

//                   {/* Profile Status */}
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                       border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.profileStatus || "pending"}
//                     </span>
//                   </td>

//                   {/* Joined */}
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#4a5568" }}>
//                       {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
//                     </span>
//                   </td>

//                   {/* Actions */}
//                   <td className="pg-td">
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button
//                         className="pg-btn"
//                         onClick={() => handleView(b)}
//                         style={{ color: "#4f6ef7", borderColor: "rgba(79,110,247,0.3)" }}
//                       >
//                         View
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleBan(id, !b.isActive)}
//                         style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
//                       >
//                         {acting === id ? "..." : b.isActive ? "Ban" : "Unban"}
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleDelete(id)}
//                         style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}
//                       >
//                         {acting === id ? "..." : "Delete"}
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



// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// const BASE = "https://api.collabzy.in/api/admin";

// const S = `
//   @keyframes spin{to{transform:rotate(360deg)}}
//   @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
//   .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//   .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//   .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//   tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//   .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;font-family:inherit;}
//   .pg-input:focus{border-color:#4f6ef7;}
//   .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//   .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//   .badge{display:inline-flex;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;}
//   .modal-overlay{position:fixed;inset:0;background:rgba(5,8,20,0.85);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
//   .modal-box{background:#141b30;border:1px solid rgba(79,110,247,0.2);border-radius:16px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;animation:modalIn 0.22s ease;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
//   .modal-header{padding:20px 24px 16px;border-bottom:1px solid rgba(79,110,247,0.1);display:flex;align-items:center;justify-content:space-between;}
//   .modal-body{padding:24px;}
//   .profile-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;font-size:13px;}
//   .profile-label{color:#4a5568;min-width:140px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding-top:1px;}
//   .profile-val{color:#e8eaf6;flex:1;word-break:break-word;}
//   .close-btn{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.25);color:#ff4757;width:28px;height:28px;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
//   .section-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6ef7;margin:16px 0 10px;border-left:2px solid #4f6ef7;padding-left:8px;}
//   .avatar-big{width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid rgba(79,110,247,0.3);}
//   .avatar-placeholder{width:72px;height:72px;border-radius:12px;background:rgba(79,110,247,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;color:#4f6ef7;border:2px solid rgba(79,110,247,0.2);}
// `;

// export default function AdminBrandsPage() {
//   const router = useRouter();
//   const [data, setData]             = useState<any[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [search, setSearch]         = useState("");
//   const [filter, setFilter]         = useState("all");
//   const [acting, setActing]         = useState<string | null>(null);
//   const [msg, setMsg]               = useState("");
//   const [viewBrand, setViewBrand]   = useState<any | null>(null);
//   const [profileLoading, setProfileLoading] = useState(false);

//   async function load() {
//     const token = localStorage.getItem("token");
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     try {
//       // ✅ FIX: Dono APIs ek saath call karo
//       const [brandsRes, usersRes] = await Promise.all([
//         fetch(`${BASE}/brand`, { headers: { Authorization: `Bearer ${token}` } }),
//         fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } }),
//       ]);

//       if (brandsRes.status === 401 || usersRes.status === 401) {
//         router.push("/login");
//         return;
//       }

//       const brandsJson = await brandsRes.json();
//       const usersJson  = await usersRes.json();

//       // Brands API se data
//       const brandsArr: any[] = Array.isArray(brandsJson)
//         ? brandsJson
//         : brandsJson?.brands ?? brandsJson?.data ?? [];

//       // Users API se data
//       const usersArr: any[] = Array.isArray(usersJson)
//         ? usersJson
//         : usersJson?.users ?? usersJson?.data ?? [];

//       // ✅ FIX: Ghost brands filter — sirf valid _id wale lo
//       const validBrands = brandsArr.filter((b: any) => !!(b._id || b.id));

//       // Brands API mein jo IDs hain unka Set banao
//       const brandApiIds = new Set(validBrands.map((b: any) => b._id || b.id));

//       // ✅ FIX: Users API se role:"brand" wale lo jo brands API mein missing hain
//       const missingBrands = usersArr
//         .filter((u: any) => u.role === "brand")
//         .filter((u: any) => {
//           const uid = u._id || u.id;
//           return uid && !brandApiIds.has(uid);
//         })
//         .map((u: any) => ({
//           _id:              u._id || u.id,
//           id:               u._id || u.id,
//           name:             u.profile?.name     || u.name,
//           email:            u.email,
//           isActive:         u.isActive,
//           isSubscribed:     u.isSubscribed,
//           plan:             u.plan,
//           kycStatus:        u.kycStatus,
//           profileStatus:    u.profileStatus,
//           campaignsCreated: u.campaignsCreated,
//           createdAt:        u.createdAt,
//           bio:              u.profile?.bio         || "",
//           location:         u.profile?.location    || "",
//           phone:            u.profile?.phone       || "",
//           website:          u.profile?.website     || "",
//           platform:         u.profile?.platform    || "",
//           companyName:      u.profile?.companyName || "",
//           profileImage:     u.profile?.profileImage|| "",
//           categories:       u.profile?.categories  || [],
//           subCategories:    u.profile?.subCategories || [],
//           followers:        u.profile?.followers   || 0,
//         }));

//       // ✅ Merge: brands API + missing brands from users API
//       setData([...validBrands, ...missingBrands]);

//     } catch (err) {
//       console.error("Failed to load brands:", err);
//     }
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleView(b: any) {
//     setProfileLoading(true);
//     setViewBrand(b);
//     try {
//       const token = localStorage.getItem("token");
//       const id = b._id || b.id;
//       if (!id) return;
//       const res = await fetch(`${BASE}/brand/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (res.ok) {
//         const json = await res.json();
//         const profile = json?.profile ?? json?.data ?? json;
//         setViewBrand({ ...b, ...profile, user: profile?.user ?? b?.user });
//       }
//     } catch (_) {}
//     setProfileLoading(false);
//   }

//   async function handleBan(id: string, isBanned: boolean) {
//     if (!id) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "Brand unbanned ✓" : "Brand banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!id) return;
//     if (!confirm("Delete this brand?")) return;
//     setActing(id);
//     const token = localStorage.getItem("token");
//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setMsg("Deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const filtered = data.filter((b) => {
//     const q = search.toLowerCase();
//     const ms =
//       (b.name        || "").toLowerCase().includes(q) ||
//       (b.email       || "").toLowerCase().includes(q) ||
//       (b.phone       || "").toLowerCase().includes(q) ||
//       (b.companyName || "").toLowerCase().includes(q) ||
//       (b.website     || "").toLowerCase().includes(q);
//     const mf =
//       filter === "all" ||
//       (filter === "subscribed" && b.isSubscribed)  ||
//       (filter === "free"       && !b.isSubscribed) ||
//       (filter === "banned"     && !b.isActive)     ||
//       (filter === "active"     && b.isActive);
//     return ms && mf;
//   });

//   const planBadge = (plan: string) => {
//     const isPro  = plan?.includes("pro");
//     const isPlus = plan?.includes("plus");
//     const bg     = isPlus ? "rgba(168,85,247,0.12)" : isPro ? "rgba(79,110,247,0.12)" : "rgba(74,85,104,0.2)";
//     const color  = isPlus ? "#a855f7" : isPro ? "#4f6ef7" : "#8892b0";
//     const border = isPlus ? "rgba(168,85,247,0.25)" : isPro ? "rgba(79,110,247,0.25)" : "rgba(74,85,104,0.3)";
//     return (
//       <span className="badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
//         {plan || "free"}
//       </span>
//     );
//   };

//   /* ── Profile Modal ── */
//   const ProfileModal = ({ b }: { b: any }) => {
//     const id   = b._id || b.id;
//     const uid  = b.user?._id || b.user?.id || id;
//     const cats = Array.isArray(b.categories)    ? b.categories    : b.categories    ? [b.categories]    : [];
//     const subs = Array.isArray(b.subCategories) ? b.subCategories : b.subCategories ? [b.subCategories] : [];

//     const Row = ({ label, val }: { label: string; val: React.ReactNode }) => (
//       <div className="profile-row">
//         <span className="profile-label">{label}</span>
//         <span className="profile-val">{val ?? <span style={{ color: "#4a5568" }}>—</span>}</span>
//       </div>
//     );

//     return (
//       <div className="modal-overlay" onClick={() => setViewBrand(null)}>
//         <div className="modal-box" onClick={(e) => e.stopPropagation()}>

//           <div className="modal-header">
//             <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
//               {b.profileImage
//                 ? <img src={b.profileImage} alt="" className="avatar-big" />
//                 : <div className="avatar-placeholder">🏢</div>
//               }
//               <div>
//                 <div style={{ fontWeight: 700, fontSize: 17, color: "#e8eaf6" }}>{b.name || "—"}</div>
//                 {b.companyName && (
//                   <div style={{ fontSize: 12, color: "#4f6ef7", marginTop: 2 }}>🏢 {b.companyName}</div>
//                 )}
//                 <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>{b.user?.email || b.email || "—"}</div>
//                 <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
//                   <span className="badge" style={{
//                     background: b.isActive ? "rgba(0,214,143,0.12)" : "rgba(255,71,87,0.12)",
//                     color:      b.isActive ? "#00d68f" : "#ff4757",
//                     border:     `1px solid ${b.isActive ? "rgba(0,214,143,0.25)" : "rgba(255,71,87,0.25)"}`,
//                   }}>
//                     {b.isActive ? "Active" : "Banned"}
//                   </span>
//                   {planBadge(b.plan)}
//                 </div>
//               </div>
//             </div>
//             <button className="close-btn" onClick={() => setViewBrand(null)}>✕</button>
//           </div>

//           {profileLoading && (
//             <div style={{ padding: "12px 24px", background: "rgba(79,110,247,0.05)", fontSize: 12, color: "#4f6ef7", display: "flex", alignItems: "center", gap: 8 }}>
//               <div style={{ width: 12, height: 12, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
//               Loading full profile...
//             </div>
//           )}

//           <div className="modal-body">
//             <div className="section-title">Basic Info</div>
//             <Row label="Profile ID"     val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id}</span>} />
//             <Row label="User ID"        val={<span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{uid}</span>} />
//             <Row label="Email"          val={<span style={{ color: "#8892b0" }}>{b.user?.email || b.email || "—"}</span>} />
//             <Row label="Name"           val={<span style={{ fontWeight: 600 }}>{b.name}</span>} />
//             <Row label="Company"        val={<span style={{ color: "#a855f7", fontWeight: 600 }}>{b.companyName}</span>} />
//             <Row label="Location"       val={b.location} />
//             <Row label="Bio"            val={<span style={{ color: "#8892b0", fontSize: 12, whiteSpace: "pre-line" }}>{b.bio}</span>} />

//             <div className="section-title">Contact</div>
//             <Row label="Phone" val={
//               b.phone
//                 ? <a href={`tel:${b.phone}`} style={{ color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
//                 : null
//             } />
//             <Row label="Website" val={
//               b.website
//                 ? <a
//                     href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
//                     target="_blank" rel="noopener noreferrer"
//                     style={{ color: "#00d4ff", textDecoration: "none" }}
//                   >{b.website}</a>
//                 : null
//             } />
//             <Row label="Platform" val={
//               b.platform
//                 ? <a href={b.platform} target="_blank" rel="noopener noreferrer"
//                     style={{ color: "#00d4ff", textDecoration: "none", fontSize: 12, wordBreak: "break-all" }}>
//                     {b.platform}
//                   </a>
//                 : null
//             } />

//             <div className="section-title">Subscription & KYC</div>
//             <Row label="Plan"           val={planBadge(b.plan)} />
//             <Row label="Subscribed"     val={
//               <span className="badge" style={{
//                 background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                 color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                 border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//               }}>
//                 {b.isSubscribed ? "Yes" : "No"}
//               </span>
//             } />
//             <Row label="KYC Status"     val={
//               <span className="badge" style={{
//                 background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                 color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                 border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//               }}>
//                 {b.kycStatus || "Pending"}
//               </span>
//             } />
//             <Row label="Profile Status" val={
//               <span className="badge" style={{
//                 background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                 color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                 border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//               }}>
//                 {b.profileStatus || "pending"}
//               </span>
//             } />
//             <Row label="Campaigns"      val={
//               <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4f6ef7", fontSize: 15 }}>
//                 {b.campaignsCreated ?? "0"}
//               </span>
//             } />
//             <Row label="Joined" val={
//               b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : null
//             } />

//             {cats.length > 0 && (
//               <>
//                 <div className="section-title">Categories</div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//                   {cats.map((c: string, i: number) => (
//                     <span key={i} className="badge" style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>{c}</span>
//                   ))}
//                 </div>
//               </>
//             )}

//             {subs.length > 0 && (
//               <>
//                 <div className="section-title">Sub-Categories</div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
//                   {subs.map((sc: string, i: number) => (
//                     <span key={i} className="badge" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>{sc}</span>
//                   ))}
//                 </div>
//               </>
//             )}

//             <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(79,110,247,0.1)", display: "flex", gap: 8 }}>
//               <button
//                 className="pg-btn"
//                 disabled={acting === id}
//                 onClick={() => { handleBan(id, !b.isActive); setViewBrand(null); }}
//                 style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)", padding: "6px 14px" }}
//               >
//                 {b.isActive ? "Ban Brand" : "Unban Brand"}
//               </button>
//               <button
//                 className="pg-btn"
//                 disabled={acting === id}
//                 onClick={() => { handleDelete(id); setViewBrand(null); }}
//                 style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)", padding: "6px 14px" }}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{S}</style>

//       {viewBrand && <ProfileModal b={viewBrand} />}

//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>Brands</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>
//             {loading ? "Loading..." : `${data.length} brands`}
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input
//             className="pg-input"
//             placeholder="Search name, email, phone, company..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             style={{ width: 260 }}
//           />
//           <select className="pg-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 140 }}>
//             <option value="all">All</option>
//             <option value="active">Active</option>
//             <option value="banned">Banned</option>
//             <option value="subscribed">Subscribed</option>
//             <option value="free">Free Plan</option>
//           </select>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
//         {[
//           { label: "Total",      color: "#a855f7", count: data.length },
//           { label: "Subscribed", color: "#00d68f", count: data.filter((b) => b.isSubscribed).length },
//           { label: "Free",       color: "#8892b0", count: data.filter((b) => !b.isSubscribed).length },
//           { label: "Banned",     color: "#ff4757", count: data.filter((b) => !b.isActive).length },
//         ].map((x, i) => (
//           <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <span style={{ fontSize: 13, color: "#8892b0" }}>{x.label}</span>
//             <span style={{ fontSize: 22, fontWeight: 700, color: x.color, fontFamily: "monospace" }}>{x.count}</span>
//           </div>
//         ))}
//       </div>

//       {msg && (
//         <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>
//           {msg}
//         </div>
//       )}

//       {/* Table */}
//       <div className="pg-card" style={{ overflow: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>
//               {["ID", "Name", "Email", "Phone", "Company", "Website", "Campaigns", "KYC", "Plan", "Subscribed", "Profile", "Joined", "Actions"].map((h) => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={13} style={{ textAlign: "center", padding: 40 }}>
//                 <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={13} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No brands found</td></tr>
//             ) : filtered.map((b: any) => {
//               const id = b._id || b.id;
//               if (!id) return null; // ✅ ghost brand skip

//               return (
//                 <tr key={id}>
//                   <td className="pg-td">
//                     <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span>
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontWeight: 600, fontSize: 13 }}>{b.name || "—"}</span>
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#8892b0" }}>{b.email || "—"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {b.phone
//                       ? <a href={`tel:${b.phone}`} style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}>{b.phone}</a>
//                       : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
//                     }
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 600 }}>{b.companyName || "—"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {b.website
//                       ? <a
//                           href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
//                           target="_blank" rel="noopener noreferrer"
//                           style={{ fontSize: 12, color: "#00d4ff", textDecoration: "none" }}
//                         >{b.website}</a>
//                       : <span style={{ fontSize: 12, color: "#4a5568" }}>—</span>
//                     }
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600 }}>
//                       {b.campaignsCreated ?? "0"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.kycStatus === "Verified" ? "rgba(0,214,143,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.kycStatus === "Verified" ? "#00d68f" : "#f5a623",
//                       border:     `1px solid ${b.kycStatus === "Verified" ? "rgba(0,214,143,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.kycStatus || "Pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td">{planBadge(b.plan)}</td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.isSubscribed ? "rgba(0,214,143,0.12)" : "rgba(74,85,104,0.2)",
//                       color:      b.isSubscribed ? "#00d68f" : "#8892b0",
//                       border:     `1px solid ${b.isSubscribed ? "rgba(0,214,143,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>
//                       {b.isSubscribed ? "Yes" : "No"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: b.profileStatus === "completed" ? "rgba(79,110,247,0.12)" : "rgba(245,166,35,0.12)",
//                       color:      b.profileStatus === "completed" ? "#4f6ef7" : "#f5a623",
//                       border:     `1px solid ${b.profileStatus === "completed" ? "rgba(79,110,247,0.25)" : "rgba(245,166,35,0.25)"}`,
//                     }}>
//                       {b.profileStatus || "pending"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <span style={{ fontSize: 12, color: "#4a5568" }}>
//                       {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}
//                     </span>
//                   </td>
//                   <td className="pg-td">
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button
//                         className="pg-btn"
//                         onClick={() => handleView(b)}
//                         style={{ color: "#4f6ef7", borderColor: "rgba(79,110,247,0.3)" }}
//                       >
//                         View
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleBan(id, !b.isActive)}
//                         style={{ color: b.isActive ? "#f5a623" : "#00d68f", borderColor: b.isActive ? "rgba(245,166,35,0.3)" : "rgba(0,214,143,0.3)" }}
//                       >
//                         {acting === id ? "..." : b.isActive ? "Ban" : "Unban"}
//                       </button>
//                       <button
//                         className="pg-btn"
//                         disabled={acting === id}
//                         onClick={() => handleDelete(id)}
//                         style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}
//                       >
//                         {acting === id ? "..." : "Delete"}
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