import assert from 'assert';
import {describe, it} from 'node:test';
import { getRandomColor } from '../utils/colors.js';

describe('Colors Utility', () => {
    it('getRandomColor returns valid hex color', () => {
        const color = getRandomColor();
        assert.match(color, /^#[0-9A-F]{6}$/i);
    });

    it('getRandomColor returns different colors', () => {
        const colors = new Set();
        for (let i = 0; i < 100; i++) {
            colors.add(getRandomColor());
        }
        assert.ok(colors.size > 1, 'Should generate different colors');
    });
});
