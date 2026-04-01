import React from 'react';

const StartOptionScreen = ({ onSelect, testInstanceId = 0 }) => {
  const options = [
    {
      id: 'safety',
      name: '安全',
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      id: 'solid',
      name: '堅実',
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      id: 'challenge',
      name: '挑戦',
      color: 'from-orange-500 to-rose-600',
      shadow: 'shadow-orange-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-500">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <h2 className="text-slate-400 text-sm font-black tracking-[0.3em] uppercase mb-12 animate-in slide-in-from-bottom-4 duration-700">
          始まりの力を選択
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              id={`ai-start-option-${option.id}-${testInstanceId}`}
              className={`group relative flex items-center justify-center p-8 bg-slate-900/60 border border-white/10 rounded-3xl transition-all duration-300 hover:scale-[1.05] hover:bg-slate-800/80 hover:border-white/20 shadow-2xl ${option.shadow}`}
            >
              <span className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${option.color} group-hover:scale-110 transition-transform duration-500`}>
                {option.name}
              </span>

              {/* Card Bottom Decoration (Gradient overlay on hover) */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-[0.05] transition-opacity pointer-events-none`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartOptionScreen;
