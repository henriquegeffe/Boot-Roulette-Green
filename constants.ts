
export const wheelSequence = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];

export const tierNumbers = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
export const orfaoNumbers = [1, 20, 14, 31, 9, 17, 34, 6];
export const voisinsNumbers = [22, 18, 29, 7, 28, 19, 4, 21, 2, 25];
export const zeroGameNumbers = [12, 35, 3, 26, 0, 32, 15];

export const regions: Record<string, number[]> = {
  "Voisins": [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  "Tiers": tierNumbers,
  "Orphelins": orfaoNumbers,
  "Zero": zeroGameNumbers,
};

export const terminals: Record<number, number[]> = {
  0: [0, 10, 20, 30],
  1: [1, 11, 21, 31],
  2: [2, 12, 22, 32],
  3: [3, 13, 23, 33],
  4: [4, 14, 24, 34],
  5: [5, 15, 25, 35],
  6: [6, 16, 26, 36],
  7: [7, 17, 27],
  8: [8, 18, 28],
  9: [9, 19, 29],
};

export const casas: Record<string, number[]> = {
  "0": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  "10": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  "20": [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  "30": [30, 31, 32, 33, 34, 35, 36],
};

export const geometricPatterns: Record<string, { name: string; numbers: number[]; color: string }> = {
  'triangle_1': { name: 'Triângulo 0 24 13', numbers: [0, 24, 13], color: 'yellow' },
  'triangle_2': { name: 'Triângulo 32 5 36', numbers: [32, 5, 36], color: 'yellow' },
  'triangle_3': { name: 'Triângulo 15 16 11', numbers: [15, 16, 11], color: 'yellow' },
  'triangle_4': { name: 'Triângulo 19 33 30', numbers: [19, 33, 30], color: 'yellow' },
  'triangle_5': { name: 'Triângulo 4 1 8', numbers: [4, 1, 8], color: 'yellow' },
  'triangle_6': { name: 'Triângulo 21 20 23', numbers: [21, 20, 23], color: 'yellow' },
  'triangle_7': { name: 'Triângulo 2 14 10', numbers: [2, 14, 10], color: 'yellow' },
  'square_1': { name: 'Quadrado 0 9 18 27', numbers: [0, 9, 18, 27], color: 'yellow' },
  'square_2': { name: 'Quadrado 11 20 29', numbers: [11, 20, 29], color: 'yellow' },
  'line_1': { name: 'Linha 3 12 21 30', numbers: [3, 12, 21, 30], color: 'yellow' },
  'line_2': { name: 'Linha 6 15 24 33', numbers: [6, 15, 24, 33], color: 'yellow' },
};

export const STRATEGY_COLORS: { [key: string]: string } = {
  main: 'blue',
  geometric: 'yellow',
  casas: 'purple',
  pelayo: 'green',
  default: 'purple'
};
