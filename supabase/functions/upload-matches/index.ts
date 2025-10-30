import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  match_time: string;
  home_team: string;
  away_team: string;
  half_time_home_goals: string;
  half_time_away_goals: string;
  full_time_home_goals: string;
  full_time_away_goals: string;
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row as CSVRow;
  });
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

    const { csv_content, league_type } = await req.json();

    console.log(`Processing upload for league type: ${league_type}`);

    // Validate league_type
    if (!['angol', 'spanyol'].includes(league_type)) {
      throw new Error('Invalid league_type. Must be "angol" or "spanyol".');
    }

    // Parse CSV
    const lines = csv_content.trim().split('\n');
    
    // Validate row count (241 = 1 header + 240 matches)
    if (lines.length !== 241) {
      throw new Error(`Invalid row count: ${lines.length}. Expected 241 (1 header + 240 matches).`);
    }

    const parsedData = parseCSV(csv_content);

    // Validate match count
    if (parsedData.length !== 240) {
      throw new Error(`Invalid match count: ${parsedData.length}. Expected 240 matches.`);
    }

    // Validate columns
    const requiredColumns = [
      'match_time', 'home_team', 'away_team',
      'half_time_home_goals', 'half_time_away_goals',
      'full_time_home_goals', 'full_time_away_goals'
    ];

    const hasAllColumns = requiredColumns.every(col => col in parsedData[0]);
    if (!hasAllColumns) {
      throw new Error('Missing required columns in CSV.');
    }

    // Get latest season number for this league type
    const { data: latestLeague } = await supabase
      .from('leagues')
      .select('season_number')
      .eq('league_type', league_type)
      .order('season_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newSeasonNumber = (latestLeague?.season_number || 0) + 1;

    console.log(`Creating new season: ${newSeasonNumber} for ${league_type}`);

    // Create new league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        season_number: newSeasonNumber,
        league_type: league_type,
        match_count: 240
      })
      .select()
      .single();

    if (leagueError) {
      console.error('League insert error:', leagueError);
      throw new Error(`Failed to create league: ${leagueError.message}`);
    }

    console.log(`League created with ID: ${league.id}`);

    // Prepare matches data
    const matchesData = parsedData.map(row => ({
      league_id: league.id,
      match_time: row.match_time,
      home_team: row.home_team,
      away_team: row.away_team,
      half_time_home_goals: parseInt(row.half_time_home_goals),
      half_time_away_goals: parseInt(row.half_time_away_goals),
      full_time_home_goals: parseInt(row.full_time_home_goals),
      full_time_away_goals: parseInt(row.full_time_away_goals)
    }));

    // Insert matches
    const { error: matchesError } = await supabase
      .from('matches')
      .insert(matchesData);

    if (matchesError) {
      console.error('Matches insert error:', matchesError);
      // Rollback: delete the league
      await supabase.from('leagues').delete().eq('id', league.id);
      throw new Error(`Failed to insert matches: ${matchesError.message}`);
    }

    console.log(`Successfully inserted ${matchesData.length} matches`);

    return new Response(JSON.stringify({
      success: true,
      league: {
        id: league.id,
        season_number: newSeasonNumber,
        league_type: league_type,
        match_count: 240
      },
      message: `Successfully uploaded ${league_type} league, Season #${newSeasonNumber}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
