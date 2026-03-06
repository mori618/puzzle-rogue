
const fs = require('fs');
const path = require('path');

// Mock DOM
const document = {
    createElement: () => ({
        appendChild: () => { },
        style: {},
        classList: { add: () => { }, remove: () => { } },
        querySelector: () => ({ innerText: '', appendChild: () => { }, classList: { add: () => { }, remove: () => { } } }),
        remove: () => { }
    })
};

// Simplified PuzzleEngine logic for testing
class MockEngine {
    constructor() {
        this.rows = 5;
        this.cols = 6;
        this.minMatchLength = 3;
        this.state = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    }

    setOrb(r, c, type) {
        this.state[r][c] = { type, r, c, el: document.createElement() };
    }

    findCombos() {
        const basicTypes = ["fire", "water", "wood", "light", "dark", "heart"];
        const allGroups = [];
        const visitedPerColor = {};
        basicTypes.forEach(t => { visitedPerColor[t] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false)); });

        for (const color of basicTypes) {
            const matched = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c <= this.cols - this.minMatchLength; c++) {
                    const orb = this.state[r][c];
                    if (!orb || (orb.type !== color && !orb.isRainbow)) continue;
                    let isMatch = true;
                    for (let k = 1; k < this.minMatchLength; k++) {
                        const nextOrb = this.state[r][c + k];
                        if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) { isMatch = false; break; }
                    }
                    if (isMatch) {
                        for (let k = 0; k < this.minMatchLength; k++) matched[r][c + k] = true;
                        let k = c + this.minMatchLength;
                        while (k < this.cols && this.state[r][k] && (this.state[r][k].type === color || this.state[r][k].isRainbow)) { matched[r][k++] = true; }
                    }
                }
            }
            for (let c = 0; c < this.cols; c++) {
                for (let r = 0; r <= this.rows - this.minMatchLength; r++) {
                    const orb = this.state[r][c];
                    if (!orb || (orb.type !== color && !orb.isRainbow)) continue;
                    let isMatch = true;
                    for (let k = 1; k < this.minMatchLength; k++) {
                        const nextOrb = this.state[r + k][c];
                        if (!nextOrb || (nextOrb.type !== color && !nextOrb.isRainbow)) { isMatch = false; break; }
                    }
                    if (isMatch) {
                        for (let k = 0; k < this.minMatchLength; k++) matched[r + k][c] = true;
                        let k = r + this.minMatchLength;
                        while (k < this.rows && this.state[k][c] && (this.state[k][c].type === color || this.state[k][c].isRainbow)) { matched[k++][c] = true; }
                    }
                }
            }
            const visited = visitedPerColor[color];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (matched[r][c] && !visited[r][c]) {
                        const group = [];
                        const q = [{ r, c }];
                        visited[r][c] = true;
                        let hasBaseColor = false;
                        while (q.length > 0) {
                            const curr = q.shift();
                            const orb = this.state[curr.r][curr.c];
                            group.push(orb);
                            if (!orb.isRainbow && orb.type === color) hasBaseColor = true;
                            [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
                                const nr = curr.r + dr, nc = curr.c + dc;
                                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                                    if (matched[nr][nc] && !visited[nr][nc] && (this.state[nr][nc].type === color || this.state[nr][nc].isRainbow)) {
                                        visited[nr][nc] = true;
                                        q.push({ r: nr, c: nc });
                                    }
                                }
                            });
                        }
                        if (hasBaseColor || color === "heart") {
                            group.groupType = color;
                            allGroups.push(group);
                        }
                    }
                }
            }
        }
        return allGroups;
    }
}

const engine = new MockEngine();
// 3 fire orbs
engine.setOrb(0, 0, 'fire');
engine.setOrb(0, 1, 'fire');
engine.setOrb(0, 2, 'fire');

const groups = engine.findCombos();
console.log('Groups found:', groups.length);
if (groups.length > 0) {
    groups.forEach((g, i) => {
        console.log(`Group ${i}: type=${g.groupType}, size=${g.length}`);
    });
}
