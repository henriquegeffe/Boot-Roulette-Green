
export interface NumberEntry {
  number: number;
  timestamp: Date;
  casa: "0" | "10" | "20" | "30" | null;
  index: number;
}

export interface RobotSignal {
  id: string;
  timestamp: Date;
  strategy: string;
  confidence: number;
  baseNumbers: number[];
  result?: "win" | "loss" | "pending";
  validityRounds: number;
  roundsLeft: number;
  winRound?: number;
  color: string;
}

export interface MainRobotSignal extends RobotSignal {
  terminal: number | string;
  numbers: number[];
  testedRounds: number[];
}

export interface GeometricPatternSignal extends RobotSignal {
  patternId: string;
  patternName: string;
  predictedNumbers: number[];
  reasoning: string;
  testedRounds: number[];
}

export interface CasasRobotSignal extends RobotSignal {
  casa: string;
  numbers: number[];
  reasoning: string;
  testedRounds: number[];
}

export interface PelayoRobotSignal extends RobotSignal {
  numbers: number[];
  reasoning: string;
  testedRounds: number[];
}

export interface StrategyPerformance {
  key: string;
  lossStreak: number;
}

export interface TerminalAnalysisResult {
  terminal: number;
  count: number;
  positions: number[];
  hitCount: number;
}

export interface GeometricPatternAnalysis {
  patternId: string;
  name: string;
  numbers: number[];
  color: string;
  activations: number;
  hitCount: number;
  hitRate: number;
  hitDetails: { round: number; number: number }[];
  isHot: boolean;
  confidence: number;
}

export interface CasasAnalysisResult {
  stats: {
    [key: string]: {
      count: number;
      percentage: number;
      lastPos: number | null;
      isHot: boolean;
      isCold: boolean;
    };
  };
  patterns: {
    parImpar: {
      alternating: number;
      repeating: number;
      trend: 'alternating' | 'repeating' | 'none';
    };
    altoBaixo: {
      alternating: number;
      repeating: number;
      trend: 'alternating' | 'repeating' | 'none';
    };
  };
  bestSignal: {
    confidence: number;
    numbers: number[];
    reasoning: string;
  } | null;
}

export interface PelayoAnalysisResult {
  regions: {
    name: string;
    count: number;
    percentage: number;
    lastHit: number | null;
    status: 'Dominante' | 'Cluster' | 'Normal' | 'Atrasado';
    anchorNumbers: { number: number; count: number }[];
  }[];
  bestSignal: {
    confidence: number;
    numbers: number[];
    reasoning: string;
  } | null;
}

export type ColorFilterType = "casas" | "terminais" | "geometricos";
