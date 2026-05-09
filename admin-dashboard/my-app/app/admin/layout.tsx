"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/admin",              label: "Dashboard",    icon: "⬡",  section: null         },
  { href: "/admin/users",        label: "All Users",    icon: "👥",  section: "Users"      },
  { href: "/admin/influencers",  label: "Influencers",  icon: "✨",  section: null, sub: true },
  { href: "/admin/brands",       label: "Brands",       icon: "🏢",  section: null, sub: true },
  { href: "/admin/campaigns",    label: "Campaigns",    icon: "📣",  section: "Manage"     },
  { href: "/admin/applications", label: "Applications", icon: "📋",  section: null         },
  { href: "/admin/deals",        label: "Deals",        icon: "🤝",  section: null         },
  { href: "/admin/deliverables", label: "Deliverables", icon: "📦",  section: null         },
  { href: "/admin/payments",     label: "Payments",     icon: "💳",  section: null         },
  { href: "/admin/tokens",       label: "Tokens",       icon: "🪙",  section: null         },
  { href: "/admin/reviews",      label: "Reviews",      icon: "★",   section: "More"       },
  { href: "/admin/disputes",     label: "Disputes",     icon: "⚠",   section: null         },
];

// ── THEME TOKENS ──────────────────────────────────────────────
const DARK = {
  bg:          "#0a0e1a",
  sidebar:     "#0f1526",
  card:        "#141b30",
  hover:       "#1a2240",
  border:      "rgba(79,110,247,0.12)",
  borderBr:    "rgba(79,110,247,0.3)",
  topbar:      "rgba(15,21,38,0.97)",
  text:        "#e8eaf6",
  textSub:     "#8892b0",
  textMuted:   "#4a5568",
  activeText:  "#4f6ef7",
  activeBg:    "rgba(79,110,247,0.12)",
  secLabel:    "#4a5568",
  logoutBorder:"rgba(255,71,87,0.3)",
  logoutText:  "#ff4757",
  toggleBg:    "#141b30",
  toggleBorder:"rgba(79,110,247,0.2)",
};

