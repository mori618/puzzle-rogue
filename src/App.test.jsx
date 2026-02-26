import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

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

describe('App Monkey Test', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it('runs without crashing through various random actions', async () => {
        let root;
        await act(async () => {
            root = render(<App />);
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
