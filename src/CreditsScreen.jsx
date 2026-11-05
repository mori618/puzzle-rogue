import React from 'react';
import ScreenShell, { UiSection } from './ScreenShell';

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
        <ScreenShell icon="info" title="クレジット" subtitle="CREDITS" onClose={onClose}>
            <div className="flex flex-col gap-6">
                {/* 開発者 */}
                <div className="ui-card py-5 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em]">DEVELOPER</span>
                    <p className="text-2xl font-game-header tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-500">
                        MORI
                    </p>
                </div>

                {/* 素材 */}
                <UiSection title="素材" icon="palette">
                    <div className="ui-card overflow-hidden">
                        <div className="ui-row">
                            <span className="text-slate-400 text-xs font-bold">BGM・効果音</span>
                            <span className="text-slate-200 text-sm text-right">魔王魂 / 効果音ラボ</span>
                        </div>
                        <div className="ui-row">
                            <span className="text-slate-400 text-xs font-bold">アイコン・フォント</span>
                            <span className="text-slate-200 text-sm text-right">Material Icons / Google Fonts</span>
                        </div>
                    </div>
                </UiSection>

                {/* OSSライセンス */}
                <UiSection title="オープンソースライセンス" icon="gavel">
                    <div className="flex flex-col gap-2">
                        {licenses.map((lib) => (
                            <details key={lib.name} className="ui-card group overflow-hidden">
                                <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none select-none">
                                    <span className="text-sm font-bold text-indigo-300">{lib.name}</span>
                                    <span className="flex items-center gap-2 text-[11px] text-slate-500">
                                        v{lib.version} / {lib.license}
                                        <span className="material-icons-round text-[18px] transition-transform group-open:rotate-180">expand_more</span>
                                    </span>
                                </summary>
                                <pre className="text-[9.5px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap px-4 pb-4">
                                    {lib.text}
                                </pre>
                            </details>
                        ))}
                    </div>
                </UiSection>

                <p className="text-center text-[10px] text-slate-600 font-mono tracking-widest">© 2026 MORI</p>
            </div>
        </ScreenShell>
    );
};

export default CreditsScreen;
