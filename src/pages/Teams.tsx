import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Users, Loader2 } from "lucide-react";
import type { League } from "@/types/database";

const Teams = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  // Fetch available leagues
  const { data: leagues } = useQuery({
    queryKey: ['leagues-all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('leagues')
        .select('*')
        .order('season_number', { ascending: false});

      if (error) throw error;
      return data as League[];
    }
  });

  // Auto-select latest league
  useEffect(() => {
    if (leagues && leagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues, selectedLeagueId]);

  // Fetch matches and extract unique teams
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];

      const { data, error } = await (supabase as any)
        .from('matches')
        .select('home_team, away_team')
        .eq('league_id', selectedLeagueId);

      if (error) throw error;

      // Extract unique team names
      const teamSet = new Set<string>();
      (data as any[]).forEach((match: any) => {
        teamSet.add(match.home_team);
        teamSet.add(match.away_team);
      });

      // Sort alphabetically
      return Array.from(teamSet).sort();
    },
    enabled: !!selectedLeagueId
  });

  const selectedLeague = leagues?.find(l => l.id === selectedLeagueId);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <TopBar />
        <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <p className="text-muted-foreground mt-1">Válassz szezon és böngéssz a csapatok között.</p>
            
            {/* Season Selector */}
            {leagues && leagues.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Szezon:</span>
                <select
                  value={selectedLeagueId || ''}
                  onChange={(e) => setSelectedLeagueId(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-card text-foreground ring-1 ring-border text-sm"
                >
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.league_type === 'angol' ? 'Angol' : 'Spanyol'} - {league.season_number}. szezon
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {teams && teams.length > 0 ? (
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
                        {selectedLeague?.league_type === 'angol' ? 'Angol Bajnokság' : 'Spanyol Bajnokság'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nincsenek elérhető csapatok. Tölts fel mérkőzés adatokat!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Teams;
