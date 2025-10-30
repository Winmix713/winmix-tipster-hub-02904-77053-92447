import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Users } from "lucide-react";

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

const Teams = () => {
  const [league, setLeague] = useState<"angol" | "spanyol">("angol");
  const teams = leagueTeams[league];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">Csapatok</span>
            </div>
            <h1 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">Csapatok listája</h1>
            <p className="text-muted-foreground mt-1">Válassz bajnokságot és böngéssz a csapatok között.</p>
            
            {/* League Selector */}
            <div className="mt-4 inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
              <button
                onClick={() => setLeague("angol")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  league === "angol"
                    ? "bg-card text-foreground ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Angol Bajnokság
              </button>
              <button
                onClick={() => setLeague("spanyol")}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teams.map((team, index) => (
              <Link
                key={index}
                to={`/teams/${encodeURIComponent(team)}`}
                className="rounded-2xl bg-card ring-1 ring-border p-5 hover:ring-primary/30 hover:bg-card/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted ring-1 ring-border grid place-items-center">
                    <span className="text-lg font-bold text-primary">{team.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{team}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {league === "angol" ? "Angol Bajnokság" : "Spanyol Bajnokság"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Teams;
