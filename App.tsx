
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  Bot, Target, History, Shapes, Landmark, Group, Zap, BarChart3, Flame, Activity,
  Clock, CheckCircle2, Gauge, ArrowUpRight, ArrowDownRight, TrendingUp, Undo2, Award,
  Maximize, Minimize, Wallet, TrendingDown, XCircle, Minus, ChevronUp, DollarSign, PieChart,
  ArrowRightLeft, Compass, RefreshCw, ArrowRight, Calculator, Coins, Dices, Lock, User, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Card, Button, Badge, Input, Select 
} from "./components/UI";
import { 
  wheelSequence, terminals, geometricPatterns, regions, casas, STRATEGY_COLORS, mascaradosGroups, wheelZones, nineForces, resetters,
  tierNumbers, orfaoNumbers, voisinsNumbers, zeroGameNumbers, puxamNumbersA, puxamNumbersB, triangle1Base, triangle2Base
} from "./constants";
import { 
  NumberEntry, MainRobotSignal, GeometricPatternSignal, CasasRobotSignal, PelayoRobotSignal, 
  CasasAnalysisResult, PelayoAnalysisResult, ColorFilterType, TerminalAnalysisResult, GeometricPatternAnalysis,
  MascaradosRobotSignal, MascaradosAnalysisResult, GPSRobotSignal, GPSAnalysisResult,
  TriangulacaoRobotSignal, TriangulacaoAnalysisResult, EscadinhaRobotSignal, EscadinhaAnalysisResult
} from "./types";

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getNumberColorClass = (n: number) => {
  if (n === 0) return "bg-green-600";
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(n) ? "bg-red-600" : "bg-slate-950";
};

const getTerminalColor = (n: number) => {
  if (n === 0) return "bg-green-600";
  const t = n % 10;
  const colors: Record<number, string> = {
    0: "bg-red-600",
    1: "bg-blue-600",
    2: "bg-emerald-600",
    3: "bg-yellow-600",
    4: "bg-purple-600",
    5: "bg-orange-600",
    6: "bg-pink-600",
    7: "bg-cyan-600",
    8: "bg-indigo-600",
    9: "bg-rose-600"
  };
  return colors[t] || "bg-slate-900";
};

const getMascaradoGroupColor = (m: string | number) => {
  const colors: Record<string, string> = {
    "0": "bg-orange-600 shadow-[0_0_5px_rgba(234,88,12,0.4)]",
    "1": "bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.4)]",
    "2": "bg-emerald-600 shadow-[0_0_5px_rgba(16,185,129,0.4)]",
    "3": "bg-yellow-600 shadow-[0_0_5px_rgba(202,138,4,0.4)]",
    "4": "bg-purple-600 shadow-[0_0_5px_rgba(147,51,234,0.4)]",
    "5": "bg-rose-600 shadow-[0_0_5px_rgba(225,29,72,0.4)]",
    "6": "bg-pink-600 shadow-[0_0_5px_rgba(219,39,119,0.4)]",
    "7": "bg-cyan-600 shadow-[0_0_5px_rgba(8,145,178,0.4)]",
    "8": "bg-indigo-600 shadow-[0_0_5px_rgba(79,70,229,0.4)]",
    "9": "bg-amber-600 shadow-[0_0_5px_rgba(217,119,6,0.4)]"
  };
  return colors[m.toString()] || "bg-slate-900";
};

const getNumberSection = (num: number) => {
  if (zeroGameNumbers.includes(num)) return "Zero";
  if (voisinsNumbers.includes(num)) return "Vois";
  if (tierNumbers.includes(num)) return "Tiers";
  if (orfaoNumbers.includes(num)) return "Orph";
  return "---";
};

