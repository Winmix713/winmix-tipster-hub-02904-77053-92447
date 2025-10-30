# 🚀 WinMix Tipster Hub - Teljes Implementációs Roadmap
## Fázis 3-9 Részletes Rendszerelemek Dokumentáció

---

## 📋 Tartalomjegyzék

1. [Áttekintés](#áttekintés)
2. [Fázis 3: Scheduled Jobs & Automatizáció](#fázis-3-scheduled-jobs--automatizáció)
3. [Fázis 4: Feedback Loop & Model Evaluation](#fázis-4-feedback-loop--model-evaluation)
4. [Fázis 5: Pattern Detection](#fázis-5-pattern-detection)
5. [Fázis 6: Champion/Challenger Framework](#fázis-6-championchallenger-framework)
6. [Fázis 7: Cross-League Intelligence](#fázis-7-cross-league-intelligence)
7. [Fázis 8: Monitoring & Visualization](#fázis-8-monitoring--visualization)
8. [Fázis 9: Advanced Features](#fázis-9-advanced-features)
9. [Architektúra Diagramok](#architektúra-diagramok)
10. [Technológiai Stack](#technológiai-stack)
11. [Implementációs Ütemterv](#implementációs-ütemterv)

---

## 🎯 Áttekintés

### Jelenlegi Állapot (Fázis 1-2 Kész)
- ✅ CSS (Cognitive Stability Score) számítás
- ✅ Narrative Generation
- ✅ Data Quality Layer
- ✅ Virtual Teams (Angol & Spanyol bajnokság)

### Hátralevő Fázisok Összefoglalása

| Fázis | Név | Időigény | Prioritás | Státusz |
|-------|-----|----------|-----------|---------|
| 3 | Scheduled Jobs & Automatizáció | 1.5 hét | 🔴 KRITIKUS | ✅ KÉSZ |
| 4 | Feedback Loop & Model Evaluation | 1.5 hét | 🔴 KRITIKUS | ⏳ Következik |
| 5 | Pattern Detection | 1 hét | 🟡 FONTOS | ⏳ Tervezett |
| 6 | Champion/Challenger Framework | 2 hét | 🟡 FONTOS | ⏳ Tervezett |
| 7 | Cross-League Intelligence | 3 hét | 🟢 HASZNOS | ⏳ Tervezett |
| 8 | Monitoring & Visualization | 2 hét | 🟢 HASZNOS | ⏳ Tervezett |
| 9 | Advanced Features | 4 hét | 🔵 OPCIONÁLIS | ⏳ Tervezett |

---

## 📦 Fázis 3: Scheduled Jobs & Automatizáció

### 🎯 Cél
Automatikus számítások végrehajtása, ne kelljen manuálisan triggerelni a stat frissítéseket.

### 🗄️ Database Komponensek

#### 3.1 `scheduled_jobs` Tábla
\`\`\`sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL, -- 'team_stats', 'data_quality', 'pattern_detection', 'model_evaluation'
  description TEXT,
  schedule TEXT NOT NULL, -- Cron expression: '0 */6 * * *' = 6 óránként
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status TEXT, -- 'success', 'failed', 'running', 'pending'
  last_duration_ms INTEGER,
  config JSONB, -- Job-specifikus konfiguráció
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek
CREATE INDEX idx_scheduled_jobs_enabled ON scheduled_jobs(enabled);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at) WHERE enabled = true;
\`\`\`

**Példa adatok:**
\`\`\`sql
INSERT INTO scheduled_jobs (job_name, job_type, description, schedule, config) VALUES
('calculate-all-team-stats', 'team_stats', 'Összes csapat statisztikák frissítése', '0 */6 * * *', '{"leagues": ["all"]}'),
('validate-data-quality', 'data_quality', 'Adatminőség ellenőrzés', '0 3 * * *', '{"threshold": 0.8}'),
('detect-patterns', 'pattern_detection', 'Minták felismerése', '0 4 * * *', '{"min_confidence": 0.7}'),
('evaluate-models', 'model_evaluation', 'Model pontosság értékelés', '0 5 * * *', '{"time_period": "weekly"}');
\`\`\`

#### 3.2 `job_execution_logs` Tábla
\`\`\`sql
CREATE TABLE job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'success', 'failed', 'timeout', 'cancelled'
  duration_ms INTEGER,
  records_processed INTEGER,
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB, -- Részletes execution info
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek
CREATE INDEX idx_job_logs_job_id ON job_execution_logs(job_id);
CREATE INDEX idx_job_logs_started_at ON job_execution_logs(started_at DESC);
CREATE INDEX idx_job_logs_status ON job_execution_logs(status);

-- Retention policy: 90 napnál régebbi logok törlése
CREATE OR REPLACE FUNCTION cleanup_old_job_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM job_execution_logs WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 🔧 API Endpoints

#### 3.3 `/api/jobs/list` - Job Lista Lekérése
**Method:** GET  
**Response:**
\`\`\`typescript
{
  jobs: Array<{
    id: string;
    job_name: string;
    job_type: string;
    description: string;
    schedule: string;
    enabled: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    last_status: 'success' | 'failed' | 'running' | 'pending';
    last_duration_ms: number | null;
  }>;
}
\`\`\`

#### 3.4 `/api/jobs/logs` - Execution Logs
**Method:** GET  
**Query Params:** `?job_id=xxx&limit=50`  
**Response:**
\`\`\`typescript
{
  logs: Array<{
    id: string;
    job_name: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    duration_ms: number | null;
    records_processed: number | null;
    error_message: string | null;
  }>;
  total: number;
}
\`\`\`

#### 3.5 `/api/jobs/trigger` - Manuális Job Indítás
**Method:** POST  
**Body:**
\`\`\`typescript
{
  job_name: string;
  force?: boolean; // Ignore schedule, run immediately
}
\`\`\`
**Response:**
\`\`\`typescript
{
  success: boolean;
  execution_id: string;
  message: string;
}
\`\`\`

#### 3.6 `/api/jobs/toggle` - Job Enable/Disable
**Method:** PATCH  
**Body:**
\`\`\`typescript
{
  job_id: string;
  enabled: boolean;
}
\`\`\`

#### 3.7 `/api/jobs/scheduler` - Cron Scheduler (Vercel Cron)
**Method:** GET  
**Headers:** `Authorization: Bearer ${CRON_SECRET}`  
**Működés:**
1. Lekéri az összes enabled job-ot ahol `next_run_at <= now()`
2. Minden job-ot elindít párhuzamosan
3. Frissíti a `next_run_at` értéket a cron expression alapján
4. Logol minden execution-t

### 🎨 Frontend Komponensek

#### 3.8 `ScheduledJobsPanel` Komponens
**Fájl:** `components/scheduled-jobs-panel.tsx`

**Funkciók:**
- Job lista megjelenítése (név, típus, schedule, last run, next run)
- Enable/Disable toggle minden job-hoz
- Manual trigger gomb
- Real-time status frissítés (SWR polling 10 másodpercenként)
- Execution logs modal

**UI Elemek:**
\`\`\`typescript
<Card>
  <CardHeader>
    <CardTitle>Scheduled Jobs</CardTitle>
    <CardDescription>Automatikus számítások ütemezése</CardDescription>
  </CardHeader>
  <CardContent>
    {jobs.map(job => (
      <JobStatusCard
        key={job.id}
        job={job}
        onToggle={handleToggle}
        onTrigger={handleTrigger}
        onViewLogs={handleViewLogs}
      />
    ))}
  </CardContent>
</Card>
\`\`\`

#### 3.9 `JobStatusCard` Komponens
**Fájl:** `components/job-status-card.tsx`

**Megjelenítés:**
- Job név és leírás
- Status badge (🟢 Success, 🔴 Failed, 🟡 Running, ⚪ Pending)
- Last run: "2 órája" (relative time)
- Next run: "4 óra múlva"
- Duration: "1.2s"
- Enable/Disable switch
- "▶️ Run Now" gomb
- "📋 View Logs" gomb

### 🔄 Adatfolyamat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Cron Trigger                      │
│                  (minden 10 percben)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/jobs/scheduler (GET)                      │
│  - Ellenőrzi: next_run_at <= now() && enabled = true       │
│  - Lekéri az esedékes job-okat                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Párhuzamos Job Végrehajtás                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Team Stats   │  │ Data Quality │  │ Patterns     │     │
│  │ Calculation  │  │ Validation   │  │ Detection    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Job Execution Logging                          │
│  - started_at, completed_at, duration_ms                   │
│  - status, error_message                                    │
│  - records_processed                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Next Run Számítás (Cron Parser)                   │
│  - Következő futás időpontja                                │
│  - scheduled_jobs.next_run_at frissítése                   │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 📊 Monitoring & Alerting

**Metrics:**
- Job success rate (last 24h, 7d, 30d)
- Average execution time per job type
- Failed jobs count
- Queue depth (pending jobs)

**Alerts:**
- 3 egymás utáni failed execution → Email alert
- Execution time > 5 perc → Warning
- Job nem futott 24 órája (ha enabled) → Critical alert

---

## 📈 Fázis 4: Feedback Loop & Model Evaluation

### 🎯 Cél
Mérni a predikciók pontosságát, tanulni belőle, és automatikusan javítani a modelleket.

### 🗄️ Database Komponensek

#### 4.1 `predictions` Tábla
\`\`\`sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE NOT NULL,
  
  -- Prediction Data
  predicted_at TIMESTAMPTZ DEFAULT now(),
  model_version TEXT NOT NULL, -- 'v1.0', 'v1.1', etc.
  predicted_winner TEXT NOT NULL, -- 'home', 'away', 'draw'
  predicted_home_goals DECIMAL(3,1),
  predicted_away_goals DECIMAL(3,1),
  predicted_btts BOOLEAN,
  predicted_over_2_5 BOOLEAN,
  
  -- Confidence Metrics
  confidence DECIMAL(3,2), -- 0.00 - 1.00
  css_score DECIMAL(3,1), -- 0.0 - 10.0
  
  -- Actual Results (filled after match)
  actual_winner TEXT, -- 'home', 'away', 'draw'
  actual_home_goals INTEGER,
  actual_away_goals INTEGER,
  actual_btts BOOLEAN,
  actual_over_2_5 BOOLEAN,
  result_recorded_at TIMESTAMPTZ,
  
  -- Accuracy Metrics
  winner_correct BOOLEAN,
  goals_diff_error DECIMAL(3,1), -- |predicted - actual|
  btts_correct BOOLEAN,
  over_2_5_correct BOOLEAN,
  overall_accuracy DECIMAL(3,2), -- Weighted accuracy score
  
  -- Metadata
  prediction_factors JSONB, -- Top factors that influenced prediction
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_predictions_match_date ON predictions(match_date DESC);
CREATE INDEX idx_predictions_model_version ON predictions(model_version);
CREATE INDEX idx_predictions_accuracy ON predictions(overall_accuracy) WHERE overall_accuracy IS NOT NULL;
\`\`\`

#### 4.2 `model_performance` Tábla
\`\`\`sql
CREATE TABLE model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Prediction Counts
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  
  -- Accuracy Metrics
  overall_accuracy DECIMAL(5,2), -- Percentage
  winner_accuracy DECIMAL(5,2),
  btts_accuracy DECIMAL(5,2),
  over_2_5_accuracy DECIMAL(5,2),
  
  -- Confidence Metrics
  avg_confidence DECIMAL(3,2),
  avg_css_score DECIMAL(3,1),
  confidence_calibration DECIMAL(3,2), -- How well confidence matches actual accuracy
  
  -- Goal Prediction Metrics
  avg_goals_error DECIMAL(3,2),
  rmse_goals DECIMAL(3,2), -- Root Mean Square Error
  
  -- League Breakdown
  performance_by_league JSONB, -- { "Premier League": { accuracy: 0.72 }, ... }
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(model_name, model_version, time_period, period_start)
);

-- Indexek
CREATE INDEX idx_model_perf_model ON model_performance(model_name, model_version);
CREATE INDEX idx_model_perf_period ON model_performance(period_start DESC);
CREATE INDEX idx_model_perf_accuracy ON model_performance(overall_accuracy DESC);
\`\`\`

#### 4.3 `model_comparison` Tábla
\`\`\`sql
CREATE TABLE model_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_date DATE NOT NULL,
  model_a_name TEXT NOT NULL,
  model_a_version TEXT NOT NULL,
  model_b_name TEXT NOT NULL,
  model_b_version TEXT NOT NULL,
  
  -- Comparison Metrics
  model_a_accuracy DECIMAL(5,2),
  model_b_accuracy DECIMAL(5,2),
  accuracy_diff DECIMAL(5,2), -- model_b - model_a
  statistical_significance DECIMAL(4,3), -- p-value
  winner TEXT, -- 'model_a', 'model_b', 'tie'
  
  -- Sample Size
  total_predictions INTEGER,
  
  -- Detailed Breakdown
  comparison_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

### 🔧 API Endpoints

#### 4.4 `/api/predictions/track` - Predikció Mentése
**Method:** POST  
**Body:**
\`\`\`typescript
{
  match_id: string;
  predicted_winner: 'home' | 'away' | 'draw';
  predicted_home_goals: number;
  predicted_away_goals: number;
  confidence: number;
  css_score: number;
  prediction_factors: Array<{
    factor: string;
    weight: number;
    type: 'supporting' | 'risk';
  }>;
}
\`\`\`

#### 4.5 `/api/predictions/update-results` - Eredmények Frissítése
**Method:** PATCH  
**Body:**
\`\`\`typescript
{
  match_id: string;
  actual_winner: 'home' | 'away' | 'draw';
  actual_home_goals: number;
  actual_away_goals: number;
}
\`\`\`
**Működés:**
1. Megkeresi a prediction-t match_id alapján
2. Kitölti az actual_* mezőket
3. Kiszámítja az accuracy metrikákat
4. Frissíti a `model_performance` táblát

#### 4.6 `/api/models/performance` - Model Teljesítmény
**Method:** GET  
**Query Params:** `?model=v1.0&period=weekly&start=2024-01-01&end=2024-01-31`  
**Response:**
\`\`\`typescript
{
  model_name: string;
  model_version: string;
  time_period: string;
  metrics: {
    overall_accuracy: number;
    winner_accuracy: number;
    btts_accuracy: number;
    total_predictions: number;
    correct_predictions: number;
    avg_confidence: number;
    avg_css_score: number;
  };
  performance_by_league: Record<string, { accuracy: number }>;
  trend: Array<{ date: string; accuracy: number }>;
}
\`\`\`

#### 4.7 `/api/models/compare` - Modellek Összehasonlítása
**Method:** POST  
**Body:**
\`\`\`typescript
{
  model_a: { name: string; version: string };
  model_b: { name: string; version: string };
  start_date: string;
  end_date: string;
}
\`\`\`
**Response:**
\`\`\`typescript
{
  model_a_accuracy: number;
  model_b_accuracy: number;
  accuracy_diff: number;
  statistical_significance: number; // p-value
  winner: 'model_a' | 'model_b' | 'tie';
  sample_size: number;
  breakdown: {
    winner_prediction: { a: number; b: number };
    btts_prediction: { a: number; b: number };
    over_2_5_prediction: { a: number; b: number };
  };
}
\`\`\`

#### 4.8 `/api/models/auto-prune` - Automatikus Feature Pruning
**Method:** POST  
**Body:**
\`\`\`typescript
{
  threshold: number; // Minimum accuracy (pl. 0.50)
  time_window: string; // 'last_30_days', 'last_90_days'
}
\`\`\`
**Működés:**
1. Elemzi az összes feature accuracy-jét
2. Azonosítja az underperforming feature-öket (< threshold)
3. Javaslatot ad az eltávolításra
4. Opcionálisan automatikusan disable-eli őket

### 🎨 Frontend Komponensek

#### 4.9 `/app/analytics/page.tsx` - Analytics Dashboard
**Új oldal létrehozása**

**Szekciók:**
1. **Overall Performance Card**
   - Total predictions
   - Overall accuracy (nagy számmal, színkódolva)
   - Trend chart (last 30 days)

2. **Model Comparison Chart**
   - Bar chart: Model A vs Model B accuracy
   - Line chart: Accuracy over time (multiple models)

3. **Accuracy Breakdown**
   - Winner prediction: 72%
   - BTTS prediction: 68%
   - Over 2.5 prediction: 65%
   - Goals prediction RMSE: 1.2

4. **Confidence Calibration Chart**
   - X-axis: Predicted confidence (0-100%)
   - Y-axis: Actual accuracy
   - Ideal line: y = x (perfect calibration)
   - Actual line: Shows over/under-confidence

5. **League Performance Table**
   - Liga neve | Predictions | Accuracy | Avg Confidence
   - Sortable columns

6. **Recent Predictions Table**
   - Match | Predicted | Actual | Accuracy | Confidence
   - Filter: All / Correct / Incorrect

#### 4.10 `ModelPerformanceChart` Komponens
\`\`\`typescript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={performanceData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis domain={[0, 100]} />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy %" />
    <Line type="monotone" dataKey="confidence" stroke="#82ca9d" name="Avg Confidence %" />
  </LineChart>
</ResponsiveContainer>
\`\`\`

### 🔄 Adatfolyamat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│              Predikció Készítése (Frontend)                 │
│  - User kiválaszt egy mérkőzést                            │
│  - Rendszer kiszámítja a predikciót                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/predictions/track                         │
│  - Predikció mentése predictions táblába                   │
│  - predicted_winner, confidence, css_score, factors        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Mérkőzés Lejátszódik                           │
│  - Eredmény beérkezik (CSV upload vagy API)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│       PATCH /api/predictions/update-results                 │
│  - actual_winner, actual_goals kitöltése                   │
│  - Accuracy számítás:                                       │
│    • winner_correct = (predicted == actual)                │
│    • goals_diff_error = |predicted - actual|               │
│    • overall_accuracy = weighted average                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Scheduled Job: evaluate-models (Daily)              │
│  - Aggregálja az accuracy metrikákat                       │
│  - Frissíti model_performance táblát                       │
│  - Számítja a confidence calibration-t                     │
│  - Liga-specifikus breakdown                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Analytics Dashboard Frissül                    │
│  - Real-time charts (SWR polling)                          │
│  - Performance trends                                       │
│  - Model comparison                                         │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 📊 Automatikus Tanulás

**Auto-Pruning Logic:**
\`\`\`typescript
// Scheduled Job: auto-prune-features (Weekly)
async function autoPruneFeatures() {
  const features = await analyzeFeaturePerformance({
    timeWindow: 'last_90_days',
    minPredictions: 50
  });
  
  const underperforming = features.filter(f => 
    f.accuracy < 0.50 && f.confidence > 0.70
  ); // High confidence, low accuracy = bad feature
  
  for (const feature of underperforming) {
    await disableFeature(feature.name);
    await notifyAdmin({
      message: `Feature "${feature.name}" disabled due to poor performance`,
      accuracy: feature.accuracy,
      confidence: feature.confidence
    });
  }
}
\`\`\`

---

## 🔍 Fázis 5: Pattern Detection

### 🎯 Cél
Rejtett minták felismerése a csapatok teljesítményében, amelyek javítják a predikciók pontosságát.

### 🗄️ Database Komponensek

#### 5.1 `team_patterns` Tábla
\`\`\`sql
CREATE TABLE team_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  league_id UUID REFERENCES leagues(id),
  
  -- Pattern Details
  pattern_type TEXT NOT NULL, -- 'winning_streak', 'home_dominance', 'high_scoring', 'late_scorer', etc.
  pattern_name TEXT NOT NULL, -- Human-readable name
  pattern_description TEXT,
  
  -- Pattern Data
  pattern_data JSONB NOT NULL, -- Specific pattern details
  confidence DECIMAL(3,2) NOT NULL, -- 0.00 - 1.00
  strength DECIMAL(3,2), -- Pattern strength (0.00 - 1.00)
  
  -- Validity
  detected_at TIMESTAMPTZ DEFAULT now(),
  valid_from DATE NOT NULL,
  valid_until DATE, -- NULL = still valid
  last_verified_at TIMESTAMPTZ,
  
  -- Impact
  prediction_impact DECIMAL(3,2), -- How much this pattern affects predictions
  historical_accuracy DECIMAL(3,2), -- How accurate predictions were when this pattern was present
  
  -- Metadata
  sample_size INTEGER, -- Number of matches used to detect pattern
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek
CREATE INDEX idx_team_patterns_team ON team_patterns(team_name);
CREATE INDEX idx_team_patterns_type ON team_patterns(pattern_type);
CREATE INDEX idx_team_patterns_valid ON team_patterns(valid_until) WHERE valid_until IS NULL;
CREATE INDEX idx_team_patterns_confidence ON team_patterns(confidence DESC);
\`\`\`

#### 5.2 `pattern_definitions` Tábla
\`\`\`sql
CREATE TABLE pattern_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL UNIQUE,
  pattern_name TEXT NOT NULL,
  description TEXT,
  
  -- Detection Logic
  detection_query TEXT, -- SQL query template
  detection_function TEXT, -- Edge function name
  min_sample_size INTEGER DEFAULT 5,
  min_confidence DECIMAL(3,2) DEFAULT 0.70,
  
  -- Configuration
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher = checked first
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Előre definiált minták
INSERT INTO pattern_definitions (pattern_type, pattern_name, description, min_sample_size) VALUES
('winning_streak', 'Győzelmi Széria', 'Csapat 3+ egymás utáni győzelmet ért el', 3),
('losing_streak', 'Vereség Széria', 'Csapat 3+ egymás utáni vereséget szenvedett', 3),
('home_dominance', 'Hazai Erőd', 'Csapat >70% win rate otthon', 5),
('away_weakness', 'Vendég Gyengeség', 'Csapat <30% win rate idegenben', 5),
('high_scoring', 'Gólzápor', 'Csapat átlag >3 gól/meccs (last 5)', 5),
('defensive_solid', 'Védelmi Fal', 'Csapat <1 kapott gól/meccs (last 5)', 5),
('btts_specialist', 'BTTS Specialista', 'Csapat >80% BTTS (last 10)', 10),
('early_scorer', 'Korai Gólos', 'Csapat >60% első félidős gól (last 10)', 10),
('late_comeback', 'Késői Fordító', 'Csapat >50% második félidős comeback (last 10)', 10),
('form_surge', 'Forma Emelkedés', 'Csapat form index +30% (last 3 vs previous 3)', 6);
\`\`\`

### 🔧 API Endpoints

#### 5.3 `/api/patterns/detect` - Minták Felismerése
**Method:** POST  
**Body:**
\`\`\`typescript
{
  team_name?: string; // Ha nincs megadva, minden csapatot ellenőriz
  league_id?: string;
  pattern_types?: string[]; // Ha nincs megadva, minden típust ellenőriz
}
\`\`\`
**Response:**
\`\`\`typescript
{
  detected_patterns: Array<{
    team_name: string;
    pattern_type: string;
    pattern_name: string;
    confidence: number;
    strength: number;
    pattern_data: any;
    detected_at: string;
  }>;
  total_detected: number;
}
\`\`\`

#### 5.4 `/api/patterns/team/{teamName}` - Csapat Mintái
**Method:** GET  
**Response:**
\`\`\`typescript
{
  team_name: string;
  active_patterns: Array<{
    pattern_type: string;
    pattern_name: string;
    pattern_description: string;
    confidence: number;
    strength: number;
    detected_at: string;
    pattern_data: {
      // Pattern-specific data
      streak_length?: number;
      win_rate?: number;
      avg_goals?: number;
      // ...
    };
  }>;
  expired_patterns: Array<{...}>; // Recently expired patterns
}
\`\`\`

#### 5.5 `/api/patterns/verify` - Minták Verifikálása
**Method:** POST  
**Body:**
\`\`\`typescript
{
  pattern_id: string;
}
\`\`\`
**Működés:**
1. Újra futtatja a detection logic-ot
2. Ha a minta még mindig érvényes → frissíti `last_verified_at`
3. Ha már nem érvényes → beállítja `valid_until` dátumot
4. Frissíti a `confidence` és `strength` értékeket

### 🎨 Frontend Komponensek

#### 5.6 `TeamPatternsSection` Komponens
**Fájl:** `components/team-patterns-section.tsx`

**Megjelenítés:**
\`\`\`typescript
<Card>
  <CardHeader>
    <CardTitle>🔍 Felismert Minták</CardTitle>
    <CardDescription>
      Automatikusan felismert teljesítmény minták
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid gap-3">
      {patterns.map(pattern => (
        <PatternBadge
          key={pattern.id}
          pattern={pattern}
          showDetails={true}
        />
      ))}
    </div>
  </CardContent>
</Card>
\`\`\`

#### 5.7 `PatternBadge` Komponens
**Példa megjelenítések:**

\`\`\`typescript
// Winning Streak
<Badge variant="success" className="flex items-center gap-2">
  🔥 5 meccs óta veretlen
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>ℹ️</TooltipTrigger>
      <TooltipContent>
        <p>Confidence: 95%</p>
        <p>Strength: 0.88</p>
        <p>Last 5: W-W-W-D-W</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</Badge>

// Home Dominance
<Badge variant="info">
  🏠 Hazai erőd (85% win rate)
</Badge>

// High Scoring
<Badge variant="warning">
  ⚽ Gólzápor (átlag 3.4 gól/meccs)
</Badge>

// Defensive Solid
<Badge variant="secondary">
  🛡️ Védelmi fal (0.6 kapott gól/meccs)
</Badge>
\`\`\`

### 🧠 Pattern Detection Algoritmusok

#### 5.8 Winning/Losing Streak Detection
\`\`\`typescript
async function detectStreak(teamName: string, leagueId: string) {
  const recentMatches = await getRecentMatches(teamName, leagueId, 10);
  
  let currentStreak = 0;
  let streakType: 'winning' | 'losing' | null = null;
  
  for (const match of recentMatches) {
    const result = getMatchResult(match, teamName);
    
    if (result === 'win') {
      if (streakType === 'winning' || streakType === null) {
        currentStreak++;
        streakType = 'winning';
      } else break;
    } else if (result === 'loss') {
      if (streakType === 'losing' || streakType === null) {
        currentStreak++;
        streakType = 'losing';
      } else break;
    } else {
      break; // Draw breaks streak
    }
  }
  
  if (currentStreak >= 3) {
    return {
      pattern_type: streakType === 'winning' ? 'winning_streak' : 'losing_streak',
      confidence: Math.min(0.70 + (currentStreak * 0.05), 0.95),
      strength: currentStreak / 10,
      pattern_data: {
        streak_length: currentStreak,
        results: recentMatches.slice(0, currentStreak).map(m => getMatchResult(m, teamName))
      }
    };
  }
  
  return null;
}
\`\`\`

#### 5.9 Home/Away Dominance Detection
\`\`\`typescript
async function detectHomeDominance(teamName: string, leagueId: string) {
  const homeMatches = await getHomeMatches(teamName, leagueId, 10);
  
  const wins = homeMatches.filter(m => getMatchResult(m, teamName) === 'win').length;
  const winRate = wins / homeMatches.length;
  
  if (winRate >= 0.70) {
    return {
      pattern_type: 'home_dominance',
      confidence: winRate,
      strength: (winRate - 0.70) / 0.30, // Normalize to 0-1
      pattern_data: {
        win_rate: winRate,
        wins: wins,
        total_matches: homeMatches.length,
        avg_goals_scored: calculateAvgGoals(homeMatches, teamName, 'scored'),
        avg_goals_conceded: calculateAvgGoals(homeMatches, teamName, 'conceded')
      }
    };
  }
  
  return null;
}
\`\`\`

#### 5.10 High Scoring Trend Detection
\`\`\`typescript
async function detectHighScoring(teamName: string, leagueId: string) {
  const recentMatches = await getRecentMatches(teamName, leagueId, 5);
  
  const totalGoals = recentMatches.reduce((sum, match) => {
    return sum + getGoalsScored(match, teamName);
  }, 0);
  
  const avgGoals = totalGoals / recentMatches.length;
  
  if (avgGoals >= 3.0) {
    return {
      pattern_type: 'high_scoring',
      confidence: Math.min(avgGoals / 5, 0.95), // Max confidence at 5 goals/match
      strength: (avgGoals - 3.0) / 2.0, // Normalize to 0-1 (3-5 goals range)
      pattern_data: {
        avg_goals: avgGoals,
        total_goals: totalGoals,
        matches_analyzed: recentMatches.length,
        goal_distribution: recentMatches.map(m => getGoalsScored(m, teamName))
      }
    };
  }
  
  return null;
}
\`\`\`

#### 5.11 Form Surge Detection
\`\`\`typescript
async function detectFormSurge(teamName: string, leagueId: string) {
  const last3Matches = await getRecentMatches(teamName, leagueId, 3);
  const previous3Matches = await getRecentMatches(teamName, leagueId, 6).slice(3);
  
  const recentFormIndex = calculateFormIndex(last3Matches, teamName);
  const previousFormIndex = calculateFormIndex(previous3Matches, teamName);
  
  const formChange = ((recentFormIndex - previousFormIndex) / previousFormIndex) * 100;
  
  if (formChange >= 30) {
    return {
      pattern_type: 'form_surge',
      confidence: Math.min(0.70 + (formChange / 100), 0.95),
      strength: Math.min(formChange / 100, 1.0),
      pattern_data: {
        form_change_percent: formChange,
        recent_form_index: recentFormIndex,
        previous_form_index: previousFormIndex,
        recent_results: last3Matches.map(m => getMatchResult(m, teamName)),
        previous_results: previous3Matches.map(m => getMatchResult(m, teamName))
      }
    };
  }
  
  return null;
}
\`\`\`

### 🔄 Adatfolyamat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│     Scheduled Job: detect-patterns (Daily 4:00 AM)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Minden Csapat Iterálása (Párhuzamosan)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Arsenal      │  │ Liverpool    │  │ Man City     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Pattern Detection Functions Futtatása             │
│  - detectStreak()                                           │
│  - detectHomeDominance()                                    │
│  - detectHighScoring()                                      │
│  - detectDefensiveSolid()                                   │
│  - detectBTTSSpecialist()                                   │
│  - detectFormSurge()                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Minták Mentése / Frissítése                    │
│  - Új minta → INSERT INTO team_patterns                    │
│  - Meglévő minta → UPDATE confidence, strength             │
│  - Lejárt minta → SET valid_until = now()                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Minták Integrálása Predikciókba                     │
│  - Predikció készítésekor lekéri az aktív mintákat         │
│  - Súlyozza a predikciót a minták alapján                  │
│  - Növeli a confidence-t ha erős minta van                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend Megjelenítés                          │
│  - TeamDetail oldalon "Felismert Minták" szekció          │
│  - Badge-ek színkódolva                                     │
│  - Tooltip részletes infóval                               │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 📊 Pattern Impact on Predictions

**Súlyozási Logika:**
\`\`\`typescript
function adjustPredictionWithPatterns(
  basePrediction: Prediction,
  patterns: TeamPattern[]
): Prediction {
  let adjustedPrediction = { ...basePrediction };
  
  for (const pattern of patterns) {
    switch (pattern.pattern_type) {
      case 'winning_streak':
        // Növeli a győzelmi esélyt
        adjustedPrediction.win_probability *= (1 + pattern.strength * 0.15);
        adjustedPrediction.confidence *= (1 + pattern.confidence * 0.10);
        break;
        
      case 'home_dominance':
        // Csak hazai meccseknél
        if (basePrediction.is_home_match) {
          adjustedPrediction.win_probability *= (1 + pattern.strength * 0.20);
        }
        break;
        
      case 'high_scoring':
        // Növeli a várható gólokat
        adjustedPrediction.expected_goals *= (1 + pattern.strength * 0.25);
        adjustedPrediction.over_2_5_probability *= (1 + pattern.strength * 0.15);
        break;
        
      case 'defensive_solid':
        // Csökkenti a kapott gólokat
        adjustedPrediction.expected_goals_conceded *= (1 - pattern.strength * 0.20);
        break;
        
      case 'form_surge':
        // Általános confidence boost
        adjustedPrediction.confidence *= (1 + pattern.strength * 0.12);
        break;
    }
  }
  
  // Normalizálás (valószínűségek ne lépjék túl az 1.0-t)
  adjustedPrediction.win_probability = Math.min(adjustedPrediction.win_probability, 0.95);
  adjustedPrediction.confidence = Math.min(adjustedPrediction.confidence, 0.95);
  
  return adjustedPrediction;
}
\`\`\`

---

## 🏆 Fázis 6: Champion/Challenger Framework

### 🎯 Cél
Több predikciós model párhuzamos futtatása, automatikus teljesítmény összehasonlítás, és a legjobb model automatikus promóciója.

### 🗄️ Database Komponensek

#### 6.1 `model_registry` Tábla
\`\`\`sql
CREATE TABLE model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'champion', 'challenger', 'retired'
  
  -- Model Details
  description TEXT,
  algorithm TEXT, -- 'poisson', 'elo', 'ml_ensemble', 'neural_network'
  hyperparameters JSONB,
  
  -- Deployment Info
  deployed_at TIMESTAMPTZ,
  deployed_by TEXT,
  traffic_allocation DECIMAL(3,2) DEFAULT 0.00, -- 0.00 - 1.00 (percentage of traffic)
  
  -- Performance Metrics
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  current_accuracy DECIMAL(5,2),
  avg_confidence DECIMAL(3,2),
  avg_css_score DECIMAL(3,1),
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'testing', 'retired', 'failed'
  last_evaluated_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(model_name, model_version)
);

-- Indexek
CREATE INDEX idx_model_registry_type ON model_registry(model_type);
CREATE INDEX idx_model_registry_status ON model_registry(status);
CREATE INDEX idx_model_registry_accuracy ON model_registry(current_accuracy DESC);

-- Kezdeti modellek
INSERT INTO model_registry (model_name, model_version, model_type, algorithm, traffic_allocation, status) VALUES
('Poisson Model', 'v1.0', 'champion', 'poisson', 0.90, 'active'),
('Elo Model', 'v1.0', 'challenger', 'elo', 0.10, 'testing');
\`\`\`

#### 6.2 `model_experiments` Tábla
\`\`\`sql
CREATE TABLE model_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL,
  champion_model_id UUID REFERENCES model_registry(id),
  challenger_model_id UUID REFERENCES model_registry(id),
  
  -- Experiment Config
  start_date DATE NOT NULL,
  end_date DATE,
  target_sample_size INTEGER DEFAULT 100,
  significance_threshold DECIMAL(4,3) DEFAULT 0.05, -- p-value
  
  -- Results
  champion_accuracy DECIMAL(5,2),
  challenger_accuracy DECIMAL(5,2),
  accuracy_diff DECIMAL(5,2),
  statistical_significance DECIMAL(4,3), -- p-value
  winner TEXT, -- 'champion', 'challenger', 'tie', 'ongoing'
  
  -- Decision
  decision TEXT, -- 'promote_challenger', 'keep_champion', 'continue_testing'
  decision_made_at TIMESTAMPTZ,
  decision_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

#### 6.3 `model_predictions` Tábla (Bővítés)
\`\`\`sql
-- Hozzáadás a meglévő predictions táblához
ALTER TABLE predictions ADD COLUMN model_id UUID REFERENCES model_registry(id);
ALTER TABLE predictions ADD COLUMN model_name TEXT;
ALTER TABLE predictions ADD COLUMN model_version TEXT;
ALTER TABLE predictions ADD COLUMN is_shadow_mode BOOLEAN DEFAULT false;

CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_predictions_shadow ON predictions(is_shadow_mode);
\`\`\`

### 🔧 API Endpoints

#### 6.4 `/api/models/register` - Új Model Regisztrálása
**Method:** POST  
**Body:**
\`\`\`typescript
{
  model_name: string;
  model_version: string;
  model_type: 'champion' | 'challenger';
  algorithm: string;
  description?: string;
  hyperparameters?: Record<string, any>;
  traffic_allocation?: number; // 0.00 - 1.00
}
\`\`\`

#### 6.5 `/api/models/select` - Model Kiválasztása (Epsilon-Greedy)
**Method:** GET  
**Query Params:** `?match_id=xxx`  
**Response:**
\`\`\`typescript
{
  selected_model: {
    id: string;
    model_name: string;
    model_version: string;
    model_type: 'champion' | 'challenger';
    traffic_allocation: number;
  };
  selection_reason: 'champion' | 'challenger_test' | 'random';
  epsilon: number; // Current exploration rate
}
\`\`\`

**Működés (Epsilon-Greedy):**
\`\`\`typescript
function selectModel(epsilon: number = 0.10): Model {
  const random = Math.random();
  
  if (random < epsilon) {
    // Exploration: Select challenger
    return getChallengerModel();
  } else {
    // Exploitation: Select champion
    return getChampionModel();
  }
}
\`\`\`

#### 6.6 `/api/models/shadow-run` - Shadow Mode Futtatás
**Method:** POST  
**Body:**
\`\`\`typescript
{
  match_id: string;
  champion_model_id: string;
  challenger_model_id: string;
}
\`\`\`
**Működés:**
1. Futtatja mindkét modellt párhuzamosan
2. Champion predikciót visszaadja a usernek
3. Challenger predikciót elmenti `is_shadow_mode = true` flag-gel
4. Később összehasonlítja az eredményeket

#### 6.7 `/api/models/promote` - Model Promóció
**Method:** POST  
**Body:**
\`\`\`typescript
{
  challenger_model_id: string;
  reason: string;
}
\`\`\`
**Működés:**
1. Jelenlegi champion → `model_type = 'retired'`
2. Challenger → `model_type = 'champion'`, `traffic_allocation = 0.90`
3. Új challenger regisztrálása (ha van)

#### 6.8 `/api/experiments/create` - Új Experiment Indítása
**Method:** POST  
**Body:**
\`\`\`typescript
{
  experiment_name: string;
  champion_model_id: string;
  challenger_model_id: string;
  target_sample_size: number;
  duration_days: number;
}
\`\`\`

#### 6.9 `/api/experiments/evaluate` - Experiment Értékelése
**Method:** POST  
**Body:**
\`\`\`typescript
{
  experiment_id: string;
}
\`\`\`
**Response:**
\`\`\`typescript
{
  experiment_name: string;
  champion_accuracy: number;
  challenger_accuracy: number;
  accuracy_diff: number;
  statistical_significance: number; // p-value
  winner: 'champion' | 'challenger' | 'tie';
  decision: 'promote_challenger' | 'keep_champion' | 'continue_testing';
  decision_reason: string;
  sample_size: number;
  confidence_interval: { lower: number; upper: number };
}
\`\`\`

**Statisztikai Teszt (Chi-Square Test):**
\`\`\`typescript
function evaluateExperiment(experimentId: string) {
  const championPredictions = getPredictions(championModelId);
  const challengerPredictions = getPredictions(challengerModelId);
  
  const championAccuracy = calculateAccuracy(championPredictions);
  const challengerAccuracy = calculateAccuracy(challengerPredictions);
  
  const pValue = chiSquareTest(championPredictions, challengerPredictions);
  
  let decision: string;
  let winner: string;
  
  if (pValue < 0.05) {
    // Statistically significant difference
    if (challengerAccuracy > championAccuracy + 0.05) {
      // Challenger is 5%+ better
      decision = 'promote_challenger';
      winner = 'challenger';
    } else {
      decision = 'keep_champion';
      winner = 'champion';
    }
  } else {
    // No significant difference
    decision = 'continue_testing';
    winner = 'tie';
  }
  
  return { championAccuracy, challengerAccuracy, pValue, decision, winner };
}
\`\`\`

### 🎨 Frontend Komponensek

#### 6.10 `/app/models/page.tsx` - Model Management Dashboard
**Új oldal létrehozása**

**Szekciók:**
1. **Active Models Card**
   - Champion model (nagy kártya, zöld border)
   - Challenger model(ek) (kisebb kártyák, sárga border)
   - Retired models (szürke, collapsed)

2. **Model Comparison Chart**
   - Line chart: Accuracy over time (champion vs challenger)
   - Bar chart: Side-by-side accuracy comparison

3. **Traffic Allocation Pie Chart**
   - Champion: 90%
   - Challenger: 10%

4. **Experiments Table**
   - Experiment name | Start date | Status | Winner | Action
   - "View Details" gomb

5. **Promote Challenger Button**
   - Csak akkor enabled, ha challenger > champion + 5%
   - Confirmation modal

#### 6.11 `ModelCard` Komponens
\`\`\`typescript
<Card className={modelType === 'champion' ? 'border-green-500' : 'border-yellow-500'}>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>{modelName} {modelVersion}</CardTitle>
        <CardDescription>{algorithm}</CardDescription>
      </div>
      <Badge variant={modelType === 'champion' ? 'success' : 'warning'}>
        {modelType === 'champion' ? '👑 Champion' : '🥊 Challenger'}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Accuracy:</span>
        <span className="font-bold">{accuracy}%</span>
      </div>
      <div className="flex justify-between">
        <span>Predictions:</span>
        <span>{totalPredictions}</span>
      </div>
      <div className="flex justify-between">
        <span>Traffic:</span>
        <span>{trafficAllocation * 100}%</span>
      </div>
      <Progress value={accuracy} className="h-2" />
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm" onClick={onViewDetails}>
      View Details
    </Button>
  </CardFooter>
</Card>
\`\`\`

### 🔄 Adatfolyamat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│              User Kér Egy Predikciót                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         GET /api/models/select (Epsilon-Greedy)             │
│  - 90% esély: Champion model                               │
│  - 10% esély: Challenger model                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Kiválasztott Model Futtatása                   │
│  - Predikció számítás                                       │
│  - Mentés predictions táblába (model_id, model_name)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Shadow Mode: Másik Model is Fut (Háttérben)        │
│  - Challenger predikció számítás                           │
│  - Mentés is_shadow_mode = true flag-gel                   │
│  - User nem látja ezt a predikciót                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Mérkőzés Lejátszódik                           │
│  - Eredmény beérkezik                                       │
│  - Mindkét predikció accuracy-je kiszámolódik              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    Scheduled Job: evaluate-experiments (Daily)              │
│  - Összehasonlítja champion vs challenger accuracy-t       │
│  - Statisztikai teszt (Chi-Square, p-value)                │
│  - Ha challenger > champion + 5% AND p < 0.05:             │
│    → Automatikus promóció javaslat                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Döntés (vagy Auto-Promote)               │
│  - Ha auto-promote enabled: Automatikus promóció           │
│  - Ha manual: Email notification adminnak                  │
│  - Promóció után: Challenger → Champion                    │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 📊 Automatikus Promóció Logika

\`\`\`typescript
// Scheduled Job: auto-promote-models (Weekly)
async function autoPromoteModels() {
  const experiments = await getActiveExperiments();
  
  for (const experiment of experiments) {
    const evaluation = await evaluateExperiment(experiment.id);
    
    // Promóció feltételek:
    // 1. Challenger accuracy > Champion accuracy + 5%
    // 2. Statisztikai szignifikancia (p < 0.05)
    // 3. Minimum 100 predikció mindkét modellnél
    // 4. Minimum 2 hét tesztelés
    
    const shouldPromote = (
      evaluation.challengerAccuracy > evaluation.championAccuracy + 0.05 &&
      evaluation.pValue < 0.05 &&
      evaluation.sampleSize >= 100 &&
      daysSince(experiment.start_date) >= 14
    );
    
    if (shouldPromote) {
      await promoteChallenger(experiment.challenger_model_id, {
        reason: `Challenger outperformed champion by ${evaluation.accuracy_diff}% (p=${evaluation.pValue})`,
        experiment_id: experiment.id
      });
      
      await notifyAdmin({
        subject: '🏆 Model Promoted: New Champion!',
        message: `Challenger model has been automatically promoted to champion.`,
        details: evaluation
      });
    }
  }
}
\`\`\`

---

## 🌍 Fázis 7: Cross-League Intelligence

### 🎯 Cél
Liga-közti korrelációk felismerése, meta-minták felfedezése, és univerzális football insights generálása.

### 🗄️ Database Komponensek

#### 7.1 `cross_league_correlations` Tábla
\`\`\`sql
CREATE TABLE cross_league_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_a_id UUID REFERENCES leagues(id),
  league_b_id UUID REFERENCES leagues(id),
  
  -- Correlation Metrics
  correlation_type TEXT NOT NULL, -- 'scoring_rate', 'defensive_strength', 'home_advantage', 'form_consistency'
  correlation_coefficient DECIMAL(4,3), -- -1.00 to 1.00 (Pearson correlation)
  correlation_strength TEXT, -- 'strong', 'moderate', 'weak', 'none'
  
  -- Statistical Significance
  p_value DECIMAL(5,4),
  sample_size INTEGER,
  confidence_interval JSONB, -- { lower: -0.15, upper: 0.45 }
  
  -- Insights
  insight_summary TEXT,
  actionable_recommendation TEXT,
  
  -- Validity
  calculated_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(league_a_id, league_b_id, correlation_type)
);

-- Indexek
CREATE INDEX idx_cross_league_corr_leagues ON cross_league_correlations(league_a_id, league_b_id);
CREATE INDEX idx_cross_league_corr_type ON cross_league_correlations(correlation_type);
CREATE INDEX idx_cross_league_corr_strength ON cross_league_correlations(correlation_coefficient DESC);
\`\`\`

#### 7.2 `meta_patterns` Tábla
\`\`\`sql
CREATE TABLE meta_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL UNIQUE,
  pattern_type TEXT NOT NULL, -- 'universal_truth', 'counter_intuitive', 'league_specific'
  
  -- Pattern Description
  description TEXT NOT NULL,
  discovery_method TEXT, -- 'statistical_analysis', 'ml_discovery', 'manual_observation'
  
  -- Evidence
  supporting_leagues TEXT[], -- Array of league names
  evidence_strength DECIMAL(3,2), -- 0.00 - 1.00
  sample_size INTEGER,
  
  -- Statistical Validation
  statistical_significance DECIMAL(5,4), -- p-value
  confidence_level DECIMAL(3,2), -- 0.95 = 95% confidence
  
  -- Impact
  prediction_impact DECIMAL(3,2), -- How much this affects predictions
  accuracy_improvement DECIMAL(4,2), -- % improvement when applied
  
  -- Pattern Data
  pattern_data JSONB, -- Detailed pattern information
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'testing', 'deprecated'
  validated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Példa meta-minták
INSERT INTO meta_patterns (pattern_name, pattern_type, description, supporting_leagues, evidence_strength) VALUES
('Form Always Wins', 'universal_truth', 'Csapat jelenlegi formája erősebb prediktor mint a történelmi teljesítmény', ARRAY['Premier League', 'La Liga', 'Bundesliga'], 0.87),
('Home Advantage Decay', 'universal_truth', 'Hazai előny csökken a szezon végéhez közeledve', ARRAY['Premier League', 'La Liga'], 0.72),
('Underdog Surge', 'counter_intuitive', 'Kiesés ellen küzdő csapatok váratlanul jól teljesítenek a szezon utolsó 5 hetében', ARRAY['Premier League', 'Serie A'], 0.68),
('Derby Unpredictability', 'universal_truth', 'Derby meccsek 30%-kal kevésbé prediktálhatóak mint normál meccsek', ARRAY['Premier League', 'La Liga', 'Bundesliga', 'Serie A'], 0.91);
\`\`\`

#### 7.3 `league_characteristics` Tábla
\`\`\`sql
CREATE TABLE league_characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) UNIQUE,
  league_name TEXT NOT NULL,
  
  -- Scoring Characteristics
  avg_goals_per_match DECIMAL(3,2),
  avg_home_goals DECIMAL(3,2),
  avg_away_goals DECIMAL(3,2),
  btts_percentage DECIMAL(3,2),
  over_2_5_percentage DECIMAL(3,2),
  
  -- Competitive Balance
  competitive_balance_index DECIMAL(3,2), -- 0.00 - 1.00 (1.00 = perfectly balanced)
  dominance_factor DECIMAL(3,2), -- How dominant are top teams
  upset_frequency DECIMAL(3,2), -- % of unexpected results
  
  -- Playing Style
  avg_possession_differential DECIMAL(3,2),
  avg_shots_per_match DECIMAL(3,2),
  avg_corners_per_match DECIMAL(3,2),
  physicality_index DECIMAL(3,2), -- Based on fouls, cards
  
  -- Home Advantage
  home_win_percentage DECIMAL(3,2),
  home_advantage_strength DECIMAL(3,2), -- 0.00 - 1.00
  
  -- Predictability
  predictability_score DECIMAL(3,2), -- 0.00 - 1.00 (1.00 = highly predictable)
  form_consistency DECIMAL(3,2), -- How consistent are team forms
  
  -- Temporal Patterns
  seasonal_trends JSONB, -- { "early_season": {...}, "mid_season": {...}, "late_season": {...} }
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  season TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

### 🔧 API Endpoints

#### 7.4 `/api/cross-league/correlations` - Liga Korrelációk
**Method:** GET  
**Query Params:** `?league_a=premier-league&league_b=la-liga&type=scoring_rate`  
**Response:**
\`\`\`typescript
{
  league_a: { id: string; name: string };
  league_b: { id: string; name: string };
  correlations: Array<{
    correlation_type: string;
    correlation_coefficient: number; // -1.00 to 1.00
    correlation_strength: 'strong' | 'moderate' | 'weak' | 'none';
    p_value: number;
    insight_summary: string;
    actionable_recommendation: string;
  }>;
}
\`\`\`

#### 7.5 `/api/cross-league/analyze` - Liga Összehasonlítás
**Method:** POST  
**Body:**
\`\`\`typescript
{
  league_ids: string[];
  metrics: string[]; // ['scoring_rate', 'home_advantage', 'predictability']
}
\`\`\`
**Response:**
\`\`\`typescript
{
  leagues: Array<{
    league_id: string;
    league_name: string;
    characteristics: {
      avg_goals_per_match: number;
      home_win_percentage: number;
      predictability_score: number;
      competitive_balance_index: number;
    };
  }>;
  comparisons: Array<{
    metric: string;
    league_rankings: Array<{ league_name: string; value: number; rank: number }>;
    insights: string[];
  }>;
}
\`\`\`

#### 7.6 `/api/meta-patterns/discover` - Meta-Minták Felfedezése
**Method:** POST  
**Body:**
\`\`\`typescript
{
  min_leagues: number; // Minimum hány ligában kell megjelennie
  min_evidence_strength: number; // 0.00 - 1.00
}
\`\`\`
**Response:**
\`\`\`typescript
{
  discovered_patterns: Array<{
    pattern_name: string;
    pattern_type: string;
    description: string;
    supporting_leagues: string[];
    evidence_strength: number;
    prediction_impact: number;
    accuracy_improvement: number;
  }>;
  total_discovered: number;
}
\`\`\`

#### 7.7 `/api/meta-patterns/apply` - Meta-Minta Alkalmazása
**Method:** POST  
**Body:**
\`\`\`typescript
{
  pattern_id: string;
  match_id: string;
}
\`\`\`
**Response:**
\`\`\`typescript
{
  original_prediction: Prediction;
  adjusted_prediction: Prediction;
  applied_patterns: Array<{
    pattern_name: string;
    adjustment_factor: number;
    confidence_boost: number;
  }>;
}
\`\`\`

### 🎨 Frontend Komponensek

#### 7.8 `/app/cross-league/page.tsx` - Cross-League Dashboard
**Új oldal létrehozása**

**Szekciók:**
1. **League Comparison Matrix**
   - Heatmap: Liga vs Liga korrelációk
   - Hover: Részletes correlation info

2. **League Characteristics Radar Chart**
   - Több liga összehasonlítása radar chart-on
   - Metrics: Scoring, Home Advantage, Predictability, Competitive Balance

3. **Meta-Patterns List**
   - Universal Truths (zöld badge)
   - Counter-Intuitive Patterns (sárga badge)
   - League-Specific Patterns (kék badge)

4. **Cross-League Insights**
   - "Premier League csapatok átlagosan 0.3 góllal többet rúgnak mint La Liga csapatok"
   - "Bundesliga hazai előnye 15%-kal erősebb mint Serie A-ban"

#### 7.9 `LeagueComparisonRadarChart` Komponens
\`\`\`typescript
<ResponsiveContainer width="100%" height={400}>
  <RadarChart data={leagueData}>
    <PolarGrid />
    <PolarAngleAxis dataKey="metric" />
    <PolarRadiusAxis angle={90} domain={[0, 100]} />
    <Radar name="Premier League" dataKey="premier_league" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
    <Radar name="La Liga" dataKey="la_liga" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
    <Radar name="Bundesliga" dataKey="bundesliga" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
    <Legend />
  </RadarChart>
</ResponsiveContainer>
\`\`\`

#### 7.10 `CorrelationHeatmap` Komponens
\`\`\`typescript
// Heatmap megjelenítés (Recharts vagy custom SVG)
<div className="grid grid-cols-5 gap-1">
  {correlationMatrix.map((row, i) => (
    row.map((cell, j) => (
      <div
        key={`${i}-${j}`}
        className={`p-4 rounded ${getColorForCorrelation(cell.value)}`}
        title={`${cell.league_a} vs ${cell.league_b}: ${cell.value}`}
      >
        {cell.value.toFixed(2)}
      </div>
    ))
  ))}
</div>

function getColorForCorrelation(value: number): string {
  if (value > 0.7) return 'bg-green-500';
  if (value > 0.4) return 'bg-yellow-500';
  if (value > 0.0) return 'bg-orange-500';
  return 'bg-red-500';
}
\`\`\`

### 🧠 Cross-League Analysis Algoritmusok

#### 7.11 Correlation Analysis
\`\`\`typescript
async function analyzeCrossLeagueCorrelation(
  leagueAId: string,
  leagueBId: string,
  metric: string
): Promise<Correlation> {
  // Lekéri mindkét liga csapatainak adatait
  const leagueAData = await getLeagueMetrics(leagueAId, metric);
  const leagueBData = await getLeagueMetrics(leagueBId, metric);
  
  // Pearson correlation coefficient számítás
  const correlation = calculatePearsonCorrelation(leagueAData, leagueBData);
  
  // Statistical significance (p-value)
  const pValue = calculatePValue(correlation, leagueAData.length);
  
  // Correlation strength classification
  const strength = classifyCorrelationStrength(correlation);
  
  // Insight generation
  const insight = generateCorrelationInsight(leagueAId, leagueBId, metric, correlation);
  
  return {
    correlation_coefficient: correlation,
    p_value: pValue,
    correlation_strength: strength,
    insight_summary: insight,
    sample_size: leagueAData.length
  };
}

function calculatePearsonCorrelation(dataA: number[], dataB: number[]): number {
  const n = dataA.length;
  const sumA = dataA.reduce((a, b) => a + b, 0);
  const sumB = dataB.reduce((a, b) => a + b, 0);
  const sumAB = dataA.reduce((sum, a, i) => sum + a * dataB[i], 0);
  const sumA2 = dataA.reduce((sum, a) => sum + a * a, 0);
  const sumB2 = dataB.reduce((sum, b) => sum + b * b, 0);
  
  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  
  return numerator / denominator;
}

function classifyCorrelationStrength(r: number): string {
  const absR = Math.abs(r);
  if (absR >= 0.7) return 'strong';
  if (absR >= 0.4) return 'moderate';
  if (absR >= 0.2) return 'weak';
  return 'none';
}
\`\`\`

#### 7.12 Meta-Pattern Discovery
\`\`\`typescript
async function discoverMetaPatterns(
  minLeagues: number = 3,
  minEvidenceStrength: number = 0.70
): Promise<MetaPattern[]> {
  const allLeagues = await getAllLeagues();
  const discoveredPatterns: MetaPattern[] = [];
  
  // Pattern 1: Form Always Wins
  const formPattern = await analyzeFormImpact(allLeagues);
  if (formPattern.supporting_leagues.length >= minLeagues && 
      formPattern.evidence_strength >= minEvidenceStrength) {
    discoveredPatterns.push(formPattern);
  }
  
  // Pattern 2: Home Advantage Decay
  const homeAdvantagePattern = await analyzeHomeAdvantageTrend(allLeagues);
  if (homeAdvantagePattern.supporting_leagues.length >= minLeagues && 
      homeAdvantagePattern.evidence_strength >= minEvidenceStrength) {
    discoveredPatterns.push(homeAdvantagePattern);
  }
  
  // Pattern 3: Derby Unpredictability
  const derbyPattern = await analyzeDerbyMatches(allLeagues);
  if (derbyPattern.supporting_leagues.length >= minLeagues && 
      derbyPattern.evidence_strength >= minEvidenceStrength) {
    discoveredPatterns.push(derbyPattern);
  }
  
  // Pattern 4: Underdog Surge (Late Season)
  const underdogPattern = await analyzeUnderdogPerformance(allLeagues);
  if (underdogPattern.supporting_leagues.length >= minLeagues && 
      underdogPattern.evidence_strength >= minEvidenceStrength) {
    discoveredPatterns.push(underdogPattern);
  }
  
  return discoveredPatterns;
}

async function analyzeFormImpact(leagues: League[]): Promise<MetaPattern> {
  const supportingLeagues: string[] = [];
  let totalEvidenceStrength = 0;
  
  for (const league of leagues) {
    // Összehasonlítja a form-based predictions vs historical-based predictions accuracy-jét
    const formAccuracy = await getFormBasedAccuracy(league.id);
    const historicalAccuracy = await getHistoricalBasedAccuracy(league.id);
    
    if (formAccuracy > historicalAccuracy + 0.05) {
      supportingLeagues.push(league.name);
      totalEvidenceStrength += (formAccuracy - historicalAccuracy);
    }
  }
  
  return {
    pattern_name: 'Form Always Wins',
    pattern_type: 'universal_truth',
    description: 'Csapat jelenlegi formája erősebb prediktor mint a történelmi teljesítmény',
    supporting_leagues: supportingLeagues,
    evidence_strength: totalEvidenceStrength / supportingLeagues.length,
    prediction_impact: 0.15,
    accuracy_improvement: 0.08
  };
}
\`\`\`

### 🔄 Adatfolyamat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│   Scheduled Job: analyze-cross-league (Weekly)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Liga Karakterisztikák Számítása                     │
│  - Minden ligára: avg goals, home advantage, etc.          │
│  - Mentés league_characteristics táblába                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Liga-Liga Korrelációk Számítása                     │
│  - Minden liga párosra: Pearson correlation                │
│  - Metrics: scoring, home advantage, predictability        │
│  - Mentés cross_league_correlations táblába                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Meta-Minták Felfedezése                             │
│  - Univerzális minták keresése (3+ ligában)                │
│  - Statisztikai validáció (p-value < 0.05)                 │
│  - Mentés meta_patterns táblába                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Predikciók Finomhangolása                           │
│  - Meta-minták alkalmazása új predikciókra                 │
│  - Cross-league insights integrálása                       │
│  - Accuracy javulás mérése                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Frontend Dashboard Frissítése                       │
│  - Cross-League Comparison Charts                          │
│  - Meta-Patterns List                                       │
│  - Correlation Heatmap                                      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📊 Fázis 8: Monitoring & Visualization

### 🎯 Cél
Rendszer health monitoring, performance tracking, és interaktív computation map dashboard.

### 🗄️ Database Komponensek

#### 8.1 `system_health` Tábla
\`\`\`sql
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL, -- 'api_endpoint', 'edge_function', 'database_query', 'scheduled_job'
  
  -- Health Metrics
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down', 'unknown'
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- 0.0000 - 1.0000
  success_rate DECIMAL(5,4),
  
  -- Resource Usage
  cpu_usage DECIMAL(5,2), -- Percentage
  memory_usage DECIMAL(5,2), -- Percentage
  cache_hit_rate DECIMAL(5,4),
  
  -- Throughput
  requests_per_minute INTEGER,
  avg_response_time_ms INTEGER,
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  
  -- Errors
  error_count INTEGER DEFAULT 0,
  last_error_message TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Metadata
  checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek
CREATE INDEX idx_system_health_component ON system_health(component_name);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_checked_at ON system_health(checked_at DESC);

-- Retention: 7 napnál régebbi health check-ek törlése
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM system_health WHERE checked_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
\`\`\`

#### 8.2 `performance_metrics` Tábla
\`\`\`sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'accuracy', 'latency', 'throughput', 'error_rate'
  metric_category TEXT, -- 'prediction', 'data_quality', 'system'
  
  -- Metric Value
  value DECIMAL(10,4) NOT NULL,
  unit TEXT, -- 'percentage', 'milliseconds', 'count', 'rate'
  
  -- Context
  component_name TEXT,
  league_id UUID REFERENCES leagues(id),
  model_version TEXT,
  
  -- Aggregation
  aggregation_period TEXT, -- 'minute', 'hour', 'day', 'week'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek
CREATE INDEX idx_perf_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_perf_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_perf_metrics_period ON performance_metrics(period_start DESC);
CREATE INDEX idx_perf_metrics_component ON performance_metrics(component_name);
\`\`\`

#### 8.3 `computation_graph` Tábla
\`\`\`sql
CREATE TABLE computation_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT NOT NULL UNIQUE,
  node_name TEXT NOT NULL,
  node_type TEXT NOT NULL, -- 'data_source', 'computation', 'model', 'output'
  
  -- Node Details
  description TEXT,
  function_name TEXT,
  execution_time_ms INTEGER,
  
  -- Dependencies
  depends_on TEXT[], -- Array of node_ids
  triggers TEXT[], -- Array of node_ids that this node triggers
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'disabled', 'deprecated'
  last_executed_at TIMESTAMPTZ,
  
  -- Visualization
  position_x INTEGER,
  position_y INTEGER,
  color TEXT,
  icon TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Computation graph nodes
INSERT INTO computation_graph (node_id, node_name, node_type, depends_on, triggers) VALUES
('csv_upload', 'CSV Upload', 'data_source', ARRAY[]::TEXT[], ARRAY['data_validation', 'match_processing']),
('data_validation', 'Data Validation', 'computation', ARRAY['csv_upload'], ARRAY['data_quality_scoring']),
('match_processing', 'Match Processing', 'computation', ARRAY['csv_upload'], ARRAY['team_stats_calc']),
('team_stats_calc', 'Team Stats Calculation', 'computation', ARRAY['match_processing'], ARRAY['css_scoring', 'pattern_detection']),
('css_scoring', 'CSS Scoring', 'computation', ARRAY['team_stats_calc', 'data_quality_scoring'], ARRAY['prediction_model']),
('pattern_detection', 'Pattern Detection', 'computation', ARRAY['team_stats_calc'], ARRAY['prediction_model']),
('prediction_model', 'Prediction Model', 'model', ARRAY['css_scoring', 'pattern_detection'], ARRAY['narrative_generation', 'prediction_output']),
('narrative_generation', 'Narrative Generation', 'computation', ARRAY['prediction_model'], ARRAY['prediction_output']),
('prediction_output', 'Prediction Output', 'output', ARRAY['prediction_model', 'narrative_generation'], ARRAY[]::TEXT[]);
\`\`\`

### 🔧 API Endpoints

#### 8.4 `/api/monitoring/health` - System Health Check
**Method:** GET  
**Response:**
\`\`\`typescript
{
  overall_status: 'healthy' | 'degraded' | 'down';
  components: Array<{
    component_name: string;
    component_type: string;
    status: string;
    response_time_ms: number;
    error_rate: number;
    last_checked: string;
  }>;
  summary: {
    healthy_count: number;
    degraded_count: number;
    down_count: number;
  };
}
\`\`\`

#### 8.5 `/api/monitoring/metrics` - Performance Metrics
**Method:** GET  
**Query Params:** `?metric=accuracy&period=day&start=2024-01-01&end=2024-01-31`  
**Response:**
\`\`\`typescript
{
  metric_name: string;
  metric_type: string;
  data_points: Array<{
    timestamp: string;
    value: number;
    unit: string;
  }>;
  aggregation: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
}
\`\`\`

#### 8.6 `/api/monitoring/computation-graph` - Computation Graph
**Method:** GET  
**Response:**
\`\`\`typescript
{
  nodes: Array<{
    id: string;
    name: string;
    type: 'data_source' | 'computation' | 'model' | 'output';
    status: 'active' | 'disabled' | 'deprecated';
    execution_time_ms: number;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'dependency' | 'trigger';
  }>;
}
\`\`\`

#### 8.7 `/api/monitoring/alerts` - System Alerts
**Method:** GET  
**Response:**
\`\`\`typescript
{
  active_alerts: Array<{
    alert_id: string;
    severity: 'critical' | 'warning' | 'info';
    component_name: string;
    message: string;
    triggered_at: string;
    acknowledged: boolean;
  }>;
  total_active: number;
}
\`\`\`

### 🎨 Frontend Komponensek

#### 8.8 `/app/monitoring/page.tsx` - Monitoring Dashboard
**Új oldal létrehozása**

**Szekciók:**
1. **System Health Overview**
   - Overall status badge (🟢 Healthy, 🟡 Degraded, 🔴 Down)
   - Component status grid
   - Active alerts banner

2. **Performance Metrics Charts**
   - Line chart: Accuracy over time
   - Line chart: Response time (p50, p95, p99)
   - Bar chart: Error rate by component
   - Pie chart: Cache hit rate

3. **Computation Map (React Flow)**
   - Interactive node graph
   - Color-coded nodes (green = healthy, yellow = slow, red = error)
   - Click node → detailed metrics modal
   - Hover edge → dependency info

4. **Real-Time Metrics**
   - Live updating metrics (SWR polling 5 sec)
   - Requests per minute
   - Active users
   - Database connections

#### 8.9 `ComputationMapDashboard` Komponens
\`\`\`typescript
import ReactFlow, { Node, Edge, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

export function ComputationMapDashboard() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  useEffect(() => {
    async function loadGraph() {
      const response = await fetch('/api/monitoring/computation-graph');
      const data = await response.json();
      
      setNodes(data.nodes.map(node => ({
        id: node.id,
        type: 'custom',
        position: node.position,
        data: {
          label: node.name,
          status: node.status,
          execution_time: node.execution_time_ms
        }
      })));
      
      setEdges(data.edges.map(edge => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: edge.type === 'trigger'
      })));
    }
    
    loadGraph();
  }, []);
  
  return (
    <div className="h-[600px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
\`\`\`

#### 8.10 `SystemHealthCard` Komponens
\`\`\`typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>System Health</CardTitle>
      <Badge variant={getStatusVariant(overallStatus)}>
        {getStatusIcon(overallStatus)} {overallStatus}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      {components.map(component => (
        <div key={component.name} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(component.status)}`} />
          <span className="text-sm">{component.name}</span>
          <span className="text-xs text-muted-foreground">{component.response_time_ms}ms</span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
\`\`\`

#### 8.11 `PerformanceMetricsChart` Komponens
\`\`\`typescript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={metricsData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="p50" stroke="#8884d8" name="P50" />
    <Line type="monotone" dataKey="p95" stroke="#82ca9d" name="P95" />
    <Line type="monotone" dataKey="p99" stroke="#ffc658" name="P99" />
  </LineChart>
</ResponsiveContainer>
\`\`\`

### 🔄 Adatfolyamat

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│   Scheduled Job: health-monitor (Every 1 minute)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Minden Komponens Health Check                       │
│  - API endpoints ping                                       │
│  - Edge functions status                                    │
│  - Database query performance                               │
│  - Scheduled jobs last run                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Metrics Számítás                                    │
│  - Response time (p50, p95, p99)                           │
│  - Error rate                                               │
│  - Success rate                                             │
│  - Cache hit rate                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Mentés system_health Táblába                        │
│  - Component status                                         │
│  - Performance metrics                                      │
│  - Error details                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Alert Triggering (Ha Szükséges)                     │
│  - Error rate > 5% → Warning                               │
│  - Response time > 5s → Warning                            │
│  - Component down → Critical                                │
│  - Email/Slack notification                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Frontend Dashboard Frissítése                       │
│  - Real-time metrics (SWR polling 5 sec)                   │
│  - Computation map color update                            │
│  - Alert banner megjelenítés                               │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 📊 Alerting Rules

\`\`\`typescript
// Alert configuration
const ALERT_RULES = [
  {
    name: 'High Error Rate',
    condition: (metrics) => metrics.error_rate > 0.05,
    severity: 'warning',
    message: 'Error rate exceeded 5%'
  },
  {
    name: 'Slow Response Time',
    condition: (metrics) => metrics.p95_response_time_ms > 5000,
    severity: 'warning',
    message: 'P95 response time exceeded 5 seconds'
  },
  {
    name: 'Component Down',
    condition: (health) => health.status === 'down',
    severity: 'critical',
    message: 'Component is down'
  },
  {
    name: 'Low Cache Hit Rate',
    condition: (metrics) => metrics.cache_hit_rate < 0.70,
    severity: 'info',
    message: 'Cache hit rate below 70%'
  },
  {
    name: 'Prediction Accuracy Drop',
    condition: (metrics) => metrics.accuracy < 0.60,
    severity: 'warning',
    message: 'Prediction accuracy dropped below 60%'
  }
];

async function checkAlerts() {
  const health = await getSystemHealth();
  const metrics = await getPerformanceMetrics();
  
  for (const rule of ALERT_RULES) {
    if (rule.condition(health) || rule.condition(metrics)) {
      await triggerAlert({
        rule_name: rule.name,
        severity: rule.severity,
        message: rule.message,
        component: health.component_name,
        metrics: metrics
      });
    }
  }
}
\`\`\`

---

## 🚀 Fázis 9: Advanced Features

### 🎯 Cél
Haladó funkciók: Collaborative Intelligence, Market Integration, Temporal Decay, Self-Improving System.

### 9.1 Collaborative Intelligence

**Cél:** User predikciók gyűjtése és wisdom of crowd analysis.

**Database:**
\`\`\`sql
CREATE TABLE user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  match_id UUID REFERENCES matches(id),
  
  -- User Prediction
  predicted_winner TEXT NOT NULL,
  predicted_home_goals INTEGER,
  predicted_away_goals INTEGER,
  confidence DECIMAL(3,2),
  
  -- Actual Result
  actual_winner TEXT,
  was_correct BOOLEAN,
  
  -- Metadata
  predicted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE crowd_wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  
  -- Crowd Prediction
  crowd_predicted_winner TEXT,
  crowd_confidence DECIMAL(3,2),
  total_predictions INTEGER,
  
  -- Model Prediction
  model_predicted_winner TEXT,
  model_confidence DECIMAL(3,2),
  
  -- Divergence
  divergence_score DECIMAL(3,2), -- How much crowd disagrees with model
  
  created_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

**API Endpoints:**
- `POST /api/predictions/user` - User predikció mentése
- `GET /api/predictions/crowd/{matchId}` - Crowd wisdom lekérése
- `GET /api/predictions/divergence` - Model vs Crowd divergence

**Frontend:**
- User prediction form
- Crowd wisdom display ("85% of users predict home win")
- Divergence indicator ("⚠️ Model disagrees with crowd")

---

### 9.2 Market Integration

**Cél:** Külső odds API integráció és value bet detection.

**Database:**
\`\`\`sql
CREATE TABLE market_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  bookmaker TEXT NOT NULL,
  
  -- Odds
  home_win_odds DECIMAL(5,2),
  draw_odds DECIMAL(5,2),
  away_win_odds DECIMAL(5,2),
  over_2_5_odds DECIMAL(5,2),
  btts_yes_odds DECIMAL(5,2),
  
  -- Implied Probability
  home_win_probability DECIMAL(5,4),
  draw_probability DECIMAL(5,4),
  away_win_probability DECIMAL(5,4),
  
  -- Metadata
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE value_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  bet_type TEXT NOT NULL, -- 'home_win', 'draw', 'away_win', 'over_2_5', 'btts'
  
  -- Model vs Market
  model_probability DECIMAL(5,4),
  market_probability DECIMAL(5,4),
  odds DECIMAL(5,2),
  
  -- Value
  expected_value DECIMAL(5,2), -- EV = (model_prob * odds) - 1
  kelly_criterion DECIMAL(5,4), -- Optimal bet size
  value_rating TEXT, -- 'excellent', 'good', 'fair', 'poor'
  
  -- Metadata
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

**API Endpoints:**
- `GET /api/market/odds/{matchId}` - Market odds lekérése
- `GET /api/market/value-bets` - Value bets lista
- `POST /api/market/sync` - Odds szinkronizálás külső API-val

**Frontend:**
- Market odds display
- Value bet highlights (🟢 Excellent value, 🟡 Good value)
- Kelly Criterion calculator

---

### 9.3 Temporal Decay System

**Cél:** Információ frissesség tracking és exponential decay.

**Database:**
\`\`\`sql
CREATE TABLE information_freshness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  information_type TEXT NOT NULL, -- 'form', 'injuries', 'stats', 'patterns'
  
  -- Freshness
  last_updated_at TIMESTAMPTZ NOT NULL,
  decay_rate DECIMAL(5,4), -- Exponential decay rate (0.0001 - 0.1)
  current_freshness DECIMAL(3,2), -- 0.00 - 1.00 (1.00 = fresh, 0.00 = stale)
  
  -- Thresholds
  refresh_threshold DECIMAL(3,2) DEFAULT 0.70, -- Trigger refresh when below this
  critical_threshold DECIMAL(3,2) DEFAULT 0.50, -- Critical staleness
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

**Decay Function:**
\`\`\`typescript
function calculateFreshness(lastUpdated: Date, decayRate: number): number {
  const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
  const freshness = Math.exp(-decayRate * hoursSinceUpdate);
  return Math.max(0, Math.min(1, freshness));
}

// Example decay rates:
// - Form data: 0.05 (decays quickly, ~14 hours to 50%)
// - Season stats: 0.001 (decays slowly, ~693 hours to 50%)
// - Injury news: 0.1 (decays very quickly, ~7 hours to 50%)
\`\`\`

**Auto-Refresh Trigger:**
\`\`\`typescript
async function checkAndRefreshStaleData() {
  const staleInfo = await getStaleInformation({ threshold: 0.70 });
  
  for (const info of staleInfo) {
    if (info.information_type === 'form') {
      await refreshTeamForm(info.team_name);
    } else if (info.information_type === 'stats') {
      await refreshTeamStats(info.team_name);
    } else if (info.information_type === 'patterns') {
      await detectPatterns(info.team_name);
    }
  }
}
\`\`\`

---

### 9.4 Self-Improving System

**Cél:** Automatikus feature engineering és continuous learning.

**Database:**
\`\`\`sql
CREATE TABLE feature_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  feature_type TEXT NOT NULL, -- 'engineered', 'derived', 'external'
  
  -- Feature Definition
  calculation_logic TEXT,
  dependencies TEXT[],
  
  -- Performance
  baseline_accuracy DECIMAL(5,2),
  with_feature_accuracy DECIMAL(5,2),
  accuracy_improvement DECIMAL(5,2),
  
  -- Statistical Validation
  p_value DECIMAL(5,4),
  confidence_interval JSONB,
  
  -- Status
  status TEXT DEFAULT 'testing', -- 'testing', 'approved', 'rejected', 'deprecated'
  tested_predictions INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

**Automated Feature Engineering:**
\`\`\`typescript
async function generateNewFeatures() {
  const baseFeatures = await getExistingFeatures();
  const newFeatures: Feature[] = [];
  
  // 1. Polynomial features (x^2, x^3)
  for (const feature of baseFeatures) {
    if (feature.type === 'numeric') {
      newFeatures.push({
        name: `${feature.name}_squared`,
        calculation: (data) => Math.pow(data[feature.name], 2)
      });
    }
  }
  
  // 2. Interaction features (x * y)
  for (let i = 0; i < baseFeatures.length; i++) {
    for (let j = i + 1; j < baseFeatures.length; j++) {
      newFeatures.push({
        name: `${baseFeatures[i].name}_x_${baseFeatures[j].name}`,
        calculation: (data) => data[baseFeatures[i].name] * data[baseFeatures[j].name]
      });
    }
  }
  
  // 3. Ratio features (x / y)
  newFeatures.push({
    name: 'goals_scored_per_match',
    calculation: (data) => data.total_goals_scored / data.matches_played
  });
  
  // 4. Rolling averages (last 3, 5, 10 matches)
  newFeatures.push({
    name: 'rolling_avg_goals_last_5',
    calculation: (data) => calculateRollingAverage(data.recent_goals, 5)
  });
  
  // Test each new feature
  for (const feature of newFeatures) {
    await testFeature(feature);
  }
}

async function testFeature(feature: Feature) {
  // A/B test: baseline model vs model with new feature
  const baselineAccuracy = await getBaselineAccuracy();
  const withFeatureAccuracy = await testModelWithFeature(feature);
  
  const improvement = withFeatureAccuracy - baselineAccuracy;
  const pValue = calculateStatisticalSignificance(baselineAccuracy, withFeatureAccuracy);
  
  if (improvement > 0.02 && pValue < 0.05) {
    // Feature improves accuracy by 2%+ and is statistically significant
    await approveFeature(feature);
  } else {
    await rejectFeature(feature);
  }
}
\`\`\`

**Continuous Learning Pipeline:**
\`\`\`typescript
// Scheduled Job: continuous-learning (Weekly)
async function continuousLearning() {
  // 1. Generate new features
  await generateNewFeatures();
  
  // 2. Test new features
  const newFeatures = await getTestingFeatures();
  for (const feature of newFeatures) {
    await testFeature(feature);
  }
  
  // 3. Prune underperforming features
  await pruneUnderperformingFeatures({ threshold: 0.50 });
  
  // 4. Retrain model with approved features
  await retrainModel({ includeNewFeatures: true });
  
  // 5. Deploy new model as challenger
  await deployAsChallenger({ modelVersion: 'auto-generated-v1.x' });
}
\`\`\`

---

## 📊 Architektúra Diagramok

### Teljes Rendszer Architektúra

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Teams    │  │ Matches  │  │ Analytics│  │ Jobs     │  │ Monitoring│ │
│  │ Page     │  │ Page     │  │ Dashboard│  │ Page     │  │ Dashboard │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API Layer (Next.js API Routes)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Jobs     │  │ Predictions│ │ Models   │  │ Patterns │  │ Monitoring│ │
│  │ API      │  │ API       │  │ API      │  │ API      │  │ API       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ CSS      │  │ Narrative│  │ Pattern  │  │ Model    │  │ Data     │ │
│  │ Calculator│ │ Generator│  │ Detector │  │ Selector │  │ Quality  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ leagues  │  │ matches  │  │ predictions│ │ patterns │  │ jobs     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ model_   │  │ system_  │  │ performance│ │ meta_    │  │ user_    │ │
│  │ registry │  │ health   │  │ _metrics  │  │ patterns │  │ predictions│
│  └──────────┘  └──────────┘  └──────────┘  └���─────────┘  └──────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Scheduled Jobs (Vercel Cron)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Calculate│  │ Detect   │  │ Evaluate │  │ Health   │  │ Auto     │ │
│  │ Stats    │  │ Patterns │  │ Models   │  │ Monitor  │  │ Promote  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 🛠️ Technológiai Stack

### Backend
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Direct SQL queries (no ORM)
- **Caching:** SWR (client-side), Supabase caching (server-side)
- **Scheduled Jobs:** Vercel Cron
- **API:** Next.js API Routes

### Frontend
- **Framework:** React 19.2
- **UI Library:** shadcn/ui
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Flow Diagrams:** React Flow
- **State Management:** React Context + SWR
- **Forms:** React Hook Form + Zod

### DevOps
- **Hosting:** Vercel
- **CI/CD:** Vercel Git Integration
- **Monitoring:** Custom monitoring dashboard
- **Alerting:** Email/Slack notifications

### External Integrations (Optional)
- **Odds API:** Odds API, The Odds API
- **Weather API:** OpenWeatherMap
- **News API:** NewsAPI

---

## 📅 Implementációs Ütemterv

### Hét 1-2: Fázis 4 - Feedback Loop
- **Hét 1:**
  - Database táblák (predictions, model_performance)
  - API endpoints (track, update-results, performance)
  - Scheduled job: evaluate-models
- **Hét 2:**
  - Analytics dashboard frontend
  - Charts és visualizations
  - Auto-pruning logic

### Hét 3: Fázis 5 - Pattern Detection
- Pattern definitions tábla
- Detection algoritmusok (streak, dominance, scoring)
- Frontend: TeamPatternsSection komponens
- Scheduled job: detect-patterns

### Hét 4-5: Fázis 6 - Champion/Challenger
- **Hét 4:**
  - Model registry tábla
  - Epsilon-greedy selection
  - Shadow mode implementation
- **Hét 5:**
  - Model comparison logic
  - Auto-promotion logic
  - Models dashboard frontend

### Hét 6-8: Fázis 7 - Cross-League Intelligence
- **Hét 6:**
  - Cross-league correlations tábla
  - Correlation analysis algoritmusok
- **Hét 7:**
  - Meta-patterns discovery
  - League characteristics calculation
- **Hét 8:**
  - Cross-league dashboard frontend
  - Radar charts, heatmaps

### Hét 9-10: Fázis 8 - Monitoring
- **Hét 9:**
  - System health tábla
  - Health check scheduled job
  - Performance metrics collection
- **Hét 10:**
  - Monitoring dashboard frontend
  - Computation map (React Flow)
  - Alerting system

### Hét 11-14: Fázis 9 - Advanced Features
- **Hét 11:** Collaborative Intelligence
- **Hét 12:** Market Integration
- **Hét 13:** Temporal Decay System
- **Hét 14:** Self-Improving System

---

## 🎯 Összefoglalás

### Teljes Rendszer Komponensek Száma

**Database Táblák:** 15+
- scheduled_jobs, job_execution_logs
- predictions, model_performance, model_comparison
- team_patterns, pattern_definitions
- model_registry, model_experiments
- cross_league_correlations, meta_patterns, league_characteristics
- system_health, performance_metrics, computation_graph
- user_predictions, crowd_wisdom, market_odds, value_bets, information_freshness, feature_experiments

**API Endpoints:** 30+
- Jobs: list, logs, trigger, toggle, scheduler
- Predictions: track, update-results, performance, compare
- Models: register, select, shadow-run, promote
- Experiments: create, evaluate
- Patterns: detect, team, verify
- Cross-League: correlations, analyze, discover, apply
- Monitoring: health, metrics, computation-graph, alerts
- Market: odds, value-bets, sync
- Features: generate, test, approve

**Frontend Pages:** 8+
- /jobs - Scheduled Jobs Management
- /analytics - Model Performance Dashboard
- /models - Model Management & Comparison
- /cross-league - Cross-League Intelligence
- /monitoring - System Health & Monitoring
- /market - Market Odds & Value Bets (optional)
- /experiments - Feature Experiments (optional)

**Scheduled Jobs:** 10+
- calculate-all-team-stats (6 óránként)
- validate-data-quality (naponta)
- detect-patterns (naponta)
- evaluate-models (naponta)
- auto-promote-models (hetente)
- analyze-cross-league (hetente)
- discover-meta-patterns (hetente)
- health-monitor (percenként)
- continuous-learning (hetente)
- cleanup-old-logs (naponta)

**Komponensek:** 50+
- ScheduledJobsPanel, JobStatusCard
- ModelPerformanceChart, ModelCard
- TeamPatternsSection, PatternBadge
- ComputationMapDashboard, SystemHealthCard
- LeagueComparisonRadarChart, CorrelationHeatmap
- ValueBetCard, MarketOddsDisplay
- ... és még sok más

---

## 🚀 Következő Lépések

1. **Fázis 4 Indítása:** Feedback Loop implementálása
2. **Database Migrációk:** SQL script-ek futtatása
3. **API Endpoints:** Predictions tracking és model evaluation
4. **Frontend:** Analytics dashboard létrehozása
5. **Tesztelés:** Minden új funkció alapos tesztelése
6. **Dokumentáció:** API dokumentáció frissítése
7. **Monitoring:** System health tracking beállítása

---

**Készítette:** v0 AI Assistant  
**Utolsó frissítés:** 2024-10-30  
**Verzió:** 1.0.0
