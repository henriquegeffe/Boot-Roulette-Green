
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
  result?: "win" | "loss" | "pending" | "cancelled";
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

export interface MascaradosRobotSignal extends RobotSignal {
  group: string;
  numbers: number[];
  reasoning: string;
  testedRounds: number[];
}

export interface GPSRobotSignal extends RobotSignal {
  direction: string;
  numbers: number[];
  zonaAtaque: number[];
  zonaDefesa: number[];
  destinoProvavel: number[];
  reasoning: string;
  testedRounds: number[];
}

export interface TriangulacaoRobotSignal extends RobotSignal {
  numbers: number[];
  reasoning: string;
  testedRounds: number[];
  triangleType: 1 | 2;
}

export interface EscadinhaRobotSignal extends RobotSignal {
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
  shortCount: number;
  longCount: number;
  positions: number[];
  hitCount: number;
  score: number;
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
  caminhoDaBola?: {
    lastJump: number;
    jumpType: 'Curto' | 'Médio' | 'Longo' | 'Parado';
    direction: 'Frente' | 'Trás' | 'Parado';
    pattern: string;
  };
  bestSignal: {
    confidence: number;
    numbers: number[];
    reasoning: string;
  } | null;
}

export interface MascaradosAnalysisResult {
  unifiedStats: {
    [key: string]: {
      count: number;
      percentage: number;
      lastPos: number | null;
      numbers: number[];
      history: number[];
    };
  };
  bestSignal: {
    confidence: number;
    numbers: number[];
    reasoning: string;
    group: string;
    pattern: string;
  } | null;
  activePatterns: {
    type: string;
    reasoning: string;
    priority: number;
    value: number;
    numbers: number[];
  }[];
  globalTrends: {
    topMascarados: { value: number; count: number; percentage: number }[];
    topEscadinhas: { pair: string; count: number; percentage: number }[];
    topCorrelations: { from: number; to: number; count: number; percentage: number }[];
    topRepetitions: { value: number; count: number; percentage: number }[];
  };
}

export interface GPSAnalysisResult {
  dominante: string;
  frequencia: number;
  regionFrequency: number;
  repeticoes: number;
  padrao: "REPETINDO" | "ESTÁVEL";
  destino: number;
  zona: number[];
  zonaAtaque: number[];
  zonaDefesa: number[];
  targetNumbers: number[];
  hotRegion: string;
  alerta: boolean;
  intensidade: "ALTA" | "MÉDIA" | "BAIXA";
  tendencia: "HORÁRIO" | "ANTI-HORÁRIO" | "ESTÁVEL";
  direcoes: string[];
  contagem: Record<string, number>;
  regionCounts: Record<string, number>;
  frequenciaNumerosPorDirecao: Record<string, Record<number, number>>;
  hotNumbers50: number[];
}

export interface TriangulacaoAnalysisResult {
  bestSignal: {
    confidence: number;
    numbers: number[];
    baseNumbers?: number[];
    reasoning: string;
    triangleType: 1 | 2;
  } | null;
  triangleStats: {
    1: { hits: number; total: number; rate: number };
    2: { hits: number; total: number; rate: number };
  };
  flowAnalysis: {
    consecutiveRepetitions: { type: 1 | 2; count: number }[];
    currentStreak: { type: 1 | 2; count: number } | null;
    topCallers: { number: number; type: 1 | 2; count: number }[];
    transitions: { from: 1 | 2; to: 1 | 2; count: number }[];
  };
}

export interface EscadinhaAnalysisResult {
  bestSignal: {
    confidence: number;
    numbers: number[];
    baseNumbers?: number[];
    reasoning: string;
  } | null;
  escadinhaStats: {
    [terminal: number]: {
      hits: number;
      total: number;
      rate: number;
    }
  };
  flowAnalysis: {
    consecutiveRepetitions: { terminal: number; count: number }[];
    currentStreak: { terminal: number; count: number } | null;
    topCallers: { number: number; terminal: number; count: number }[];
    transitions: { from: number; to: number; count: number }[];
  };
  terminalTrends: {
    lowCount: number;
    highCount: number;
    evenCount: number;
    oddCount: number;
    lowPercentage: number;
    highPercentage: number;
    evenPercentage: number;
    oddPercentage: number;
    hotTerminals: number[];
    coldTerminals: number[];
  };
}

export type ColorFilterType = "casas" | "terminais" | "geometricos" | "terminais_escadinha" | "triangulo" | "mascarados";
