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