const LIGHT = {
  bg:          "#f0f2f8",
  sidebar:     "#ffffff",
  card:        "#ffffff",
  hover:       "#f5f7ff",
  border:      "rgba(79,110,247,0.15)",
  borderBr:    "rgba(79,110,247,0.4)",
  topbar:      "rgba(255,255,255,0.97)",
  text:        "#1a2240",
  textSub:     "#4a5568",
  textMuted:   "#94a3b8",
  activeText:  "#4f6ef7",
  activeBg:    "rgba(79,110,247,0.08)",
  secLabel:    "#94a3b8",
  logoutBorder:"rgba(255,71,87,0.3)",
  logoutText:  "#ff4757",
  toggleBg:    "#f0f2f8",
  toggleBorder:"rgba(79,110,247,0.2)",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Dark mode state — persisted in localStorage
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("admin_theme");
    if (saved === "light") setDark(false);
    else setDark(true);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("admin_theme", next ? "dark" : "light");
  }

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  const T = dark ? DARK : LIGHT;
  const pageTitle = NAV.find(n => n.href === pathname)?.label ?? "Admin";
  const adminName = typeof window !== "undefined" ? localStorage.getItem("admin_name") || "Super Admin" : "Super Admin";

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: T.bg,
      fontFamily: "'Space Grotesk', sans-serif",
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        * { transition: background-color 0.25s, border-color 0.25s, color 0.25s; }

        .sl {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 13px;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          text-decoration: none;
          position: relative;
        }

        .toggle-btn {
          width: 44px; height: 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.3s;
          flex-shrink: 0;
        }
        .toggle-knob {
          position: absolute;
          top: 3px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: white;
          transition: left 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(79,110,247,0.2); border-radius: 2px; }

        /* Page content font size boost */
        .admin-content { font-size: 15px; }
        .admin-content h1 { font-size: 22px !important; }
        .admin-content p  { font-size: 14px !important; }

        /* Table text bigger */
        .pg-th { font-size: 12px !important; padding: 13px 16px !important; }
        .pg-td { font-size: 15px !important; padding: 14px 16px !important; }

        /* Badge bigger */
        .badge { font-size: 12px !important; padding: 3px 11px !important; }

        /* Input bigger */
        .pg-input { font-size: 14px !important; padding: 10px 14px !important; }
        .pg-btn   { font-size: 12px !important; padding: 5px 12px !important; }

        /* Stat cards */
        .pg-card { background: ${T.card}; border-color: ${T.border}; }
      `}</style>

      {/* ── SIDEBAR ───────────────────────────────────── */}
      <div style={{
        width: 230, minWidth: 230,
        background: T.sidebar,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        height: "100vh", position: "sticky", top: 0,
        boxShadow: dark ? "none" : "2px 0 12px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 18px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
              width: 38, height: 38,
              background: "linear-gradient(135deg, #4f6ef7, #a855f7)",
              borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, fontWeight: 700, color: "white",
              boxShadow: "0 4px 12px rgba(79,110,247,0.35)",
            }}>C</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>Collabzy</div>
              <div style={{ fontSize: 10.5, color: T.textMuted, letterSpacing: "1.4px", textTransform: "uppercase" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {NAV.map((item, i) => {
            const isActive  = pathname === item.href;
            const prevItem  = NAV[i - 1];
            const showSection = item.section && item.section !== prevItem?.section;

            return (
              <div key={item.href}>
                {showSection && (
                  <div style={{ fontSize: 11, color: T.secLabel, letterSpacing: "1.2px", textTransform: "uppercase", padding: "10px 13px 4px", fontWeight: 600 }}>
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  className="sl"
                  style={{
                    color:      isActive ? T.activeText : T.textSub,
                    background: isActive ? T.activeBg   : "transparent",
                    paddingLeft: item.sub ? 30 : 13,
                    fontSize:   item.sub ? 14 : 15,
                    ...(isActive ? {
                      boxShadow: dark ? "none" : "0 2px 8px rgba(79,110,247,0.1)",
                    } : {}),
                  }}
                >
                  {isActive && (
                    <span style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:22, background:"#4f6ef7", borderRadius:"0 2px 2px 0" }} />
                  )}
                  <span style={{ fontSize: item.sub ? 10 : 16, width: 20, textAlign: "center", color: item.sub && !isActive ? "#4f6ef7" : "inherit" }}>
                    {item.sub ? "✦" : item.icon}
                  </span>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "14px 14px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg, #4f6ef7, #a855f7)",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white",
            }}>
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {adminName}
              </div>
              <div style={{ fontSize: 11.5, color: T.textMuted }}>Administrator</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", background: "transparent",
              border: `1px solid ${T.logoutBorder}`,
              color: T.logoutText, padding: "8px", borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,71,87,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── MAIN ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{
          height: 60,
          background: T.topbar,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(12px)",
          boxShadow: dark ? "none" : "0 1px 8px rgba(0,0,0,0.06)",
        }}>
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{pageTitle}</span>
            <span style={{
              padding: "3px 11px",
              background: "rgba(79,110,247,0.1)",
              border: "1px solid rgba(79,110,247,0.25)",
              borderRadius: 20, fontSize: 12,
              color: "#4f6ef7", fontWeight: 600, letterSpacing: "0.5px",
            }}>LIVE</span>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

            {/* Online dot */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, background: "#00d68f", borderRadius: "50%", boxShadow: "0 0 6px #00d68f" }} />
              <span style={{ fontSize: 13, color: T.textSub }}>System Online</span>
            </div>

            {/* Dark / Light Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>{dark ? "🌙" : "☀️"}</span>
              <button
                className="toggle-btn"
                onClick={toggleTheme}
                title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{ background: dark ? "#4f6ef7" : "#cbd5e1" }}
              >
                <div
                  className="toggle-knob"
                  style={{ left: dark ? 23 : 3 }}
                />
              </button>
              <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>
                {dark ? "Dark" : "Light"}
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div
          className="admin-content"
          style={{ flex: 1, overflowY: "auto", background: T.bg, color: T.text }}
        >
          {/* Pass theme colors via CSS variables so child pages can use them */}
          <style>{`
            :root {
              --pg-bg:        ${T.bg};
              --pg-card:      ${T.card};
              --pg-sidebar:   ${T.sidebar};
              --pg-border:    ${T.border};
              --pg-text:      ${T.text};
              --pg-text-sub:  ${T.textSub};
              --pg-text-muted:${T.textMuted};
              --pg-hover:     ${T.hover};
            }
            /* Override page styles with theme */
            .pg-card {
              background: ${T.card} !important;
              border-color: ${T.border} !important;
            }
            .pg-th {
              background: ${dark ? "#0f1526" : "#f8fafc"} !important;
              color: ${T.textMuted} !important;
            }
            .pg-td { color: ${T.text} !important; }
            tr:hover .pg-td { background: ${dark ? "rgba(79,110,247,0.03)" : "rgba(79,110,247,0.03)"} !important; }
            .pg-input {
              background: ${dark ? "#141b30" : "#f8fafc"} !important;
              border-color: ${T.border} !important;
              color: ${T.text} !important;
            }
            .pg-input::placeholder { color: ${T.textMuted} !important; }
            .pg-input:focus { border-color: #4f6ef7 !important; }

            /* Stat card numbers */
            .pg-card > div { color: ${T.text}; }

            /* Section headings in pages */
            h1 { color: ${T.text} !important; }
            p  { color: ${T.textMuted} !important; }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  );
}




