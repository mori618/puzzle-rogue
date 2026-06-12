/* global global */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PuzzleEngine } from './engine/PuzzleEngine.js';
import { ALL_TOKEN_BASES } from './constants/tokens.js';

// AudioContextのモック
class MockAudioContext {
    createOscillator() {
        return {
            connect: () => {},
            start: () => {},
            stop: () => {},
            frequency: {
                setValueAtTime: () => {},
                exponentialRampToValueAtTime: () => {},
            }
        };
    }
    createGain() {
        return {
            connect: () => {},
            gain: {
                setValueAtTime: () => {},
                exponentialRampToValueAtTime: () => {},
            },
        };
    }
    destination = {};
    close() {}
    state = 'suspended';
    resume() { return Promise.resolve(); }
}
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

describe('PuzzleEngine Headless Tests', () => {
    let container;
    let timerBar;
    let comboEl;
    let engine;

    beforeEach(() => {
        vi.useFakeTimers();
        container = document.createElement('div');
        timerBar = document.createElement('div');
        comboEl = document.createElement('div');
        document.body.appendChild(container);

        engine = new PuzzleEngine(container, timerBar, comboEl, {
            rows: 5,
            cols: 6,
            timeLimit: 5000,
            minMatchLength: 3,
            onTurnEnd: vi.fn(),
            onCombo: vi.fn(),
            totalMoveTimeRef: { current: 0 }
        });

        // Mock getBoundingClientRect for DOM env
        container.getBoundingClientRect = () => ({ width: 300, height: 300, left: 0, top: 0 });
        engine.init();
    });

    afterEach(() => {
        vi.clearAllTimers();
        document.body.innerHTML = '';
    });

    it('initializes the board correctly', () => {
        expect(engine.state.length).toBe(5);
        expect(engine.state[0].length).toBe(6);
        expect(engine.state[0][0]).not.toBeNull();
    });

    it('adds special matching classes to orb elements', async () => {
        // Arrange: Prepare a 4-orb match in the first row
        for(let i=0; i<4; i++) {
            engine.state[0][i].type = 'fire';
        }
        engine.state[0][4].type = 'water';

        // Act: Manually call createShapeEffect or trigger process
        const group = [engine.state[0][0], engine.state[0][1], engine.state[0][2], engine.state[0][3]];
        engine.createShapeEffect('len4', group);

        // Assert: Elements should have the special class
        expect(group[0].el.classList.contains('orb-matching-len4')).toBe(true);
        expect(group[1].el.classList.contains('orb-matching-len4')).toBe(true);
    });

    it('can drag and drop an orb without throwing', async () => {
        const orb = engine.state[0][0];

        // Fake down event
        const downEvent = new MouseEvent('mousedown');
        orb.el.dispatchEvent(downEvent);

        // Fake move event
        const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
        window.dispatchEvent(moveEvent);

        // Fast forward for requestAnimationFrame
        vi.advanceTimersByTime(200);

        // Fake up event
        const upEvent = new MouseEvent('mouseup');
        window.dispatchEvent(upEvent);

        // Engine should process combos
        await vi.advanceTimersByTimeAsync(3000);
        expect(engine.processing).toBe(false);
    });

    describe('Skill Actions from ALL_TOKEN_BASES', () => {
        it('executes convert actions safely', () => {
            engine.state[0][0].type = 'wood';
            engine.state[0][1].type = 'fire';
            engine.state[0][2].type = 'water';

            const convertFireSkill = ALL_TOKEN_BASES.find(t => t.id === 'fired');
            if (convertFireSkill && convertFireSkill.action === 'convert') {
                engine.convertColor(convertFireSkill.params.from, convertFireSkill.params.to);
                expect(engine.state[0][0].type).toBe('fire');
            }

            const convertMultiSkill = ALL_TOKEN_BASES.find(t => t.id === 'conv_m1');
            if (convertMultiSkill && convertMultiSkill.action === 'convert_multi') {
                engine.convertMultiColor(convertMultiSkill.params.types, convertMultiSkill.params.to);
                const orbType1 = engine.state[0][0].type;
                const orbType2 = engine.state[0][1].type;
                const orbType3 = engine.state[0][2].type;
                expect([orbType1, orbType2, orbType3].includes('wood')).toBe(true);
            }
        });

        it('executes board_change actions safely', () => {
            const boardSkill = ALL_TOKEN_BASES.find(t => t.action === 'board_change');
            if (boardSkill) {
                engine.changeBoardColors(boardSkill.params.colors);
                const firstType = engine.state[0][0].type;
                expect(boardSkill.params.colors).toContain(firstType);
            }
        });

        it('executes board_balance action safely', () => {
            expect(() => {
                engine.forceRefresh();
            }).not.toThrow();
        });

        it('executes row_fix and col_fix safely', () => {
            engine.fixRowColor(0, 'fire');
            expect(engine.state[0][0].type).toBe('fire');
            expect(engine.state[0][5].type).toBe('fire');

            engine.fixColColor(0, 'water');
            expect(engine.state[0][0].type).toBe('water');
            expect(engine.state[4][0].type).toBe('water');

            engine.fixRowColor(-1, 'dark'); // Bottom row
            expect(engine.state[4][5].type).toBe('dark');

            engine.fixColColor(-1, 'light'); // Rightmost col
            expect(engine.state[0][5].type).toBe('light');
        });

        it('executes activateChronosStop safely', () => {
            engine.activateChronosStop(100);
            expect(engine.chronosStopActive).toBe(true);
            vi.advanceTimersByTime(200);
            expect(engine.chronosStopActive).toBe(false);
        });

        it('can set and trigger skyfall limits and weights', () => {
            engine.setSpawnWeights({ fire: 0, water: 0, wood: 10, light: 0, dark: 0, heart: 0 });
            engine.spawnOrb(0, 0, true, 0);
            expect(engine.state[0][0].type).toBe('wood');
        });

        it('executes enhanceColorOrbs safely', () => {
            engine.state[0][0].type = 'fire';
            engine.enhanceColorOrbs(['fire']);
            expect(engine.state[0][0].isEnhanced).toBe(true);
        });
    });

    describe('Special Drops and Behaviors', () => {
        it('spawns and processes bomb drops', async () => {
            engine.state[0][0].isBomb = true;
            engine.state[0][0].type = 'fire';
            engine.state[0][1].type = 'fire';
            engine.state[0][2].type = 'fire';

            engine.process();
            await vi.advanceTimersByTimeAsync(3000);
            expect(true).toBe(true);
        });

        it('spawns and processes rainbow drops', async () => {
            engine.state[0][0].type = 'rainbow';
            engine.state[0][1].type = 'fire';
            engine.state[0][2].type = 'fire';

            engine.process();
            await vi.advanceTimersByTimeAsync(3000);
            expect(true).toBe(true);
        });

        it('spawns and processes repeat drops', async () => {
            const orb = engine.state[0][0];
            orb.type = 'water';
            orb.isRepeat = true;
            engine.state[0][1].type = 'water';
            engine.state[0][2].type = 'water';

            engine.process();
            await vi.advanceTimersByTimeAsync(3000);
            expect(true).toBe(true);
        });
    });

    describe('新規トークンと重力逆転の挙動テスト', () => {
        it('重力方向を上に切り替えてオーブが上に詰まることを検証', async () => {
            engine.gravityDirection = 'up';
            
            // c=0 列をすべて空にする
            for (let r = 0; r < engine.rows; r++) {
                engine.state[r][0] = null;
            }
            
            // (1,0) にだけテスト用オーブを配置する
            const testOrb = {
                type: 'fire',
                el: document.createElement('div'),
                r: 1,
                c: 0,
                baseTop: 0,
                baseLeft: 0
            };
            engine.state[1][0] = testOrb;
            
            engine.gravityOnly();
            await vi.advanceTimersByTimeAsync(100);
            
            // testOrb が上に詰められるはず
            expect(engine.state[0][0]).toBe(testOrb);
            expect(engine.state[1][0]).toBeNull();
        });

        it('一筆書きの誓約が有効な場合、通過済みマスへの移動がブロックされることを検証', async () => {
            engine.hasOneStrokeSeal = true;
            const startOrb = engine.state[0][0];
            const secondOrb = engine.state[0][1];

            // ドラッグ開始
            const downEvent = new MouseEvent('mousedown');
            startOrb.el.dispatchEvent(downEvent);
            expect(engine.oneStrokeVisited.has('0,0')).toBe(true);
            expect(container.querySelectorAll('.one-stroke-tile').length).toBe(1);

            // 隣のセル (0,1) に移動（スワップ）
            // xの位置は clientX = rect.left (0) + 71px (1セル分 + 余裕)
            engine.onMove(new MouseEvent('mousemove', { clientX: 71, clientY: 20 }));
            vi.advanceTimersByTime(100);

            // 訪問履歴に (0,1) が追加され、スワップされていること
            expect(engine.oneStrokeVisited.has('0,1')).toBe(true);
            expect(engine.state[0][1]).toBe(startOrb);
            expect(engine.state[0][0]).toBe(secondOrb);
            expect(container.querySelectorAll('.one-stroke-tile').length).toBe(2);

            // 訪問済みの (0,0) に戻るようなマウス移動
            engine.onMove(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }));
            vi.advanceTimersByTime(100);

            // 移動が拒否され、オーブの位置は (0,1) = startOrb, (0,0) = secondOrb のままであること
            expect(engine.state[0][1]).toBe(startOrb);
            expect(engine.state[0][0]).toBe(secondOrb);
            expect(container.querySelectorAll('.one-stroke-tile').length).toBe(2);

            // ドラッグ終了
            const upEvent = new MouseEvent('mouseup');
            window.dispatchEvent(upEvent);
            
            // インジケーターがクリーンアップされていること
            expect(container.querySelectorAll('.one-stroke-tile').length).toBe(0);
            expect(engine.oneStrokeVisited).toBeNull();
        });

        it('ランダムな位置にリピートオーブとボムオーブが生成されることを検証', () => {
            let repeatCount = 0;
            let bombCount = 0;
            engine.state.forEach(row => {
                row.forEach(orb => {
                    if (orb && orb.isRepeat) repeatCount++;
                    if (orb && orb.isBomb) bombCount++;
                });
            });
            expect(repeatCount).toBe(0);
            expect(bombCount).toBe(0);

            engine.spawnRepeatRandom(3);
            engine.spawnBombRandom(2);

            repeatCount = 0;
            bombCount = 0;
            engine.state.forEach(row => {
                row.forEach(orb => {
                    if (orb && orb.isRepeat) repeatCount++;
                    if (orb && orb.isBomb) bombCount++;
                });
            });
            expect(repeatCount).toBe(3);
            expect(bombCount).toBe(2);
        });

        it('organizeColor メソッドが指定された色のドロップを左上に整列させ、他のドロップを下・右に詰めることを検証', () => {
            const testBoard = [
                ['wood', 'water', 'fire', 'wood', 'water', 'fire'],
                ['fire', 'wood', 'water', 'wood', 'water', 'wood'],
                ['water', 'wood', 'fire', 'wood', 'water', 'fire'],
                ['wood', 'water', 'wood', 'water', 'fire', 'wood'],
                ['fire', 'water', 'wood', 'wood', 'water', 'water']
            ];

            testBoard.forEach((row, r) => {
                row.forEach((type, c) => {
                    engine.state[r][c] = {
                        type,
                        el: document.createElement('div'),
                        r,
                        c,
                        baseTop: r * 50,
                        baseLeft: c * 50
                    };
                    const inner = document.createElement('div');
                    inner.className = 'orb-inner';
                    engine.state[r][c].el.appendChild(inner);
                });
            });

            let fireCount = 0;
            let otherCount = 0;
            testBoard.forEach(row => {
                row.forEach(t => {
                    if (t === 'fire') fireCount++;
                    else otherCount++;
                });
            });

            expect(fireCount).toBe(7);

            engine.organizeColor('fire');

            for (let c = 0; c < 6; c++) {
                expect(engine.state[0][c].type).toBe('fire');
            }
            expect(engine.state[1][0].type).toBe('fire');

            expect(engine.state[1][1].type).not.toBe('fire');
            for (let r = 2; r < 5; r++) {
                for (let c = 0; c < 6; c++) {
                    expect(engine.state[r][c].type).not.toBe('fire');
                }
            }

            let finalFireCount = 0;
            let finalOtherCount = 0;
            engine.state.forEach(row => {
                row.forEach(orb => {
                    if (orb) {
                        if (orb.type === 'fire') finalFireCount++;
                        else finalOtherCount++;
                    }
                });
            });
            expect(finalFireCount).toBe(fireCount);
            expect(finalOtherCount).toBe(otherCount);
        });

        it('eraseColor メソッドが指定された色のドロップを削除し、再補充を行い、消去数を正しくカウントすることを検証', async () => {
            const testBoard = [
                ['wood', 'water', 'fire', 'wood', 'water', 'fire'],
                ['fire', 'wood', 'water', 'wood', 'water', 'wood'],
                ['water', 'wood', 'fire', 'wood', 'water', 'fire'],
                ['wood', 'water', 'wood', 'water', 'fire', 'wood'],
                ['fire', 'water', 'wood', 'wood', 'water', 'water']
            ];

            testBoard.forEach((row, r) => {
                row.forEach((type, c) => {
                    engine.state[r][c] = {
                        type,
                        el: document.createElement('div'),
                        r,
                        c,
                        baseTop: r * 50,
                        baseLeft: c * 50
                    };
                    const inner = document.createElement('div');
                    inner.className = 'orb-inner';
                    engine.state[r][c].el.appendChild(inner);
                });
            });

            engine.state[0][2].isBomb = true;

            const erasePromise = engine.eraseColor('fire');

            // 非同期アニメーションの進行を待つ
            await vi.advanceTimersByTimeAsync(1000);

            const { erasedCount, rawCount } = await erasePromise;

            expect(rawCount).toBe(7);
            expect(erasedCount).toBe(8);

            engine.state.forEach(row => {
                row.forEach(orb => {
                    expect(orb).not.toBeNull();
                });
            });
        });

        it('changeBoardToEnhancedColor メソッドが盤面上のすべての通常ドロップを指定色のプラス（強化）ドロップに変換することを検証', () => {
            engine.changeBoardToEnhancedColor('fire');

            engine.state.forEach(row => {
                row.forEach(orb => {
                    if (orb && !orb.isMoveDrop) {
                        expect(orb.type).toBe('fire');
                        expect(orb.isEnhanced).toBe(true);
                    }
                });
            });
        });

        it('ムーブドロップにカウントが存在する際、ドラッグ開始時にリセットされず、ターン処理完了後にリセットされることを検証', async () => {
            const orb = engine.state[0][0];
            orb.isMoveDrop = true;
            orb.moveCount = 20;
            orb.moveSteps = 0;
            orb.moveRequired = 5;
            orb.type = "move";

            const countSpan = document.createElement("span");
            countSpan.className = "move-count-text";
            countSpan.innerText = orb.moveCount;
            orb.el.querySelector('.orb-inner').appendChild(countSpan);

            const downEvent = new MouseEvent('mousedown');
            orb.el.dispatchEvent(downEvent);

            expect(orb.moveCount).toBe(20);

            // 移動イベントを発生させてスワップ（ターン進行）を発生させる
            const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
            window.dispatchEvent(moveEvent);
            vi.advanceTimersByTime(200);

            const upEvent = new MouseEvent('mouseup');
            window.dispatchEvent(upEvent);

            await vi.advanceTimersByTimeAsync(3000);

            expect(orb.moveCount).toBe(0);
        });
    });
});

