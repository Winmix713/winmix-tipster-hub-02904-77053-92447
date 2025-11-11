import { Home, Users, Calendar as CalendarIcon, Trophy, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <>
      {/* Desktop sidebar - glassmorphic */}
      <aside className="hidden md:flex fixed z-40 top-0 left-0 h-screen w-[84px] flex-col justify-between py-6 border-r border-border glass-card">
        <div className="flex flex-col items-center gap-4">
          <NavLink to="/" className="group">
            <div className="h-9 w-9 rounded-xl glass-strong grid place-items-center text-primary text-[10px] font-semibold tracking-tight hover:ring-1 hover:ring-primary/40 hover:glow-emerald transition-all">
              WT
            </div>
          </NavLink>
          <div className="mt-4 flex flex-col items-center gap-3">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all active:scale-95 ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : "glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 hover:scale-110"
                }`
              }
            >
              {({ isActive }) => (
                <Home className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </NavLink>
            <NavLink 
              to="/teams" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all active:scale-95 ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : "glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 hover:scale-110"
                }`
              }
            >
              {({ isActive }) => (
                <Users className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </NavLink>
            <NavLink 
              to="/matches" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all active:scale-95 ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : "glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 hover:scale-110"
                }`
              }
            >
              {({ isActive }) => (
                <CalendarIcon className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </NavLink>
            <NavLink 
              to="/leagues" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all active:scale-95 ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : "glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 hover:scale-110"
                }`
              }
            >
              {({ isActive }) => (
                <Trophy className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </NavLink>
          </div>
        </div>
        <div className="px-4">
          <button className="w-12 h-12 rounded-xl glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 hover:scale-110 grid place-items-center transition-all active:scale-95">
            <Settings className="w-5 h-5 text-muted-foreground transition-transform hover:rotate-90" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
