import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Match {
  id: string;
  league_id: string;
  match_time: string;
  home_team: string;
  away_team: string;
  half_time_home_goals: number;
  half_time_away_goals: number;
  full_time_home_goals: number;
  full_time_away_goals: number;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { team_name, league_id } = await req.json();

    if (!team_name) {
      throw new Error('team_name is required');
    }

    console.log(`Calculating stats for team: ${team_name}, league_id: ${league_id || 'all'}`);

    // Fetch matches
    let query = supabase
      .from('matches')
      .select('*')
      .or(`home_team.eq.${team_name},away_team.eq.${team_name}`);

    if (league_id) {
      query = query.eq('league_id', league_id);
    }

    const { data: matches, error: matchesError } = await query;

    if (matchesError) {
      throw new Error(`Failed to fetch matches: ${matchesError.message}`);
    }

    if (!matches || matches.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No matches found for this team'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${matches.length} matches`);

    // Calculate statistics
    const homeMatches = matches.filter(m => m.home_team === team_name);
    const awayMatches = matches.filter(m => m.away_team === team_name);

    // 1. Both Teams Scored Percentage
    const bothTeamsScored = matches.filter(m => 
      m.full_time_home_goals > 0 && m.full_time_away_goals > 0
    ).length;
    const bothTeamsScoredPercentage = (bothTeamsScored / matches.length) * 100;

    // 2. Average Goals
    const totalGoals = matches.reduce((sum, m) => 
      sum + m.full_time_home_goals + m.full_time_away_goals, 0
    );
    const avgTotalGoals = totalGoals / matches.length;

    const avgHomeGoals = homeMatches.length > 0
      ? homeMatches.reduce((sum, m) => sum + m.full_time_home_goals, 0) / homeMatches.length
      : 0;

    const avgAwayGoals = awayMatches.length > 0
      ? awayMatches.reduce((sum, m) => sum + m.full_time_away_goals, 0) / awayMatches.length
      : 0;

    // 3. Form Index (Last 5 matches)
    const recentHomeMatches = homeMatches.slice(-5);
    const recentAwayMatches = awayMatches.slice(-5);

    const calculateFormPoints = (matches: Match[], isHome: boolean) => {
      return matches.reduce((sum, m) => {
        let points = 0;
        if (isHome) {
          if (m.full_time_home_goals > m.full_time_away_goals) points = 3;
          else if (m.full_time_home_goals === m.full_time_away_goals) points = 1;
        } else {
          if (m.full_time_away_goals > m.full_time_home_goals) points = 3;
          else if (m.full_time_away_goals === m.full_time_home_goals) points = 1;
        }
        return sum + points;
      }, 0);
    };

    const homeFormPoints = calculateFormPoints(recentHomeMatches, true);
    const awayFormPoints = calculateFormPoints(recentAwayMatches, false);

    const homeFormIndex = recentHomeMatches.length > 0 
      ? (homeFormPoints / (recentHomeMatches.length * 3)) * 100 
      : 0;
    const awayFormIndex = recentAwayMatches.length > 0
      ? (awayFormPoints / (recentAwayMatches.length * 3)) * 100
      : 0;

    // 4. Expected Goals (xG)
    const teamGoals = matches.map(m => 
      m.home_team === team_name ? m.full_time_home_goals : m.full_time_away_goals
    );
    const expectedGoals = teamGoals.reduce((sum, g) => sum + g, 0) / teamGoals.length;

    // 5. Win/Draw/Loss Stats
    let wins = 0, draws = 0, losses = 0;

    matches.forEach(m => {
      if (m.home_team === team_name) {
        if (m.full_time_home_goals > m.full_time_away_goals) wins++;
        else if (m.full_time_home_goals === m.full_time_away_goals) draws++;
        else losses++;
      } else {
        if (m.full_time_away_goals > m.full_time_home_goals) wins++;
        else if (m.full_time_away_goals === m.full_time_home_goals) draws++;
        else losses++;
      }
    });

    const winRate = wins / matches.length;

    // 6. Elo-based Win Probability
    const homeWinProb = Math.min(0.85, Math.max(0.15, winRate + 0.1));
    const awayWinProb = Math.min(0.85, Math.max(0.15, winRate - 0.1));
    const drawProb = Math.max(0.1, 1 - homeWinProb - awayWinProb);

    // 7. Poisson Model Predictions
    const poissonHomeGoals = Math.round(avgHomeGoals);
    const poissonAwayGoals = Math.round(avgAwayGoals);

    // 8. Predicted Winner
    let predictedWinner: 'home' | 'away' | 'draw';
    if (homeWinProb > drawProb && homeWinProb > awayWinProb) {
      predictedWinner = 'home';
    } else if (awayWinProb > drawProb && awayWinProb > homeWinProb) {
      predictedWinner = 'away';
    } else {
      predictedWinner = 'draw';
    }

    // 9. Confidence (based on form consistency)
    const formConsistency = (homeFormIndex + awayFormIndex) / 200;
    const confidence = Math.min(0.95, Math.max(0.3, formConsistency * 0.7 + winRate * 0.3));

    // 10. Both Teams to Score Probability
    const bothTeamsToScoreProb = bothTeamsScoredPercentage / 100;

    const response = {
      success: true,
      team_analysis: {
        both_teams_scored_percentage: parseFloat(bothTeamsScoredPercentage.toFixed(2)),
        average_goals: {
          average_total_goals: parseFloat(avgTotalGoals.toFixed(2)),
          average_home_goals: parseFloat(avgHomeGoals.toFixed(2)),
          average_away_goals: parseFloat(avgAwayGoals.toFixed(2))
        },
        home_form_index: parseFloat(homeFormIndex.toFixed(2)),
        away_form_index: parseFloat(awayFormIndex.toFixed(2)),
        expected_goals: parseFloat(expectedGoals.toFixed(2)),
        head_to_head_stats: {
          home_win_percentage: parseFloat(((wins / matches.length) * 100).toFixed(2)),
          draw_percentage: parseFloat(((draws / matches.length) * 100).toFixed(2)),
          away_win_percentage: parseFloat(((losses / matches.length) * 100).toFixed(2))
        }
      },
      prediction: {
        homeExpectedGoals: parseFloat(avgHomeGoals.toFixed(2)),
        awayExpectedGoals: parseFloat(avgAwayGoals.toFixed(2)),
        bothTeamsToScoreProb: parseFloat(bothTeamsToScoreProb.toFixed(2)),
        predictedWinner: predictedWinner,
        confidence: parseFloat(confidence.toFixed(2)),
        modelPredictions: {
          poisson: {
            homeGoals: poissonHomeGoals,
            awayGoals: poissonAwayGoals
          },
          elo: {
            homeWinProb: parseFloat(homeWinProb.toFixed(3)),
            drawProb: parseFloat(drawProb.toFixed(3)),
            awayWinProb: parseFloat(awayWinProb.toFixed(3))
          }
        }
      },
      matches: matches
    };

    console.log('Stats calculation completed successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Stats calculation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