// "use client";
// import { usePathname, useRouter } from "next/navigation";
// import Link from "next/link";

// const NAV = [
//   { href: "/admin",               label: "Dashboard",    icon: "⬡",  section: null         },
//   { href: "/admin/users",         label: "All Users",    icon: "👥",  section: "Users"      },
//   { href: "/admin/influencers",   label: "Influencers",  icon: "✨",  section: null, sub: true },
//   { href: "/admin/brands",        label: "Brands",       icon: "🏢",  section: null, sub: true },
//   { href: "/admin/campaigns",     label: "Campaigns",    icon: "📣",  section: "Manage"     },
//   { href: "/admin/applications",  label: "Applications", icon: "📋",  section: null         },
//   { href: "/admin/deals",         label: "Deals",        icon: "🤝",  section: null         },
//   { href: "/admin/deliverables",  label: "Deliverables", icon: "📦",  section: null         },
//   { href: "/admin/payments",      label: "Payments",     icon: "💳",  section: null         },
//   { href: "/admin/tokens",        label: "Tokens",       icon: "🪙",  section: null         },
//   { href: "/admin/reviews",       label: "Reviews",      icon: "★",   section: "More"       },
//   { href: "/admin/disputes",      label: "Disputes",     icon: "⚠",   section: null         },
// ];

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const router   = useRouter();

//   function logout() {
//     localStorage.removeItem("token");
//     router.push("/login");
//   }

//   const pageTitle = NAV.find(n => n.href === pathname)?.label ?? "Admin";

//   return (
//     <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0e1a", fontFamily: "'Space Grotesk', sans-serif" }}>
//       <style>{`
//         .sl { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; font-size:13.5px; font-weight:500; color:#8892b0; cursor:pointer; transition:all 0.18s; text-decoration:none; position:relative; }
//         .sl:hover { color:#e8eaf6; background:rgba(79,110,247,0.08); }
//         .sl.active { color:#4f6ef7; background:rgba(79,110,247,0.12); }
//         .sl.active::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:20px; background:#4f6ef7; border-radius:0 2px 2px 0; }
//         .sec-label { font-size:10px; color:#4a5568; letter-spacing:1.2px; text-transform:uppercase; padding:10px 12px 3px; font-weight:600; }
//       `}</style>

