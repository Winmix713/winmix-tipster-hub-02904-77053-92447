import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { ArrowLeft, TrendingUp, Users, Target, Shield, Activity, Loader2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import type { TeamStatistics, League } from "@/types/database";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const TeamDetail = () => {
  const { teamName } = useParams<{ teamName: string }>();
  const navigate = useNavigate();
  const decodedTeamName = decodeURIComponent(teamName || "");
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
  if (leagues && leagues.length > 0 && !selectedLeagueId) {
    setSelectedLeagueId(leagues[0].id);
  }

  // Fetch team statistics
  const { data: teamStats, isLoading, error } = useQuery({
    queryKey: ['teamStats', decodedTeamName, selectedLeagueId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-team-stats', {
        body: {
          team_name: decodedTeamName,
          league_id: selectedLeagueId
        }
      });

      if (error) throw new Error(error.message);
      return data as TeamStatistics;
    },
    enabled: !!decodedTeamName && !!selectedLeagueId,
    staleTime: 5 * 60 * 1000,
  });

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

  if (error) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <TopBar />
        <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Button variant="outline" onClick={() => navigate("/teams")} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
            <Alert variant="destructive">
              <AlertDescription>
                Hiba történt: {error.message}
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  if (!teamStats || !teamStats.success) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <TopBar />
        <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Button variant="outline" onClick={() => navigate("/teams")} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
            <Alert>
              <AlertDescription>
                Ehhez a csapathoz még nincsenek statisztikák. Tölts fel mérkőzés adatokat!
              </AlertDescription>
            </Alert>
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
          <Button variant="outline" onClick={() => navigate("/teams")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a csapatokhoz
          </Button>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">Csapat Statisztikák</span>
            </div>
            <h1 className="text-3xl sm:text-4xl tracking-tight text-foreground font-semibold">{decodedTeamName}</h1>
            
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
                      {league.league_type === 'angol' ? 'Angol' : 'Spanyol'} - {league.season_number}. szezon
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Summary Card */}
            <div className="rounded-2xl bg-card ring-1 ring-border p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 ring-2 ring-primary/30 grid place-items-center">
                  <span className="text-5xl font-bold text-primary">{decodedTeamName?.charAt(0)}</span>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{decodedTeamName}</h2>
                <Badge variant="outline" className="mb-3">
                  {teamStats.matches.length} mérkőzés
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Hazai Forma</span>
                    <span className="text-sm font-bold text-primary">
                      {teamStats.team_analysis.home_form_index.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden ring-1 ring-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                      style={{ width: `${teamStats.team_analysis.home_form_index}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Vendég Forma</span>
                    <span className="text-sm font-bold text-primary">
                      {teamStats.team_analysis.away_form_index.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden ring-1 ring-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                      style={{ width: `${teamStats.team_analysis.away_form_index}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Match Statistics */}
              <StatCard
                title="Alapvető Mérkőzésstatisztikák"
                icon={<Activity className="w-5 h-5 text-primary" />}
                stats={[
                  { label: "Mindkét csapat góllövése", value: teamStats.team_analysis.both_teams_scored_percentage, type: "percentage" },
                  { label: "Átlagos gólok mérkőzésenként", value: teamStats.team_analysis.average_goals.average_total_goals, type: "number" },
                  { label: "Átlagos hazai gólok", value: teamStats.team_analysis.average_goals.average_home_goals, type: "number" },
                  { label: "Átlagos vendég gólok", value: teamStats.team_analysis.average_goals.average_away_goals, type: "number" },
                ]}
              />

              {/* Team-Specific Statistics */}
              <StatCard
                title="Csapatspecifikus Statisztikák"
                icon={<Target className="w-5 h-5 text-primary" />}
                stats={[
                  { label: "Hazai formindex", value: teamStats.team_analysis.home_form_index, type: "percentage" },
                  { label: "Vendég formindex", value: teamStats.team_analysis.away_form_index, type: "percentage" },
                  { label: "Várható gólok (xG)", value: teamStats.team_analysis.expected_goals, type: "number" },
                  { label: "Mindkét csapat góllövésének valószínűsége", value: teamStats.prediction.bothTeamsToScoreProb * 100, type: "percentage" },
                ]}
              />

              {/* Head-to-Head Statistics */}
              <StatCard
                title="Mérkőzések Eredményei"
                icon={<Shield className="w-5 h-5 text-primary" />}
                stats={[
                  { label: "Győzelmek aránya", value: teamStats.team_analysis.head_to_head_stats.home_win_percentage, type: "percentage" },
                  { label: "Döntetlenek aránya", value: teamStats.team_analysis.head_to_head_stats.draw_percentage, type: "percentage" },
                  { label: "Vereségek aránya", value: teamStats.team_analysis.head_to_head_stats.away_win_percentage, type: "percentage" },
                ]}
              />

              {/* Prediction Statistics */}
              <StatCard
                title="Előrejelzési Képesség"
                icon={<TrendingDown className="w-5 h-5 text-primary" />}
                stats={[
                  { label: "Következő mérkőzés előrejelzés", value: teamStats.prediction.predictedWinner, type: "text" },
                  { label: "Bizonytalansági szint", value: `${(teamStats.prediction.confidence * 100).toFixed(0)}%`, type: "text" },
                  { label: "Várható hazai gólok (Poisson)", value: teamStats.prediction.modelPredictions.poisson.homeGoals, type: "number" },
                  { label: "Várható vendég gólok (Poisson)", value: teamStats.prediction.modelPredictions.poisson.awayGoals, type: "number" },
                ]}
              />

              {/* Win Probability (Elo Model) */}
              <StatCard
                title="Győzelmi Valószínűségek (Elo-modell)"
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                stats={[
                  { label: "Hazai győzelem valószínűsége", value: teamStats.prediction.modelPredictions.elo.homeWinProb * 100, type: "percentage" },
                  { label: "Döntetlen valószínűsége", value: teamStats.prediction.modelPredictions.elo.drawProb * 100, type: "percentage" },
                  { label: "Vendég győzelem valószínűsége", value: teamStats.prediction.modelPredictions.elo.awayWinProb * 100, type: "percentage" },
                ]}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamDetail;
