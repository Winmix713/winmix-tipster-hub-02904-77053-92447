import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Trophy, Loader2 } from "lucide-react";
import type { League } from "@/types/database";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Leagues = () => {
  const [leagueType, setLeagueType] = useState<"angol" | "spanyol">("angol");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  // Fetch leagues
  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ['leagues', leagueType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_type', leagueType)
        .order('season_number', { ascending: false });

      if (error) throw error;
      return data as League[];
    }
  });

  // Auto-select latest league
  if (leagues && leagues.length > 0 && !selectedLeagueId) {
    setSelectedLeagueId(leagues[0].id);
  }

  // Fetch matches for standings calculation
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches-standings', selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('league_id', selectedLeagueId);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedLeagueId
  });

  // Calculate standings from matches
  const standings = matches ? calculateStandings(matches) : [];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">Bajnokságok</span>
            </div>
            <h1 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">Bajnoki tabella</h1>
            <p className="text-muted-foreground mt-1">Válassz bajnokságot és szezont az aktuális állás megtekintéséhez.</p>
            
            {/* League Type Selector */}
            <div className="mt-4 inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
              <button
                onClick={() => {
                  setLeagueType("angol");
                  setSelectedLeagueId(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  leagueType === "angol"
                    ? "bg-card text-foreground ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Angol Bajnokság
              </button>
              <button
                onClick={() => {
                  setLeagueType("spanyol");
                  setSelectedLeagueId(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  leagueType === "spanyol"
                    ? "bg-card text-foreground ring-1 ring-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Spanyol Bajnokság
              </button>
            </div>

            {/* Season Selector */}
            {leagues && leagues.length > 0 && (
              <div className="mt-3 inline-flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Szezon:</span>
                <select
                  value={selectedLeagueId || ''}
                  onChange={(e) => setSelectedLeagueId(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-card text-foreground ring-1 ring-border text-sm"
                >
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.season_number}. szezon ({league.match_count} mérkőzés)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {leaguesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !leagues || leagues.length === 0 ? (
            <Alert>
              <AlertDescription>
                Ehhez a bajnoksághoz még nincsenek feltöltött szezónok. Tölts fel mérkőzés adatokat a Vezérlőpult oldalon!
              </AlertDescription>
            </Alert>
          ) : matchesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : standings.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nincsenek mérkőzések ebben a szezonban.
              </AlertDescription>
            </Alert>
          ) : (

            <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Csapat</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">M</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Gy</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">D</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">V</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, index) => (
                      <tr
                        key={team.team}
                        className="border-b border-border hover:bg-muted/30 transition"
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{team.team}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.played}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.won}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.drawn}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.lost}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-primary">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper function to calculate standings
function calculateStandings(matches: any[]) {
  const teams: Record<string, { team: string; played: number; won: number; drawn: number; lost: number; points: number }> = {};

  matches.forEach((match) => {
    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const homeGoals = match.full_time_home_goals;
    const awayGoals = match.full_time_away_goals;

    // Initialize teams
    if (!teams[homeTeam]) {
      teams[homeTeam] = { team: homeTeam, played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
    }
    if (!teams[awayTeam]) {
      teams[awayTeam] = { team: awayTeam, played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
    }

    // Update stats
    teams[homeTeam].played++;
    teams[awayTeam].played++;

    if (homeGoals > awayGoals) {
      teams[homeTeam].won++;
      teams[homeTeam].points += 3;
      teams[awayTeam].lost++;
    } else if (homeGoals < awayGoals) {
      teams[awayTeam].won++;
      teams[awayTeam].points += 3;
      teams[homeTeam].lost++;
    } else {
      teams[homeTeam].drawn++;
      teams[awayTeam].drawn++;
      teams[homeTeam].points++;
      teams[awayTeam].points++;
    }
  });

  return Object.values(teams).sort((a, b) => b.points - a.points);
}

export default Leagues;
