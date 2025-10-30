import { useState, useEffect } from "react";
import { Menu, Activity, Target, Clock } from "lucide-react";

const TopBar = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('hu-HU', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 backdrop-blur bg-background/40 border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-card ring-1 ring-border grid place-items-center text-primary text-[10px] font-semibold tracking-tight">WT</div>
            <span className="text-sm text-foreground tracking-tight font-medium">WINMIX TIPSTER</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">{currentTime}</div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-card ring-1 ring-border hover:bg-muted hover:ring-primary/30 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-border backdrop-blur bg-background/50">
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              <a href="#hero" className="h-10 rounded-lg bg-card ring-1 ring-border hover:bg-muted text-sm grid place-items-center">Kezdőlap</a>
              <a href="#match-selection" className="h-10 rounded-lg bg-card ring-1 ring-border hover:bg-muted text-sm grid place-items-center">Mérkőzések</a>
              <a href="#call-to-action" className="h-10 rounded-lg bg-card ring-1 ring-border hover:bg-muted text-sm grid place-items-center">Elemzés</a>
              <a href="#leaderboard" className="h-10 rounded-lg bg-card ring-1 ring-border hover:bg-muted text-sm grid place-items-center">Ranglista</a>
            </div>
          </div>
        )}
      </header>

      {/* Desktop top meta bar */}
      <div className="hidden md:flex sticky top-0 z-30 ml-[84px] h-16 items-center justify-between px-6 lg:px-10 backdrop-blur bg-background/35 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-card ring-1 ring-border px-3 py-1.5">
            <div className="text-muted-foreground text-sm tracking-tight font-medium">Smart Betting • {currentDate}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-card ring-1 ring-border px-3 py-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="w-4 h-4" /> Szorzó: <span className="text-foreground font-semibold">11%</span>
            </span>
            <span className="h-4 w-px bg-border"></span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="w-4 h-4" /> Pontosság: <span className="text-foreground font-semibold">67%</span>
            </span>
            <span className="h-4 w-px bg-border"></span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-4 h-4" /> {currentTime}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopBar;
