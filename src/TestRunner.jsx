import React, { Component } from 'react';
import App from './App.jsx';
import { SAVE_KEY, SETTINGS_KEY } from './constants/gameConstants.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Log error to global object for reporting
    if (!window.AIErrors) window.AIErrors = [];
    window.AIErrors.push({
      instanceId: this.props.instanceId,
      message: error.message,
      stack: error.stack,
      time: new Date().toLocaleTimeString()
    });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-2 bg-red-900/50 text-red-200 text-[10px] overflow-auto h-full border border-red-500 rounded">
          <div className="flex items-center gap-1 mb-1">
            <span className="material-icons-round text-xs">error</span>
            <strong>Sub-instance Error</strong>
          </div>
          <div className="bg-black/40 p-1 rounded font-mono break-all whitespace-pre-wrap">
            {this.state.error?.message}
          </div>
          <div className="mt-1 opacity-70">
            Check Balance Report for details.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TestRunner = ({ onExit }) => {
  const instances = Array.from({ length: 10 }).map((_, i) => i);
  const [showReport, setShowReport] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Clear all test-related localStorage on start
    for (let i = 0; i < 10; i++) {
        localStorage.removeItem(`${SAVE_KEY}_test_${i}`);
        localStorage.removeItem(`${SETTINGS_KEY}_test_${i}`);
        localStorage.removeItem(`puzzle_rogue_stats_test_${i}`);
    }
    // Clear global logs for a fresh report
    window.AILogs = [];
    window.AIErrors = [];
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
      return (
        <div className="w-full h-screen bg-black flex items-center justify-center">
          <div className="text-blue-400 font-bold animate-pulse">Initializing Test Instances...</div>
        </div>
      );
  }

  const getReportStats = () => {
    const logs = window.AILogs || [];
    const errors = window.AIErrors || [];
    
    if (logs.length === 0 && errors.length === 0) return "まだAIのプレイデータがありません。";
    
    const overallAvgCombo = logs.length > 0 ? (logs.reduce((sum, l) => sum + l.maxCombo, 0) / logs.length) : 0;
    
    // トークン使用率・シナジー・エンチャント・インフレの集計
    const tokenCounts = {};
    const tokenContribution = {}; // {name: {sum: 0, count: 0}}
    const enchantContribution = {}; // {name: {sum: 0, count: 0}}
    const synergies = {}; // Pair counts
    const synergyContribution = {}; // {pair: {sum: 0, count: 0}}
    const cycleInflation = {}; // cycle -> { totalStars: 0, count: 0 }

    logs.forEach(l => {
       // Inflation trend
       const cyc = l.cycle;
       if (!cycleInflation[cyc]) cycleInflation[cyc] = { totalStars: 0, count: 0 };
       cycleInflation[cyc].totalStars += (l.stars || 0);
       cycleInflation[cyc].count++;

       // Tokens & Enchants
       const uniqueTokens = [...new Set(l.tokens.filter(t => t !== "Empty"))];
       const uniqueEnchants = [...new Set(l.enchants || [])];

       uniqueTokens.forEach((t, idx) => {
          tokenCounts[t] = (tokenCounts[t] || 0) + 1;
          if (!tokenContribution[t]) tokenContribution[t] = { sum: 0, count: 0 };
          tokenContribution[t].sum += l.maxCombo;
          tokenContribution[t].count++;

          for (let j = idx + 1; j < uniqueTokens.length; j++) {
             const t2 = uniqueTokens[j];
             const pair = [t, t2].sort().join(' + ');
             synergies[pair] = (synergies[pair] || 0) + 1;
             if (!synergyContribution[pair]) synergyContribution[pair] = { sum: 0, count: 0 };
             synergyContribution[pair].sum += l.maxCombo;
             synergyContribution[pair].count++;
          }
       });

       uniqueEnchants.forEach(e => {
          if (!enchantContribution[e]) enchantContribution[e] = { sum: 0, count: 0 };
          enchantContribution[e].sum += l.maxCombo;
          enchantContribution[e].count++;
       });
    });

    const strengthRanking = Object.entries(tokenContribution)
       .map(([name, data]) => ({ name, index: (data.sum / data.count) / (overallAvgCombo || 1), count: data.count }))
       .filter(x => x.count >= 2)
       .sort((a, b) => b.index - a.index)
       .slice(0, 8)
       .map(x => `${x.name}: 指数 x${x.index.toFixed(1)} (${x.count}回)`);

    const enchantRanking = Object.entries(enchantContribution)
       .map(([name, data]) => ({ name, index: (data.sum / data.count) / (overallAvgCombo || 1), count: data.count }))
       .filter(x => x.count >= 1)
       .sort((a, b) => b.index - a.index)
       .slice(0, 8)
       .map(x => `${x.name}: 指数 x${x.index.toFixed(1)} (${x.count}回)`);

    const synergyRanking = Object.entries(synergyContribution)
       .map(([pair, data]) => ({ pair, index: (data.sum / data.count) / (overallAvgCombo || 1), count: data.count }))
       .filter(x => x.count >= 2)
       .sort((a, b) => b.index - a.index)
       .slice(0, 8)
       .map(x => `${x.pair}: 指数 x${x.index.toFixed(1)} (${x.count}回)`);

    const inflationTrend = Object.entries(cycleInflation)
       .sort((a, b) => Number(a[0]) - Number(b[0]))
       .map(([cyc, data]) => `Cycle ${cyc}: 平均 ${(data.totalStars / data.count).toLocaleString()} ★`);

    // 最大コンボ
    const maxComboEver = logs.length > 0 ? Math.max(...logs.map(l => l.maxCombo)) : 0;
    const avgCombo = logs.length > 0 ? (overallAvgCombo).toLocaleString() : 0;
    const avgCycle = logs.length > 0 ? (logs.reduce((sum, l) => sum + (l.cycle || 1), 0) / logs.length).toFixed(1) : 0;
    const maxCycle = logs.length > 0 ? Math.max(...logs.map(l => l.cycle || 1)) : 0;

    // エラー統計
    const errorStats = {};
    errors.forEach(e => {
       errorStats[e.message] = (errorStats[e.message] || 0) + 1;
    });
    const errorSummary = Object.entries(errorStats)
       .map(([msg, count]) => `- ${msg}: ${count}件`)
       .join('\n') || "なし";

    return `【AI自動テスト 強度分析レポート V2】
総ログ数: ${logs.length} (平均到達: ${avgCycle} | 最高: ${maxCycle})
平均コンボ: ${avgCombo} | 歴代最大: ${maxComboEver.toLocaleString()}

■ インフレ貢献度 (Token Strength Index)
${strengthRanking.join('\n') || "データ不足"}

■ エンチャント貢献度 (Enchant Strength Index)
※ 特定のエンチャントが装備されている時の平均コンボ倍率です。
${enchantRanking.join('\n') || "データ不足"}

■ 最強シナジー (Combo Multiplier Index)
${synergyRanking.join('\n') || "データ不足"}

■ インフレ曲線 (サイクル毎の平均所持金)
${inflationTrend.join('\n') || "データ不足"}

■ エラーレポート (発生件数: ${errors.length}件)
${errorSummary}

■ 全ログデータ (直近1件)
${JSON.stringify(logs.slice(-1), null, 2)}`;
  };


  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col items-center">
      {/* Header bar for TestRunner */}
      <div className="w-full h-10 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-700 z-50 shrink-0">
        <h1 className="text-white text-sm font-bold tracking-widest text-[#00f0ff] uppercase drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
          🧪 10-Split AI Auto Test Mode
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReport(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            SHOW REPORT
          </button>
          <button 
            onClick={onExit}
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            EXIT TEST MODE
          </button>
        </div>
      </div>

      {/* Grid container for 10 instances */}
      <div className="w-full h-full p-1 grid grid-cols-5 grid-rows-2 gap-1 overflow-auto bg-slate-950">
        {instances.map(id => (
          <div key={id} className="relative aspect-[9/16] bg-slate-800 rounded overflow-hidden border border-slate-700 shadow-md flex items-center justify-center">
            <div className="absolute top-0 left-0 bg-blue-500/80 text-white text-[10px] font-bold px-1 z-50 rounded-br">
              Sub #{id}
            </div>
            {/* The scaled container: using a fixed size and scaling down to fit small cells */}
            <div className="w-full h-full flex items-center justify-center">
                <ErrorBoundary instanceId={id}>
                    <div style={{ width: '375px', height: '812px', transform: 'scale(0.35)', transformOrigin: 'center center', flexShrink: 0 }}>
                        <App 
                            isMultiTest={true} 
                            testInstanceId={id} 
                            initialAutoStartAI={true} 
                        />
                    </div>
                </ErrorBoundary>
            </div>
          </div>
        ))}
      </div>

      {showReport && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8">
            <div className="bg-slate-800 w-full max-w-3xl h-[80vh] rounded-xl flex flex-col overflow-hidden border border-slate-600 shadow-2xl">
               <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                  <h2 className="text-white font-bold">AI バランスレポート</h2>
                  <button onClick={() => setShowReport(false)} className="text-red-400 font-bold hover:text-white">✕ 閉じる</button>
               </div>
               <div className="p-4 overflow-auto flex-1">
                  <pre className="text-emerald-400 text-xs whitespace-pre-wrap font-mono">
                     {getReportStats()}
                  </pre>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
