import { useState } from "react";
import { useTheme } from "./components/useTheme";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { GalleryView } from "./components/GalleryView";
import { SearchView } from "./components/SearchView";
import { SettingsView } from "./components/SettingsView";

const views = {
  gallery: GalleryView,
  search: SearchView,
  settings: SettingsView,
};

export default function App() {
  const [activeView, setActiveView] = useState("gallery");
  const { theme, applyTheme } = useTheme();
  const ActiveView = views[activeView];

  return (
    <div className="flex flex-col h-full">
      <TitleBar theme={theme} onToggleTheme={(t) => applyTheme(t)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main
          className="flex-1 overflow-hidden"
          style={{ background: "var(--bg-raised)" }}
        >
          <ActiveView applyTheme={applyTheme} currentTheme={theme} />
        </main>
      </div>
    </div>
  );
}
