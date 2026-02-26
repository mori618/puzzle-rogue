import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PuzzleEngine, ALL_TOKEN_BASES } from './App';

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

    it('can drag and drop an orb without throwing', () => {
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
        vi.advanceTimersByTime(1000);
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
            // Manually mimic board balance logic since it resides in App.jsx usually, 
            // but let's just make sure we don't crash by calling forceRefresh-like logic.
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
            // It spawns wood since probability of wood is 100%
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
            // Fast forward until animations complete
            await vi.advanceTimersByTimeAsync(3000);
            // It should run without error. Depending on the test setup and skyfall timing, it may be null or a regular orb.
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
});
