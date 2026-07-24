import React from 'react';

const CreditsScreen = ({ onClose }) => {
    const licenses = [
        {
            name: "react",
            version: "19.2.4",
            license: "MIT",
            text: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
        },
        {
            name: "react-dom",
            version: "19.2.4",
            license: "MIT",
            text: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
        },
        {
            name: "scheduler",
            version: "0.27.0",
            license: "MIT",
            text: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
        }
    ];

    return (
        <div 
            className="w-full h-screen bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in font-game-cyber"
            onClick={onClose}
        >
            <div 
                className="game-panel-cyber rounded-2xl w-full max-w-md h-full max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/40 shrink-0">
                    <h2 className="text-base font-game-header text-indigo-300 flex items-center gap-2">
                        <span className="material-icons-round text-indigo-400">info</span>
                        CREDITS
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn-game-cyber rounded-xl w-8 h-8 p-0 flex items-center justify-center text-slate-400"
                    >
                        <span className="material-icons-round text-[18px]">close</span>
                    </button>
                </div>

                {/* スクロールエリア */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* 開発者 */}
                    <div className="text-center">
                        <h3 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Developer</h3>
                        <p className="text-xl font-game-header text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                            MORI
                        </p>
                    </div>

                    {/* 素材 */}
                    <section>
                        <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest text-center">Assets & Materials</h3>
                        <div className="space-y-3">
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                <p className="text-xs font-bold text-slate-300">BGM・効果音</p>
                                <p className="text-sm text-slate-400 mt-1">魔王魂 / 効果音ラボ</p>
                            </div>
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                <p className="text-xs font-bold text-slate-300">アイコン・フォント</p>
                                <p className="text-sm text-slate-400 mt-1">Material Icons / Google Fonts</p>
                            </div>
                        </div>
                    </section>

                    {/* OSSライセンス */}
                    <section>
                        <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest text-center">Open Source Licenses</h3>
                        <div className="space-y-4">
                            {licenses.map((lib, i) => (
                                <div key={i} className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-bold text-indigo-400">{lib.name}</p>
                                        <p className="text-[10px] text-slate-500">v{lib.version} / {lib.license}</p>
                                    </div>
                                    <pre className="text-[9px] text-slate-500 font-mono leading-relaxed overflow-x-auto p-2 bg-black/30 rounded-lg max-h-32">
                                        {lib.text}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="text-center pb-4">
                        <p className="text-[10px] text-slate-600 font-mono tracking-widest">© 2026 MORI</p>
                    </div>
                </div>

                {/* フッター */}
                <div className="p-4 border-t border-white/10 shrink-0 bg-slate-950/40">
                    <button
                        onClick={onClose}
                        className="w-full btn-game-secondary py-3 text-sm"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreditsScreen;
