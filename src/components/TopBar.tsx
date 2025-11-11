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
      <header className="md:hidden sticky top-0 z-50 backdrop-blur-xl glass-card border-b border-border" role="banner">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md glass-strong grid place-items-center text-primary text-[10px] font-semibold tracking-tight">WT</div>
            <span className="text-sm text-foreground tracking-tight font-medium">WINMIX TIPSTER</span>
          </div>
          <div className="flex items-center gap-3">
            <time className="text-xs text-muted-foreground" dateTime={new Date().toISOString()}>{currentTime}</time>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 transition-all active:scale-95"
              aria-label="Menü megnyitása"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-border backdrop-blur-xl glass-card animate-slide-in-bottom" aria-label="Mobil navigáció">
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              <a href="#hero" className="h-10 rounded-lg glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 text-sm grid place-items-center transition-all active:scale-95">Kezdőlap</a>
              <a href="#match-selection" className="h-10 rounded-lg glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 text-sm grid place-items-center transition-all active:scale-95">Mérkőzések</a>
              <a href="#call-to-action" className="h-10 rounded-lg glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 text-sm grid place-items-center transition-all active:scale-95">Elemzés</a>
              <a href="#leaderboard" className="h-10 rounded-lg glass-card ring-1 ring-border hover:glass-strong hover:ring-primary/30 text-sm grid place-items-center transition-all active:scale-95">Ranglista</a>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop top meta bar */}
      <div className="hidden md:flex sticky top-0 z-30 ml-[84px] h-16 items-center justify-between px-6 lg:px-10 backdrop-blur-xl glass-card border-b border-border" role="banner">
        <div className="flex items-center gap-3">
          <div className="rounded-lg glass-strong px-3 py-1.5">
            <div className="text-muted-foreground text-sm tracking-tight font-medium">Smart Betting • {currentDate}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl glass-card ring-1 ring-border px-3 py-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="w-4 h-4" aria-hidden="true" /> 
              <span className="sr-only">Szorzó:</span> 
              Szorzó: <span className="text-foreground font-semibold">11%</span>
            </span>
            <span className="h-4 w-px bg-border" aria-hidden="true"></span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="w-4 h-4" aria-hidden="true" /> 
              <span className="sr-only">Pontosság:</span>
              Pontosság: <span className="text-foreground font-semibold">67%</span>
            </span>
            <span className="h-4 w-px bg-border" aria-hidden="true"></span>
            <time className="inline-flex items-center gap-1 text-xs text-muted-foreground" dateTime={new Date().toISOString()}>
              <Clock className="w-4 h-4" aria-hidden="true" /> {currentTime}
            </time>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopBar;
