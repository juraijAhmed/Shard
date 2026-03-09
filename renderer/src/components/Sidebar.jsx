export function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: "gallery", label: "Gallery", icon: "⊞" },
    { id: "search", label: "Search", icon: "⌕" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div
      className="flex flex-col py-4 gap-1 shrink-0"
      style={{
        width: "56px",
        borderRight: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          title={item.label}
          className="mx-2 h-10 rounded flex items-center justify-center text-lg transition-all"
          style={{
            color: activeView === item.id ? "var(--accent)" : "var(--text-dim)",
            background:
              activeView === item.id ? "var(--bg-overlay)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (activeView !== item.id)
              e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            if (activeView !== item.id)
              e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
