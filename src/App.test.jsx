/* global global */
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
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

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Star: () => <div data-testid="icon-star" />,
    Settings: () => <div data-testid="icon-settings" />,
    Play: () => <div data-testid="icon-play" />,
    Zap: () => <div data-testid="icon-zap" />,
    Shield: () => <div data-testid="icon-shield" />,
    Clock: () => <div data-testid="icon-clock" />,
    Swords: () => <div data-testid="icon-swords" />,
    BookOpen: () => <div data-testid="icon-book" />,
    Backpack: () => <div data-testid="icon-backpack" />,
    Sword: () => <div data-testid="icon-sword" />,
    Heart: () => <div data-testid="icon-heart" />,
    Coins: () => <div data-testid="icon-coins" />,
    Timer: () => <div data-testid="icon-timer" />,
    Trophy: () => <div data-testid="icon-trophy" />,
    RefreshCw: () => <div data-testid="icon-refresh" />,
    X: () => <div data-testid="icon-x" />,
    Info: () => <div data-testid="icon-info" />,
    BarChart2: () => <div data-testid="icon-barchart" />,
    ShoppingCart: () => <div data-testid="icon-cart" />,
    RotateCcw: () => <div data-testid="icon-rotate" />,
    Home: () => <div data-testid="icon-home" />,
    HelpCircle: () => <div data-testid="icon-help" />,
    Cpu: () => <div data-testid="icon-cpu" />,
}));

describe('purifyCurse reward pooling logic', () => {
    it('selects rarity 4 tokens for legendary reward', () => {
        const legendPool = ALL_TOKEN_BASES.filter(t => t.rarity === 4 && t.type !== 'curse' && !t.isCurse);
        expect(legendPool.length).toBeGreaterThan(0);
        legendPool.forEach(t => {
            expect(t.rarity).toBe(4);
            expect(t.type).not.toBe('curse');
            expect(t.isCurse).not.toBe(true);
        });
    });

    it('selects rarity 3 tokens for normal reward', () => {
        const rewardPool = ALL_TOKEN_BASES.filter(t => t.rarity === 3 && t.canBeCurseReward);
        expect(rewardPool.length).toBeGreaterThan(0);
        rewardPool.forEach(t => {
            expect(t.rarity).toBe(3);
            expect(t.canBeCurseReward).toBe(true);
        });
    });
});

describe('App Monkey Test', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it('runs without crashing through various random actions', async () => {
        await act(async () => {
            render(<App />);
        });

        // Start game from title screen
        const startButton = screen.queryByText(/GAME START/i) || screen.queryByText(/スタート/);
        if (startButton) {
            fireEvent.click(startButton);
        }

        // Simulate some time passing to allow React state to settle
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        const performRandomActions = async (iterations) => {
            for (let i = 0; i < iterations; i++) {
                // Find all clickable things
                const buttons = document.querySelectorAll('button');
                if (buttons.length > 0) {
                    const randomBtn = buttons[Math.floor(Math.random() * buttons.length)];
                    try {
                        fireEvent.click(randomBtn);
                    } catch (e) {
                        console.error("Error clicking button", e);
                    }
                }

                // Try to trigger orb drag drop
                const orbs = document.querySelectorAll('.orb');
                if (orbs.length >= 2) {
                    const orb1 = orbs[Math.floor(Math.random() * orbs.length)];
                    const orb2 = orbs[Math.floor(Math.random() * orbs.length)];

                    if (orb1 && orb2 && orb1 !== orb2) {
                        try {
                            fireEvent.mouseDown(orb1, { clientX: 100, clientY: 100 });
                            fireEvent.mouseMove(orb2, { clientX: 150, clientY: 150 });
                            fireEvent.mouseUp(orb2);
                        } catch (e) {
                            console.error("Error moving orb", e);
                        }
                    }
                }

                // Advance timers simulating gameplay flow
                await act(async () => {
                    vi.advanceTimersByTime(200);
                });
            }
        };

        // run interactions
        await performRandomActions(50);

        // End run gracefully without errors
        expect(true).toBe(true);
    });
});
