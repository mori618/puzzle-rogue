import React, { Component } from 'react';
import App from './App.jsx';

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

  const getReportStats = () => {
    const logs = window.AILogs || [];
    const errors = window.AIErrors || [];
    
    if (logs.length === 0 && errors.length === 0) return "まだAIのプレイデータがありません。";
    
    const maxCycle = logs.length > 0 ? Math.max(...logs.map(l => l.cycle)) : 0;
    const avgCycle = logs.length > 0 ? (logs.reduce((a, b) => a + b.cycle, 0) / logs.length).toFixed(1) : 0;
    
    // トークン使用率の集計
    const tokenCounts = {};
    logs.forEach(l => {
       l.tokens.forEach(t => {
          if (t !== "Empty") {
             const baseName = t.split('(')[0];
             tokenCounts[baseName] = (tokenCounts[baseName] || 0) + 1;
          }
       });
    });

    const popularTokens = Object.entries(tokenCounts)
       .sort((a, b) => b[1] - a[1])
       .slice(0, 10)
       .map(([name, count]) => `${name}: ${count}回`);

    // 最大コンボ
    const maxComboEver = logs.length > 0 ? Math.max(...logs.map(l => l.maxCombo)) : 0;

    // エラー統計
    const errorStats = {};
    errors.forEach(e => {
       errorStats[e.message] = (errorStats[e.message] || 0) + 1;
    });
    const errorSummary = Object.entries(errorStats)
       .map(([msg, count]) => `- ${msg}: ${count}件`)
       .join('\n') || "なし";

    return `【AI自動テスト レポート】
総ゲームオーバー回数: ${logs.length}
平均到達サイクル: ${avgCycle}
最高到達サイクル: ${maxCycle}
歴代最大コンボ: ${maxComboEver}

■ エラーレポート (発生件数: ${errors.length}件)
${errorSummary}

■ よく使われるトークン (Top10)
${popularTokens.join('\n') || "データなし"}

■ 全ログデータ (直近5件)
${JSON.stringify(logs.slice(-5), null, 2)}`;
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
