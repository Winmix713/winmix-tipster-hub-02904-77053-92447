import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Match {
  home: string;
  away: string;
}

interface PredictionResultsProps {
  matches: Match[];
}

const PredictionResults = ({ matches }: PredictionResultsProps) => {
  const generatePrediction = (home: string, away: string) => {
    const outcomes = ["home", "draw", "away"];
    const random = Math.random();
    const outcome = random < 0.4 ? "home" : random < 0.65 ? "draw" : "away";
    
    const homeWin = Math.floor(Math.random() * 30) + 35;
    const draw = Math.floor(Math.random() * 20) + 25;
    const awayWin = 100 - homeWin - draw;
    
    return {
      outcome,
      probabilities: { home: homeWin, draw, away: awayWin }
    };
  };

  return (
    <div className="glass-card rounded-3xl p-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">
        Predikciós Eredmények
      </h3>
      
      <div className="grid gap-4">
        {matches.map((match, index) => {
          const prediction = generatePrediction(match.home, match.away);
          
          return (
            <div key={index} className="glass-card-hover rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{match.home}</p>
                </div>
                <div className="px-4">
                  <span className="text-gray-400">vs</span>
                </div>
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{match.away}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className={`text-center p-3 rounded-xl ${prediction.outcome === 'home' ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5'}`}>
                  <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${prediction.outcome === 'home' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-400">Hazai</p>
                  <p className="font-bold text-white">{prediction.probabilities.home}%</p>
                </div>

                <div className={`text-center p-3 rounded-xl ${prediction.outcome === 'draw' ? 'bg-gray-500/20 border border-gray-400/30' : 'bg-white/5'}`}>
                  <Minus className={`w-5 h-5 mx-auto mb-1 ${prediction.outcome === 'draw' ? 'text-gray-300' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-400">Döntetlen</p>
                  <p className="font-bold text-white">{prediction.probabilities.draw}%</p>
                </div>

                <div className={`text-center p-3 rounded-xl ${prediction.outcome === 'away' ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5'}`}>
                  <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${prediction.outcome === 'away' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-400">Vendég</p>
                  <p className="font-bold text-white">{prediction.probabilities.away}%</p>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-1">Ajánlott tipp</p>
                <p className="font-bold text-blue-400">
                  {prediction.outcome === 'home' ? `${match.home} győzelem` : 
                   prediction.outcome === 'away' ? `${match.away} győzelem` : 
                   'Döntetlen'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PredictionResults;