const BetCalculator: React.FC<{ 
  numbers: number[], 
  chipValue: number, 
  setChipValue: (v: number) => void,
  martingale: boolean,
  setMartingale: (v: boolean) => void,
  totalProfit: number,
  initialBankroll: number,
  setInitialBankroll: (v: number) => void
}> = ({ numbers, chipValue, setChipValue, martingale, setMartingale, totalProfit, initialBankroll, setInitialBankroll }) => {
  const uniqueNumbers = [...new Set(numbers)];
  const totalChips = uniqueNumbers.length;
  const initialCost = totalChips * chipValue;
  
  const chipOptions = [0.50, 1, 2.50, 5, 10, 25, 125];
  const currentTotal = initialBankroll + totalProfit;
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [tempBank, setTempBank] = useState(initialBankroll.toString());

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-xl p-2 mt-2 space-y-2 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <div className="flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px] font-black text-white uppercase tracking-wider">Calculadora & Banca</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMartingale(!martingale)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all ${martingale ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-500'}`}
          >
            <RefreshCw className={`w-2.5 h-2.5 ${martingale ? 'animate-spin-slow' : ''}`} />
            <span className="text-[7px] font-black uppercase">Martingale</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Lado Esquerdo: Simulador */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <span className="text-[7px] font-bold text-slate-500 uppercase">Valor Ficha</span>
            <div className="grid grid-cols-4 gap-1">
              {chipOptions.slice(0, 4).map(v => (
                <button
                  key={v}
                  onClick={() => setChipValue(v)}
                  className={`h-5 rounded border text-[8px] font-black transition-all ${chipValue === v ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                >
                  {v < 1 ? `0,${(v*100).toString().padStart(2, '0')}` : v}
                </button>
              ))}
              {chipOptions.slice(4).map(v => (
                <button
                  key={v}
                  onClick={() => setChipValue(v)}
                  className={`h-5 rounded border text-[8px] font-black transition-all ${chipValue === v ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900/50 p-1.5 rounded-lg border border-white/5">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[6px] text-slate-500 font-black uppercase">Entrada</span>
              <span className="text-[6px] font-bold text-slate-600">{totalChips} fichas</span>
            </div>
            <div className="text-[11px] font-black text-white">R$ {initialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            {martingale && (
              <div className="text-[7px] text-emerald-400 font-bold mt-0.5">Total: R$ {(initialCost * 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
          </div>
        </div>

        {/* Lado Direito: Banca */}
        <div className="bg-slate-900/30 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">Banca Atual</span>
              <button 
                onClick={() => {
                  if (isEditingBank) {
                    const val = parseFloat(tempBank);
                    if (!isNaN(val)) setInitialBankroll(val);
                    setIsEditingBank(false);
                  } else {
                    setTempBank(initialBankroll.toString());
                    setIsEditingBank(true);
                  }
                }}
                className="p-0.5 hover:bg-white/5 rounded"
              >
                {isEditingBank ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <RefreshCw className="w-2 h-2 text-slate-600" />}
              </button>
            </div>
            {isEditingBank ? (
              <Input 
                value={tempBank}
                onChange={(e) => setTempBank(e.target.value)}
                className="h-4 bg-slate-950 border-white/10 text-[9px] font-black text-white px-1"
                type="number"
                autoFocus
              />
            ) : (
              <span className="text-[12px] font-black text-white leading-none">R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            )}
          </div>

          <div className="border-t border-white/5 pt-1 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-[6px] text-slate-500 uppercase font-black tracking-tight">Lucro</span>
              <span className={`text-[8px] font-black ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-0.5 w-full bg-slate-800 rounded-full mt-0.5 overflow-hidden">
               <div 
                 className={`h-full ${totalProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                 style={{ width: `${Math.min(100, (Math.abs(totalProfit) / initialBankroll) * 100)}%` }} 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Se o admin tentar criar, apenas reforçamos que a gestão principal é no Console
      setMessage(`O acesso via e-mail deve ser gerenciado no Console do Firebase. Se o usuário "${newUsername}@signal-cortex.br" já existe lá, ele já pode tentar o login com a senha definida.`);
      setNewUsername("");
    } catch (err) {
      setMessage("Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white uppercase italic">Gerenciar Usuários</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400"><XCircle className="w-6 h-6" /></button>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <p className="text-[10px] font-bold text-blue-400 uppercase leading-relaxed">
            Como administrador, você pode criar novos acessos. 
            Recomendamos usar o Console do Firebase para gerenciar senhas com segurança máxima.
          </p>
          <a hred="https://console.firebase.google.com/" target="_blank" className="text-[10px] font-black text-white underline mt-2 block uppercase">Abrir Console Firebase</a>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Novo Usuário</label>
            <Input 
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="ex: joao"
              className="bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Provisória</label>
            <Input 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-950 border-white/5"
            />
          </div>
          <Button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-6 font-black uppercase text-xs">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Solicitar Criação"}
          </Button>
          {message && <p className="text-[10px] font-bold text-center text-slate-400 mt-4">{message}</p>}
        </form>
      </div>
    </div>
  );
};

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // If user enters just a username, we append a virtual domain to make it an email for Firebase Auth
      const loginEmail = email.includes('@') ? email : `${email}@signal-cortex.br`;
      await signInWithEmailAndPassword(auth, loginEmail, password);
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("Usuário não encontrado. Certifique-se de que o acesso foi criado no Console do Firebase.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Senha incorreta. Tente novamente.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Credenciais inválidas ou usuário inexistente.");
      } else {
        setError("Erro ao tentar entrar. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Background elements preserved */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 transform rotate-3">
              <Zap className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
              SIGNAL <span className="text-blue-500">CORTEX</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sistemas de Inteligência Preditiva</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário / Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-xs placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="Seu usuário ou email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 pl-10 pr-12 text-white text-xs placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-red-400">{error}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[11px] tracking-widest py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Entrar no Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2">Segurança Firebase Ativa</span>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Servidors Seguros</span>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          &copy; 2025 CORTEX PREDICTOR LTD.
        </p>
      </motion.div>
    </div>
  );
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<{ role: string, username: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, "users", user.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as any);
          } else {
            // Create default profile for any new authenticated user
            const username = user.email?.split('@')[0] || 'Usuário';
            const isMasterAdmin = user.email === 'henrique.geffe.89@gmail.com';
            const role = isMasterAdmin ? 'admin' : 'user';
            const newProfile = { role, username, email: user.email };
            
            try {
              // Tentamos criar o perfil no Firestore se for o primeiro login
              await setDoc(doc(db, "users", user.uid), newProfile);
              setUserProfile(newProfile);
            } catch (e) {
              console.warn("Profile auto-creation delayed or failed, using local state:", e);
              // Fallback para estado local para que o usuário não fique travado
              setUserProfile(newProfile);
            }
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Auth profile check failed:", error);
          // Fallback for any authenticated user to at least see the app
          setIsAuthenticated(true);
          setUserProfile({ role: 'user', username: user.email?.split('@')[0] || 'Usuário' });
        }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const [showUserManagement, setShowUserManagement] = useState(false);
  const [inputNumbers, setInputNumbers] = useState("");
  const [numberHistory, setNumberHistory] = useState<number[]>([]);
  const [reverseOrder, setReverseOrder] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [colorFilter, setColorFilter] = useState<ColorFilterType>("casas");
  const [subColorFilter, setSubColorFilter] = useState<string>("all");

  // Strategy-specific states for Calculator and Bankroll
  const [strategyConfigs, setStrategyConfigs] = useState<Record<string, {
    chipValue: number;
    martingale: boolean;
    initialBankroll: number;
    profit: number;
  }>>({
    main: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    geo: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    pelayo: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    casas: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    mascarados: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    gps: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    puxam: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    escadinha: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
    cavalos: { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 },
  });

  const updateStrategyConfig = (strategy: string, updates: Partial<typeof strategyConfigs[string]>) => {
    setStrategyConfigs(prev => ({
      ...prev,
      [strategy]: { ...prev[strategy] || { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 }, ...updates }
    }));
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [mainRobotSignals, setMainRobotSignals] = useState<MainRobotSignal[]>([]);
  const [currentMainSignal, setCurrentMainSignal] = useState<MainRobotSignal | null>(null);
  const [geometricSignals, setGeometricSignals] = useState<GeometricPatternSignal[]>([]);
  const [currentGeometricSignal, setCurrentGeometricSignal] = useState<GeometricPatternSignal | null>(null);
  const [casasSignals, setCasasSignals] = useState<CasasRobotSignal[]>([]);
  const [currentCasasSignal, setCurrentCasasSignal] = useState<CasasRobotSignal | null>(null);
  const [pelayoSignals, setPelayoSignals] = useState<PelayoRobotSignal[]>([]);
  const [currentPelayoSignal, setCurrentPelayoSignal] = useState<PelayoRobotSignal | null>(null);
  const [mascaradosSignals, setMascaradosSignals] = useState<MascaradosRobotSignal[]>([]);
  const [currentMascaradosSignal, setCurrentMascaradosSignal] = useState<MascaradosRobotSignal | null>(null);
  const [gpsSignals, setGpsSignals] = useState<GPSRobotSignal[]>([]);
  const [currentGpsSignal, setCurrentGpsSignal] = useState<GPSRobotSignal | null>(null);
  const [triangulacaoSignals, setTriangulacaoSignals] = useState<TriangulacaoRobotSignal[]>([]);
  const [currentTriangulacaoSignal, setCurrentTriangulacaoSignal] = useState<TriangulacaoRobotSignal | null>(null);
  const [escadinhaSignals, setEscadinhaSignals] = useState<EscadinhaRobotSignal[]>([]);
  const [currentEscadinhaSignal, setCurrentEscadinhaSignal] = useState<EscadinhaRobotSignal | null>(null);

  // Sync history filter with active tab and active signal
  useEffect(() => {
    const tabToFilterMap: Record<string, ColorFilterType> = {
      main: "terminais",
      geo: "geometricos",
      casas: "casas",
      mascarados: "mascarados",
      puxam: "triangulo",
      escadinha: "terminais_escadinha",
      pelayo: "casas",
      gps: "terminais"
    };

    if (tabToFilterMap[activeTab]) {
      const targetFilter = tabToFilterMap[activeTab];
      setColorFilter(targetFilter);
      
      let subFilter = "all";
      
      // Auto-select the active signal's strategy in history
      if (activeTab === "main") {
        if (currentMainSignal && currentMainSignal.result === "pending") {
          subFilter = currentMainSignal.terminal.toString();
        }
      } else if (activeTab === "geo") {
        if (currentGeometricSignal && currentGeometricSignal.result === "pending") {
          subFilter = currentGeometricSignal.patternId;
        }
      } else if (activeTab === "casas") {
        if (currentCasasSignal && currentCasasSignal.result === "pending") {
          const n = currentCasasSignal.baseNumbers[0];
          if (n !== undefined) {
             if (n < 10) subFilter = "0";
             else if (n < 20) subFilter = "10";
             else if (n < 30) subFilter = "20";
             else subFilter = "30";
          }
        }
      } else if (activeTab === "mascarados") {
        if (currentMascaradosSignal && currentMascaradosSignal.result === "pending") {
          subFilter = currentMascaradosSignal.group.replace('M', '');
        }
      } else if (activeTab === "puxam") {
        if (currentTriangulacaoSignal && currentTriangulacaoSignal.result === "pending") {
          subFilter = currentTriangulacaoSignal.triangleType.toString();
        }
      } else if (activeTab === "escadinha") {
        if (currentEscadinhaSignal && currentEscadinhaSignal.result === "pending") {
           const lastTerminal = numberHistory[0] % 10;
           const tAbove = (lastTerminal + 1) % 10;
           const tBelow = (lastTerminal - 1 + 10) % 10;
           subFilter = `${tBelow},${tAbove}`;
        }
      }
      
      setSubColorFilter(subFilter);
    }
  }, [activeTab, currentMainSignal, currentGeometricSignal, currentCasasSignal, currentMascaradosSignal, currentTriangulacaoSignal, currentEscadinhaSignal, numberHistory]);

  // Profit Calculation Logic per Strategy
  useEffect(() => {
    const calculateStrategyProfit = (signals: any[], strategyId: string) => {
      const config = strategyConfigs[strategyId] || { chipValue: 0.50, martingale: false };
      
      return signals.reduce((acc, sig: any) => {
        const nums = sig.numbers || sig.predictedNumbers || [];
        if (!nums || nums.length === 0 || !sig.testedRounds || sig.testedRounds.length === 0) return acc;

        const uniqueNumbers = [...new Set(nums)];
        const costPerRound = uniqueNumbers.length * config.chipValue;
        
        let hitIdx = -1;
        for (let i = 0; i < sig.testedRounds.length; i++) {
          const roundNum = sig.testedRounds[i];
          if (nums.includes(roundNum)) {
            hitIdx = i;
            break;
          }
        }

        if (hitIdx === -1) {
          if (config.martingale) {
            let totalLoss = 0;
            for (let i = 0; i < sig.testedRounds.length; i++) {
              totalLoss += costPerRound * Math.pow(2, i);
            }
            return acc - totalLoss;
          } else {
            return acc - (costPerRound * sig.testedRounds.length);
          }
        } else {
          if (config.martingale) {
            const betMultiplier = Math.pow(2, hitIdx);
            const totalSpentBeforeHit = (hitIdx > 0) ? costPerRound * (Math.pow(2, hitIdx) - 1) : 0;
            const currentBetCost = costPerRound * betMultiplier;
            const winAmount = (config.chipValue * betMultiplier) * 36;
            return acc + (winAmount - (totalSpentBeforeHit + currentBetCost));
          } else {
            const totalSpent = costPerRound * (hitIdx + 1);
            const winAmount = config.chipValue * 36;
            return acc + (winAmount - totalSpent);
          }
        }
      }, 0);
    };

    setStrategyConfigs(prev => {
      const newConfigs = { ...prev };
      newConfigs.main = { ...newConfigs.main, profit: calculateStrategyProfit(mainRobotSignals, 'main') };
      newConfigs.geo = { ...newConfigs.geo, profit: calculateStrategyProfit(geometricSignals, 'geo') };
      newConfigs.pelayo = { ...newConfigs.pelayo, profit: calculateStrategyProfit(pelayoSignals, 'pelayo') };
      newConfigs.casas = { ...newConfigs.casas, profit: calculateStrategyProfit(casasSignals, 'casas') };
      newConfigs.mascarados = { ...newConfigs.mascarados, profit: calculateStrategyProfit(mascaradosSignals, 'mascarados') };
      newConfigs.gps = { ...newConfigs.gps, profit: calculateStrategyProfit(gpsSignals, 'gps') };
      newConfigs.puxam = { ...newConfigs.puxam, profit: calculateStrategyProfit(triangulacaoSignals, 'puxam') };
      newConfigs.escadinha = { ...newConfigs.escadinha, profit: calculateStrategyProfit(escadinhaSignals, 'escadinha') };
      return newConfigs;
    });
  }, [
    mainRobotSignals, 
    geometricSignals, 
    casasSignals, 
    pelayoSignals, 
    gpsSignals, 
    triangulacaoSignals, 
    escadinhaSignals, 
    mascaradosSignals,
    strategyConfigs.main?.chipValue, strategyConfigs.main?.martingale,
    strategyConfigs.geo?.chipValue, strategyConfigs.geo?.martingale,
    strategyConfigs.pelayo?.chipValue, strategyConfigs.pelayo?.martingale,
    strategyConfigs.casas?.chipValue, strategyConfigs.casas?.martingale,
    strategyConfigs.mascarados?.chipValue, strategyConfigs.mascarados?.martingale,
    strategyConfigs.gps?.chipValue, strategyConfigs.gps?.martingale,
    strategyConfigs.puxam?.chipValue, strategyConfigs.puxam?.martingale,
    strategyConfigs.escadinha?.chipValue, strategyConfigs.escadinha?.martingale,
  ]);
  const [hoveredNumber, setHoveredNumber] = useState<number | null>(null);
  const [lastMascaradosSignalEndIndex, setLastMascaradosSignalEndIndex] = useState<number>(0);
  const [mascaradosConfidenceLevel, setMascaradosConfidenceLevel] = useState<number>(95);

  const currentMainRef = useRef(currentMainSignal);
  const currentGeoRef = useRef(currentGeometricSignal);
  const currentCasasRef = useRef(currentCasasSignal);
  const currentPelayoRef = useRef(currentPelayoSignal);
  const currentMascaradosRef = useRef(currentMascaradosSignal);
  const currentGpsRef = useRef(currentGpsSignal);
  const currentTriangulacaoRef = useRef(currentTriangulacaoSignal);
  const currentEscadinhaRef = useRef(currentEscadinhaSignal);

  useEffect(() => { currentMainRef.current = currentMainSignal; }, [currentMainSignal]);
  useEffect(() => { currentGeoRef.current = currentGeometricSignal; }, [currentGeometricSignal]);
  useEffect(() => { currentCasasRef.current = currentCasasSignal; }, [currentCasasSignal]);
  useEffect(() => { currentPelayoRef.current = currentPelayoSignal; }, [currentPelayoSignal]);
  useEffect(() => { currentMascaradosRef.current = currentMascaradosSignal; }, [currentMascaradosSignal]);
  useEffect(() => { currentGpsRef.current = currentGpsSignal; }, [currentGpsSignal]);
  useEffect(() => { currentTriangulacaoRef.current = currentTriangulacaoSignal; }, [currentTriangulacaoSignal]);
  useEffect(() => { currentEscadinhaRef.current = currentEscadinhaSignal; }, [currentEscadinhaSignal]);

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

  const getWheelDistance = useCallback((n1: number, n2: number): number => {
    const idx1 = wheelSequence.indexOf(n1);
    const idx2 = wheelSequence.indexOf(n2);
    if (idx1 === -1 || idx2 === -1) return 0;
    const dist = Math.abs(idx1 - idx2);
    return Math.min(dist, 37 - dist);
  }, []);

  const getNumberRegion = useCallback((num: number): string => {
    if (zeroGameNumbers.includes(num)) return "JEU ZERO";
    if (voisinsNumbers.includes(num)) return "VOISINS";
    if (orfaoNumbers.includes(num)) return "ORPHELINS";
    if (tierNumbers.includes(num)) return "TIERS";
    return "MISTA";
  }, []);

  const getNumberSoma = useCallback((number: number): number => {
    if (number === 0) return 0;
    let s = number;
    while (s > 9) {
      s = Math.floor(s / 10) + (s % 10);
    }
    return s;
  }, []);

  const getNumberDiff = useCallback((number: number): number => {
    if (number < 10) return number;
    const d1 = Math.floor(number / 10);
    const d2 = number % 10;
    return Math.abs(d1 - d2);
  }, []);

  const getNumberZone = useCallback((number: number): number => {
    for (let i = 0; i < wheelZones.length; i++) {
      if (wheelZones[i].includes(number)) return i + 1;
    }
    return 1;
  }, []);

  const getNumberForce = useCallback((number: number): number | null => {
    for (const [force, nums] of Object.entries(nineForces)) {
      if (nums.includes(number)) return parseInt(force);
    }
    return null;
  }, []);

  const calcularMovimento = useCallback((num1: number, num2: number) => {
    const idx1 = wheelSequence.indexOf(num1);
    const idx2 = wheelSequence.indexOf(num2);
    if (idx1 === -1 || idx2 === -1) return 0;
    let diff = idx2 - idx1;
    if (diff > 18) diff -= 37;
    if (diff < -18) diff += 37;
    return diff;
  }, []);

  const mapearDirecao = useCallback((diff: number) => {
    if (diff === 0) return "PARADO";
    if (diff > 0 && diff <= 3) return "HORARIO_CURTO";
    if (diff > 3 && diff <= 8) return "HORARIO_MEDIO";
    if (diff > 8) return "HORARIO_LONGO";
    if (diff < 0 && diff >= -3) return "ANTI_CURTO";
    if (diff < -3 && diff >= -8) return "ANTI_MEDIO";
    if (diff < -8) return "ANTI_LONGO";
    return "PARADO";
  }, []);

  const correlationMatrix = useMemo(() => {
    const matrix: Record<number, Record<number, number>> = {};
    // Analisamos do mais antigo para o mais novo no histórico (que está invertido)
    // history[0] é o mais recente. history[1] é o anterior.
    // Queremos saber: depois de history[1], veio history[0].
    for (let i = 0; i < numberHistory.length - 1; i++) {
      const current = numberHistory[i + 1];
      const next = numberHistory[i];
      if (!matrix[current]) matrix[current] = {};
      matrix[current][next] = (matrix[current][next] || 0) + 1;
    }
    return matrix;
  }, [numberHistory]);

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
    
    const shortTerm = numberHistory.slice(0, 15);
    const longTerm = numberHistory.slice(0, 60);
    
    const terminalCounts: Record<number, { 
      shortCount: number, 
      longCount: number, 
      positions: number[], 
      hitCount: number,
      score: number
    }> = {};
    
    // Pre-calculate sets for each terminal region (terminal + neighbors)
    const terminalSets: Record<number, Set<number>> = {};
    for (let t = 0; t <= 9; t++) {
      const baseNumbers = terminals[t];
      const neighborCount = t >= 7 ? 2 : 1;
      const allNumbers = [...new Set([...baseNumbers, ...baseNumbers.flatMap(n => getCorrectNeighbors(n, neighborCount))])];
      terminalSets[t] = new Set(allNumbers);
      terminalCounts[t] = { shortCount: 0, longCount: 0, positions: [], hitCount: 0, score: 0 };
    }
    
    // Analyze history: check which terminal regions each number in history "hits"
    longTerm.forEach((num, index) => {
      for (let t = 0; t <= 9; t++) {
        if (terminalSets[t].has(num)) {
          terminalCounts[t].longCount++;
          if (index < 15) terminalCounts[t].shortCount++;
          terminalCounts[t].positions.push(index);
        }
      }
    });

    Object.keys(terminalCounts).forEach(tStr => {
      const t = parseInt(tStr);
      
      // Hit count is now based on the full region (terminal + neighbors)
      terminalCounts[t].hitCount = terminalCounts[t].longCount;
      
      // Score calculation: 
      // 70% weight on short term (last 15)
      // 30% weight on long term (last 60)
      const shortFreq = terminalCounts[t].shortCount / 15;
      const longFreq = terminalCounts[t].longCount / 60;
      
      // Bonus for very recent appearance (last 3 rounds)
      const recentBonus = terminalCounts[t].positions.some(p => p < 3) ? 0.2 : 0;
      
      // Bonus for "burst" (2+ in last 8)
      const burstBonus = terminalCounts[t].positions.filter(p => p < 8).length >= 2 ? 0.3 : 0;
      
      // Score calculation with region-based frequency
      terminalCounts[t].score = (shortFreq * 0.7 + longFreq * 0.3) + recentBonus + burstBonus;
    });

    const sorted = Object.entries(terminalCounts)
      .map(([t, data]) => ({ terminal: parseInt(t), ...data }))
      .filter(t => t.longCount > 0)
      .sort((a, b) => b.score - a.score);

    const best = sorted[0];
    let bestStrategy = null;
    // Adjusted threshold for region-based scoring
    if (best && best.score > 0.5) {
      let confidence = Math.min(best.score * 100, 95);
      bestStrategy = { terminal: best.terminal, confidence };
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
      const bFirst = b.activations > 0 ? (b.hitDetails.filter(d => d.round === 1).length / a.activations) : 0;
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
    if (history.length < 5) return { regions: [], bestSignal: null };
    
    // 1. Análise de Regiões (Mantendo para compatibilidade)
    const regStats: any[] = Object.keys(regions).map(name => {
      const regionNumbers = regions[name];
      const count = history.filter(n => regionNumbers.includes(n)).length;
      const lastHit = history.findIndex(n => regionNumbers.includes(n));
      const percentage = (count / history.length) * 100;
      
      const anchorNumbers = regionNumbers.map(n => ({ 
        number: n, 
        count: history.filter(h => h === n).length 
      })).sort((a,b) => b.count - a.count);
      
      return { name, count, percentage, lastHit: lastHit !== -1 ? lastHit : null, status: 'Normal', anchorNumbers };
    });

    regStats.forEach(r => {
      if (r.percentage > 35) r.status = 'Dominante';
      else if (r.lastHit !== null && r.lastHit > 15) r.status = 'Atrasado';
    });

    // 2. LEITURA DO “CAMINHO DA BOLA”
    const lastNum = history[0];
    const prevNum = history[1];
    const prevPrevNum = history[2];

    const getJump = (n1: number, n2: number) => {
      const idx1 = wheelSequence.indexOf(n1);
      const idx2 = wheelSequence.indexOf(n2);
      if (idx1 === -1 || idx2 === -1) return 0;
      let diff = idx2 - idx1;
      if (diff > 18) diff -= 37;
      if (diff < -18) diff += 37;
      return diff;
    };

    const jump1 = getJump(prevNum, lastNum);
    const jump2 = getJump(prevPrevNum, prevNum);

    const getJumpType = (j: number) => {
      const absJ = Math.abs(j);
      if (absJ === 0) return 'Parado';
      if (absJ <= 3) return 'Curto';
      if (absJ <= 8) return 'Médio';
      return 'Longo';
    };

    const type1 = getJumpType(jump1);
    const type2 = getJumpType(jump2);

    const dir1 = jump1 > 0 ? 'Frente' : jump1 < 0 ? 'Trás' : 'Parado';
    const dir2 = jump2 > 0 ? 'Frente' : jump2 < 0 ? 'Trás' : 'Parado';

    let pattern = "Analisando...";
    let confidence = 0;
    let predictedNumbers: number[] = [];
    let reasoning = "";

    // Padrão 1: Repetição de Tipo de Salto
    if (type1 === type2 && type1 !== 'Parado') {
      pattern = `Salto ${type1} Repetido`;
      confidence = 88;
      const avgJump = Math.round((jump1 + jump2) / 2);
      const targetIdx = (wheelSequence.indexOf(lastNum) + avgJump + 37) % 37;
      const targetNum = wheelSequence[targetIdx];
      predictedNumbers = [targetNum, ...getCorrectNeighbors(targetNum, 2)];
      reasoning = `Sequência de saltos ${type1.toLowerCase()}s detectada na roda.`;
    } 
    // Padrão 2: Repetição de Direção
    else if (dir1 === dir2 && dir1 !== 'Parado') {
      pattern = `Direção ${dir1} Constante`;
      confidence = 82;
      const avgJump = Math.round((jump1 + jump2) / 2);
      const targetIdx = (wheelSequence.indexOf(lastNum) + avgJump + 37) % 37;
      const targetNum = wheelSequence[targetIdx];
      predictedNumbers = [targetNum, ...getCorrectNeighbors(targetNum, 2)];
      reasoning = `Bola mantendo direção para ${dir1.toLowerCase()}.`;
    }
    // Padrão 3: Clustering (Repetição de Região/Zona)
    else {
      const zone1 = getNumberZone(lastNum);
      const zone2 = getNumberZone(prevNum);
      if (zone1 === zone2) {
        pattern = "Clustering na Zona " + zone1;
        confidence = 85;
        const zoneNums = wheelZones[zone1 - 1];
        predictedNumbers = [...zoneNums];
        reasoning = `Repetição de região (Zona ${zone1}) detectada na roda.`;
      }
    }

    let bestSignal = null;
    if (confidence >= 80 && predictedNumbers.length > 0) {
      bestSignal = { 
        confidence, 
        numbers: [...new Set(predictedNumbers)].slice(0, 9), 
        reasoning: `${pattern}: ${reasoning}` 
      };
    }

    return { 
      regions: regStats, 
      caminhoDaBola: {
        lastJump: jump1,
        jumpType: type1,
        direction: dir1,
        pattern
      },
      bestSignal 
    };
  }, [numberHistory, getCorrectNeighbors, getNumberZone]);

  const mascaradosAnalysis = useMemo((): MascaradosAnalysisResult => {
    const res: MascaradosAnalysisResult = { 
      unifiedStats: {}, 
      bestSignal: null, 
      activePatterns: [],
      globalTrends: { topMascarados: [], topEscadinhas: [], topCorrelations: [], topRepetitions: [] }
    };
    if (numberHistory.length < 3) return res;
    
    const history = numberHistory.slice(0, 100);
    const groups = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    // 1. Estatísticas Unificadas
    const unifiedStats: Record<string, { count: number; percentage: number; lastPos: number | null; numbers: number[]; history: number[] }> = {};
    groups.forEach(g => {
      unifiedStats[g] = { count: 0, percentage: 0, lastPos: null, numbers: [], history: [] };
    });

    history.forEach((n, idx) => {
      const gList = Object.entries(mascaradosGroups).filter(([_, nums]) => nums.includes(n)).map(([g]) => g);
      gList.forEach(g => {
        if (unifiedStats[g]) {
          unifiedStats[g].count++;
          unifiedStats[g].history.push(n);
          if (!unifiedStats[g].numbers.includes(n)) unifiedStats[g].numbers.push(n);
          if (unifiedStats[g].lastPos === null) unifiedStats[g].lastPos = idx;
        }
      });
    });
    
    groups.forEach(g => {
      unifiedStats[g].percentage = (unifiedStats[g].count / history.length) * 100;
    });
    res.unifiedStats = unifiedStats;

    // 2. Tendências Globais
    const somaFreq: Record<number, number> = {};
    const recentSomaFreq: Record<number, number> = {};
    const escadinhaCounts: Record<string, number> = {};
    const globalCorrelationMap: Record<string, number> = {};
    
    const recentHistory = history.slice(0, 30);
    
    history.forEach((n, idx) => {
      const gList = Object.entries(mascaradosGroups).filter(([_, nums]) => nums.includes(n)).map(([g]) => parseInt(g));
      gList.forEach(g => {
        somaFreq[g] = (somaFreq[g] || 0) + 1;
        if (idx < 30) {
          recentSomaFreq[g] = (recentSomaFreq[g] || 0) + 1;
        }
      });
    });

    // Escadinhas e Correlações
    const somaHistory = history.map(n => {
      const g = Object.entries(mascaradosGroups).find(([_, nums]) => nums.includes(n))?.[0];
      return g ? parseInt(g) : null;
    }).filter(g => g !== null) as number[];

    for (let i = 0; i < somaHistory.length - 1; i++) {
      const v1 = somaHistory[i+1];
      const v2 = somaHistory[i];
      
      // Correlações
      const corrKey = `${v1}->${v2}`;
      globalCorrelationMap[corrKey] = (globalCorrelationMap[corrKey] || 0) + 1;

      // Escadinhas
      if (Math.abs(v1 - v2) === 1) {
        const escKey = `${v1} e ${v2}`;
        escadinhaCounts[escKey] = (escadinhaCounts[escKey] || 0) + 1;
      }
    }

    res.globalTrends.topMascarados = Object.entries(somaFreq)
      .map(([s, count]) => ({ value: parseInt(s), count, percentage: (count / history.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.globalTrends.topRepetitions = Object.entries(recentSomaFreq)
      .map(([s, count]) => ({ value: parseInt(s), count, percentage: (count / recentHistory.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.globalTrends.topEscadinhas = Object.entries(escadinhaCounts)
      .map(([pair, count]) => ({ pair, count, percentage: (count / (somaHistory.length - 1)) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.globalTrends.topCorrelations = Object.entries(globalCorrelationMap)
      .map(([key, count]) => {
        const [from, to] = key.split("->").map(Number);
        return { from, to, count, percentage: (count / (somaHistory.length - 1)) * 100 };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const lastNum = history[0];
    const prevNum = history[1];

    // 1. Identificar Grupos de Mascarados
    const getGroups = (num: number) => {
      return Object.entries(mascaradosGroups)
        .filter(([_, nums]) => nums.includes(num))
        .map(([g]) => g);
    };

    const lastGroups = getGroups(lastNum);
    const prevGroups = getGroups(prevNum);

    // Detectar repetição de mascarados
    const repeatingGroups = lastGroups.filter(g => prevGroups.includes(g));
    const hasMascaradoRepetition = repeatingGroups.length > 0;

    // 2. Dominância de Região
    const lastRegion = getNumberRegion(lastNum);
    const prevRegion = getNumberRegion(prevNum);
    const hasRegionConcentration = lastRegion === prevRegion && lastRegion !== "MISTA";

    // 3. Detectar Movimento
    const dist = getWheelDistance(lastNum, prevNum);
    let movementType = "HÍBRIDO";
    if (dist <= 4) movementType = "COLADO";
    else if (dist >= 12) movementType = "SALTO";

    // 4. Regras de Decisão
    let strategy = "HÍBRIDO";
    let targetNumbers: number[] = [];
    let activeRegion = lastRegion;

    if (hasMascaradoRepetition) {
      strategy = "MASCARADO";
      // Priorizar os números do grupo que repetiu
      const groupToUse = repeatingGroups[0];
      targetNumbers = [...mascaradosGroups[groupToUse]].slice(0, 4);
    } else if (hasRegionConcentration) {
      strategy = "REGIÃO";
      // Priorizar números da região
      const regionNums = regions[lastRegion === "JEU ZERO" ? "Zero" : lastRegion.charAt(0) + lastRegion.slice(1).toLowerCase()];
      targetNumbers = [...regionNums].slice(0, 4);
    } else {
      strategy = "HÍBRIDO";
      // 2 colados + 2 mascarados
      const colados = getCorrectNeighbors(lastNum, 1);
      const mascarados = lastGroups.length > 0 ? mascaradosGroups[lastGroups[0]].slice(0, 2) : [0, 32];
      targetNumbers = [...new Set([...colados.slice(0, 2), ...mascarados.slice(0, 2)])];
    }

    // Garantir 4 números
    if (targetNumbers.length < 4) {
      const extra = [0, 32, 15, 19].filter(n => !targetNumbers.includes(n));
      targetNumbers = [...targetNumbers, ...extra].slice(0, 4);
    }

    const reasoning = `PADRÃO DETECTADO: ${movementType}\n\nREGIÃO ATIVA: ${activeRegion}\n\nESTRATÉGIA ESCOLHIDA: ${strategy}\n\nEntrada:\n\n${targetNumbers.join('  ')} + 1 V`;

    const finalNumbers = [...new Set(targetNumbers.flatMap(n => [n, ...getCorrectNeighbors(n, 1)]))];

    res.bestSignal = {
      group: strategy === "MASCARADO" ? `M${repeatingGroups[0]}` : "HÍBRIDO",
      numbers: finalNumbers,
      confidence: mascaradosConfidenceLevel,
      reasoning: reasoning,
      pattern: movementType
    };

    return res;
  }, [numberHistory, getNumberRegion, getWheelDistance, getCorrectNeighbors, mascaradosConfidenceLevel]);

  const gpsAnalysis = useMemo<GPSAnalysisResult | null>(() => {
    if (numberHistory.length < 4) return null;

    const direcoes: string[] = [];
    const movimentos: number[] = [];
    const chronoHistory = [...numberHistory].reverse();
    for (let i = 0; i < chronoHistory.length - 1; i++) {
      const diff = calcularMovimento(chronoHistory[i], chronoHistory[i+1]);
      movimentos.push(diff);
      direcoes.push(mapearDirecao(diff));
    }

    if (direcoes.length === 0) return null;

    const contagem: Record<string, number> = {};
    const regionCounts: Record<string, number> = {
      Zero: 0,
      Voisins: 0,
      Tiers: 0,
      Orphelins: 0
    };
    const frequenciaNumerosPorDirecao: Record<string, Record<number, number>> = {};
    
    for (let i = 0; i < chronoHistory.length - 1; i++) {
      const diff = calcularMovimento(chronoHistory[i], chronoHistory[i+1]);
      const dir = mapearDirecao(diff);
      const resultNum = chronoHistory[i+1];
      
      contagem[dir] = (contagem[dir] || 0) + 1;
      
      if (!frequenciaNumerosPorDirecao[dir]) frequenciaNumerosPorDirecao[dir] = {};
      frequenciaNumerosPorDirecao[dir][resultNum] = (frequenciaNumerosPorDirecao[dir][resultNum] || 0) + 1;
    }

    // Contagem de regiões (Últimas 50 para consistência com o card)
    numberHistory.slice(0, 50).forEach(n => {
      if (zeroGameNumbers.includes(n)) regionCounts.Zero++;
      else if (voisinsNumbers.includes(n)) regionCounts.Voisins++;
      else if (tierNumbers.includes(n)) regionCounts.Tiers++;
      else if (orfaoNumbers.includes(n)) regionCounts.Orphelins++;
    });

    const dominanteEntry = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
    const dominante = dominanteEntry[0];
    const frequencia = (dominanteEntry[1] / direcoes.length) * 100;

    const detectarPadraoRota = (dirs: string[]) => {
      if (dirs.length < 6) return 0;
      const ultimas = dirs.slice(-3).join("-");
      let repeticoes = 0;
      for (let i = 0; i < dirs.length - 3; i++) {
        const seq = dirs.slice(i, i + 3).join("-");
        if (seq === ultimas) repeticoes++;
      }
      return repeticoes;
    };

    const repeticoes = detectarPadraoRota(direcoes);
    const media = movimentos.length >= 3 
      ? movimentos.slice(-3).reduce((a, b) => a + b, 0) / 3 
      : movimentos.reduce((a, b) => a + b, 0) / (movimentos.length || 1);
    
    const ultimo = numberHistory[0];
    const ultimoIdx = wheelSequence.indexOf(ultimo);
    const proximoIndex = (ultimoIdx + Math.round(media) + 37) % 37;
    const numeroBase = wheelSequence[proximoIndex];
    const zona = getCorrectNeighbors(numeroBase, 2);

    const saltosGrandes = movimentos.slice(-10).filter(m => Math.abs(m) > 12).length;
    const direcoesDiferentes = new Set(direcoes.slice(-5)).size;
    const alerta = (saltosGrandes > 5 || direcoesDiferentes > 4);

    const intensidade = Math.abs(media) > 8 ? "ALTA" : Math.abs(media) > 3 ? "MÉDIA" : "BAIXA";
    const tendencia = media > 0 ? "HORÁRIO" : media < 0 ? "ANTI-HORÁRIO" : "ESTÁVEL";

    const hotNumbers50 = Object.entries(
      numberHistory.slice(0, 50).reduce((acc: Record<number, number>, num) => {
        acc[num] = (acc[num] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 12) // Pega os 12 mais quentes
      .map(([num]) => parseInt(num));

    // Análise Regional (Últimas 50)
    const regionStats = {
      Zero: numberHistory.slice(0, 50).filter(n => zeroGameNumbers.includes(n)).length,
      Voisins: numberHistory.slice(0, 50).filter(n => voisinsNumbers.includes(n)).length,
      Tiers: numberHistory.slice(0, 50).filter(n => tierNumbers.includes(n)).length,
      Orphelins: numberHistory.slice(0, 50).filter(n => orfaoNumbers.includes(n)).length,
    };

    const sortedRegions = Object.entries(regionStats).sort((a, b) => b[1] - a[1]);
    const hotRegion = sortedRegions[0][0];
    const regionFrequency = (sortedRegions[0][1] / Math.min(numberHistory.length, 50)) * 100;
    
    const regionNumbersMap: Record<string, number[]> = {
      Zero: zeroGameNumbers,
      Voisins: voisinsNumbers,
      Tiers: tierNumbers,
      Orphelins: orfaoNumbers
    };

    const targetNumbers = regionNumbersMap[hotRegion].filter(n => hotNumbers50.includes(n));

    // Zona de Ataque: Vizinhos do destino
    const zonaAtaque = getCorrectNeighbors(numeroBase, 2);

    // Zona de Defesa: Região com mais vizinhos quentes entre os 5 números quentes
    const top5Hot = hotNumbers50.slice(0, 5);
    let bestDefenseCenter = top5Hot[0] || 0;
    let maxHotNeighbors = 0;
    top5Hot.forEach((num: number) => {
      const neighbors = getCorrectNeighbors(num, 2);
      const hotCount = neighbors.filter(n => top5Hot.includes(n)).length;
      if (hotCount > maxHotNeighbors) {
        maxHotNeighbors = hotCount;
        bestDefenseCenter = num;
      }
    });
    const zonaDefesa = getCorrectNeighbors(bestDefenseCenter, 2);

    const combinedZona = [...new Set([
      numeroBase,
      ...zonaAtaque,
      ...zonaDefesa,
      ...targetNumbers
    ])];

    return {
      dominante,
      frequencia,
      regionFrequency,
      repeticoes,
      padrao: repeticoes > 1 ? "REPETINDO" : "ESTÁVEL",
      destino: numeroBase,
      zona: combinedZona,
      zonaAtaque,
      zonaDefesa,
      targetNumbers,
      hotRegion,
      alerta,
      intensidade,
      tendencia,
      direcoes,
      contagem,
      regionCounts,
      frequenciaNumerosPorDirecao,
      hotNumbers50: top5Hot
    };
  }, [numberHistory, getCorrectNeighbors, calcularMovimento, mapearDirecao]);

  const triangulacaoAnalysis = useMemo((): TriangulacaoAnalysisResult => {
    const res: TriangulacaoAnalysisResult = {
      bestSignal: null,
      triangleStats: {
        1: { hits: 0, total: 0, rate: 0 },
        2: { hits: 0, total: 0, rate: 0 }
      },
      flowAnalysis: {
        consecutiveRepetitions: [],
        currentStreak: null,
        topCallers: [],
        transitions: []
      }
    };

    if (numberHistory.length < 5) return res;

    const history = [...numberHistory].reverse();
    const t1Full = [...new Set(triangle1Base.flatMap(n => [n, ...getCorrectNeighbors(n, 2)]))];
    const t2Full = [...new Set(triangle2Base.flatMap(n => [n, ...getCorrectNeighbors(n, 2)]))];

    const callers: Record<number, { 1: number; 2: number }> = {};
    const transitions: Record<string, number> = {};
    let currentStreak: { type: 1 | 2; count: number } | null = null;
    const streaks: { type: 1 | 2; count: number }[] = [];

    // Analisar histórico para ver qual triângulo está mais forte e fluxo
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      const isT1Current = t1Full.includes(current);
      const isT2Current = t2Full.includes(current);
      const isT1Next = t1Full.includes(next);
      const isT2Next = t2Full.includes(next);

      if (isT1Current) {
        res.triangleStats[1].total++;
        if (isT1Next) res.triangleStats[1].hits++;
      }
      if (isT2Current) {
        res.triangleStats[2].total++;
        if (isT2Next) res.triangleStats[2].hits++;
      }

      // Flow: Top Callers (quem chama a estratégia)
      if (isT1Next || isT2Next) {
        if (!callers[current]) callers[current] = { 1: 0, 2: 0 };
        if (isT1Next) callers[current][1]++;
        if (isT2Next) callers[current][2]++;
      }

      // Flow: Transitions
      if ((isT1Current || isT2Current) && (isT1Next || isT2Next)) {
        const from = isT1Current ? 1 : 2;
        const to = isT1Next ? 1 : 2;
        const key = `${from}->${to}`;
        transitions[key] = (transitions[key] || 0) + 1;

        // Consecutive Repetitions
        if (from === to) {
          if (currentStreak && currentStreak.type === from) {
            currentStreak.count++;
          } else {
            if (currentStreak) streaks.push(currentStreak);
            currentStreak = { type: from, count: 2 };
          }
        } else {
          if (currentStreak) streaks.push(currentStreak);
          currentStreak = null;
        }
      } else {
        if (currentStreak) streaks.push(currentStreak);
        currentStreak = null;
      }
    }
    if (currentStreak) streaks.push(currentStreak);

    // Calculate Current Streak (from the end of history, which is the start of history array)
    let activeStreak: { type: 1 | 2; count: number } | null = null;
    const lastNum = numberHistory[0];
    const isT1Last = t1Full.includes(lastNum);
    const isT2Last = t2Full.includes(lastNum);
    
    if (isT1Last || isT2Last) {
      const type = isT1Last ? 1 : 2;
      let count = 1;
      for (let i = 1; i < numberHistory.length; i++) {
        const n = numberHistory[i];
        const isMatch = type === 1 ? t1Full.includes(n) : t2Full.includes(n);
        if (isMatch) count++;
        else break;
      }
      if (count >= 2) activeStreak = { type, count };
    }

    res.triangleStats[1].rate = res.triangleStats[1].total > 0 ? (res.triangleStats[1].hits / res.triangleStats[1].total) * 100 : 0;
    res.triangleStats[2].rate = res.triangleStats[2].total > 0 ? (res.triangleStats[2].hits / res.triangleStats[2].total) * 100 : 0;

    // Process Flow Analysis
    res.flowAnalysis.currentStreak = activeStreak;
    res.flowAnalysis.consecutiveRepetitions = streaks.sort((a, b) => b.count - a.count).slice(0, 5);
    
    res.flowAnalysis.topCallers = Object.entries(callers)
      .flatMap(([num, counts]) => [
        { number: parseInt(num), type: 1 as const, count: counts[1] },
        { number: parseInt(num), type: 2 as const, count: counts[2] }
      ])
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.flowAnalysis.transitions = Object.entries(transitions)
      .map(([key, count]) => {
        const [from, to] = key.split('->').map(Number);
        return { from: from as 1 | 2, to: to as 1 | 2, count };
      })
      .sort((a, b) => b.count - a.count);

    const isT1 = t1Full.includes(lastNum);
    const isT2 = t2Full.includes(lastNum);

    if (isT1 || isT2) {
      let bestT: 1 | 2 = isT1 ? 1 : 2;
      
      // Se o número pertence a ambos ou se queremos decidir qual padrão está melhor no momento
      if (isT1 && isT2) {
        bestT = res.triangleStats[1].rate >= res.triangleStats[2].rate ? 1 : 2;
      } else if (isT1) {
        bestT = 1;
      } else {
        bestT = 2;
      }

      const stats = res.triangleStats[bestT];
      if (stats.rate >= 35 && stats.total >= 1) {
        res.bestSignal = {
          confidence: Math.min(stats.rate + 20, 95),
          numbers: bestT === 1 ? t1Full : t2Full,
          baseNumbers: bestT === 1 ? triangle1Base : triangle2Base,
          triangleType: bestT,
          reasoning: `Triângulo ${bestT} detectado (${bestT === 1 ? '11-15-22' : '17-24-28'}). Assertividade de ${stats.rate.toFixed(1)}% no histórico.`
        };
      }
    }

    return res;
  }, [numberHistory, getCorrectNeighbors]);

    const escadinhaAnalysis = useMemo((): EscadinhaAnalysisResult => {
    const res: EscadinhaAnalysisResult = {
      bestSignal: null,
      escadinhaStats: {},
      flowAnalysis: {
        consecutiveRepetitions: [],
        currentStreak: null,
        topCallers: [],
        transitions: []
      },
      terminalTrends: {
        lowCount: 0,
        highCount: 0,
        evenCount: 0,
        oddCount: 0,
        lowPercentage: 0,
        highPercentage: 0,
        evenPercentage: 0,
        oddPercentage: 0,
        hotTerminals: [],
        coldTerminals: []
      }
    };

    if (numberHistory.length < 5) return res;

    const history = [...numberHistory].reverse(); 

    // Terminal Trends calculation
    const terminalCounts = new Array(10).fill(0);
    const trendHistory = numberHistory.slice(0, 50);
    trendHistory.forEach(num => {
      terminalCounts[num % 10]++;
    });

    const lowCount = terminalCounts.slice(0, 5).reduce((a, b) => a + b, 0);
    const highCount = terminalCounts.slice(5, 10).reduce((a, b) => a + b, 0);
    const evenCount = terminalCounts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    const oddCount = terminalCounts.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0);
    const totalTrend = trendHistory.length || 1;

    res.terminalTrends = {
      lowCount,
      highCount,
      evenCount,
      oddCount,
      lowPercentage: (lowCount / totalTrend) * 100,
      highPercentage: (highCount / totalTrend) * 100,
      evenPercentage: (evenCount / totalTrend) * 100,
      oddPercentage: (oddCount / totalTrend) * 100,
      hotTerminals: terminalCounts
        .map((count, i) => ({ terminal: i, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(t => t.terminal),
      coldTerminals: terminalCounts
        .map((count, i) => ({ terminal: i, count }))
        .sort((a, b) => a.count - b.count)
        .slice(0, 3)
        .map(t => t.terminal)
    };

    // Statistics per terminal
    for (let t = 0; t <= 9; t++) {
      let hits = 0;
      let total = 0;
      
      for (let i = 0; i < history.length - 1; i++) {
        const currentTerminal = history[i] % 10;
        if (currentTerminal === t) {
          total++;
          const nextTerminal = history[i+1] % 10;
          if (nextTerminal === (t + 1) % 10 || nextTerminal === (t - 1 + 10) % 10) {
            hits++;
          }
        }
      }
      
      if (total > 0) {
        res.escadinhaStats[t] = { hits, total, rate: (hits / total) * 100 };
      }
    }

    // Flow Analysis (Escadinhas)
    const hitsStream: { terminal: number; index: number }[] = [];
    for (let i = 0; i < history.length - 1; i++) {
      const t1 = history[i] % 10;
      const t2 = history[i+1] % 10;
      if (t2 === (t1 + 1) % 10 || t2 === (t1 - 1 + 10) % 10) {
        hitsStream.push({ terminal: t1, index: i });
      }
    }

    // Consecutive repetitions of ANY escadinha hit
    if (hitsStream.length > 0) {
      const reps: { terminal: number; count: number }[] = [];
      let currentTerminal = hitsStream[0].terminal;
      let count = 1;

      for (let i = 1; i < hitsStream.length; i++) {
        if (hitsStream[i].terminal === currentTerminal && hitsStream[i].index === hitsStream[i-1].index + 1) {
          count++;
        } else {
          reps.push({ terminal: currentTerminal, count });
          currentTerminal = hitsStream[i].terminal;
          count = 1;
        }
      }
      reps.push({ terminal: currentTerminal, count });
      res.flowAnalysis.consecutiveRepetitions = reps.sort((a, b) => b.count - a.count);

      // Current streak calculation
      const lastHitIdx = hitsStream.findIndex(h => h.index === history.length - 2);
      if (lastHitIdx !== -1) {
        let streak = 1;
        const streakTerminal = hitsStream[lastHitIdx].terminal;
        for (let i = lastHitIdx - 1; i >= 0; i--) {
          if (hitsStream[i].terminal === streakTerminal && hitsStream[i].index === hitsStream[i+1].index - 1) {
            streak++;
          } else break;
        }
        res.flowAnalysis.currentStreak = { terminal: streakTerminal, count: streak };
      }
    }

    // Top Callers (Numbers that most frequently lead to an escadinha hit)
    const callers: Record<number, Record<number, number>> = {};
    for (let i = 1; i < history.length - 1; i++) {
      const t1 = history[i] % 10;
      const t2 = history[i+1] % 10;
      if (t2 === (t1 + 1) % 10 || t2 === (t1 - 1 + 10) % 10) {
        const callerNum = history[i-1];
        if (!callers[t1]) callers[t1] = {};
        callers[t1][callerNum] = (callers[t1][callerNum] || 0) + 1;
      }
    }

    const flatCallers: { number: number; terminal: number; count: number }[] = [];
    Object.entries(callers).forEach(([t, nums]) => {
      Object.entries(nums).forEach(([num, count]) => {
        flatCallers.push({ number: parseInt(num), terminal: parseInt(t), count });
      });
    });
    res.flowAnalysis.topCallers = flatCallers.sort((a, b) => b.count - a.count).slice(0, 5);

    // Transitions
    const transCounts: Record<string, number> = {};
    for (let i = 0; i < hitsStream.length - 1; i++) {
      if (hitsStream[i+1].index === hitsStream[i].index + 1) {
        const key = `${hitsStream[i].terminal}-${hitsStream[i+1].terminal}`;
        transCounts[key] = (transCounts[key] || 0) + 1;
      }
    }
    res.flowAnalysis.transitions = Object.entries(transCounts).map(([key, count]) => {
      const [from, to] = key.split('-').map(Number);
      return { from, to, count };
    }).sort((a, b) => b.count - a.count).slice(0, 4);

    const lastNum = numberHistory[0];
    const lastTerminal = lastNum % 10;
    
    // 1. Análise de Momentum (Busca Avançada)
    const recentHistory = numberHistory.slice(0, 20);
    let recentEscadinhas = 0;
    for (let i = 0; i < recentHistory.length - 1; i++) {
      const t1 = recentHistory[i+1] % 10;
      const t2 = recentHistory[i] % 10;
      const diff = Math.abs(t1 - t2);
      if (diff === 1 || (t1 === 0 && t2 === 9) || (t1 === 9 && t2 === 0)) {
        recentEscadinhas++;
      }
    }
    const marketMomentum = recentEscadinhas / 10; // Taxa de escadinhas recentes
    const isMarketHot = marketMomentum >= 0.2; // Pelo menos 2 em 10

    // 2. Correlações de Terminais (Busca Refinada)
    const terminalCorrelations: Record<number, Record<number, number>> = {};
    const correlationHistory = numberHistory.slice(1);
    for (let i = 0; i < correlationHistory.length - 1; i++) {
      const tPrev = correlationHistory[i+1] % 10;
      const tNext = correlationHistory[i] % 10;
      if (!terminalCorrelations[tPrev]) terminalCorrelations[tPrev] = {};
      terminalCorrelations[tPrev][tNext] = (terminalCorrelations[tPrev][tNext] || 0) + 1;
    }
    
    const lastCorrelations = terminalCorrelations[lastTerminal] || {};
    const terminalAbove = (lastTerminal + 1) % 10;
    const terminalBelow = (lastTerminal - 1 + 10) % 10;
    
    const hitsAbove = lastCorrelations[terminalAbove] || 0;
    const hitsBelow = lastCorrelations[terminalBelow] || 0;
    const totalHits = hitsAbove + hitsBelow;
    
    const escadinhaStats = res.escadinhaStats[lastTerminal];
    
    // Gatilho Inteligente:
    // - Se o mercado está "quente" para escadinhas (Momentum alto)
    // - OU se o terminal atual tem uma correlação forte com seus vizinhos (pelo menos 2 hits)
    // - OU se a assertividade histórica é alta (>= 45%)
    const shouldTrigger = (escadinhaStats && escadinhaStats.rate >= 45 && escadinhaStats.total >= 3) || 
                         (isMarketHot && totalHits >= 2) ||
                         (totalHits >= 3);

    if (shouldTrigger && numberHistory.length >= 5) {
      const targets = [...terminals[terminalAbove], ...terminals[terminalBelow]];
      const currentRate = escadinhaStats ? escadinhaStats.rate : (totalHits / 5) * 100;
      const confidence = Math.max(40, Math.min(95, currentRate + (isMarketHot ? 15 : 0)));

      res.bestSignal = {
        confidence: confidence,
        numbers: targets,
        reasoning: totalHits >= 2 
          ? `Busca Refinada: O terminal ${lastTerminal} possui correlação direta confirmada com os vizinhos ${terminalBelow} e ${terminalAbove} (${totalHits} ocorrências).`
          : isMarketHot 
            ? `Detecção de Momentum: Ciclo de Escadinha ativo no mercado. Terminal ${lastTerminal} posicionado para alvo em ${terminalBelow}/${terminalAbove}.`
            : `Análise Avançada: Padrão de Escadinha identificado para o terminal ${lastTerminal} com ${confidence.toFixed(0)}% de probabilidade.`
      };
    }

    return res;
  }, [numberHistory]);

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
      .slice(0, 5);
  }, [numberHistory]);

  const generateSignals = useCallback(() => {
    if (numberHistory.length < 5) return;
    
    // TERMINAIS
    if (!currentMainRef.current && terminalAnalysis.bestStrategy) {
      const { terminal, confidence } = terminalAnalysis.bestStrategy;
      const neighborCount = terminal >= 7 ? 2 : 1;
      const base = terminals[terminal], final = [...new Set([...base, ...base.flatMap(n => getCorrectNeighbors(n, neighborCount))])];
      const sig: MainRobotSignal = { id: `m-${Date.now()}`, timestamp: new Date(), terminal, strategy: `Terminal Quente: (${terminal} + ${neighborCount}V)`, confidence, baseNumbers: base, numbers: final, result: "pending", validityRounds: 3, roundsLeft: 3, testedRounds: [], color: "blue" };
      setCurrentMainSignal(sig); setMainRobotSignals(prev => [sig, ...prev]);
    }
    
    // GEOMÉTRICOS - FIX: Gatilho reativo ao último número
    const lastNum = numberHistory[0];
    const triggeredGeo = geometricAnalysis.find(p => p.numbers.includes(lastNum));
    
    if (!currentGeoRef.current && triggeredGeo && (triggeredGeo.hitRate >= 35 || triggeredGeo.activations < 2)) {
      const nbr = (triggeredGeo.patternId.includes('line') || triggeredGeo.patternId.includes('square_1')) ? 1 : 2;
      const final = [...new Set([...triggeredGeo.numbers, ...triggeredGeo.numbers.flatMap(n => getCorrectNeighbors(n, nbr))])];
      const sig: GeometricPatternSignal = { 
        id: `g-${Date.now()}`, 
        timestamp: new Date(), 
        patternId: triggeredGeo.patternId, 
        patternName: triggeredGeo.name, 
        predictedNumbers: final, 
        strategy: `Geometricos Padrão: ${triggeredGeo.name} + ${nbr} V`, 
        confidence: triggeredGeo.confidence, 
        baseNumbers: triggeredGeo.numbers, 
        result: "pending", 
        validityRounds: 3, 
        roundsLeft: 3, 
        testedRounds: [], 
        reasoning: `Ativado por: ${lastNum}`, 
        color: "yellow" 
      };
      setCurrentGeometricSignal(sig); 
      setGeometricSignals(prev => [sig, ...prev]);
    }
    
    // CASAS
    if (numberHistory.length >= 10 && !currentCasasRef.current && casasAnalysis.bestSignal) {
      const sig: CasasRobotSignal = { ...casasAnalysis.bestSignal, id: `c-${Date.now()}`, timestamp: new Date(), casa: "Confluência", strategy: "Análise de Casas", result: "pending", validityRounds: 5, roundsLeft: 5, testedRounds: [], color: "purple", baseNumbers: casasAnalysis.bestSignal.numbers, numbers: casasAnalysis.bestSignal.numbers };
      setCurrentCasasSignal(sig); setCasasSignals(prev => [sig, ...prev]);
    }
    
    // PELAYO - Caminho da Bola
    if (numberHistory.length >= 5 && !currentPelayoRef.current && pelayoAnalysis.bestSignal) {
      const sig: PelayoRobotSignal = { 
        ...pelayoAnalysis.bestSignal, 
        id: `p-${Date.now()}`, 
        timestamp: new Date(), 
        strategy: `Caminho da Bola`, 
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

    // MASCARADOS - Inteligência de Fluxo e Regiões
    const mascaradosCooldown = numberHistory.length - lastMascaradosSignalEndIndex;
    if (numberHistory.length >= 3 && !currentMascaradosRef.current && mascaradosAnalysis.bestSignal && mascaradosCooldown >= 2) {
      const sig: MascaradosRobotSignal = {
        id: `masc-${Date.now()}`,
        timestamp: new Date(),
        group: mascaradosAnalysis.bestSignal.group,
        strategy: "Inteligência Mascarada",
        confidence: mascaradosAnalysis.bestSignal.confidence,
        baseNumbers: mascaradosAnalysis.bestSignal.numbers,
        numbers: mascaradosAnalysis.bestSignal.numbers,
        result: "pending",
        validityRounds: 3, 
        roundsLeft: 3,
        testedRounds: [],
        color: "orange",
        reasoning: mascaradosAnalysis.bestSignal.reasoning
      };
      setCurrentMascaradosSignal(sig);
      setMascaradosSignals(prev => [sig, ...prev]);
    }

    // GPS ROBOT - Análise Regional e Padrão de Rota
    if (gpsAnalysis && !currentGpsRef.current) {
      const isRepetindo = gpsAnalysis.padrao === "REPETINDO" || gpsAnalysis.repeticoes >= 1;
      const isDominante = gpsAnalysis.frequencia >= 25; // Reduzido de 30
      const isRegionHot = gpsAnalysis.regionFrequency >= 20; // Reduzido de 25
      const hasTargetNumbers = gpsAnalysis.targetNumbers.length >= 1;
      
      // Gatilho: Padrão de Rota OU (Dominância de Rota + Região Quente) OU (Região Quente + Alvos)
      const shouldTrigger = isRepetindo || 
                           (isDominante && isRegionHot) ||
                           (isRegionHot && hasTargetNumbers);

      if (shouldTrigger && numberHistory.length >= 4) {
        const destinoProvavel = [gpsAnalysis.destino];
        const zonaAtaque = gpsAnalysis.zonaAtaque;
        const zonaDefesa = gpsAnalysis.zonaDefesa;
        const targetNumbers = gpsAnalysis.targetNumbers;
        
        const combinedNumbers = [...new Set([
          ...destinoProvavel,
          ...zonaAtaque,
          ...zonaDefesa,
          ...targetNumbers
        ])].slice(0, 18);

        const strategy = isRepetindo ? "ROTA REPETITIVA" : `TENDÊNCIA: ${gpsAnalysis.hotRegion.toUpperCase()}`;
        const confidence = isRepetindo ? 94 : Math.min(82 + gpsAnalysis.regionFrequency / 4, 92);
        const reasoning = isRepetindo 
          ? `Padrão de Rota Detectado (${gpsAnalysis.repeticoes}x). Alvos na região ${gpsAnalysis.hotRegion}.` 
          : `Tendência Regional (${gpsAnalysis.regionFrequency.toFixed(0)}%) + Dominância de Rota (${gpsAnalysis.frequencia.toFixed(0)}%).`;

        const sig: GPSRobotSignal = {
          id: `gps-dest-${Date.now()}`,
          timestamp: new Date(),
          strategy: strategy,
          confidence: confidence,
          baseNumbers: destinoProvavel,
          direction: gpsAnalysis.dominante,
          numbers: combinedNumbers,
          zonaAtaque,
          zonaDefesa,
          destinoProvavel,
          result: "pending",
          validityRounds: 4, // Aumentado de 3
          roundsLeft: 4,
          testedRounds: [],
          color: "purple",
          reasoning: reasoning
        };
        
        setCurrentGpsSignal(sig);
        setGpsSignals(prev => [sig, ...prev]);
      }
    }

    // TRIÂNGULO (Antigo Puxam)
    if (triangulacaoAnalysis.bestSignal && !currentTriangulacaoRef.current) {
      const sig: TriangulacaoRobotSignal = {
        id: `tri-${Date.now()}`,
        timestamp: new Date(),
        strategy: `Triângulo de Precisão ${triangulacaoAnalysis.bestSignal.baseNumbers?.join(' ')} + 2 V`,
        confidence: triangulacaoAnalysis.bestSignal.confidence,
        baseNumbers: triangulacaoAnalysis.bestSignal.baseNumbers || triangulacaoAnalysis.bestSignal.numbers,
        numbers: triangulacaoAnalysis.bestSignal.numbers,
        result: "pending",
        validityRounds: 2,
        roundsLeft: 2,
        testedRounds: [],
        color: "cyan",
        triangleType: triangulacaoAnalysis.bestSignal.triangleType,
        reasoning: triangulacaoAnalysis.bestSignal.reasoning,
      };
      setCurrentTriangulacaoSignal(sig);
      setTriangulacaoSignals(prev => [sig, ...prev]);
    }

    // ESCADINHAS
    if (escadinhaAnalysis.bestSignal && !currentEscadinhaRef.current) {
      const lastTerminal = numberHistory[0] % 10;
      const tAbove = (lastTerminal + 1) % 10;
      const tBelow = (lastTerminal - 1 + 10) % 10;
      const sig: EscadinhaRobotSignal = {
        id: `esc-${Date.now()}`,
        timestamp: new Date(),
        strategy: `Escadinha: Escadinha de Terminais T${tAbove} T${tBelow}`,
        confidence: escadinhaAnalysis.bestSignal.confidence,
        baseNumbers: escadinhaAnalysis.bestSignal.numbers,
        numbers: escadinhaAnalysis.bestSignal.numbers,
        result: "pending",
        validityRounds: 2,
        roundsLeft: 2,
        testedRounds: [],
        color: "blue",
        reasoning: escadinhaAnalysis.bestSignal.reasoning,
      };
      setCurrentEscadinhaSignal(sig);
      setEscadinhaSignals(prev => [sig, ...prev]);
    }
  }, [numberHistory, terminalAnalysis, geometricAnalysis, casasAnalysis, pelayoAnalysis, mascaradosAnalysis, gpsAnalysis, triangulacaoAnalysis, escadinhaAnalysis, getCorrectNeighbors, calcularMovimento, mapearDirecao]);

  const cancelCurrentSignal = useCallback(() => {
    if (activeTab === 'puxam' && currentTriangulacaoSignal) {
      const cancelled = { ...currentTriangulacaoSignal, result: 'cancelled' as const };
      setTriangulacaoSignals(prev => prev.map(s => s.id === cancelled.id ? cancelled : s));
      setCurrentTriangulacaoSignal(null);
      currentTriangulacaoRef.current = null;
      setTimeout(() => generateSignals(), 50);
    } else if (activeTab === 'escadinha' && currentEscadinhaSignal) {
      const cancelled = { ...currentEscadinhaSignal, result: 'cancelled' as const };
      setEscadinhaSignals(prev => prev.map(s => s.id === cancelled.id ? cancelled : s));
      setCurrentEscadinhaSignal(null);
      currentEscadinhaRef.current = null;
      setTimeout(() => generateSignals(), 50);
    }
  }, [activeTab, currentTriangulacaoSignal, currentEscadinhaSignal, generateSignals]);

  const forceNewAnalysis = useCallback(() => {
    if (activeTab === 'puxam') {
      setCurrentTriangulacaoSignal(null);
      currentTriangulacaoRef.current = null;
    }
    if (activeTab === 'escadinha') {
      setCurrentEscadinhaSignal(null);
      currentEscadinhaRef.current = null;
    }
    setTimeout(() => generateSignals(), 50);
  }, [activeTab, generateSignals]);

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
          
          // Se for o robô Mascarados, marcar o fim para o cooldown e atualizar aprendizado
          if (cur.id.startsWith('masc-')) {
            setLastMascaradosSignalEndIndex(history.length + 1);
            setMascaradosConfidenceLevel(prev => isWin ? Math.min(100, prev + 1) : Math.max(90, prev - 1));
          }

          set(null); return null;
        }
        set(next); histSetter((prev: any[]) => prev.map(s => s.id === next.id ? next : s)); return next;
      };
      check(currentMainRef.current, setCurrentMainSignal, setMainRobotSignals);
      check(currentGeoRef.current, setCurrentGeometricSignal, setGeometricSignals);
      check(currentCasasRef.current, setCurrentCasasSignal, setCasasSignals);
      check(currentPelayoRef.current, setCurrentPelayoSignal, setPelayoSignals);
      check(currentMascaradosRef.current, setCurrentMascaradosSignal, setMascaradosSignals);
      check(currentGpsRef.current, setCurrentGpsSignal, setGpsSignals);
      check(currentTriangulacaoRef.current, setCurrentTriangulacaoSignal, setTriangulacaoSignals);
      check(currentEscadinhaRef.current, setCurrentEscadinhaSignal, setEscadinhaSignals);
      history = [num, ...history];
    });
    setNumberHistory(history); setInputNumbers("");
  };

  const removeLastNumber = () => {
    if (numberHistory.length === 0) return;
    const removedNum = numberHistory[0];
    
    const robots = [
      { setCur: setCurrentMainSignal, setHist: setMainRobotSignals, ref: currentMainRef },
      { setCur: setCurrentGeometricSignal, setHist: setGeometricSignals, ref: currentGeoRef },
      { setCur: setCurrentCasasSignal, setHist: setCasasSignals, ref: currentCasasRef },
      { setCur: setCurrentPelayoSignal, setHist: setPelayoSignals, ref: currentPelayoRef },
      { setCur: setCurrentMascaradosSignal, setHist: setMascaradosSignals, ref: currentMascaradosRef },
      { setCur: setCurrentGpsSignal, setHist: setGpsSignals, ref: currentGpsRef },
      { setCur: setCurrentTriangulacaoSignal, setHist: setTriangulacaoSignals, ref: currentTriangulacaoRef },
      { setCur: setCurrentEscadinhaSignal, setHist: setEscadinhaSignals, ref: currentEscadinhaRef },
    ];

    robots.forEach(({ setCur, setHist, ref }) => {
      setHist((prev: any[]) => {
        if (prev.length === 0) return prev;
        const lastSignal = prev[0];
        
        // Caso 1: O sinal foi atualizado por este número (estava em teste ou foi finalizado por ele)
        if (lastSignal.testedRounds && lastSignal.testedRounds.length > 0 && 
            lastSignal.testedRounds[lastSignal.testedRounds.length - 1] === removedNum) {
          const updated = {
            ...lastSignal,
            roundsLeft: lastSignal.roundsLeft + 1,
            testedRounds: lastSignal.testedRounds.slice(0, -1),
            result: "pending",
            winRound: undefined
          };
          setCur(updated);
          ref.current = updated;
          return [updated, ...prev.slice(1)];
        }
        
        // Caso 2: O sinal foi criado por causa deste número (não tem rodadas testadas ainda)
        // Se foi o sinal mais recente e não tem testes, removemos ele para voltar ao estado anterior
        if (lastSignal.testedRounds && lastSignal.testedRounds.length === 0) {
          setCur(null);
          ref.current = null;
          return prev.slice(1);
        }
        
        return prev;
      });
    });

    setNumberHistory(prev => prev.slice(1));
  };

  const PerformanceDashboard = ({ signals, tabId }: { signals: any[], tabId: string }) => {
    const total = signals.length;
    const wins = signals.filter(s => s.result === 'win').length;
    const losses = signals.filter(s => s.result === 'loss').length;
    const rate = total > 0 ? ((wins / total) * 100).toFixed(0) : "0";
    const roundsCount = (tabId === 'casas' || tabId === 'pelayo' || tabId === 'cavalos') ? 5 : tabId === 'puxam' ? 1 : tabId === 'escadinha' ? 2 : 3;

    return (
      <div className="bg-slate-900/40 rounded-xl p-2 border border-white/10 flex flex-col justify-between h-full shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Header Decorativo */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span className="text-[9px] font-black uppercase text-white/50 tracking-widest">Live Engine</span>
          </div>
          <div className="text-[8px] font-black text-purple-400 italic">CORE_ACTIVE</div>
        </div>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          <div className="bg-slate-950/60 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center relative group">
             <span className="text-xl font-black text-white leading-none tracking-tighter">{total}</span>
             <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-1">Sinais</span>
             <div className="absolute top-0 right-0 p-1 opacity-20"><Zap className="w-2 h-2 text-blue-400" /></div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center border-b-2 border-b-purple-600/50">
             <span className="text-xl font-black text-purple-400 leading-none tracking-tighter">{rate}%</span>
             <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-1">Taxa</span>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          <div className="bg-emerald-500/5 rounded-lg py-1.5 flex flex-col items-center justify-center border border-emerald-500/10">
             <span className="text-base font-black text-emerald-500 leading-none">{wins}</span>
             <span className="text-[7px] text-emerald-500/50 font-black uppercase tracking-wider">Hits</span>
          </div>
          <div className="bg-orange-500/5 rounded-lg py-1.5 flex flex-col items-center justify-center border border-orange-500/10">
             <span className="text-base font-black text-orange-500 leading-none">{losses}</span>
             <span className="text-[7px] text-orange-500/50 font-black uppercase tracking-wider">Loss</span>
          </div>
        </div>

        {/* Gale Rounds Indicator */}
        <div className="mt-auto px-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Distribuição por Entrada</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const count = signals.filter(s => s.result === 'win' && s.winRound === (i + 1)).length;
              const isVisible = i < roundsCount;
              return (
                <div key={i} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg bg-slate-950/60 border border-white/5 transition-all shadow-inner ${isVisible ? 'opacity-100 scale-100' : 'opacity-10 scale-95'}`}>
                  <span className={`text-[13px] font-black leading-none ${count > 0 ? 'text-emerald-400' : 'text-slate-700'}`}>{count}</span>
                  <span className="text-[7px] text-slate-500/80 font-black uppercase leading-none mt-1">{i === 0 ? 'DIR' : `${i}G`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const RacetrackSVG = ({ 
    signalNumbers = [], 
    color = "blue",
    extraSignals = []
  }: { 
    signalNumbers?: number[], 
    color?: string,
    extraSignals?: { numbers: number[], color: string }[]
  }) => {
    const [hoveredSector, setHoveredSector] = useState<string | null>(null);

    const sequence = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 
      24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    const getNumberColor = (n: number) => {
      if (n === 0) return "#008542";
      const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return reds.includes(n) ? "#d60000" : "#000000";
    };

    const SECTORS = {
      ZERO: [12, 35, 3, 26, 0, 32, 15],
      VOISINS: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
      ORPHELINS: [1, 20, 14, 31, 9, 17, 34, 6],
      TIERS: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33]
    };

    // Layout Constants for perfect stadium shape
    const R_OUT = 140;
    const R_IN = 85;
    const L = 580; 
    const VIEW_W = L + 2 * R_OUT;
    const VIEW_H = 2 * R_OUT;
    const CX_L = R_OUT;
    const CX_R = R_OUT + L;
    const CY = R_OUT;

    const segments = useMemo(() => {
      const result = [];
      const totalNumbers = 37;
      
      // Proportions to get ~15 numbers on straight and ~3.5 on curves
      const rOuter = 130;
      const rInner = 75; // Increased to make segments shorter
      const lStraight = 1750;
      const arcLen = Math.PI * rOuter;
      const totalPerimeter = 2 * lStraight + 2 * arcLen;
      const segmentLen = totalPerimeter / totalNumbers;

      // Calculate offset to align 26 (index 36) to the left apex
      const leftApexDist = 2 * lStraight + 1.5 * arcLen;
      const segment36Center = 36.5 * segmentLen;
      const offset = leftApexDist - segment36Center;

      for (let i = 0; i < totalNumbers; i++) {
        const dStart = (i * segmentLen + offset + totalPerimeter) % totalPerimeter;
        const dEnd = ((i + 1) * segmentLen + offset + totalPerimeter) % totalPerimeter;
        const dMid = ((i + 0.5) * segmentLen + offset + totalPerimeter) % totalPerimeter;

        const getPos = (d: number, r: number) => {
          if (d <= lStraight) {
            return { x: rOuter + d, y: rOuter - r };
          } else if (d <= lStraight + arcLen) {
            const angle = (-90 + (d - lStraight) / arcLen * 180) * Math.PI / 180;
            return { x: rOuter + lStraight + r * Math.cos(angle), y: rOuter + r * Math.sin(angle) };
          } else if (d <= 2 * lStraight + arcLen) {
            return { x: rOuter + lStraight - (d - (lStraight + arcLen)), y: rOuter + r };
          } else {
            const angle = (90 + (d - (2 * lStraight + arcLen)) / arcLen * 180) * Math.PI / 180;
            return { x: rOuter + r * Math.cos(angle), y: rOuter + r * Math.sin(angle) };
          }
        };

        const p1 = getPos(dStart, rOuter);
        const p2 = getPos(dEnd, rOuter);
        const p3 = getPos(dEnd, rInner);
        const p4 = getPos(dStart, rInner);
        const mid = getPos(dMid, (rOuter + rInner) / 2);

        // Path construction: handle segments crossing boundaries for smooth transitions
        let path = "";
        const s1 = dStart <= lStraight ? 0 : dStart <= lStraight + arcLen ? 1 : dStart <= 2 * lStraight + arcLen ? 2 : 3;
        const s2 = dEnd <= lStraight ? 0 : dEnd <= lStraight + arcLen ? 1 : dEnd <= 2 * lStraight + arcLen ? 2 : 3;

        if (s1 === s2) {
          if (s1 === 1 || s1 === 3) {
            path = `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 0 ${p4.x} ${p4.y} Z`;
          } else {
            path = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
          }
        } else {
          // Segment crosses a boundary (like number 5 or 32)
          // We split the path at the boundary for a perfect fit
          const boundary = s1 === 0 ? lStraight : s1 === 1 ? lStraight + arcLen : s1 === 2 ? 2 * lStraight + arcLen : 0;
          const pbOuter = getPos(boundary, rOuter);
          const pbInner = getPos(boundary, rInner);

          if (s1 === 1 || s1 === 3) {
            // Arc then Straight or vice versa
            path = `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 1 ${pbOuter.x} ${pbOuter.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${pbInner.x} ${pbInner.y} A ${rInner} ${rInner} 0 0 0 ${p4.x} ${p4.y} Z`;
          } else {
            path = `M ${p1.x} ${p1.y} L ${pbOuter.x} ${pbOuter.y} A ${rOuter} ${rOuter} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 0 ${pbInner.x} ${pbInner.y} L ${p4.x} ${p4.y} Z`;
          }
        }

        result.push({
          n: sequence[i],
          path,
          textPos: mid,
          pStartInner: p4
        });
      }

      return { result, viewW: lStraight + 2 * rOuter, viewH: 2 * rOuter, cxL: rOuter, cxR: rOuter + lStraight, cy: rOuter, rIn: rInner };
    }, [sequence]);

    const isHighlighted = (n: number) => {
      if (hoveredSector && SECTORS[hoveredSector as keyof typeof SECTORS].includes(n)) return true;
      if (signalNumbers.includes(n)) return true;
      if (extraSignals.some(s => s.numbers.includes(n))) return true;
      return false;
    };

    const getColorHex = (c: string) => {
      if (c === 'blue') return "#3b82f6";
      if (c === 'yellow') return "#eab308";
      if (c === 'purple') return "#a855f7";
      if (c === 'green') return "#22c55e";
      if (c === 'orange') return "#f97316";
      return "#22c55e";
    };

    const getHighlightColor = (n: number) => {
      // Check extra signals first (e.g. GPS)
      for (const sig of extraSignals) {
        if (sig.numbers.includes(n)) return getColorHex(sig.color);
      }
      // Check main signal
      if (signalNumbers.includes(n)) return getColorHex(color);
      return null;
    };

    return (
      <div className="w-full h-full flex items-center justify-center p-0.5 overflow-hidden">
        <div className="w-full max-w-[1200px] max-h-[280px] relative select-none flex items-center justify-center">
          <svg viewBox={`0 0 ${segments.viewW} ${segments.viewH}`} className="w-full h-auto drop-shadow-xl overflow-visible" preserveAspectRatio="xMidYMid meet">
            {/* Numbers Track */}
            {segments.result.map((seg) => {
              const highlighted = isHighlighted(seg.n);
              const signalColor = getHighlightColor(seg.n);
              
              return (
                <g key={seg.n} onClick={() => addNumbers([seg.n])} className="cursor-pointer group">
                  <path 
                    d={seg.path} 
                    fill={getNumberColor(seg.n)}
                    className={`transition-all duration-200 ${highlighted ? 'brightness-150' : 'group-hover:brightness-125'}`}
                  />
                  {signalColor && (
                    <path 
                      d={seg.path} 
                      fill="none"
                      stroke={signalColor}
                      strokeWidth="8"
                      className="animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 12px ' + signalColor + ')' }}
                    />
                  )}
                  <text 
                    x={seg.textPos.x} 
                    y={seg.textPos.y} 
                    fill="white" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className="text-[28px] font-black pointer-events-none drop-shadow-lg"
                  >
                    {seg.n}
                  </text>
                </g>
              );
            })}

            {/* Inner Area Background (Transparent) */}
            <path 
              d={`M ${segments.cxL} ${segments.cy - segments.rIn} L ${segments.cxR} ${segments.cy - segments.rIn} A ${segments.rIn} ${segments.rIn} 0 0 1 ${segments.cxR} ${segments.cy + segments.rIn} L ${segments.cxL} ${segments.cy + segments.rIn} A ${segments.rIn} ${segments.rIn} 0 0 1 ${segments.cxL} ${segments.cy - segments.rIn} Z`}
              fill="transparent"
            />

            {/* Sector Buttons */}
            <g>
              {/* Dividers */}
              {/* Voisins / Orphelins (Boundary 8 and 28) */}
              <line 
                x1={segments.result[8].pStartInner.x} y1={segments.result[8].pStartInner.y} 
                x2={segments.result[28].pStartInner.x} y2={segments.result[28].pStartInner.y} 
                stroke="white" strokeWidth="2" strokeOpacity="0.4" 
              />
              
              {/* Inclined Tiers Divider (Boundary 11 to Boundary 23) */}
              <line 
                x1={segments.result[11].pStartInner.x} y1={segments.result[11].pStartInner.y} 
                x2={segments.result[23].pStartInner.x} y2={segments.result[23].pStartInner.y} 
                stroke="white" strokeWidth="2" strokeOpacity="0.6" 
              />

              {/* Zero Divider (Boundary 3 and 33) */}
              <line 
                x1={segments.result[3].pStartInner.x} y1={segments.result[3].pStartInner.y} 
                x2={segments.result[33].pStartInner.x} y2={segments.result[33].pStartInner.y} 
                stroke="white" strokeWidth="2" strokeOpacity="0.3" 
              />

              {/* Jeu Zero */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSector('ZERO')}
                onMouseLeave={() => setHoveredSector(null)}
              >
                <circle cx={(segments.cxL - segments.rIn + segments.result[3].pStartInner.x) / 2} cy={segments.cy} r="100" fill="transparent" />
                <text x={(segments.cxL - segments.rIn + segments.result[3].pStartInner.x) / 2} y={segments.cy} fill="white" textAnchor="middle" dominantBaseline="middle" className="text-[22px] font-black uppercase tracking-widest">ZERO</text>
              </g>

              {/* Voisins */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSector('VOISINS')}
                onMouseLeave={() => setHoveredSector(null)}
              >
                <path d={`M ${segments.result[3].pStartInner.x} ${segments.cy - segments.rIn} L ${segments.result[8].pStartInner.x} ${segments.cy - segments.rIn} L ${segments.result[8].pStartInner.x} ${segments.cy + segments.rIn} L ${segments.result[3].pStartInner.x} ${segments.cy + segments.rIn} Z`} fill="transparent" />
                <text x={(segments.result[3].pStartInner.x + segments.result[8].pStartInner.x) / 2} y={segments.cy} fill="white" textAnchor="middle" dominantBaseline="middle" className="text-[22px] font-black uppercase tracking-widest">VOISINS</text>
              </g>

              {/* Orphelins */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSector('ORPHELINS')}
                onMouseLeave={() => setHoveredSector(null)}
              >
                <path d={`M ${segments.result[8].pStartInner.x} ${segments.cy - segments.rIn} L ${segments.result[11].pStartInner.x} ${segments.cy - segments.rIn} L ${segments.result[11].pStartInner.x} ${segments.cy + segments.rIn} L ${segments.result[8].pStartInner.x} ${segments.cy + segments.rIn} Z`} fill="transparent" />
                <text x={(segments.result[8].pStartInner.x + segments.result[11].pStartInner.x) / 2} y={segments.cy} fill="white" textAnchor="middle" dominantBaseline="middle" className="text-[22px] font-black uppercase tracking-widest">ORPHELINS</text>
              </g>

              {/* Tiers */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSector('TIERS')}
                onMouseLeave={() => setHoveredSector(null)}
              >
                <path d={`M ${segments.result[11].pStartInner.x} ${segments.cy - segments.rIn} L ${segments.cxR + segments.rIn} ${segments.cy - segments.rIn} L ${segments.cxR + segments.rIn} ${segments.cy + segments.rIn} L ${segments.result[11].pStartInner.x} ${segments.cy + segments.rIn} Z`} fill="transparent" />
                <text x={(segments.result[11].pStartInner.x + segments.cxR + segments.rIn) / 2} y={segments.cy} fill="white" textAnchor="middle" dominantBaseline="middle" className="text-[22px] font-black uppercase tracking-widest">TIERS</text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  const ExpandedRouletteTable = ({ signalNumbers = [], color = "purple" }: { signalNumbers?: number[], color?: string }) => {
    const rows = [[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]];
    const getBg = (n: number) => {
      if (n === 0) return "bg-green-700";
      const realReds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return realReds.includes(n) ? "bg-red-700" : "bg-slate-950";
    };

    const ringClass = color === 'blue' ? 'ring-blue-500' : color === 'yellow' ? 'ring-yellow-500' : color === 'purple' ? 'ring-purple-500' : color === 'green' ? 'ring-green-500' : color === 'cyan' ? 'ring-cyan-500' : color === 'orange' ? 'ring-orange-500' : 'ring-purple-500';
    const shadowClass = color === 'blue' ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' : color === 'yellow' ? 'shadow-[0_0_15px_rgba(234,179,8,0.5)]' : color === 'purple' ? 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' : color === 'green' ? 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' : color === 'cyan' ? 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' : color === 'orange' ? 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'shadow-[0_0_15px_rgba(168,85,247,0.5)]';

    return (
      <div className="w-full h-full flex items-center justify-center p-0">
        <div className="w-full flex gap-0.5 h-full max-h-[125px] bg-slate-950/80 p-1 rounded-lg border border-white/10 shadow-2xl">
          <div onClick={() => addNumbers([0])} className={`w-7 flex items-center justify-center text-sm font-black rounded-l border border-white/5 ${getBg(0)} ${signalNumbers.includes(0) ? `ring-2 ${ringClass} scale-105 z-10 ${shadowClass}` : 'text-white'}`}>0</div>
          <div className="flex-1 grid grid-cols-12 gap-0.5">
            {Array.from({ length: 12 }).map((_, col) => (
              <div key={col} className="grid grid-rows-3 gap-0.5">
                {rows.map((row) => {
                  const n = row[col];
                  const isS = signalNumbers.includes(n);
                  return (
                    <div key={n} onClick={() => addNumbers([n])} className={`flex items-center justify-center font-black text-[9px] cursor-pointer border border-white/5 rounded transition-all ${getBg(n)} ${isS ? `ring-2 ${ringClass} scale-110 z-20 ${shadowClass}` : 'text-white'}`}>{n}</div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const IntelligenceMetricCard = ({ title, percentage, status, lastHit, colorClass = "bg-blue-500", topNumbers = [], history = [] }: any) => {
    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3 mb-3 hover:bg-slate-800/80 transition-all relative overflow-hidden group shadow-xl backdrop-blur-md">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${colorClass} opacity-60 group-hover:opacity-100 transition-opacity`} />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase text-white/90 flex items-center gap-1.5 tracking-tight">
              {status === 'Quente' ? <Flame className="w-3.5 h-3.5 text-orange-500" /> : <Activity className="w-3.5 h-3.5 text-blue-400" />}
              {title}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {lastHit === null ? '0' : lastHit} rds delay
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              <span className="text-xs font-black text-white">{percentage.toFixed(0)}%</span>
              {percentage > 50 ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-slate-600" />}
            </div>
            <Badge className={`text-[8px] font-black uppercase mt-1.5 px-2 py-0 rounded transition-colors ${status === 'Quente' || status === 'Dominante' ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-slate-800 text-slate-400'}`}>{status}</Badge>
          </div>
        </div>
        
        {/* Removed redundant number chips and history from metric cards for extreme clarity as requested */}

        <div className="h-1.5 w-full bg-slate-950/40 rounded-full overflow-hidden mt-3 shadow-inner">
          <div className={`h-full ${colorClass} transition-all duration-1000 opacity-70 group-hover:opacity-100 group-hover:brightness-125`} style={{ width: `${Math.min(percentage * 2, 100)}%` }} />
        </div>
      </div>
    );
  };

  const getDirAbbr = (dir: string) => {
    const map: Record<string, string> = {
      'HORARIO_LONGO': 'Tiers',
      'ANTI_LONGO': 'Orph',
      'ANTI_MEDIO': 'Vois',
      'HORARIO_MEDIO': 'Zero',
      'HORARIO_CURTO': 'HC',
      'ANTI_CURTO': 'AC',
      'PARADO': 'P'
    };
    return map[dir] || dir;
  };

  const gpsLabelMap: Record<string, string> = {
    'HORARIO_LONGO': 'Rota Longa Horária',
    'ANTI_LONGO': 'Rota Longa Anti-Horária',
    'ANTI_MEDIO': 'Rota Média Anti-Horária',
    'HORARIO_MEDIO': 'Rota Média Horária',
    'HORARIO_CURTO': 'Rota Curta Horária',
    'ANTI_CURTO': 'Rota Curta Anti-Horária',
    'PARADO': 'Repetição (Parado)'
  };

  const gpsColorMap: Record<string, string> = {
    'HORARIO_LONGO': 'bg-slate-800',
    'ANTI_LONGO': 'bg-blue-800',
    'ANTI_MEDIO': 'bg-slate-400',
    'HORARIO_MEDIO': 'bg-orange-800',
    'HORARIO_CURTO': 'bg-slate-600',
    'ANTI_CURTO': 'bg-slate-600',
    'PARADO': 'bg-slate-900'
  };

  const regionColorMap: Record<string, string> = {
    'Zero': 'bg-orange-600',
    'Voisins': 'bg-slate-100',
    'Tiers': 'bg-slate-900',
    'Orphelins': 'bg-blue-600'
  };

  const signals = activeTab === 'main' ? mainRobotSignals : activeTab === 'geo' ? geometricSignals : activeTab === 'casas' ? casasSignals : activeTab === 'pelayo' ? pelayoSignals : activeTab === 'gps' ? gpsSignals : activeTab === 'puxam' ? triangulacaoSignals : activeTab === 'escadinha' ? escadinhaSignals : mascaradosSignals;
  const currentSignal = activeTab === 'main' ? currentMainSignal : activeTab === 'geo' ? currentGeometricSignal : activeTab === 'casas' ? currentCasasSignal : activeTab === 'pelayo' ? currentPelayoSignal : activeTab === 'gps' ? currentGpsSignal : activeTab === 'puxam' ? currentTriangulacaoSignal : activeTab === 'escadinha' ? currentEscadinhaSignal : currentMascaradosSignal;

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 p-2 overflow-hidden flex flex-col gap-2 font-sans relative">
      <div className="flex items-center justify-between bg-slate-900 border border-white/10 p-3 rounded-2xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg ring-1 ring-white/10"><Bot className="w-5.5 h-5.5 text-white" /></div>
          <div>
            <h1 className="text-[15px] font-black uppercase tracking-tighter text-white leading-none">ABRACADABRA</h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Sinais com Acompanhamento em Tempo Real</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Input value={inputNumbers} onChange={e => setInputNumbers(e.target.value)} placeholder="Inserir..." onKeyDown={e => e.key === "Enter" && addNumbers()} className="w-28 h-10 text-xs bg-slate-800 border-white/10 font-black text-center" />
          <Button onClick={() => setReverseOrder(!reverseOrder)} variant={reverseOrder ? "primary" : "outline"} className="h-10 px-4 text-[10px] font-black uppercase rounded-xl"> {reverseOrder ? "Inverter" : "Direto"}</Button>
          <Button onClick={() => addNumbers()} className="h-10 px-5 text-[10px] font-black uppercase rounded-xl bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.3)]"><Target className="w-3.5 h-3.5 mr-2" /> Analisar</Button>
          <Button onClick={removeLastNumber} variant="outline" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-red-500/50 text-red-400 hover:bg-red-500/10"><Undo2 className="w-3.5 h-3.5 mr-1" /> Apagar</Button>
          <Button onClick={() => { 
            setNumberHistory([]); 
            setMainRobotSignals([]); 
            setGeometricSignals([]); 
            setCasasSignals([]); 
            setPelayoSignals([]); 
            setMascaradosSignals([]);
            setGpsSignals([]);
            setTriangulacaoSignals([]);
            setEscadinhaSignals([]);
            setCurrentMainSignal(null);
            setCurrentGeometricSignal(null);
            setCurrentCasasSignal(null);
            setCurrentPelayoSignal(null);
            setCurrentMascaradosSignal(null);
            setCurrentGpsSignal(null);
            setCurrentTriangulacaoSignal(null);
            setCurrentEscadinhaSignal(null);
          }} variant="destructive" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl">Limpar</Button>
          <Button onClick={toggleFullscreen} variant="outline" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-white/10 text-white hover:bg-white/5">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          {userProfile?.role === 'admin' && (
            <Button onClick={() => setShowUserManagement(true)} variant="outline" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-blue-500/20 text-blue-500 hover:bg-blue-500/10">
              <User className="w-3.5 h-3.5 mr-1" /> Gerenciar
            </Button>
          )}
          <Button onClick={handleLogout} variant="outline" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Sair
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* COLUNA 1: HISTÓRICO */}
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
              <option value="terminais_escadinha">Filtro: Terminais Secos</option>
              <option value="geometricos">Filtro: Geométricos</option>
              <option value="triangulo">Filtro: Triângulo</option>
              <option value="mascarados">Filtro: Mascarados</option>
            </Select>
            {colorFilter !== "casas" && (
              (colorFilter === "terminais_escadinha" || colorFilter === "mascarados") ? (
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(t => {
                    const selectedArr = subColorFilter === "all" ? [] : subColorFilter.split(',');
                    const isSelected = subColorFilter === "all" || selectedArr.includes(t.toString());
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          if (subColorFilter === "all") {
                            setSubColorFilter(t.toString());
                          } else {
                            const selected = subColorFilter.split(',');
                            if (selected.includes(t.toString())) {
                              const filtered = selected.filter(s => s !== t.toString());
                              setSubColorFilter(filtered.length === 0 ? "all" : filtered.join(','));
                            } else {
                              setSubColorFilter([...selected, t.toString()].sort().join(','));
                            }
                          }
                        }}
                        className={`h-4.5 flex items-center justify-center text-[8px] font-black rounded border transition-all ${isSelected ? (colorFilter === 'mascarados' ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_5px_rgba(234,88,12,0.4)]' : 'bg-blue-600 border-blue-400 text-white shadow-[0_0_5px_rgba(37,99,235,0.4)]') : 'bg-slate-950 border-white/5 text-slate-500 opacity-50 hover:opacity-80'}`}
                      >
                        {colorFilter === 'mascarados' ? `M${t}` : `T${t}`}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Select value={subColorFilter} onValueChange={(val: any) => setSubColorFilter(val)} className="flex-1 h-9 text-[10px] font-black bg-slate-950 border-white/10 cursor-pointer">
                  <option value="all">Todos</option>
                  {colorFilter === "terminais" ? Object.keys(terminals).map(t => <option key={t} value={t}>Terminal {t}</option>) : 
                   colorFilter === "triangulo" ? (
                     <>
                       <option value="1">Triângulo 1 (11-15-22)</option>
                       <option value="2">Triângulo 2 (17-24-28)</option>
                     </>
                   ) :
                   Object.entries(geometricPatterns).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}
                </Select>
              )
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-950/20">
            <div className="grid grid-cols-10 gap-1.5 relative">
              {numberHistory.map((n, i) => {
                const isTarget = hoveredNumber === n;
                const isSuccessor = hoveredNumber !== null && numberHistory[i + 1] === hoveredNumber;
                const isAncestor = hoveredNumber !== null && numberHistory[i - 1] === hoveredNumber;
                
                return (
                  <div 
                    key={i} 
                    onMouseEnter={() => setHoveredNumber(n)}
                    onMouseLeave={() => setHoveredNumber(null)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-black border transition-all duration-200 shadow-sm cursor-help relative group/num ${(() => {
                      if (isTarget) return "bg-white text-slate-950 border-white scale-110 z-10 ring-4 ring-white/20";
                      if (isSuccessor) return "bg-blue-500/40 text-white border-blue-400/50 scale-95 z-0";
                      if (isAncestor) return "bg-amber-500/40 text-white border-amber-400/50 scale-95 z-0";

                      if (colorFilter === "casas") {
                    if (n === 0) return "bg-green-600";
                    if (casas["0"].includes(n)) return "bg-purple-600 shadow-[0_0_5px_rgba(147,51,234,0.3)]";
                    if (casas["10"].includes(n)) return "bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.3)]";
                    if (casas["20"].includes(n)) return "bg-emerald-600 shadow-[0_0_5px_rgba(5,150,105,0.3)]";
                    if (casas["30"].includes(n)) return "bg-rose-600 shadow-[0_0_5px_rgba(225,29,72,0.3)]";
                    return getNumberColorClass(n);
                  }
                  if (colorFilter === "triangulo") {
                    if (n === 0) return "bg-green-600";
                    const t1Full = [...new Set(triangle1Base.flatMap(num => [num, ...getCorrectNeighbors(num, 2)]))];
                    const t2Full = [...new Set(triangle2Base.flatMap(num => [num, ...getCorrectNeighbors(num, 2)]))];
                    
                    const isT1 = t1Full.includes(n);
                    const isT2 = t2Full.includes(n);
                    
                    if (subColorFilter === "1") return isT1 ? "bg-cyan-600 shadow-[0_0_5px_rgba(8,145,178,0.4)]" : getNumberColorClass(n);
                    if (subColorFilter === "2") return isT2 ? "bg-purple-600 shadow-[0_0_5px_rgba(147,51,234,0.4)]" : getNumberColorClass(n);
                    
                    if (isT1) return "bg-cyan-600 shadow-[0_0_5px_rgba(8,145,178,0.4)]";
                    if (isT2) return "bg-purple-600 shadow-[0_0_5px_rgba(147,51,234,0.4)]";
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
                  if (colorFilter === "terminais_escadinha") {
                    if (n === 0) return "bg-green-600";
                    const t = n % 10;
                    const isMatch = subColorFilter === "all" || subColorFilter.split(',').includes(t.toString());
                    return isMatch ? getTerminalColor(n) : getNumberColorClass(n);
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
                  if (colorFilter === "mascarados") {
                    if (n === 0) return "bg-green-600";
                    const selectedGroups = subColorFilter === "all" ? ["0","1","2","3","4","5","6","7","8","9"] : subColorFilter.split(',');
                    const matchedGroup = selectedGroups.find(g => mascaradosGroups[g] && mascaradosGroups[g].includes(n));
                    return matchedGroup ? getMascaradoGroupColor(matchedGroup) : getNumberColorClass(n);
                  }
                  return getNumberColorClass(n);
                })()}`}>
                  {n}
                  {isTarget && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                  )}
                </div>
              )})}
            </div>
          </div>
        </Card>

        {/* COLUNA 2: ANÁLISE PRINCIPAL */}
        <Card className="col-span-6 bg-slate-900 border-white/10 flex flex-col overflow-hidden relative shadow-2xl rounded-2xl">
          <div className="flex bg-slate-950 p-2 gap-2 border-b border-white/10 shrink-0">
            {[
              { id: 'main', icon: Bot, label: 'Terminais' }, 
              { id: 'geo', icon: Shapes, label: 'Geométricos' }, 
              { id: 'pelayo', icon: Group, label: 'Pelayo' }, 
              { id: 'casas', icon: Landmark, label: 'Casas' }, 
              { id: 'mascarados', icon: ArrowRightLeft, label: 'Mascarados' },
              { id: 'gps', icon: Compass, label: 'GPS' },
              { id: 'puxam', icon: Zap, label: 'Triângulo' },
              { id: 'escadinha', icon: TrendingUp, label: 'Escadinha' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all border ${activeTab === tab.id ? 'bg-slate-800 border-white/20 shadow-lg text-white' : 'border-transparent opacity-40 hover:opacity-60 text-slate-400'}`}>
                <tab.icon className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <PerformanceDashboard signals={signals} tabId={activeTab} />
              
              <div className="bg-slate-950/90 border border-white/10 rounded-xl p-3.5 flex flex-col justify-center shadow-inner relative overflow-hidden group">
                {(() => {
                  const sig: any = currentSignal;
                  const config = strategyConfigs[activeTab] || { chipValue: 0.50, martingale: false, initialBankroll: 100, profit: 0 };
                  
                  if (!sig) return (
                    <div className="flex flex-col gap-2 animate-in fade-in duration-500">
                      <div className="flex flex-col items-center py-2 opacity-20 group-hover:opacity-40 transition-opacity" id="signal-sync-loader">
                        <Zap className="w-4 h-4 animate-pulse text-purple-400" />
                        <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest text-slate-400">Sincronizando Mercado...</span>
                        <div className="flex gap-0.5 mt-1.5">
                          <div className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce" />
                        </div>
                      </div>

                      <BetCalculator 
                        numbers={[]}
                        chipValue={config.chipValue}
                        setChipValue={(v) => updateStrategyConfig(activeTab, { chipValue: v })}
                        martingale={config.martingale}
                        setMartingale={(v) => updateStrategyConfig(activeTab, { martingale: v })}
                        totalProfit={config.profit}
                        initialBankroll={config.initialBankroll}
                        setInitialBankroll={(v) => updateStrategyConfig(activeTab, { initialBankroll: v })}
                      />
                      
                      <div className="flex items-center justify-between mt-0.5 px-0.5 opacity-20">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Gales:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(g => (
                              <div key={g} className="w-3.5 h-3.5 rounded-full border border-white/10 flex items-center justify-center text-[7px] font-black text-slate-600 font-black">
                                {g}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="text-[8px] font-black text-slate-600 uppercase cursor-not-allowed">Parar</button>
                           <button onClick={forceNewAnalysis} className="text-[8px] font-black text-slate-500 hover:text-orange-400 transition-colors uppercase">Novo</button>
                        </div>
                      </div>
                    </div>
                  );

                  const bg = { blue: 'bg-blue-600', yellow: 'bg-yellow-500', green: 'bg-green-600', purple: 'bg-purple-600', orange: 'bg-orange-600' }[sig?.color as string || 'blue'];

                  if (activeTab === 'mascarados') {
                    return (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between bg-orange-600/10 p-1 rounded-lg border border-orange-600/20 shadow-lg">
                          <div className="flex items-center gap-1.5 px-1 text-[10px] font-black uppercase text-white tracking-widest">
                            <div className="p-1 bg-orange-600 rounded">
                              <Activity className="w-3 h-3 text-white" />
                            </div>
                            SINAL ATIVO
                          </div>
                          <Badge className="bg-orange-600 text-white font-black text-[8px] h-4 px-2 tracking-tighter">{sig.confidence.toFixed(0)}% CONF.</Badge>
                        </div>
                        
                        {/* Removed redundant pattern/region boxes for extreme clarity */}
                        
                        <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 shadow-inner flex flex-col items-center justify-center min-h-[40px]">
                          <p className="text-[12px] font-black text-orange-400 uppercase tracking-widest text-center leading-tight">
                             {sig.strategy}
                          </p>
                        </div>

                        <BetCalculator 
                          numbers={sig.numbers}
                          chipValue={config.chipValue}
                          setChipValue={(v) => updateStrategyConfig(activeTab, { chipValue: v })}
                          martingale={config.martingale}
                          setMartingale={(v) => updateStrategyConfig(activeTab, { martingale: v })}
                          totalProfit={config.profit}
                          initialBankroll={config.initialBankroll}
                          setInitialBankroll={(v) => updateStrategyConfig(activeTab, { initialBankroll: v })}
                        />

                        <div className="flex items-center justify-between mt-0.5 px-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Gales:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3].map(g => (
                                <div key={g} className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-black ${sig.testedRounds?.length >= g ? 'bg-green-600 border-green-400 text-white' : 'border-white/10 text-slate-600'}`}>
                                  {g}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                             <button onClick={cancelCurrentSignal} className="text-[8px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase">Parar</button>
                             <button onClick={forceNewAnalysis} className="text-[8px] font-black text-slate-500 hover:text-orange-400 transition-colors uppercase">Novo</button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (activeTab === 'puxam') {
                    return (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between bg-cyan-600/10 p-1 rounded-lg border border-cyan-600/20 shadow-lg">
                          <div className="flex items-center gap-1.5 px-1 text-[10px] font-black uppercase text-white tracking-widest">
                            <div className="p-1 bg-cyan-600 rounded">
                              <Zap className="w-3 h-3 text-white" />
                            </div>
                            SINAL ATIVO
                          </div>
                          <Badge className="bg-cyan-600 text-white font-black text-[8px] h-4 px-2 tracking-tighter shrink-0">{sig.confidence.toFixed(0)}% CONF.</Badge>
                        </div>
                        
                        <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 shadow-inner flex flex-col items-center justify-center min-h-[40px]">
                          <p className="text-[12px] font-black text-cyan-400 uppercase tracking-widest text-center leading-tight">
                            {sig.strategy}
                          </p>
                        </div>

                        <BetCalculator 
                          numbers={sig.numbers}
                          chipValue={config.chipValue}
                          setChipValue={(v) => updateStrategyConfig(activeTab, { chipValue: v })}
                          martingale={config.martingale}
                          setMartingale={(v) => updateStrategyConfig(activeTab, { martingale: v })}
                          totalProfit={config.profit}
                          initialBankroll={config.initialBankroll}
                          setInitialBankroll={(v) => updateStrategyConfig(activeTab, { initialBankroll: v })}
                        />

                        <div className="flex items-center justify-between mt-0.5 px-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[6px] font-black text-slate-600 uppercase">Gales:</span>
                            <div className="flex gap-1">
                              {[1].map(g => (
                                <div key={g} className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-black ${sig.testedRounds?.length >= g ? 'bg-green-600 border-green-400 text-white' : 'border-white/10 text-slate-600'}`}>
                                  {g}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                             <button onClick={cancelCurrentSignal} className="text-[8px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase">Parar</button>
                             <button onClick={forceNewAnalysis} className="text-[8px] font-black text-slate-500 hover:text-cyan-400 transition-colors uppercase">Novo</button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (activeTab === 'escadinha') {
                    return (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between bg-blue-600/10 p-1 rounded-lg border border-blue-600/20 shadow-lg">
                          <div className="flex items-center gap-1.5 px-1 text-[10px] font-black uppercase text-white tracking-widest">
                            <div className="p-1 bg-blue-600 rounded">
                              <TrendingUp className="w-3 h-3 text-white" />
                            </div>
                            SINAL ATIVO
                          </div>
                          <Badge className="bg-blue-600 text-white font-black text-[8px] h-4 px-2 tracking-tighter">{sig.confidence.toFixed(0)}% CONF.</Badge>
                        </div>
                        
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 shadow-inner flex flex-col items-center justify-center min-h-[40px]">
                          <p className="text-[12px] font-black text-blue-400 uppercase tracking-widest text-center leading-tight">
                            {sig.strategy}
                          </p>
                        </div>

                        <BetCalculator 
                          numbers={sig.numbers}
                          chipValue={config.chipValue}
                          setChipValue={(v) => updateStrategyConfig(activeTab, { chipValue: v })}
                          martingale={config.martingale}
                          setMartingale={(v) => updateStrategyConfig(activeTab, { martingale: v })}
                          totalProfit={config.profit}
                          initialBankroll={config.initialBankroll}
                          setInitialBankroll={(v) => updateStrategyConfig(activeTab, { initialBankroll: v })}
                        />

                        <div className="flex items-center justify-between mt-0.5 px-0.5">
                           <div className="flex items-center gap-1.5">
                            <span className="text-[6px] font-black text-slate-600 uppercase">Gales:</span>
                            <div className="flex gap-1">
                              {[1, 2].map(g => (
                                <div key={g} className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-black ${sig.testedRounds?.length >= g ? 'bg-green-600 border-green-400 text-white' : 'border-white/10 text-slate-600'}`}>
                                  {g}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                             <button onClick={cancelCurrentSignal} className="text-[8px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase">Parar</button>
                             <button onClick={forceNewAnalysis} className="text-[8px] font-black text-slate-500 hover:text-white transition-colors uppercase">Novo</button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between bg-slate-800/20 p-1 rounded-lg border border-white/5 shadow-lg">
                        <div className="flex items-center gap-1.5 px-1 text-[10px] font-black uppercase text-white tracking-widest">
                           <div className={`p-1 ${bg} rounded shadow-sm opacity-80 shrink-0`}>
                              <Activity className="w-2.5 h-2.5 text-white" />
                           </div>
                           SINAL ATIVO
                        </div>
                        <Badge className={`${bg} text-white font-black text-[8px] h-4 px-2 tracking-tighter shrink-0`}>{sig.confidence.toFixed(0)}% CONF.</Badge>
                      </div>
                      
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 shadow-inner flex flex-col items-center justify-center min-h-[40px]">
                        <p className="text-[12px] font-black text-white uppercase tracking-widest text-center leading-tight">
                          {sig.strategy}
                        </p>
                      </div>

                      <BetCalculator 
                        numbers={sig.numbers || sig.predictedNumbers || []}
                        chipValue={config.chipValue}
                        setChipValue={(v) => updateStrategyConfig(activeTab, { chipValue: v })}
                        martingale={config.martingale}
                        setMartingale={(v) => updateStrategyConfig(activeTab, { martingale: v })}
                        totalProfit={config.profit}
                        initialBankroll={config.initialBankroll}
                        setInitialBankroll={(v) => updateStrategyConfig(activeTab, { initialBankroll: v })}
                      />

                      <div className="flex items-center justify-between mt-0.5 px-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Status:</span>
                          <div className="flex flex-wrap gap-1">
                            {sig.testedRounds && sig.testedRounds.length > 0 ? (
                              sig.testedRounds.map((rn: number, idx: number) => (
                                <div key={idx} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white ${getNumberColorClass(rn)} shadow-md border border-white/5`}>
                                  {rn}
                                </div>
                              ))
                            ) : (
                              <span className="text-[6px] font-bold text-slate-700 uppercase italic">Aguardando...</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={cancelCurrentSignal} className="text-[8px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase">Parar</button>
                           <button onClick={forceNewAnalysis} className="text-[8px] font-black text-slate-500 hover:text-white transition-colors uppercase">Novo</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] relative group/race overflow-hidden">
               {activeTab === 'casas' || activeTab === 'mascarados' || activeTab === 'escadinha' ? (
                 <ExpandedRouletteTable 
                    signalNumbers={(() => {
                      if (activeTab === 'casas' && currentCasasSignal) return currentCasasSignal.numbers;
                      if (activeTab === 'mascarados' && currentMascaradosSignal) return currentMascaradosSignal.numbers;
                      if (activeTab === 'escadinha' && currentEscadinhaSignal) return currentEscadinhaSignal.numbers;
                      return [];
                    })()} 
                    color={activeTab === 'escadinha' ? 'blue' : activeTab === 'mascarados' ? 'orange' : 'purple'}
                 />
               ) : (
                 <RacetrackSVG 
                    signalNumbers={(() => {
                      if (activeTab === 'main' && currentMainSignal) return currentMainSignal.numbers;
                      if (activeTab === 'geo' && currentGeometricSignal) return currentGeometricSignal.predictedNumbers;
                      if (activeTab === 'pelayo' && currentPelayoSignal) return currentPelayoSignal.numbers;
                      if (activeTab === 'gps' && currentGpsSignal) return currentGpsSignal.numbers;
                      if (activeTab === 'puxam' && currentTriangulacaoSignal) return currentTriangulacaoSignal.numbers;
                      return [];
                    })()} 
                    color={activeTab === 'main' ? 'blue' : activeTab === 'geo' ? 'yellow' : activeTab === 'gps' ? 'purple' : activeTab === 'puxam' ? 'cyan' : 'green'} 
                    extraSignals={[]}
                 />
               )}
            </div>
          </div>
        </Card>

        {/* COLUNA 3: TENDÊNCIAS */}
        <Card className="col-span-3 bg-slate-900/50 border-white/5 flex flex-col overflow-hidden shadow-2xl rounded-2xl">
          <div className="p-4 border-b border-white/10 bg-slate-900/80 flex items-center gap-3 shrink-0">
            <BarChart3 className="w-5.5 h-5.5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[12px] font-black uppercase text-white leading-none tracking-tight">Market Intelligence</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Tendências de Mercado</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar bg-slate-950/20">
            {activeTab === 'gps' && gpsAnalysis && (
              <div className="space-y-3">
                {/* Card de Região Dominante */}
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">Região Dominante</span>
                    </div>
                    <Badge className="bg-purple-600 text-white text-[8px] font-black uppercase">{gpsAnalysis.hotRegion}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-white/5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Freq. Rota</span>
                      <span className="text-[12px] font-black text-white">{gpsAnalysis.frequencia.toFixed(0)}%</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-white/5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Repetições</span>
                      <span className="text-[12px] font-black text-white">{gpsAnalysis.repeticoes}x</span>
                    </div>
                  </div>

                  {/* Removed number chips as requested */}
                  {gpsAnalysis.targetNumbers.length === 0 && (
                    <div className="mt-2">
                       <span className="text-[9px] font-bold text-slate-500 uppercase italic">Aguardando Alvos...</span>
                    </div>
                  )}
                </div>

                {/* Análise de Regiões (Solicitado pelo Usuário) */}
                <div className="px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Análise de Regiões</span>
                </div>
                {Object.entries(gpsAnalysis.regionCounts)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([region, count]) => {
                    const percentage = ((count as number) / Math.min(numberHistory.length, 50)) * 100;
                    const lastHit = numberHistory.findIndex(n => {
                      if (region === 'Zero') return zeroGameNumbers.includes(n);
                      if (region === 'Voisins') return voisinsNumbers.includes(n);
                      if (region === 'Tiers') return tierNumbers.includes(n);
                      if (region === 'Orphelins') return orfaoNumbers.includes(n);
                      return false;
                    });
                    const regionNumbers = region === 'Zero' ? zeroGameNumbers : region === 'Voisins' ? voisinsNumbers : region === 'Tiers' ? tierNumbers : orfaoNumbers;

                    return (
                      <IntelligenceMetricCard 
                        key={region} 
                        title={region} 
                        percentage={percentage} 
                        status={region === gpsAnalysis.hotRegion ? "Dominante" : "Normal"} 
                        lastHit={lastHit === -1 ? null : lastHit} 
                        colorClass={regionColorMap[region] || "bg-slate-500"}
                        topNumbers={getSubFrequencies(regionNumbers)}
                      />
                    );
                  })
                }
              </div>
            )}
            {activeTab === 'main' && terminalAnalysis.topTerminals.map(t => {
              const neighborCount = t.terminal >= 7 ? 2 : 1;
              const allNumbersInScope = [...new Set([...terminals[t.terminal], ...terminals[t.terminal].flatMap(num => getCorrectNeighbors(num, neighborCount))])];
              return (
                <IntelligenceMetricCard 
                  key={t.terminal} 
                  title={`Terminal ${t.terminal} (+${neighborCount} Vizinhos)`} 
                  percentage={Math.min(t.score * 100, 99)} 
                  status={t.positions[0] < 5 ? "Quente" : "Normal"} 
                  lastHit={t.positions[0] === -1 ? 0 : t.positions[0]} 
                  colorClass="bg-blue-500"
                  topNumbers={getSubFrequencies(allNumbersInScope)}
                />
              );
            })}
            {activeTab === 'geo' && geometricAnalysis.map(p => {
              const nbrCount = (p.patternId.includes('line') || p.patternId.includes('square_1')) ? 1 : 2;
              const allNumbersInScope = [...new Set([...p.numbers, ...p.numbers.flatMap(num => getCorrectNeighbors(num, nbrCount))])];
              return (
                <IntelligenceMetricCard 
                  key={p.patternId} 
                  title={p.name} 
                  percentage={p.hitRate} 
                  status={p.isHot ? "Quente" : "Normal"} 
                  lastHit={numberHistory.findIndex(n => allNumbersInScope.includes(n))} 
                  colorClass="bg-yellow-500"
                  topNumbers={getSubFrequencies(allNumbersInScope)}
                />
              );
            })}
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
            {activeTab === 'pelayo' && (
              <div className="space-y-3">
                {pelayoAnalysis.caminhoDaBola && (
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-green-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Caminho da Bola</span>
                      </div>
                      <Badge className="bg-green-600 text-white text-[8px] font-black uppercase">{pelayoAnalysis.caminhoDaBola.jumpType}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-950/50 rounded-lg p-2 border border-white/5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Último Salto</span>
                        <span className="text-[12px] font-black text-white">{pelayoAnalysis.caminhoDaBola.lastJump > 0 ? '+' : ''}{pelayoAnalysis.caminhoDaBola.lastJump} casas</span>
                      </div>
                      <div className="bg-slate-950/50 rounded-lg p-2 border border-white/5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Direção</span>
                        <span className="text-[12px] font-black text-white">{pelayoAnalysis.caminhoDaBola.direction}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 rounded-lg p-2 border border-white/5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Padrão Ativo</span>
                      <span className="text-[10px] font-black text-green-400 uppercase">{pelayoAnalysis.caminhoDaBola.pattern}</span>
                    </div>
                  </div>
                )}
                
                <div className="px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Análise de Regiões</span>
                </div>
                {pelayoAnalysis.regions.map(r => {
                  const strictRegion = regions[r.name];
                  return (
                    <IntelligenceMetricCard 
                      key={r.name} 
                      title={`${r.name}`} 
                      percentage={r.percentage} 
                      status={r.status} 
                      lastHit={r.lastHit} 
                      colorClass="bg-green-500"
                      topNumbers={getSubFrequencies(strictRegion)}
                    />
                  );
                })}
              </div>
            )}
            {activeTab === 'mascarados' && (
              <>
                {(() => {
                  const cooldown = numberHistory.length - lastMascaradosSignalEndIndex;
                  if (cooldown < 3 && !currentMascaradosSignal) {
                    return (
                      <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center gap-3 shadow-lg animate-pulse">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Aguardando Novo Padrão</p>
                          <p className="text-xs font-bold text-white leading-none">O robô está observando o mercado ({3 - cooldown} rds restantes)</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="px-2 py-1 mb-2 bg-slate-800/50 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Intelligence</span>
                  <Badge className="bg-orange-600 text-[8px] h-4">Tendências de Mercado</Badge>
                </div>

                <div className="mb-4 space-y-4">
                  <div className="px-2 py-1 bg-slate-900/80 rounded border border-white/5">
                    <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest">Análise de Tendências Globais (Histórico)</span>
                  </div>

                  {/* Mascarados Mais Fortes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Mascarados Mais Fortes</span>
                      <span className="text-[8px] text-slate-500 uppercase">Frequência</span>
                    </div>
                    <div className="grid gap-2">
                      {mascaradosAnalysis.globalTrends.topMascarados.map((m) => (
                        <div key={m.value} className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-white">MASCARADO {m.value}</span>
                            <span className="text-[10px] font-black text-orange-400">{m.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(m.percentage * 3, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repetições Dominantes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Repetições Dominantes (Últimas 30)</span>
                      <span className="text-[8px] text-slate-500 uppercase">Frequência</span>
                    </div>
                    <div className="grid gap-2">
                      {mascaradosAnalysis.globalTrends.topRepetitions.map((r) => (
                        <div key={r.value} className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-white">MASCARADO {r.value}</span>
                            <span className="text-[10px] font-black text-red-400">{r.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(r.percentage * 3, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Escadinhas Frequentes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Escadinhas Frequentes</span>
                      <span className="text-[8px] text-slate-500 uppercase">Ocorrências</span>
                    </div>
                    <div className="grid gap-2">
                      {mascaradosAnalysis.globalTrends.topEscadinhas.map((e) => (
                        <div key={e.pair} className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-white">{e.pair}</span>
                            <span className="text-[10px] font-black text-blue-400">{e.count}x</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(e.percentage * 10, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correlações Dominantes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Correlações Dominantes</span>
                      <span className="text-[8px] text-slate-500 uppercase">Assertividade</span>
                    </div>
                    <div className="grid gap-2">
                      {mascaradosAnalysis.globalTrends.topCorrelations.map((c) => (
                        <div key={`${c.from}-${c.to}`} className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-white">{c.from} chama {c.to}</span>
                            <span className="text-[10px] font-black text-green-400">{c.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(c.percentage * 15, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'puxam' && (
              <div className="space-y-4">
                <div className="px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Intelligence</span>
                  <Badge className="bg-cyan-600 text-[8px] h-4">Triângulo de Precisão</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Triângulo 1 (11-15-22)</span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-cyan-400">{triangulacaoAnalysis.triangleStats[1].rate.toFixed(1)}%</span>
                        <span className="text-[8px] text-slate-500 uppercase">Amostra: {triangulacaoAnalysis.triangleStats[1].total}x</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${triangulacaoAnalysis.triangleStats[1].rate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Triângulo 2 (17-24-28)</span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-cyan-400">{triangulacaoAnalysis.triangleStats[2].rate.toFixed(1)}%</span>
                        <span className="text-[8px] text-slate-500 uppercase">Amostra: {triangulacaoAnalysis.triangleStats[2].total}x</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${triangulacaoAnalysis.triangleStats[2].rate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-cyan-400" /> Análise de Fluxo
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Repetições Seguidas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Repetições Seguidas</span>
                        <Badge className="bg-slate-950 text-[7px] h-3.5 border-white/5 opacity-50">Sequências de acertos</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Sequência Atual */}
                        <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex flex-col justify-center">
                          <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Sequência Atual</span>
                          {triangulacaoAnalysis.flowAnalysis.currentStreak ? (
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full animate-pulse ${triangulacaoAnalysis.flowAnalysis.currentStreak.type === 1 ? 'bg-cyan-500' : 'bg-purple-500'}`} />
                              <span className="text-[11px] font-black text-white">T{triangulacaoAnalysis.flowAnalysis.currentStreak.type}</span>
                              <span className="text-[10px] font-bold text-green-400">{triangulacaoAnalysis.flowAnalysis.currentStreak.count}x seguidas</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-600 italic">Nenhuma ativa</span>
                          )}
                        </div>

                        {/* Recordes */}
                        <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex flex-col">
                          <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Maiores Recordes</span>
                          <div className="flex flex-wrap gap-1.5">
                            {triangulacaoAnalysis.flowAnalysis.consecutiveRepetitions.slice(0, 3).map((r, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                                <span className={`w-1.5 h-1.5 rounded-full ${r.type === 1 ? 'bg-cyan-500' : 'bg-purple-500'}`} />
                                <span className="text-[9px] font-black text-slate-300">{r.count}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Números que mais chamam */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Números que mais chamam</span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {triangulacaoAnalysis.flowAnalysis.topCallers.map((c, idx) => (
                          <div key={idx} className="flex flex-col items-center bg-slate-950/50 p-1.5 rounded border border-white/5">
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white ${getNumberColorClass(c.number)}`}>
                              {c.number}
                            </div>
                            <ArrowRight className="w-2 h-2 my-0.5 text-slate-600" />
                            <span className={`text-[8px] font-black ${c.type === 1 ? 'text-cyan-400' : 'text-purple-400'}`}>T{c.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mudança de Estratégia */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Mudança de Estratégia</span>
                      <div className="grid grid-cols-2 gap-2">
                        {triangulacaoAnalysis.flowAnalysis.transitions.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-950/50 px-3 py-2 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-center">
                                <span className={`text-[9px] font-black ${t.from === 1 ? 'text-cyan-400' : 'text-purple-400'}`}>T{t.from}</span>
                                <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">De</span>
                              </div>
                              <ArrowRight className="w-3 h-3 text-slate-700" />
                              <div className="flex flex-col items-center">
                                <span className={`text-[9px] font-black ${t.to === 1 ? 'text-cyan-400' : 'text-purple-400'}`}>T{t.to}</span>
                                <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">Para</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-black text-white">{t.count}x</span>
                              <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">Total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'escadinha' && (
              <div className="space-y-4">
                <div className="px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market Intelligence</span>
                  <Badge className="bg-blue-600 text-[8px] h-4">Precisão de Terminais</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(escadinhaAnalysis.escadinhaStats)
                    .sort((a: [string, any], b: [string, any]) => b[1].rate - a[1].rate)
                    .slice(0, 2)
                    .map(([terminal, stats]: [string, any]) => (
                      <div key={terminal} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Terminal {terminal}</span>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-blue-400">{stats.rate.toFixed(1)}%</span>
                            <span className="text-[8px] text-slate-500 uppercase">Amostra: {stats.total}x</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.rate}%` }} />
                          </div>
                          <div className="mt-3 grid grid-cols-5 gap-1">
                            {terminals[parseInt(terminal)].map(n => (
                              <div key={n} className={`h-5 rounded flex items-center justify-center text-[8px] font-black text-white ${getNumberColorClass(n)}`}>{n}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* Tendências de Terminais */}
                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                    <BarChart3 className="w-3 h-3 text-blue-400" /> Tendências Globais (Últimas 50)
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Baixos x Altos */}
                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[7px] text-slate-500 font-black uppercase">Baixos / Altos</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-500" style={{ width: `${escadinhaAnalysis.terminalTrends.lowPercentage}%` }} />
                        <div className="h-full bg-indigo-500" style={{ width: `${escadinhaAnalysis.terminalTrends.highPercentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[8px] font-black">
                        <span className="text-blue-400">B: {escadinhaAnalysis.terminalTrends.lowPercentage.toFixed(0)}%</span>
                        <span className="text-indigo-400">A: {escadinhaAnalysis.terminalTrends.highPercentage.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Pares x Ímpares */}
                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[7px] text-slate-500 font-black uppercase">Pares / Ímpares</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${escadinhaAnalysis.terminalTrends.evenPercentage}%` }} />
                        <div className="h-full bg-amber-500" style={{ width: `${escadinhaAnalysis.terminalTrends.oddPercentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[8px] font-black">
                        <span className="text-emerald-400">P: {escadinhaAnalysis.terminalTrends.evenPercentage.toFixed(0)}%</span>
                        <span className="text-amber-400">I: {escadinhaAnalysis.terminalTrends.oddPercentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Quentes */}
                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[7px] text-slate-500 font-black uppercase block mb-1.5">Terminais Quentes</span>
                      <div className="flex gap-1.5">
                        {escadinhaAnalysis.terminalTrends.hotTerminals.map(t => (
                          <div key={t} className="w-6 h-6 rounded bg-blue-600 flex flex-col items-center justify-center shadow-lg border border-white/10">
                            <span className="text-[10px] font-black text-white leading-none">T{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Frios */}
                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[7px] text-slate-500 font-black uppercase block mb-1.5">Terminais Frios</span>
                      <div className="flex gap-1.5">
                        {escadinhaAnalysis.terminalTrends.coldTerminals.map(t => (
                          <div key={t} className="w-6 h-6 rounded bg-slate-800 flex flex-col items-center justify-center border border-white/5">
                            <span className="text-[10px] font-black text-slate-400 leading-none">T{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-blue-400" /> Análise de Fluxo
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Repetições Seguidas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Repetições Seguidas</span>
                        <Badge className="bg-slate-950 text-[7px] h-3.5 border-white/5 opacity-50">Sequências de acertos</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Sequência Atual */}
                        <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex flex-col justify-center">
                          <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Sequência Atual</span>
                          {escadinhaAnalysis.flowAnalysis.currentStreak ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full animate-pulse bg-blue-500" />
                              <span className="text-[11px] font-black text-white">T{escadinhaAnalysis.flowAnalysis.currentStreak.terminal}</span>
                              <span className="text-[10px] font-bold text-green-400">{escadinhaAnalysis.flowAnalysis.currentStreak.count}x seguidas</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-600 italic">Nenhuma ativa</span>
                          )}
                        </div>

                        {/* Recordes */}
                        <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5 flex flex-col">
                          <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Maiores Recordes</span>
                          <div className="flex flex-wrap gap-1.5">
                            {escadinhaAnalysis.flowAnalysis.consecutiveRepetitions.slice(0, 3).map((r, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-black text-slate-300">{r.count}x</span>
                              </div>
                            ))}
                            {escadinhaAnalysis.flowAnalysis.consecutiveRepetitions.length === 0 && (
                              <span className="text-[8px] text-slate-700 italic">Aguardando...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Números que mais chamam */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Números que mais chamam</span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {escadinhaAnalysis.flowAnalysis.topCallers.map((c, idx) => (
                          <div key={idx} className="flex flex-col items-center bg-slate-950/50 p-1.5 rounded border border-white/5">
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white ${getNumberColorClass(c.number)}`}>
                              {c.number}
                            </div>
                            <ArrowRight className="w-2 h-2 my-0.5 text-slate-600" />
                            <span className="text-[8px] font-black text-blue-400">T{c.terminal}</span>
                          </div>
                        ))}
                        {escadinhaAnalysis.flowAnalysis.topCallers.length === 0 && (
                          <div className="col-span-5 py-2 text-center text-[8px] text-slate-700 italic">Processando histórico...</div>
                        )}
                      </div>
                    </div>

                    {/* Mudança de Estratégia */}
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Mudança de Estratégia</span>
                      <div className="grid grid-cols-2 gap-2">
                        {escadinhaAnalysis.flowAnalysis.transitions.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-950/50 px-3 py-2 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black text-blue-400">T{t.from}</span>
                                <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">De</span>
                              </div>
                              <ArrowRight className="w-3 h-3 text-slate-700" />
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black text-blue-400">T{t.to}</span>
                                <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">Para</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-black text-white">{t.count}x</span>
                              <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">Total</span>
                            </div>
                          </div>
                        ))}
                        {escadinhaAnalysis.flowAnalysis.transitions.length === 0 && (
                          <div className="col-span-2 py-2 text-center text-[8px] text-slate-700 italic">Aguardando dados de fluxo...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      {showUserManagement && <UserManagement onClose={() => setShowUserManagement(false)} />}
    </div>
  );
};

export default App;
