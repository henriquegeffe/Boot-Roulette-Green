
export const wheelSequence = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];

export const tierNumbers = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
export const orfaoNumbers = [1, 20, 14, 31, 9, 17, 34, 6];
export const voisinsNumbers = [22, 18, 29, 7, 28, 19, 4, 21, 2, 25];
export const zeroGameNumbers = [12, 35, 3, 26, 0, 32, 15];

export const regions: Record<string, number[]> = {
  "Voisins": voisinsNumbers,
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

export const mascaradosGroups: Record<string, number[]> = {
  "0": [0, 10, 11, 19, 20, 22, 28, 30, 33],
  "1": [1, 10, 11, 12, 19, 21, 23, 28, 31, 32],
  "2": [2, 11, 12, 13, 20, 22, 24, 29, 31, 32, 35],
  "3": [3, 12, 13, 14, 21, 23, 25, 30, 33, 36],
  "4": [4, 13, 14, 15, 22, 24, 26, 31, 34],
  "5": [5, 14, 15, 16, 23, 25, 27, 32, 35],
  "6": [6, 15, 16, 17, 24, 26, 33, 36],
  "7": [7, 16, 17, 18, 25, 27, 29, 34],
  "8": [8, 17, 18, 19, 26, 28, 35],
  "9": [9, 18, 19, 27, 29, 36],
};

export const nineForces: Record<number, number[]> = {
  1: [1, 4, 7],
  2: [10, 13, 16],
  3: [19, 22, 25],
  4: [2, 5, 8],
  5: [11, 14, 17],
  6: [20, 23, 26],
  7: [3, 6, 9],
  8: [12, 15, 18],
  9: [21, 24, 27, 30, 33, 36],
};

export const resetters = [0, 10, 11, 19, 20, 22, 28, 30, 33];

export const puxamNumbersA: Record<number, { targets: number[]; neighbors: number }> = {
  1: { targets: [0, 2, 10, 17, 27, 36], neighbors: 1 },
  2: { targets: [1, 2, 3, 22, 20], neighbors: 1 },
  3: { targets: [2, 3, 4, 30, 33], neighbors: 1 },
  4: { targets: [1, 3, 5, 8, 9, 21], neighbors: 1 },
  5: { targets: [4, 5, 6, 15, 25], neighbors: 1 },
  6: { targets: [5, 6, 7, 17, 20], neighbors: 1 },
  7: { targets: [6, 7, 8, 17, 20, 27], neighbors: 1 },
  8: { targets: [0, 7, 8, 9, 35], neighbors: 1 },
  9: { targets: [8, 9, 10, 19], neighbors: 1 },
  10: { targets: [1, 12, 19], neighbors: 2 },
  11: { targets: [0, 17, 30], neighbors: 2 },
  12: { targets: [7, 17, 20], neighbors: 2 },
  13: { targets: [15, 17, 20, 27], neighbors: 1 },
  14: { targets: [7, 17, 20], neighbors: 2 },
  15: { targets: [9, 17, 13, 18, 19], neighbors: 1 },
  16: { targets: [3, 15, 33], neighbors: 2 },
  17: { targets: [7, 11, 13, 15, 17, 20], neighbors: 1 },
  18: { targets: [2, 19, 22, 30], neighbors: 1 },
  19: { targets: [9, 18, 19, 20], neighbors: 1 },
  20: { targets: [2, 7, 17, 19, 21], neighbors: 1 },
  21: { targets: [2, 20, 22], neighbors: 2 },
  22: { targets: [2, 21, 22, 23], neighbors: 1 },
  23: { targets: [0, 10, 20, 22, 24, 30], neighbors: 1 },
  24: { targets: [5, 15, 23, 25], neighbors: 1 },
  25: { targets: [24, 26, 25], neighbors: 2 },
  26: { targets: [0, 10, 20, 25, 27, 30], neighbors: 1 },
  27: { targets: [7, 17, 20, 26, 28], neighbors: 1 },
  28: { targets: [7, 17, 27, 20], neighbors: 1 },
  29: { targets: [7, 17, 20, 28, 30], neighbors: 1 },
  30: { targets: [18, 27, 30, 36], neighbors: 1 },
  31: { targets: [7, 9, 19, 22], neighbors: 1 },
  32: { targets: [0, 10, 20, 30], neighbors: 1 },
  33: { targets: [3, 17, 33], neighbors: 2 },
  34: { targets: [7, 17, 20], neighbors: 2 },
  35: { targets: [3, 8, 17, 33], neighbors: 1 },
  36: { targets: [1, 0, 10, 20, 30], neighbors: 1 },
};

export const puxamNumbersB: Record<number, { targets: number[]; neighbors: number }> = {
  0: { targets: [34, 14, 32, 10], neighbors: 1 },
  1: { targets: [36, 1, 2, 29], neighbors: 1 },
  2: { targets: [20, 5, 22, 2], neighbors: 1 },
  3: { targets: [35, 4, 33, 6], neighbors: 1 },
  4: { targets: [12, 22, 2, 24], neighbors: 1 },
  5: { targets: [18, 6, 24, 2], neighbors: 1 },
  6: { targets: [5, 20, 12, 17], neighbors: 1 },
  7: { targets: [16, 14, 28, 4], neighbors: 1 },
  8: { targets: [11, 28, 35, 31], neighbors: 1 },
  9: { targets: [31, 11, 6, 3], neighbors: 1 },
  10: { targets: [23, 20, 28, 19], neighbors: 1 },
  11: { targets: [8, 29, 31, 13], neighbors: 1 },
  12: { targets: [21, 32, 36, 3], neighbors: 1 },
  13: { targets: [31, 11, 33, 15], neighbors: 1 },
  14: { targets: [34, 14, 30, 5], neighbors: 1 },
  15: { targets: [35, 20, 17, 24], neighbors: 1 },
  16: { targets: [36, 19, 7, 34], neighbors: 1 },
  17: { targets: [17, 22, 16, 8], neighbors: 1 },
  18: { targets: [5, 6, 22, 19], neighbors: 1 },
  19: { targets: [16, 28, 21, 36], neighbors: 1 },
  20: { targets: [2, 20, 10, 6], neighbors: 1 },
  21: { targets: [21, 12, 19, 16], neighbors: 1 },
  22: { targets: [2, 17, 32, 18], neighbors: 1 },
  23: { targets: [32, 23, 7, 14], neighbors: 1 },
  24: { targets: [27, 22, 7, 26], neighbors: 1 },
  25: { targets: [27, 22, 2, 26], neighbors: 1 },
  26: { targets: [29, 0, 23, 34], neighbors: 1 },
  27: { targets: [24, 25, 13, 26], neighbors: 1 },
  28: { targets: [8, 12, 19, 24], neighbors: 1 },
  29: { targets: [26, 11, 1, 18], neighbors: 1 },
  30: { targets: [14, 30, 36, 16], neighbors: 1 },
  31: { targets: [13, 22, 28, 11], neighbors: 1 },
  32: { targets: [23, 12, 22, 15], neighbors: 1 },
  33: { targets: [36, 31, 3, 1], neighbors: 1 },
  34: { targets: [0, 14, 34, 36], neighbors: 1 },
  35: { targets: [15, 12, 8, 9], neighbors: 1 },
  36: { targets: [16, 36, 1, 12], neighbors: 1 },
};

export const wheelZones: number[][] = [
  [0, 32, 15],      // Zona 1
  [19, 4, 21],      // Zona 2
  [2, 25, 17],      // Zona 3
  [34, 6, 27],      // Zona 4
  [13, 36, 11],     // Zona 5
  [30, 8, 23],      // Zona 6
  [10, 5, 24],      // Zona 7
  [16, 33, 1],      // Zona 8
  [20, 14, 31],     // Zona 9
  [9, 22, 18],      // Zona 10
  [29, 7, 28],      // Zona 11
  [12, 35, 3, 26],  // Zona 12
];

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

export const triangle1Base = [11, 15, 22];
export const triangle2Base = [17, 24, 28];

export const STRATEGY_COLORS: { [key: string]: string } = {
  main: 'blue',
  geometric: 'yellow',
  casas: 'purple',
  pelayo: 'green',
  default: 'purple'
};