//       {/* ── SIDEBAR ── */}
//       <div style={{
//         width: 220, minWidth: 220,
//         background: "#0f1526",
//         borderRight: "1px solid rgba(79,110,247,0.12)",
//         display: "flex", flexDirection: "column",
//         height: "100vh", position: "sticky", top: 0,
//       }}>
//         {/* Logo */}
//         <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(79,110,247,0.1)" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{
//               width: 34, height: 34,
//               background: "linear-gradient(135deg, #4f6ef7, #a855f7)",
//               borderRadius: 8, display: "flex", alignItems: "center",
//               justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white",
//             }}>I</div>
//             <div>
//               <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf6", letterSpacing: "-0.3px" }}>InfluenceHub</div>
//               <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "1.5px", textTransform: "uppercase" }}>Admin Panel</div>
//             </div>
//           </div>
//         </div>

//         {/* Nav */}
//         <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
//           {NAV.map((item, i) => {
//             const isActive = pathname === item.href;
//             const prevItem = NAV[i - 1];
//             const showSection = item.section && item.section !== prevItem?.section;

//             return (
//               <div key={item.href}>
//                 {showSection && <div className="sec-label">{item.section}</div>}
//                 <Link
//                   href={item.href}
//                   className={`sl ${isActive ? "active" : ""}`}
//                   style={item.sub ? { paddingLeft: 28, fontSize: 13 } : {}}
//                 >
//                   <span style={{ fontSize: item.sub ? 9 : 15, width: 18, textAlign: "center", color: item.sub ? "#4f6ef7" : "inherit" }}>
//                     {item.sub ? "✦" : item.icon}
//                   </span>
//                   {item.label}
//                 </Link>
//               </div>
//             );
//           })}
//         </nav>

//         {/* Admin info + logout */}
//         <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(79,110,247,0.1)" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
//             <div style={{
//               width: 32, height: 32,
//               background: "linear-gradient(135deg, #4f6ef7, #a855f7)",
//               borderRadius: "50%", display: "flex", alignItems: "center",
//               justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white",
//             }}>SA</div>
//             <div>
//               <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e8eaf6" }}>Super Admin</div>
//               <div style={{ fontSize: 11, color: "#4a5568" }}>admin@hub.com</div>
//             </div>
//           </div>
//           <button
//             onClick={logout}
//             style={{
//               width: "100%", background: "transparent",
//               border: "1px solid rgba(255,71,87,0.3)",
//               color: "#ff4757", padding: "7px", borderRadius: 7,
//               fontSize: 12, fontWeight: 600, cursor: "pointer",
//               fontFamily: "inherit", transition: "all 0.2s",
//             }}
//           >
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* ── MAIN CONTENT ── */}
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
//         {/* Topbar */}
//         <div style={{
//           height: 56,
//           background: "rgba(15,21,38,0.97)",
//           borderBottom: "1px solid rgba(79,110,247,0.1)",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//           padding: "0 24px",
//           position: "sticky", top: 0, zIndex: 50,
//           backdropFilter: "blur(12px)",
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <span style={{ fontSize: 15, fontWeight: 600, color: "#e8eaf6" }}>{pageTitle}</span>
//             <span style={{
//               padding: "2px 10px",
//               background: "rgba(79,110,247,0.1)",
//               border: "1px solid rgba(79,110,247,0.2)",
//               borderRadius: 20, fontSize: 11,
//               color: "#4f6ef7", fontWeight: 600,
//             }}>LIVE</span>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <div style={{
//               width: 7, height: 7,
//               background: "#00d68f", borderRadius: "50%",
//               boxShadow: "0 0 6px #00d68f",
//             }} />
//             <span style={{ fontSize: 11.5, color: "#8892b0" }}>System Online</span>
//           </div>
//         </div>

//         {/* Page */}
//         <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
//       </div>
//     </div>
//   );
// }