"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE = "https://api.collabzy.in/api/admin";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

// ── Field helpers ── backend uses isActive (not isBanned), phone lives in u.profile
const getBanned    = (u: any) => u.isActive === false;
const getPhone     = (u: any) => u.phone || u.profile?.phone || "";
const getImage     = (u: any) => u.profileImage || u.profile?.profileImage || "";
const getBio       = (u: any) => u.bio || u.profile?.bio || "";
const getLoc       = (u: any) => u.location || u.profile?.location || "";
const getFollowers = (u: any) => u.followers ?? u.profile?.followers ?? null;
const getPlatform  = (u: any) => u.platform || u.profile?.platform || "";
const getCats      = (u: any) => { const c = u.categories || u.profile?.categories || []; return Array.isArray(c) ? c : [c]; };
const getSubs      = (u: any) => { const s = u.subCategories || u.profile?.subCategories || []; return Array.isArray(s) ? s : [s]; };

const S = `
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
  .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
  .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
  tr:hover .pg-td{background:rgba(79,110,247,0.03);}
  .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;}
  .pg-input:focus{border-color:#4f6ef7;}
  .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
  .pg-btn:hover{border-color:rgba(79,110,247,0.4);color:#e8eaf6;}
  .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;}
  .modal-overlay{position:fixed;inset:0;background:rgba(5,8,20,0.85);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
  .modal-box{background:#141b30;border:1px solid rgba(79,110,247,0.2);border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:modalIn 0.22s ease;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
  .modal-header{padding:20px 24px 16px;border-bottom:1px solid rgba(79,110,247,0.1);display:flex;align-items:center;justify-content:space-between;}
  .modal-body{padding:24px;}
  .profile-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;font-size:13px;}
  .profile-label{color:#4a5568;min-width:130px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding-top:1px;}
  .profile-val{color:#e8eaf6;flex:1;word-break:break-word;}
  .close-btn{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.25);color:#ff4757;width:28px;height:28px;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .section-title{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4f6ef7;margin:16px 0 10px;border-left:2px solid #4f6ef7;padding-left:8px;}
  .avatar-big{width:68px;height:68px;border-radius:50%;object-fit:cover;border:2px solid rgba(79,110,247,0.3);}
  .avatar-placeholder{width:68px;height:68px;border-radius:50%;background:rgba(79,110,247,0.15);display:flex;align-items:center;justify-content:center;font-size:26px;border:2px solid rgba(79,110,247,0.2);}
`;

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("all");
  const [acting, setActing]     = useState<string | null>(null);
  const [msg, setMsg]           = useState("");
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [profLoading, setProfLoading] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { router.push("/login"); return; }
    const json = await res.json();
    setData(Array.isArray(json) ? json : json?.users ?? json?.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleView(u: any) {
    setViewUser(u);
    setProfLoading(true);
    try {
      const token = getToken();
      const id    = u._id || u.id;
      // For brands, try to get extra profile data (website etc.)
      if (u.role === "brand") {
        const res = await fetch(`${BASE}/brand/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          const ep = json?.profile ?? json?.data ?? json;
          setViewUser((prev: any) => ({ ...prev, _extra: ep }));
        }
      }
    } catch (_) {}
    setProfLoading(false);
  }

  // isActive=true → active; isActive=false → banned
  // API: { banned: true } = ban, { banned: false } = unban
  async function handleBan(id: string, currentlyBanned: boolean) {
    setActing(id);
    await fetch(`${BASE}/users/${id}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ banned: !currentlyBanned }),
    });
    setMsg(currentlyBanned ? "User unbanned ✓" : "User banned ✓");
    await load();
    setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    setActing(id);
    await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    setMsg("User deleted ✓");
    await load();
    setActing(null);
    setTimeout(() => setMsg(""), 3000);
  }

  const roles = [...new Set(data.map(u => u.role).filter(Boolean))];

  const filtered = data.filter(u => {
    const q = search.toLowerCase();
    const match =
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.profile?.name || "").toLowerCase().includes(q) ||
      getPhone(u).toLowerCase().includes(q);
    const matchR = roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter;
    return match && matchR;
  });

  const roleBadge = (role: string) => {
    const cfg: Record<string, [string,string,string]> = {
      influencer: ["rgba(168,85,247,0.12)","#a855f7","rgba(168,85,247,0.25)"],
      brand:      ["rgba(0,212,255,0.12)", "#00d4ff","rgba(0,212,255,0.25)"],
      admin:      ["rgba(255,71,87,0.12)", "#ff4757","rgba(255,71,87,0.25)"],
    };
    const [bg,color,border] = cfg[role] ?? ["rgba(74,85,104,0.2)","#8892b0","rgba(74,85,104,0.3)"];
    return <span className="badge" style={{background:bg,color,border:`1px solid ${border}`}}>{role||"user"}</span>;
  };

  /* ── Profile Modal ── */
  const ProfileModal = ({ u }: { u: any }) => {
    const id      = u._id || u.id;
    const banned  = getBanned(u);
    const ph      = getPhone(u);
    const img     = getImage(u);
    const bio     = getBio(u);
    const loc     = getLoc(u);
    const follows = getFollowers(u);
    const platform= getPlatform(u);
    const cats    = getCats(u).filter(Boolean);
    const subs    = getSubs(u).filter(Boolean);
    const ep      = u._extra;
    const website = ep?.website || u.website || "";
    const company = ep?.companyName || u.profile?.companyName || u.companyName || "";
    const displayName = u.profile?.name || u.name || "—";

    const Row = ({ label, val }: { label: string; val: React.ReactNode }) => (
      <div className="profile-row">
        <span className="profile-label">{label}</span>
        <span className="profile-val">{val ?? <span style={{color:"#4a5568"}}>—</span>}</span>
      </div>
    );

    const emoji = u.role === "brand" ? "🏢" : u.role === "admin" ? "🛡️" : "👤";

    return (
      <div className="modal-overlay" onClick={() => setViewUser(null)}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>

          <div className="modal-header">
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              {img
                ? <img src={img} alt="" className="avatar-big"/>
                : <div className="avatar-placeholder">{emoji}</div>
              }
              <div>
                <div style={{fontWeight:700,fontSize:17,color:"#e8eaf6"}}>{displayName}</div>
                {company && <div style={{fontSize:12,color:"#a855f7",marginTop:2}}>🏢 {company}</div>}
                <div style={{fontSize:12,color:"#4a5568",marginTop:2}}>{u.email}</div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  {roleBadge(u.role)}
                  <span className="badge" style={{
                    background: banned ? "rgba(255,71,87,0.12)" : "rgba(0,214,143,0.12)",
                    color:      banned ? "#ff4757" : "#00d68f",
                    border:     `1px solid ${banned ? "rgba(255,71,87,0.25)" : "rgba(0,214,143,0.25)"}`,
                  }}>{banned ? "Banned" : "Active"}</span>
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setViewUser(null)}>✕</button>
          </div>

          {profLoading && (
            <div style={{padding:"10px 24px",background:"rgba(79,110,247,0.05)",fontSize:12,color:"#4f6ef7",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:12,height:12,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
              Loading full profile...
            </div>
          )}

          <div className="modal-body">
            <div className="section-title">Account Info</div>
            <Row label="User ID"        val={<span style={{fontFamily:"monospace",fontSize:11,color:"#4a5568"}}>{id}</span>}/>
            <Row label="Role"           val={roleBadge(u.role)}/>
            <Row label="Email"          val={<span style={{color:"#8892b0"}}>{u.email}</span>}/>
            <Row label="Email Verified" val={
              u.isEmailVerified
                ? <span className="badge" style={{background:"rgba(0,214,143,0.12)",color:"#00d68f",border:"1px solid rgba(0,214,143,0.25)"}}>✓ Yes</span>
                : <span className="badge" style={{background:"rgba(74,85,104,0.2)",color:"#8892b0",border:"1px solid rgba(74,85,104,0.3)"}}>No</span>
            }/>
            <Row label="Plan" val={
              <span className="badge" style={{background:"rgba(79,110,247,0.12)",color:"#4f6ef7",border:"1px solid rgba(79,110,247,0.25)"}}>{u.plan||"free"}</span>
            }/>
            <Row label="Bits"     val={<span style={{fontFamily:"monospace",color:"#f5a623",fontWeight:700}}>{u.bits??0}</span>}/>
            <Row label="Apps Used"val={<span style={{fontFamily:"monospace",color:"#8892b0"}}>{u.applicationsUsed??0}</span>}/>
            <Row label="Joined"   val={u.createdAt ? new Date(u.createdAt).toLocaleString("en-IN") : null}/>

            <div className="section-title">Profile</div>
            <Row label="Display Name" val={<span style={{fontWeight:600}}>{displayName}</span>}/>
            {company && <Row label="Company" val={<span style={{color:"#a855f7",fontWeight:600}}>{company}</span>}/>}
            <Row label="Location" val={loc}/>
            {bio && <Row label="Bio" val={<span style={{color:"#8892b0",fontSize:12,whiteSpace:"pre-line"}}>{bio}</span>}/>}

            <div className="section-title">Contact</div>
            <Row label="Phone" val={
              ph ? <a href={`tel:${ph}`} style={{color:"#00d4ff",textDecoration:"none"}}>{ph}</a> : null
            }/>
            {website && (
              <Row label="Website" val={
                <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" style={{color:"#00d4ff",textDecoration:"none"}}>{website}</a>
              }/>
            )}
            {platform && (
              <Row label="Platform" val={
                <a href={platform} target="_blank" rel="noopener noreferrer" style={{color:"#00d4ff",textDecoration:"none",fontSize:12,wordBreak:"break-all"}}>{platform}</a>
              }/>
            )}

            {follows !== null && (
              <>
                <div className="section-title">Stats</div>
                <Row label="Followers" val={
                  <span style={{fontFamily:"monospace",fontWeight:700,color:"#4f6ef7",fontSize:15}}>
                    {Number(follows).toLocaleString("en-IN")}
                  </span>
                }/>
              </>
            )}

            {cats.length > 0 && (
              <>
                <div className="section-title">Categories</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                  {cats.map((c:string,i:number) => (
                    <span key={i} className="badge" style={{background:"rgba(0,212,255,0.12)",color:"#00d4ff",border:"1px solid rgba(0,212,255,0.25)"}}>{c}</span>
                  ))}
                </div>
              </>
            )}

            {subs.length > 0 && (
              <>
                <div className="section-title">Sub-Categories</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                  {subs.map((sc:string,i:number) => (
                    <span key={i} className="badge" style={{background:"rgba(167,139,250,0.12)",color:"#a78bfa",border:"1px solid rgba(167,139,250,0.25)"}}>{sc}</span>
                  ))}
                </div>
              </>
            )}

            {u.role !== "admin" && (
              <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(79,110,247,0.1)",display:"flex",gap:8}}>
                <button
                  className="pg-btn"
                  disabled={acting === id}
                  onClick={() => { handleBan(id, banned); setViewUser(null); }}
                  style={{color: banned?"#00d68f":"#f5a623", borderColor: banned?"rgba(0,214,143,0.3)":"rgba(245,166,35,0.3)", padding:"6px 14px"}}
                >
                  {banned ? "Unban User" : "Ban User"}
                </button>
                <button
                  className="pg-btn"
                  disabled={acting === id}
                  onClick={() => { handleDelete(id); setViewUser(null); }}
                  style={{color:"#ff4757",borderColor:"rgba(255,71,87,0.3)",padding:"6px 14px"}}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <style>{S}</style>
      {viewUser && <ProfileModal u={viewUser} />}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#e8eaf6"}}>All Users</h1>
          <p style={{fontSize:13,color:"#4a5568",marginTop:3}}>{loading ? "Loading..." : `${data.length} users registered`}</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <input className="pg-input" placeholder="Search name, email, phone..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:240}}/>
          <select className="pg-input" value={roleFilter} onChange={e=>setRole(e.target.value)} style={{width:130}}>
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Total",       value:data.length,                                                            color:"#4f6ef7"},
          {label:"Influencers", value:data.filter(u=>(u.role||"").toLowerCase()==="influencer").length,      color:"#a855f7"},
          {label:"Brands",      value:data.filter(u=>(u.role||"").toLowerCase()==="brand").length,           color:"#00d4ff"},
          {label:"Banned",      value:data.filter(u=>getBanned(u)).length,                                   color:"#ff4757"},
        ].map((s,i) => (
          <div key={i} className="pg-card" style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:"#8892b0"}}>{s.label}</span>
            <span style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:"monospace"}}>{s.value}</span>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{background:"rgba(0,214,143,0.1)",border:"1px solid rgba(0,214,143,0.25)",borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#00d68f"}}>
          {msg}
        </div>
      )}

      {/* Table */}
      <div className="pg-card" style={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0}}>
          <thead>
            <tr>
              {["ID","Name","Email","Phone","Role","Email Verified","Status","Joined","Actions"].map(h => (
                <th key={h} className="pg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{textAlign:"center",padding:40}}>
                <div style={{width:24,height:24,border:"2px solid rgba(79,110,247,0.2)",borderTopColor:"#4f6ef7",borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto"}}/>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="pg-td" style={{textAlign:"center",color:"#4a5568"}}>No users found</td></tr>
            ) : filtered.map((u:any) => {
              const id     = u._id || u.id;
              const banned = getBanned(u);
              const ph     = getPhone(u);
              const img    = getImage(u);
              const displayName = u.profile?.name || u.name || "—";
              return (
                <tr key={id}>
                  <td className="pg-td"><span style={{fontFamily:"monospace",fontSize:11,color:"#4a5568"}}>{id?.slice(-6)}</span></td>

                  <td className="pg-td">
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {img && <img src={img} alt="" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(79,110,247,0.2)",flexShrink:0}}/>}
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{displayName}</div>
                        {u.profile?.name && u.profile.name !== u.name && (
                          <div style={{fontSize:11,color:"#4a5568"}}>({u.name})</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="pg-td"><span style={{fontSize:12,color:"#8892b0"}}>{u.email}</span></td>

                  <td className="pg-td">
                    {ph
                      ? <a href={`tel:${ph}`} style={{fontSize:12,color:"#00d4ff",textDecoration:"none"}}>{ph}</a>
                      : <span style={{fontSize:12,color:"#4a5568"}}>—</span>
                    }
                  </td>

                  <td className="pg-td">{roleBadge(u.role)}</td>

                  <td className="pg-td">
                    {u.isEmailVerified
                      ? <span className="badge" style={{background:"rgba(0,214,143,0.12)",color:"#00d68f",border:"1px solid rgba(0,214,143,0.25)"}}>✓ Yes</span>
                      : <span className="badge" style={{background:"rgba(74,85,104,0.2)",color:"#8892b0",border:"1px solid rgba(74,85,104,0.3)"}}>No</span>
                    }
                  </td>

                  <td className="pg-td">
                    <span className="badge" style={{
                      background: banned ? "rgba(255,71,87,0.12)" : "rgba(0,214,143,0.12)",
                      color:      banned ? "#ff4757" : "#00d68f",
                      border:     `1px solid ${banned ? "rgba(255,71,87,0.25)" : "rgba(0,214,143,0.25)"}`,
                    }}>{banned ? "Banned" : "Active"}</span>
                  </td>

                  <td className="pg-td"><span style={{fontSize:12,color:"#4a5568"}}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</span></td>

                  <td className="pg-td">
                    <div style={{display:"flex",gap:5}}>
                      <button className="pg-btn" onClick={() => handleView(u)} style={{color:"#4f6ef7",borderColor:"rgba(79,110,247,0.3)"}}>
                        View
                      </button>
                      <button
                        className="pg-btn"
                        disabled={acting===id || u.role==="admin"}
                        onClick={() => handleBan(id, banned)}
                        style={{color: banned?"#00d68f":"#f5a623", borderColor: banned?"rgba(0,214,143,0.3)":"rgba(245,166,35,0.3)"}}
                      >
                        {acting===id ? "..." : banned ? "Unban" : "Ban"}
                      </button>
                      <button
                        className="pg-btn"
                        disabled={acting===id || u.role==="admin"}
                        onClick={() => handleDelete(id)}
                        style={{color:"#ff4757",borderColor:"rgba(255,71,87,0.3)"}}
                      >
                        {acting===id ? "..." : "Delete"}
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

// function getToken() {
//   return typeof window !== "undefined" ? localStorage.getItem("token") : null;
// }

// export default function AdminUsersPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [roleFilter, setRole] = useState("all");
//   const [acting, setActing]   = useState<string | null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = getToken();
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.users ?? json?.data ?? []);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this user permanently?")) return;
//     setActing(id);
//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     setMsg("User deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const roles = [...new Set(data.map(u => u.role).filter(Boolean))];
//   const filtered = data.filter(u => {
//     const q = search.toLowerCase();
//     const matchS = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
//     const matchR = roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter;
//     return matchS && matchR;
//   });

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{`
//         @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
//         @keyframes spin { to{transform:rotate(360deg)} }
//         .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//         .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//         .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//         tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//         .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;}
//         .pg-input:focus{border-color:#4f6ef7;}
//         .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//         .pg-btn:hover{border-color:rgba(79,110,247,0.4);color:#e8eaf6;}
//         .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//         .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;}
//       `}</style>

//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>All Users</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>{loading ? "Loading..." : `${data.length} users registered`}</p>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input className="pg-input" placeholder="Search name, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
//           <select className="pg-input" value={roleFilter} onChange={e => setRole(e.target.value)} style={{ width: 130 }}>
//             <option value="all">All Roles</option>
//             {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* Summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
//         {[
//           { label: "Total",       value: data.length,                                                              color: "#4f6ef7" },
//           { label: "Influencers", value: data.filter(u => (u.role||"").toLowerCase() === "influencer").length,    color: "#a855f7" },
//           { label: "Brands",      value: data.filter(u => (u.role||"").toLowerCase() === "brand").length,         color: "#00d4ff" },
//           { label: "Banned",      value: data.filter(u => u.isBanned).length,                                     color: "#ff4757" },
//         ].map((s, i) => (
//           <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <span style={{ fontSize: 13, color: "#8892b0" }}>{s.label}</span>
//             <span style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</span>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow: "hidden" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>
//               {["ID", "Name", "Email", "Role", "Verified", "Status", "Joined", "Actions"].map(h => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
//                 <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={8} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No users found</td></tr>
//             ) : filtered.map((u: any) => {
//               const id = u._id || u.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td">
//                     <div style={{ fontWeight: 600 }}>{u.name ||u.profile?.name}</div>
//                     {u.name && <div style={{ fontSize: 11, color: "#4a5568" }}>@{u.name}</div>}
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize: 12.5, color: "#8892b0" }}>{u.email}</span></td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: u.role === "influencer" ? "rgba(168,85,247,0.12)" : u.role === "brand" ? "rgba(0,212,255,0.12)" : u.role === "admin" ? "rgba(255,71,87,0.12)" : "rgba(74,85,104,0.2)",
//                       color: u.role === "influencer" ? "#a855f7" : u.role === "brand" ? "#00d4ff" : u.role === "admin" ? "#ff4757" : "#8892b0",
//                       border: `1px solid ${u.role === "influencer" ? "rgba(168,85,247,0.25)" : u.role === "brand" ? "rgba(0,212,255,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>{u.role || "user"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {u.isVerified
//                       ? <span className="badge" style={{ background: "rgba(0,214,143,0.12)", color: "#00d68f", border: "1px solid rgba(0,214,143,0.25)" }}>✓ Yes</span>
//                       : <span className="badge" style={{ background: "rgba(74,85,104,0.2)", color: "#8892b0", border: "1px solid rgba(74,85,104,0.3)" }}>No</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: u.isBanned ? "rgba(255,71,87,0.12)" : "rgba(0,214,143,0.12)",
//                       color: u.isBanned ? "#ff4757" : "#00d68f",
//                       border: `1px solid ${u.isBanned ? "rgba(255,71,87,0.25)" : "rgba(0,214,143,0.25)"}`,
//                     }}>{u.isBanned ? "Banned" : "Active"}</span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize: 12, color: "#4a5568" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button className="pg-btn" disabled={acting === id || u.role === "admin"}
//                         onClick={() => handleBan(id, u.isBanned)}
//                         style={{ color: u.isBanned ? "#00d68f" : "#f5a623", borderColor: u.isBanned ? "rgba(0,214,143,0.3)" : "rgba(245,166,35,0.3)" }}>
//                         {acting === id ? "..." : u.isBanned ? "Unban" : "Ban"}
//                       </button>
//                       <button className="pg-btn" disabled={acting === id || u.role === "admin"}
//                         onClick={() => handleDelete(id)}
//                         style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}>
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

// function getToken() {
//   return typeof window !== "undefined" ? localStorage.getItem("token") : null;
// }

// export default function AdminUsersPage() {
//   const router = useRouter();
//   const [data, setData]       = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState("");
//   const [roleFilter, setRole] = useState("all");
//   const [acting, setActing]   = useState<string | null>(null);
//   const [msg, setMsg]         = useState("");

//   async function load() {
//     const token = getToken();
//     if (!token) { router.push("/login"); return; }
//     setLoading(true);
//     const res = await fetch(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
//     if (res.status === 401) { router.push("/login"); return; }
//     const json = await res.json();
//     setData(Array.isArray(json) ? json : json?.users ?? json?.data ?? []);
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function handleBan(id: string, isBanned: boolean) {
//     setActing(id);
//     await fetch(`${BASE}/users/${id}/ban`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
//       body: JSON.stringify({ banned: !isBanned }),
//     });
//     setMsg(isBanned ? "User unbanned ✓" : "User banned ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this user permanently?")) return;
//     setActing(id);
//     await fetch(`${BASE}/users/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     setMsg("User deleted ✓");
//     await load();
//     setActing(null);
//     setTimeout(() => setMsg(""), 3000);
//   }

//   const roles = [...new Set(data.map(u => u.role).filter(Boolean))];
//   const filtered = data.filter(u => {
//     const q = search.toLowerCase();
//     const matchS = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
//     const matchR = roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter;
//     return matchS && matchR;
//   });

//   return (
//     <div style={{ padding: 24 }}>
//       <style>{`
//         @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
//         @keyframes spin { to{transform:rotate(360deg)} }
//         .pg-card{background:#141b30;border:1px solid rgba(79,110,247,0.15);border-radius:12px;}
//         .pg-th{background:#0f1526;color:#4a5568;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:12px 16px;text-align:left;border-bottom:1px solid rgba(79,110,247,0.1);}
//         .pg-td{padding:13px 16px;border-bottom:1px solid rgba(79,110,247,0.05);font-size:13.5px;color:#e8eaf6;vertical-align:middle;}
//         tr:hover .pg-td{background:rgba(79,110,247,0.03);}
//         .pg-input{background:#0f1526;border:1px solid rgba(79,110,247,0.15);color:#e8eaf6;padding:8px 12px;border-radius:7px;font-size:13px;outline:none;}
//         .pg-input:focus{border-color:#4f6ef7;}
//         .pg-btn{background:transparent;border:1px solid rgba(79,110,247,0.2);color:#8892b0;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;}
//         .pg-btn:hover{border-color:rgba(79,110,247,0.4);color:#e8eaf6;}
//         .pg-btn:disabled{opacity:0.4;cursor:not-allowed;}
//         .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;}
//       `}</style>

//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6" }}>All Users</h1>
//           <p style={{ fontSize: 13, color: "#4a5568", marginTop: 3 }}>{loading ? "Loading..." : `${data.length} users registered`}</p>
//         </div>
//         <div style={{ display: "flex", gap: 10 }}>
//           <input className="pg-input" placeholder="Search name, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
//           <select className="pg-input" value={roleFilter} onChange={e => setRole(e.target.value)} style={{ width: 130 }}>
//             <option value="all">All Roles</option>
//             {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* Summary */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
//         {[
//           { label: "Total",       value: data.length,                                                              color: "#4f6ef7" },
//           { label: "Influencers", value: data.filter(u => (u.role||"").toLowerCase() === "influencer").length,    color: "#a855f7" },
//           { label: "Brands",      value: data.filter(u => (u.role||"").toLowerCase() === "brand").length,         color: "#00d4ff" },
//           { label: "Banned",      value: data.filter(u => u.isBanned).length,                                     color: "#ff4757" },
//         ].map((s, i) => (
//           <div key={i} className="pg-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <span style={{ fontSize: 13, color: "#8892b0" }}>{s.label}</span>
//             <span style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</span>
//           </div>
//         ))}
//       </div>

//       {msg && <div style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#00d68f" }}>{msg}</div>}

//       <div className="pg-card" style={{ overflow: "hidden" }}>
//         <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
//           <thead>
//             <tr>
//               {["ID", "Name", "Email", "Role", "Verified", "Status", "Joined", "Actions"].map(h => (
//                 <th key={h} className="pg-th">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
//                 <div style={{ width: 24, height: 24, border: "2px solid rgba(79,110,247,0.2)", borderTopColor: "#4f6ef7", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
//               </td></tr>
//             ) : filtered.length === 0 ? (
//               <tr><td colSpan={8} className="pg-td" style={{ textAlign: "center", color: "#4a5568" }}>No users found</td></tr>
//             ) : filtered.map((u: any) => {
//               const id = u._id || u.id;
//               return (
//                 <tr key={id}>
//                   <td className="pg-td"><span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a5568" }}>{id?.slice(-6)}</span></td>
//                   <td className="pg-td">
//                     <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
//                     {u.username && <div style={{ fontSize: 11, color: "#4a5568" }}>@{u.username}</div>}
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize: 12.5, color: "#8892b0" }}>{u.email}</span></td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: u.role === "influencer" ? "rgba(168,85,247,0.12)" : u.role === "brand" ? "rgba(0,212,255,0.12)" : u.role === "admin" ? "rgba(255,71,87,0.12)" : "rgba(74,85,104,0.2)",
//                       color: u.role === "influencer" ? "#a855f7" : u.role === "brand" ? "#00d4ff" : u.role === "admin" ? "#ff4757" : "#8892b0",
//                       border: `1px solid ${u.role === "influencer" ? "rgba(168,85,247,0.25)" : u.role === "brand" ? "rgba(0,212,255,0.25)" : "rgba(74,85,104,0.3)"}`,
//                     }}>{u.role || "user"}</span>
//                   </td>
//                   <td className="pg-td">
//                     {u.isVerified
//                       ? <span className="badge" style={{ background: "rgba(0,214,143,0.12)", color: "#00d68f", border: "1px solid rgba(0,214,143,0.25)" }}>✓ Yes</span>
//                       : <span className="badge" style={{ background: "rgba(74,85,104,0.2)", color: "#8892b0", border: "1px solid rgba(74,85,104,0.3)" }}>No</span>}
//                   </td>
//                   <td className="pg-td">
//                     <span className="badge" style={{
//                       background: u.isBanned ? "rgba(255,71,87,0.12)" : "rgba(0,214,143,0.12)",
//                       color: u.isBanned ? "#ff4757" : "#00d68f",
//                       border: `1px solid ${u.isBanned ? "rgba(255,71,87,0.25)" : "rgba(0,214,143,0.25)"}`,
//                     }}>{u.isBanned ? "Banned" : "Active"}</span>
//                   </td>
//                   <td className="pg-td"><span style={{ fontSize: 12, color: "#4a5568" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</span></td>
//                   <td className="pg-td">
//                     <div style={{ display: "flex", gap: 5 }}>
//                       <button className="pg-btn" disabled={acting === id || u.role === "admin"}
//                         onClick={() => handleBan(id, u.isBanned)}
//                         style={{ color: u.isBanned ? "#00d68f" : "#f5a623", borderColor: u.isBanned ? "rgba(0,214,143,0.3)" : "rgba(245,166,35,0.3)" }}>
//                         {acting === id ? "..." : u.isBanned ? "Unban" : "Ban"}
//                       </button>
//                       <button className="pg-btn" disabled={acting === id || u.role === "admin"}
//                         onClick={() => handleDelete(id)}
//                         style={{ color: "#ff4757", borderColor: "rgba(255,71,87,0.3)" }}>
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