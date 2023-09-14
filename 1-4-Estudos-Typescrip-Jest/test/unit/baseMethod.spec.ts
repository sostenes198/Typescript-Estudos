import { double, concat } from '../../src/baseMethods';

describe('testing index file', () => {
    test('double function', () => {
        expect(double(5)).toBe(10);
    });

    test('concat function', () => {
        expect(concat('Paul', ' ', 'McCartney')).toBe('Paul McCartney');
    });
});