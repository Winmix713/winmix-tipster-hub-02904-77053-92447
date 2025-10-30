
-- Migration: 20251028151259
-- Create leagues table to store season information
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  league_type TEXT NOT NULL CHECK (league_type IN ('angol', 'spanyol')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  match_count INTEGER DEFAULT 240,
  UNIQUE(season_number, league_type)
);

-- Create matches table to store all match data
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  match_time TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  half_time_home_goals INTEGER NOT NULL,
  half_time_away_goals INTEGER NOT NULL,
  full_time_home_goals INTEGER NOT NULL,
  full_time_away_goals INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leagues_type_season ON public.leagues(league_type, season_number DESC);
CREATE INDEX IF NOT EXISTS idx_matches_league ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches(home_team);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches(away_team);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON public.matches(home_team, away_team);

-- Enable Row Level Security
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Anyone can read leagues" 
  ON public.leagues FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Anyone can read matches" 
  ON public.matches FOR SELECT 
  TO anon, authenticated 
  USING (true);
