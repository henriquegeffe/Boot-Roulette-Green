
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  Bot, Target, History, Shapes, Landmark, Group, Zap, BarChart3, Flame, Activity,
  Clock, CheckCircle2, Gauge, ArrowUpRight, ArrowDownRight, TrendingUp, Undo2, Award,
  Maximize, Minimize
} from "lucide-react";
import { 
  Card, Button, Badge, Input, Select 
} from "./components/UI";
import { 
  wheelSequence, terminals, geometricPatterns, regions, casas, STRATEGY_COLORS 
} from "./constants";
import { 
  NumberEntry, MainRobotSignal, GeometricPatternSignal, CasasRobotSignal, PelayoRobotSignal, 
  CasasAnalysisResult, PelayoAnalysisResult, ColorFilterType, TerminalAnalysisResult, GeometricPatternAnalysis
} from "./types";

const getNumberColorClass = (n: number) => {
  if (n === 0) return "bg-green-600";
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(n) ? "bg-red-600" : "bg-slate-950";
};

const App: React.FC = () => {
  const [inputNumbers, setInputNumbers] = useState("");
  const [numberHistory, setNumberHistory] = useState<number[]>([]);
  const [reverseOrder, setReverseOrder] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [colorFilter, setColorFilter] = useState<ColorFilterType>("casas");
  const [subColorFilter, setSubColorFilter] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [mainRobotSignals, setMainRobotSignals] = useState<MainRobotSignal[]>([]);
  const [currentMainSignal, setCurrentMainSignal] = useState<MainRobotSignal | null>(null);
  const [geometricSignals, setGeometricSignals] = useState<GeometricPatternSignal[]>([]);
  const [currentGeometricSignal, setCurrentGeometricSignal] = useState<GeometricPatternSignal | null>(null);
  const [casasSignals, setCasasSignals] = useState<CasasRobotSignal[]>([]);
  const [currentCasasSignal, setCurrentCasasSignal] = useState<CasasRobotSignal | null>(null);
  const [pelayoSignals, setPelayoSignals] = useState<PelayoRobotSignal[]>([]);
  const [currentPelayoSignal, setCurrentPelayoSignal] = useState<PelayoRobotSignal | null>(null);

  const currentMainRef = useRef(currentMainSignal);
  const currentGeoRef = useRef(currentGeometricSignal);
  const currentCasasRef = useRef(currentCasasSignal);
  const currentPelayoRef = useRef(currentPelayoSignal);

  useEffect(() => { currentMainRef.current = currentMainSignal; }, [currentMainSignal]);
  useEffect(() => { currentGeoRef.current = currentGeometricSignal; }, [currentGeometricSignal]);
  useEffect(() => { currentCasasRef.current = currentCasasSignal; }, [currentCasasSignal]);
  useEffect(() => { currentPelayoRef.current = currentPelayoSignal; }, [currentPelayoSignal]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar ativar modo tela cheia: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getNumberCasa = useCallback((number: number): "0" | "10" | "20" | "30" | null => {
    if (casas["0"].includes(number)) return "0";
    if (casas["10"].includes(number)) return "10";
    if (casas["20"].includes(number)) return "20";
    if (casas["30"].includes(number)) return "30";
    return null;
  }, []);

  const getCorrectNeighbors = useCallback((number: number, count = 1): number[] => {
    const index = wheelSequence.indexOf(number);
    if (index === -1) return [];
    const neighbors: number[] = [];
    const length = wheelSequence.length;
    for (let i = 1; i <= count; i++) {
      const leftIndex = (index - i + length) % length;
      const rightIndex = (index + i) % length;
      if (!neighbors.includes(wheelSequence[leftIndex])) neighbors.push(wheelSequence[leftIndex]);
      if (!neighbors.includes(wheelSequence[rightIndex])) neighbors.push(wheelSequence[rightIndex]);
    }
    return neighbors;
  }, []);

  const terminalAnalysis = useMemo(() => {
    if (numberHistory.length < 5) return { topTerminals: [], bestStrategy: null };
    const recentHistory = numberHistory.slice(0, 50);
    const terminalCounts: Record<number, { count: number, positions: number[], hitCount: number }> = {};
    for (let i = 0; i <= 9; i++) terminalCounts[i] = { count: 0, positions: [], hitCount: 0 };
    recentHistory.forEach((num, index) => {
      const t = num % 10;
      terminalCounts[t].count++;
      terminalCounts[t].positions.push(index);
    });
    Object.keys(terminalCounts).forEach(tStr => {
      const t = parseInt(tStr);
      const baseNumbers = terminals[t];
      const neighborCount = t >= 7 ? 2 : 1;
      const allNumbers = [...new Set([...baseNumbers, ...baseNumbers.flatMap(n => getCorrectNeighbors(n, neighborCount))])];
      terminalCounts[t].hitCount = recentHistory.filter(num => allNumbers.includes(num)).length;
    });
    const sorted = Object.entries(terminalCounts).map(([t, data]) => ({ terminal: parseInt(t), ...data })).filter(t => t.count > 0).sort((a, b) => b.hitCount - a.hitCount);
    const best = sorted[0];
    let bestStrategy = null;
    if (best) {
      let confidence = (best.hitCount / (recentHistory.length || 1)) * 250;
      if (best.positions.includes(0)) confidence += 35;
      confidence = Math.min(confidence, 95);
      if (confidence >= 70) bestStrategy = { terminal: best.terminal, confidence };
    }
    return { topTerminals: sorted, bestStrategy };
  }, [numberHistory, getCorrectNeighbors]);

  const geometricAnalysis = useMemo(() => {
    const perf: Record<string, { activations: number, hits: number, hitDetails: { round: number, number: number }[] }> = {};
    Object.keys(geometricPatterns).forEach(id => perf[id] = { activations: 0, hits: 0, hitDetails: [] });
    const rev = [...numberHistory].reverse();
    for (let i = 0; i < rev.length - 1; i++) {
      const trigger = rev[i + 1];
      Object.entries(geometricPatterns).forEach(([id, pattern]) => {
        if (pattern.numbers.includes(trigger)) {
          perf[id].activations++;
          const nbrCount = (id.includes('line') || id.includes('square_1')) ? 1 : 2;
          const all = [...new Set([...pattern.numbers, ...pattern.numbers.flatMap(num => getCorrectNeighbors(num, nbrCount))])];
          for (let j = 1; j <= 3; j++) {
            if (i - (j - 1) < 0) break;
            const next = rev[i - (j - 1)];
            if (all.includes(next)) {
              perf[id].hits++;
              perf[id].hitDetails.push({ round: j, number: next });
              break;
            }
          }
        }
      });
    }
    return Object.entries(perf).map(([id, data]) => {
      const p = geometricPatterns[id];
      const hitRate = data.activations > 0 ? (data.hits / data.activations) * 100 : 0;
      const firstRoundHits = data.hitDetails.filter(d => d.round === 1).length;
      const firstRoundHitRate = data.activations > 0 ? (firstRoundHits / data.activations) * 100 : 0;
      const lastHitIdx = numberHistory.findIndex(n => p.numbers.includes(n));
      const isHot = lastHitIdx !== -1 && lastHitIdx < 8;
      let confidence = (hitRate + firstRoundHitRate) / 2 + (isHot ? 20 : 0);
      return { patternId: id, name: p.name, numbers: p.numbers, color: p.color, activations: data.activations, hitCount: data.hits, hitRate, hitDetails: data.hitDetails, isHot, confidence: Math.min(confidence, 95) };
    }).sort((a, b) => {
      const aFirst = a.activations > 0 ? (a.hitDetails.filter(d => d.round === 1).length / a.activations) : 0;
      const bFirst = b.activations > 0 ? (b.hitDetails.filter(d => d.round === 1).length / b.activations) : 0;
      return bFirst - aFirst || b.hitRate - a.hitRate;
    });
  }, [numberHistory, getCorrectNeighbors]);

  const casasAnalysis = useMemo((): CasasAnalysisResult => {
    const res: CasasAnalysisResult = { stats: {}, patterns: { parImpar: { alternating: 0, repeating: 0, trend: 'none' }, altoBaixo: { alternating: 0, repeating: 0, trend: 'none' } }, bestSignal: null };
    if (numberHistory.length < 10) return res;
    const history = numberHistory.slice(0, 50);
    ["0", "10", "20", "30"].forEach(c => {
      res.stats[c] = { count: history.filter(n => getNumberCasa(n) === c).length, percentage: 0, lastPos: null, isHot: false, isCold: false };
    });
    history.forEach((num, index) => {
      const casa = getNumberCasa(num);
      if (casa && res.stats[casa].lastPos === null) res.stats[casa].lastPos = index;
    });
    Object.keys(res.stats).forEach(c => {
      res.stats[c].percentage = (res.stats[c].count / history.length) * 100;
      if (res.stats[c].lastPos !== null) {
        res.stats[c].isHot = res.stats[c].lastPos! < 8;
        res.stats[c].isCold = res.stats[c].lastPos! >= 15;
      }
    });
    const numberScores: Record<number, number> = {};
    for (let i = 0; i <= 36; i++) numberScores[i] = 0;
    history.forEach((num, index) => {
      numberScores[num] += (50 - index) * 0.1;
      numberScores[num] += history.filter(n => n === num).length * 1.5;
    });
    const lastNum = history[0];
    for (let i = 1; i <= 36; i++) {
      if ((history.length > 5) && (i % 2 === lastNum % 2)) numberScores[i] += 10;
    }
    const sorted = Object.entries(numberScores).sort(([, a], [, b]) => b - a).map(([n]) => parseInt(n));
    res.bestSignal = { confidence: 85, numbers: sorted.slice(0, 7), reasoning: "Confluência de frequência e padrões ativos." };
    return res;
  }, [numberHistory, getNumberCasa]);

  const pelayoAnalysis = useMemo((): PelayoAnalysisResult => {
    const history = numberHistory.slice(0, 50);
    if (history.length < 20) return { regions: [], bestSignal: null };
    
    const regStats: any[] = Object.keys(regions).map(name => {
      const regionNumbers = regions[name];
      const count = history.filter(n => regionNumbers.includes(n)).length;
      const lastHit = history.findIndex(n => regionNumbers.includes(n));
      const percentage = (count / history.length) * 100;
      
      const anchorCounts = regionNumbers.map(n => ({ 
        number: n, 
        count: history.filter(h => h === n).length 
      })).sort((a,b) => b.count - a.count);
      
      return { name, count, percentage, lastHit: lastHit !== -1 ? lastHit : null, status: 'Normal', anchorNumbers: anchorCounts };
    });

    regStats.forEach(r => {
      if (r.percentage > 35) r.status = 'Dominante';
      else if (r.lastHit !== null && r.lastHit > 15) r.status = 'Atrasado';
    });

    const sortedRegs = [...regStats].sort((a, b) => b.percentage - a.percentage);
    const bestReg = sortedRegs[0];

    const lastNum = history[0];
    const sequencePullers: number[] = [];
    for (let i = 0; i < history.length - 1; i++) {
        if (history[i+1] === lastNum) sequencePullers.push(history[i]);
    }
    const pullerFreq: Record<number, number> = {};
    sequencePullers.forEach(p => pullerFreq[p] = (pullerFreq[p] || 0) + 1);
    const topPullers = Object.entries(pullerFreq).sort((a,b) => b[1] - a[1]).map(([n]) => parseInt(n));

    let bestSignal = null;
    if (bestReg) {
      const n1 = bestReg.anchorNumbers[0]?.number;
      const pullerInRegion = topPullers.find(p => regions[bestReg.name].includes(p) && p !== n1);
      const n2 = pullerInRegion || bestReg.anchorNumbers.find(a => a.number !== n1)?.number || wheelSequence[2];
      
      const finalNums = [...new Set([
        n1, ...getCorrectNeighbors(n1, 1),
        n2, ...getCorrectNeighbors(n2, 1)
      ])];

      bestSignal = { 
        confidence: 90, 
        numbers: finalNums, 
        reasoning: `Anchors:${n1},${n2}` 
      };
    }

    return { regions: regStats, bestSignal };
  }, [numberHistory, getCorrectNeighbors]);

  const frequentNumbers = useMemo(() => {
    if (numberHistory.length === 0) return [];
    const counts: Record<number, number> = {};
    numberHistory.forEach(n => counts[n] = (counts[n] || 0) + 1);
    return Object.entries(counts)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [numberHistory]);

  const getSubFrequencies = useCallback((targetNumbers: number[]) => {
    const counts: Record<number, number> = {};
    targetNumbers.forEach(n => {
      counts[n] = numberHistory.filter(h => h === n).length;
    });
    return Object.entries(counts)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .filter(f => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [numberHistory]);

  const generateSignals = useCallback(() => {
    if (numberHistory.length < 5) return;
    if (!currentMainRef.current && terminalAnalysis.bestStrategy) {
      const { terminal, confidence } = terminalAnalysis.bestStrategy;
      const neighborCount = terminal >= 7 ? 2 : 1;
      const base = terminals[terminal], final = [...new Set([...base, ...base.flatMap(n => getCorrectNeighbors(n, neighborCount))])];
      const sig: MainRobotSignal = { id: `m-${Date.now()}`, timestamp: new Date(), terminal, strategy: `Terminal Quente: (${terminal} + ${neighborCount}V)`, confidence, baseNumbers: base, numbers: final, result: "pending", validityRounds: 3, roundsLeft: 3, testedRounds: [], color: "blue" };
      setCurrentMainSignal(sig); setMainRobotSignals(prev => [sig, ...prev]);
    }
    const bestGeo = geometricAnalysis[0];
    const geoRate = bestGeo?.activations > 0 ? (bestGeo.hitDetails.filter(d => d.round === 1).length / bestGeo.activations) * 100 : 0;
    if (!currentGeoRef.current && bestGeo && geoRate >= 45) {
      // Fix: Error on line 286: Cannot find name 'id'. Replaced with bestGeo.patternId.
      const nbr = (bestGeo.patternId.includes('line') || bestGeo.patternId.includes('square_1')) ? 1 : 2;
      const final = [...new Set([...bestGeo.numbers, ...bestGeo.numbers.flatMap(n => getCorrectNeighbors(n, nbr))])];
      const sig: GeometricPatternSignal = { id: `g-${Date.now()}`, timestamp: new Date(), patternId: bestGeo.patternId, patternName: bestGeo.name, predictedNumbers: final, strategy: `Padrão: ${bestGeo.name} + ${nbr}V)`, confidence: bestGeo.confidence, baseNumbers: bestGeo.numbers, result: "pending", validityRounds: 3, roundsLeft: 3, testedRounds: [], reasoning: `Confirmação de 1ª rodada`, color: "yellow" };
      setCurrentGeometricSignal(sig); setGeometricSignals(prev => [sig, ...prev]);
    }
    if (numberHistory.length >= 10 && !currentCasasRef.current && casasAnalysis.bestSignal) {
      const sig: CasasRobotSignal = { ...casasAnalysis.bestSignal, id: `c-${Date.now()}`, timestamp: new Date(), casa: "Confluência", strategy: "Análise de Casas", result: "pending", validityRounds: 5, roundsLeft: 5, testedRounds: [], color: "purple", baseNumbers: casasAnalysis.bestSignal.numbers, numbers: casasAnalysis.bestSignal.numbers };
      setCurrentCasasSignal(sig); setCasasSignals(prev => [sig, ...prev]);
    }
    if (numberHistory.length >= 20 && !currentPelayoRef.current && pelayoAnalysis.bestSignal) {
      const anchorMatch = pelayoAnalysis.bestSignal.reasoning.match(/Anchors:(\d+),(\d+)/);
      const n1 = anchorMatch ? anchorMatch[1] : pelayoAnalysis.bestSignal.numbers[0];
      const n2 = anchorMatch ? anchorMatch[2] : pelayoAnalysis.bestSignal.numbers[Math.floor(pelayoAnalysis.bestSignal.numbers.length / 2)];
      
      const sig: PelayoRobotSignal = { 
        ...pelayoAnalysis.bestSignal, 
        id: `p-${Date.now()}`, 
        timestamp: new Date(), 
        strategy: `Pelayo Inteligente (${n1} ${n2} + 1v)`, 
        result: "pending", 
        validityRounds: 5, 
        roundsLeft: 5, 
        testedRounds: [], 
        color: "green", 
        baseNumbers: pelayoAnalysis.bestSignal.numbers,
        numbers: pelayoAnalysis.bestSignal.numbers 
      };
      setCurrentPelayoSignal(sig); setPelayoSignals(prev => [sig, ...prev]);
    }
  }, [numberHistory, terminalAnalysis, geometricAnalysis, casasAnalysis, pelayoAnalysis, getCorrectNeighbors]);

  useEffect(() => { generateSignals(); }, [generateSignals]);

  const addNumbers = (directNums?: number[]) => {
    const nums = directNums || inputNumbers.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 36);
    if (!nums.length) return;
    const final = reverseOrder ? [...nums].reverse() : nums;
    let history = [...numberHistory];
    final.forEach(num => {
      const check = (cur: any, set: any, histSetter: any) => {
        if (!cur || cur.result !== "pending") return cur;
        const targets = cur.numbers || cur.predictedNumbers || cur.baseNumbers;
        const isWin = targets.includes(num);
        const newTested = [...(cur.testedRounds || []), num];
        const next = { ...cur, roundsLeft: cur.roundsLeft - 1, testedRounds: newTested };
        if (isWin || next.roundsLeft <= 0) {
          const res = { ...next, result: isWin ? "win" : "loss", winRound: isWin ? newTested.length : undefined };
          histSetter((prev: any[]) => prev.map(s => s.id === res.id ? res : s));
          set(null); return null;
        }
        set(next); histSetter((prev: any[]) => prev.map(s => s.id === next.id ? next : s)); return next;
      };
      check(currentMainRef.current, setCurrentMainSignal, setMainRobotSignals);
      check(currentGeoRef.current, setCurrentGeometricSignal, setGeometricSignals);
      check(currentCasasRef.current, setCurrentCasasSignal, setCasasSignals);
      check(currentPelayoRef.current, setCurrentPelayoSignal, setPelayoSignals);
      history = [num, ...history];
    });
    setNumberHistory(history); setInputNumbers("");
  };

  const removeLastNumber = () => {
    if (numberHistory.length === 0) return;
    setNumberHistory(prev => prev.slice(1));
  };

  const PerformanceDashboard = ({ signals, tabId }: { signals: any[], tabId: string }) => {
    const total = signals.length;
    const wins = signals.filter(s => s.result === 'win').length;
    const losses = signals.filter(s => s.result === 'loss').length;
    const rate = total > 0 ? ((wins / total) * 100).toFixed(0) : "0";
    const roundsCount = (tabId === 'casas' || tabId === 'pelayo') ? 5 : 3;

    return (
      <div className="bg-slate-800/40 rounded-xl p-2.5 border border-white/10 space-y-2 shadow-lg">
        <div className="flex items-center gap-2 ml-1">
          <BarChart3 className="w-3.5 h-3.5 text-white/70" />
          <span className="text-[10px] font-black uppercase text-white/80 tracking-widest">Performance do Robô</span>
        </div>
        
        <div className="bg-slate-900/80 rounded-xl p-3 grid grid-cols-4 gap-2 border border-white/5 shadow-inner">
          <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-none">
            <span className="text-xl font-black text-white leading-none mb-1">{total}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Sinais</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-none">
            <span className="text-xl font-black text-green-500 leading-none mb-1">{wins}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Acertos</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-none">
            <span className="text-xl font-black text-orange-500 leading-none mb-1">{losses}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Erros</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-white/5 last:border-none">
            <span className="text-xl font-black text-purple-400 leading-none mb-1">{rate}%</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Precisão</span>
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-3 grid grid-cols-5 gap-2 border border-white/5 shadow-inner">
          {Array.from({ length: 5 }).map((_, i) => {
            const count = signals.filter(s => s.result === 'win' && s.winRound === (i + 1)).length;
            const isVisible = i < roundsCount;
            return (
              <div key={i} className={`flex flex-col items-center justify-center transition-opacity ${isVisible ? 'opacity-100' : 'opacity-10'}`}>
                <span className="text-lg font-black text-green-400 leading-none mb-1">{count}</span>
                <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">{i + 1}º</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const WheelSVG = ({ signalNumbers = [], color = "blue" }: { signalNumbers?: number[], color?: string }) => {
    const getWheelColor = (n: number) => {
      if (n === 0) return "fill-green-600";
      const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return reds.includes(n) ? "fill-red-600" : "fill-slate-950";
    };
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <svg viewBox="0 0 300 300" className="w-full h-full max-h-[460px] max-w-[460px] drop-shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-visible">
          <circle cx="150" cy="150" r="148" className="fill-slate-800 stroke-slate-700 stroke-2" />
          {wheelSequence.map((num, i) => {
            const angle = (360 / 37) * i - 90;
            const startRad = (angle * Math.PI) / 180, endRad = ((angle + 360 / 37) * Math.PI) / 180;
            const x1 = 150 + 140 * Math.cos(startRad), y1 = 150 + 140 * Math.sin(startRad);
            const x2 = 150 + 140 * Math.cos(endRad), y2 = 150 + 140 * Math.sin(endRad);
            const isSelected = signalNumbers.includes(num);
            const fill = isSelected ? (color === 'blue' ? 'fill-blue-500' : color === 'yellow' ? 'fill-yellow-500' : 'fill-green-500') : getWheelColor(num);
            return (
              <g key={num} className="cursor-pointer group/num" onClick={() => addNumbers([num])}>
                <path 
                  d={`M 150,150 L ${x1},${y1} A 140,140 0 0,1 ${x2},${y2} Z`} 
                  className={`${fill} stroke-slate-800/40 stroke-1 transition-all duration-300 ${isSelected ? 'animate-pulse' : 'hover:brightness-125'}`} 
                />
                <text 
                  x={150 + 118 * Math.cos(startRad + (endRad - startRad) / 2)} 
                  y={150 + 118 * Math.sin(startRad + (endRad - startRad) / 2)} 
                  fill="white" 
                  fontSize="12" 
                  fontWeight="900" 
                  textAnchor="middle" 
                  className="pointer-events-none"
                  transform={`rotate(${angle + 90 + 360 / 74}, ${150 + 118 * Math.cos(startRad + (endRad - startRad) / 2)}, ${150 + 118 * Math.sin(startRad + (endRad - startRad) / 2)})`}
                >
                  {num}
                </text>
              </g>
            );
          })}
          <circle cx="150" cy="150" r="48" className="fill-slate-700/90 stroke-white/5" />
        </svg>
      </div>
    );
  };

  const ExpandedRouletteTable = ({ signalNumbers = [] }: { signalNumbers?: number[] }) => {
    const rows = [[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]];
    const getBg = (n: number) => {
      if (n === 0) return "bg-green-700";
      const realReds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return realReds.includes(n) ? "bg-red-700" : "bg-slate-950";
    };
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full flex gap-1 h-full max-h-[190px] bg-slate-950 p-3 rounded-xl border border-white/10 shadow-2xl">
          <div onClick={() => addNumbers([0])} className={`w-14 flex items-center justify-center text-3xl font-black rounded-l-lg cursor-pointer border border-white/5 ${getBg(0)} ${signalNumbers.includes(0) ? 'ring-4 ring-purple-500 scale-105 z-10' : 'text-white'}`}>0</div>
          <div className="flex-1 grid grid-cols-12 gap-1.5">
            {Array.from({ length: 12 }).map((_, col) => (
              <div key={col} className="grid grid-rows-3 gap-1.5">
                {rows.map((row) => {
                  const n = row[col];
                  const isS = signalNumbers.includes(n);
                  return (
                    <div key={n} onClick={() => addNumbers([n])} className={`flex items-center justify-center font-black text-[13px] cursor-pointer border border-white/5 rounded-md transition-all ${getBg(n)} ${isS ? 'ring-4 ring-purple-500 scale-110 z-20 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'text-white'}`}>{n}</div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const IntelligenceMetricCard = ({ title, percentage, status, lastHit, colorClass = "bg-blue-500", topNumbers = [] }: any) => {
    return (
      <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3.5 mb-3 hover:bg-slate-800/60 transition-all relative overflow-hidden group shadow-md">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${colorClass}`} />
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase text-white flex items-center gap-1.5">
              {status === 'Quente' ? <Flame className="w-3.5 h-3.5 text-orange-500" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
              {title}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Atraso: <span className={lastHit > 10 ? 'text-red-400' : 'text-slate-300'}>{lastHit === null ? '0' : lastHit} rds</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-white">{percentage.toFixed(0)}%</span>
              {percentage > 30 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-slate-600" />}
            </div>
            <Badge className={`text-[8px] font-black uppercase mt-1 px-2 py-0.5 ${status === 'Quente' || status === 'Dominante' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{status}</Badge>
          </div>
        </div>
        
        {/* Tendência de Números Específicos do Card */}
        {topNumbers.length > 0 && (
          <div className="flex items-center gap-2 mb-3 bg-slate-900/50 p-1.5 rounded-lg border border-white/5">
            <TrendingUp className="w-3 h-3 text-slate-500" />
            <div className="flex gap-1.5">
              {topNumbers.map((n: any) => (
                <div key={n.number} className="flex items-center gap-0.5">
                  <span className={`text-[9px] font-black px-1 rounded ${getNumberColorClass(n.number)} text-white`}>{n.number}</span>
                  <span className="text-[8px] font-bold text-slate-500">{n.count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full ${colorClass} transition-all duration-1000 group-hover:brightness-125`} style={{ width: `${Math.min(percentage * 2, 100)}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 p-2 overflow-hidden flex flex-col gap-2 font-sans">
      <div className="flex items-center justify-between bg-slate-900 border border-white/10 p-3 rounded-2xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg ring-1 ring-white/10"><Bot className="w-5.5 h-5.5 text-white" /></div>
          <div>
            <h1 className="text-[15px] font-black uppercase tracking-tighter text-white leading-none">Roulette IA Analyst Pro</h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Sinais com Acompanhamento em Tempo Real</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Input value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="Inserir..." onKeyDown={e => e.key === "Enter" && addNumbers()} className="w-28 h-10 text-xs bg-slate-800 border-white/10 font-black text-center" />
          <Button onClick={() => setReverseOrder(!reverseOrder)} variant={reverseOrder ? "primary" : "outline"} className="h-10 px-4 text-[10px] font-black uppercase rounded-xl"> {reverseOrder ? "Inverter" : "Direto"}</Button>
          <Button onClick={() => addNumbers()} className="h-10 px-5 text-[10px] font-black uppercase rounded-xl bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.3)]"><Target className="w-3.5 h-3.5 mr-2" /> Analisar</Button>
          <Button onClick={removeLastNumber} variant="outline" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/10"><Undo2 className="w-3.5 h-3.5 mr-1" /> Apagar</Button>
          <Button onClick={() => { setNumberHistory([]); setMainRobotSignals([]); setGeometricSignals([]); setCasasSignals([]); setPelayoSignals([]); }} variant="destructive" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl">Limpar</Button>
          <Button onClick={toggleFullscreen} variant="outline" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-white/10 text-white hover:bg-white/5">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        <Card className="col-span-3 bg-slate-900/50 border-white/5 flex flex-col overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-3.5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between shrink-0">
            <span className="text-[12px] font-black uppercase text-slate-300 flex items-center gap-2.5">
              <History className="w-4.5 h-4.5 text-purple-400" /> Histórico ({numberHistory.length})
            </span>
            <Badge className="bg-slate-950 text-white border border-white/10 text-[9px] px-2.5 py-0.5 font-black uppercase">ATIVO</Badge>
          </div>
          <div className="p-3 bg-slate-900 border-b border-white/10 flex gap-2.5 shadow-inner">
            <Select value={colorFilter} onValueChange={(val: any) => { setColorFilter(val); setSubColorFilter("all"); }} className="flex-1 h-9 text-[10px] font-black bg-slate-950 border-white/10 cursor-pointer">
              <option value="casas">Filtro: Casas</option>
              <option value="terminais">Filtro: Terminais</option>
              <option value="geometricos">Filtro: Geométricos</option>
            </Select>
            {colorFilter !== "casas" && (
              <Select value={subColorFilter} onValueChange={(val: any) => setSubColorFilter(val)} className="flex-1 h-9 text-[10px] font-black bg-slate-950 border-white/10 cursor-pointer">
                <option value="all">Todos</option>
                {colorFilter === "terminais" ? Object.keys(terminals).map(t => <option key={t} value={t}>Terminal {t}</option>) : Object.entries(geometricPatterns).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}
              </Select>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-950/20">
            <div className="grid grid-cols-10 gap-1.5">
              {numberHistory.map((n, i) => (
                <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-black border border-white/5 transition-all duration-300 shadow-sm ${(() => {
                  if (colorFilter === "casas") {
                    if (n === 0) return "bg-green-600";
                    if (casas["0"].includes(n)) return "bg-purple-600 shadow-[0_0_5px_rgba(147,51,234,0.3)]";
                    if (casas["10"].includes(n)) return "bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.3)]";
                    if (casas["20"].includes(n)) return "bg-emerald-600 shadow-[0_0_5px_rgba(5,150,105,0.3)]";
                    if (casas["30"].includes(n)) return "bg-rose-600 shadow-[0_0_5px_rgba(225,29,72,0.3)]";
                    return getNumberColorClass(n);
                  }
                  if (colorFilter === "geometricos") {
                    if (n === 0) return "bg-green-600";
                    const checkMatch = (id: string, p: any) => {
                      const nbrCount = (id.includes('line') || id.includes('square_1')) ? 1 : 2;
                      const all = [...new Set([...p.numbers, ...p.numbers.flatMap((num: number) => getCorrectNeighbors(num, nbrCount))])];
                      return all.includes(n);
                    };
                    const isMatch = subColorFilter === "all" 
                      ? Object.entries(geometricPatterns).some(([id, p]) => checkMatch(id, p)) 
                      : geometricPatterns[subColorFilter] ? checkMatch(subColorFilter, geometricPatterns[subColorFilter]) : false;
                    return isMatch ? "bg-yellow-500 text-slate-950 ring-2 ring-yellow-400/50" : getNumberColorClass(n);
                  }
                  if (colorFilter === "terminais") {
                    if (n === 0) return "bg-green-600";
                    const checkMatchT = (tStr: string) => {
                      const t = parseInt(tStr);
                      const base = terminals[t];
                      const nbr = t >= 7 ? 2 : 1;
                      const all = [...new Set([...base, ...base.flatMap(num => getCorrectNeighbors(num, nbr))])];
                      return all.includes(n);
                    };
                    const isMatch = subColorFilter === "all" ? true : checkMatchT(subColorFilter);
                    return isMatch ? "bg-blue-600 ring-1 ring-blue-400/30" : getNumberColorClass(n);
                  }
                  return getNumberColorClass(n);
                })()}`}>{n}</div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="col-span-6 bg-slate-900 border-white/10 flex flex-col overflow-hidden relative shadow-2xl rounded-2xl">
          <div className="flex bg-slate-950 p-2 gap-2 border-b border-white/10 shrink-0">
            {[{ id: 'main', icon: Bot, label: 'Terminais' }, { id: 'geo', icon: Shapes, label: 'Geométricos' }, { id: 'pelayo', icon: Group, label: 'Pelayo' }, { id: 'casas', icon: Landmark, label: 'Casas' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all border ${activeTab === tab.id ? 'bg-slate-800 border-white/20 shadow-lg text-white' : 'border-transparent opacity-40 hover:opacity-60 text-slate-400'}`}>
                <tab.icon className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <PerformanceDashboard signals={activeTab === 'main' ? mainRobotSignals : activeTab === 'geo' ? geometricSignals : activeTab === 'casas' ? casasSignals : pelayoSignals} tabId={activeTab} />
              
              <div className="bg-slate-950/90 border border-white/10 rounded-xl p-3.5 flex flex-col justify-center shadow-inner relative overflow-hidden group">
                {(() => {
                  const sig: any = activeTab === 'main' ? currentMainSignal : activeTab === 'geo' ? currentGeometricSignal : activeTab === 'casas' ? currentCasasSignal : currentPelayoSignal;
                  const bg = { blue: 'bg-blue-600', yellow: 'bg-yellow-500', green: 'bg-green-600', purple: 'bg-purple-600' }[sig?.color as string || 'blue'];
                  return sig ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-black uppercase text-white tracking-tight truncate max-w-[70%]">{sig.strategy}</span>
                        <Badge className={`${bg} text-white font-black text-[10px] py-0.5 px-3 ring-1 ring-white/20 shrink-0`}>{sig.confidence.toFixed(0)}% CONF.</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase shrink-0">Rodadas:</span>
                        <div className="flex flex-wrap gap-1">
                          {sig.testedRounds && sig.testedRounds.length > 0 ? (
                            sig.testedRounds.map((rn: number, idx: number) => (
                              <div key={idx} className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white ${getNumberColorClass(rn)} shadow-md border border-white/5`}>
                                {rn}
                              </div>
                            ))
                          ) : (
                            <span className="text-[8px] font-bold text-slate-700 uppercase italic">Aguardando 1ª...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-3 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Zap className="w-5 h-5 animate-pulse text-purple-400" />
                      <span className="text-[9px] font-black uppercase mt-2 tracking-widest">Sincronizando Mercado...</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-slate-950/30 rounded-[2.5rem] border border-white/5 shadow-inner relative group/race">
               {activeTab === 'casas' ? (
                 <ExpandedRouletteTable signalNumbers={currentCasasSignal?.numbers || []} />
               ) : (
                 <WheelSVG 
                    signalNumbers={(() => {
                      if (activeTab === 'main' && currentMainSignal) return currentMainSignal.numbers;
                      if (activeTab === 'geo' && currentGeometricSignal) return currentGeometricSignal.predictedNumbers;
                      if (activeTab === 'pelayo' && currentPelayoSignal) return currentPelayoSignal.numbers;
                      return [];
                    })()} 
                    color={activeTab === 'main' ? 'blue' : activeTab === 'geo' ? 'yellow' : 'green'} 
                 />
               )}
            </div>
          </div>
        </Card>

        <Card className="col-span-3 bg-slate-900/50 border-white/5 flex flex-col overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-4 border-b border-white/10 bg-slate-900/80 flex items-center gap-3 shrink-0">
            <BarChart3 className="w-5.5 h-5.5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[12px] font-black uppercase text-white leading-none tracking-tight">Market Intelligence</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Análise de Tendências</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar bg-slate-950/20">
            {/* Listagem detalhada com frequências sub-categoriais */}
            {activeTab === 'main' && terminalAnalysis.topTerminals.map(t => (
              <IntelligenceMetricCard 
                key={t.terminal} 
                title={`Terminal ${t.terminal}`} 
                percentage={(t.hitCount / (Math.min(numberHistory.length, 50) || 1)) * 100} 
                status={t.positions[0] < 5 ? "Quente" : "Normal"} 
                lastHit={t.positions[0] === -1 ? 0 : t.positions[0]} 
                colorClass="bg-blue-500"
                topNumbers={getSubFrequencies(terminals[t.terminal])}
              />
            ))}
            {activeTab === 'geo' && geometricAnalysis.map(p => (
              <IntelligenceMetricCard 
                key={p.patternId} 
                title={p.name} 
                percentage={p.hitRate} 
                status={p.isHot ? "Quente" : "Normal"} 
                lastHit={numberHistory.findIndex(n => p.numbers.includes(n))} 
                colorClass="bg-yellow-500"
                topNumbers={getSubFrequencies(p.numbers)}
              />
            ))}
            {activeTab === 'casas' && Object.entries(casasAnalysis.stats).map(([k, v]: [string, any]) => (
              <IntelligenceMetricCard 
                key={k} 
                title={`Dezenas de ${k}`} 
                percentage={v.percentage} 
                status={v.isHot ? "Quente" : "Normal"} 
                lastHit={v.lastPos} 
                colorClass="bg-purple-500"
                topNumbers={getSubFrequencies(casas[k])}
              />
            ))}
            {activeTab === 'pelayo' && pelayoAnalysis.regions.map(r => (
              <IntelligenceMetricCard 
                key={r.name} 
                title={`${r.name}`} 
                percentage={r.percentage} 
                status={r.status} 
                lastHit={r.lastHit} 
                colorClass="bg-green-500"
                topNumbers={getSubFrequencies(regions[r.name])}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default App;
