import { useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchCard from "./MatchCard";
import PredictionResults from "./PredictionResults";

const leagueTeams = {
  angol: [
    "Aston Oroszlán", "Brentford", "Brighton", "Chelsea", "Crystal Palace",
    "Everton", "Fulham", "Liverpool", "London Ágyúk", "Manchester Kék",
    "Newcastle", "Nottingham", "Tottenham", "Vörös Ördögök", "West Ham", "Wolverhampton"
  ],
  spanyol: [
    "Alaves", "Barcelona", "Bilbao", "Getafe", "Girona", "Las Palmas",
    "Madrid Fehér", "Madrid Piros", "Mallorca", "Osasuna", "San Sebastian",
    "Sevilla Piros", "Sevilla Zöld", "Valencia", "Vigo", "Villarreal"
  ]
};

const MatchSelection = () => {
  const [league, setLeague] = useState<"angol" | "spanyol">("angol");
  const [matches, setMatches] = useState(
    Array(8).fill(null).map(() => ({ home: "", away: "" }))
  );
  const [showPredictions, setShowPredictions] = useState(false);

  const teams = leagueTeams[league];

  const handleLeagueChange = (newLeague: "angol" | "spanyol") => {
    setLeague(newLeague);
    setMatches(Array(8).fill(null).map(() => ({ home: "", away: "" })));
    setShowPredictions(false);
  };

  const handleMatchChange = (index: number, team: string, side: "home" | "away") => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [side]: team };
    setMatches(newMatches);
    setShowPredictions(false);
  };

  const getAvailableTeams = (currentMatch: number, side: "home" | "away") => {
    const selectedTeams = matches.flatMap((match, index) => {
      if (index === currentMatch) {
        return side === "home" ? [match.away] : [match.home];
      }
      return [match.home, match.away];
    }).filter(Boolean);
    
    return teams.filter(team => !selectedTeams.includes(team));
  };

  const completeMatches = matches.filter(m => m.home && m.away);
  const canPredict = completeMatches.length > 0;

  const progress = (completeMatches.length / 8) * 100;

  return (
    <section id="match-selection" className="scroll-mt-24 ml-0 md:ml-[84px] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">Mérkőzések kiválasztása</span>
            </div>
            <h2 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">Válaszd ki a csapatokat</h2>
            <p className="text-muted-foreground mt-1">Válassz Otthon/Vendég csapatot. A már kiválasztott csapatok nem jelennek meg újra.</p>
            
            {/* League Selector */}
            <div className="mt-4 inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
              <button
                onClick={() => handleLeagueChange("angol")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  league === "angol"
                    ? "bg-card text-foreground ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Angol Bajnokság
              </button>
              <button
                onClick={() => handleLeagueChange("spanyol")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  league === "spanyol"
                    ? "bg-card text-foreground ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Spanyol Bajnokság
              </button>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-40 rounded-full bg-muted overflow-hidden ring-1 ring-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-muted-foreground">{completeMatches.length} / 8 kész</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {matches.map((match, index) => (
            <MatchCard
              key={index}
              match={match}
              index={index}
              availableTeams={{
                home: getAvailableTeams(index, "home"),
                away: getAvailableTeams(index, "away")
              }}
              onMatchChange={handleMatchChange}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Tipp: Keress csapatra gyorsan a lenyíló menüben a billentyűzettel.
          </div>
          <div className="flex items-center gap-3">
            <div className="sm:hidden flex items-center gap-2">
              <div className="h-2 w-28 rounded-full bg-muted overflow-hidden ring-1 ring-border">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs text-muted-foreground">{completeMatches.length} / 8</span>
            </div>
            <Button
              disabled={!canPredict}
              onClick={() => setShowPredictions(true)}
              className="group relative overflow-hidden inline-flex items-center gap-2 h-10 px-4 rounded-md bg-gradient-to-r from-primary to-primary text-primary-foreground ring-1 ring-primary hover:ring-primary/80 transition text-sm font-semibold disabled:opacity-50"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Predikciók futtatása
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-white/0 via-white/40 to-white/0"></span>
            </Button>
          </div>
        </div>

        {showPredictions && canPredict && (
          <PredictionResults matches={completeMatches} />
        )}
      </div>
    </section>
  );
};

export default MatchSelection;
