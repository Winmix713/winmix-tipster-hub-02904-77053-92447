import { Home, Users, Calendar as CalendarIcon, Trophy, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const Sidebar = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Desktop sidebar - glassmorphic */}
      <aside className="hidden md:flex fixed z-40 top-0 left-0 h-screen w-[84px] flex-col justify-between py-6 border-r border-border glass-card" role="navigation" aria-label="Fő navigáció">
        <div className="flex flex-col items-center gap-4">
          <NavLink to="/" className="group" aria-label="Főoldal">
            <div className="h-9 w-9 rounded-xl glass-strong grid place-items-center text-primary text-[10px] font-semibold tracking-tight hover:ring-1 hover:ring-primary/40 hover:glow-emerald transition-all">
              WT
            </div>
          </NavLink>
          <div className="mt-4 flex flex-col items-center gap-3">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all ${prefersReducedMotion ? "" : "active:scale-95"} ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : `glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 ${prefersReducedMotion ? "" : "hover:scale-110"}`
                }`
              }
              aria-label="Főoldal"
              aria-current={undefined}
            >
              {({ isActive }) => (
                <Home className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              )}
            </NavLink>
            <NavLink 
              to="/teams" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all ${prefersReducedMotion ? "" : "active:scale-95"} ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : `glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 ${prefersReducedMotion ? "" : "hover:scale-110"}`
                }`
              }
              aria-label="Csapatok"
            >
              {({ isActive }) => (
                <Users className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              )}
            </NavLink>
            <NavLink 
              to="/matches" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all ${prefersReducedMotion ? "" : "active:scale-95"} ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : `glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 ${prefersReducedMotion ? "" : "hover:scale-110"}`
                }`
              }
              aria-label="Mérkőzések"
            >
              {({ isActive }) => (
                <CalendarIcon className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              )}
            </NavLink>
            <NavLink 
              to="/leagues" 
              className={({ isActive }) => 
                `h-11 w-11 grid place-items-center rounded-xl transition-all ${prefersReducedMotion ? "" : "active:scale-95"} ${
                  isActive 
                    ? "glass-strong ring-1 ring-primary/40 glow-emerald hover:ring-primary/50" 
                    : `glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 ${prefersReducedMotion ? "" : "hover:scale-110"}`
                }`
              }
              aria-label="Bajnokságok"
            >
              {({ isActive }) => (
                <Trophy className={`w-5 h-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              )}
            </NavLink>
          </div>
        </div>
        <div className="px-4">
          <button 
            className={`w-12 h-12 rounded-xl glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 ${prefersReducedMotion ? "" : "hover:scale-110 active:scale-95"} grid place-items-center transition-all`}
            aria-label="Beállítások"
          >
            <Settings className={`w-5 h-5 text-muted-foreground ${prefersReducedMotion ? "" : "transition-transform hover:rotate-90"}`} aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
