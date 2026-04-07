// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";

const NAV = [
  {
    to: "/dashboard",
    end: true,
    label: "Overview",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    to: "/dashboard/repositories",
    end: false,
    label: "Repositories",
    icon: "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  },
  {
    to: "/dashboard/insights",
    end: false,
    label: "Insights",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    to: "/dashboard/settings",
    end: false,
    label: "Settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

function Icon({ d }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 16, height: 16, flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      height: "100vh",
      position: "sticky",
      top: 0,
      background: "#060d16",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* Logo */}
      <div style={{ paddingLeft: 10, marginBottom: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          ShipIQ
        </div>
        <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>
          DevOps Control Platform
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#fff" : "#4b5563",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                borderLeft: isActive ? "2px solid #818cf8" : "2px solid transparent",
                transition: "all 0.15s",
                cursor: "pointer",
              }}>
                <Icon d={icon} />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Version */}
      <div style={{ paddingLeft: 10, fontSize: 11, color: "#1f2937" }}>
        v1.0.0
      </div>
    </aside>
  );
}   