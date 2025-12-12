import React, { useState, useRef, useEffect } from 'react';
import { Code, Send, RefreshCw, Zap, ShieldAlert, Terminal, Activity, ArrowRight, DollarSign, CheckCircle, Github, Lock, EyeOff, FileCode, AlertTriangle, Undo2, Play } from 'lucide-react';
import { analyzeCode } from './services/geminiService';
import { scanAndMaskSecrets } from './services/securityService';
import { AnalysisResult, AppState, UserMode, AnalysisItem, RiskLevel } from './types';
import AnalysisCard from './components/AnalysisCard';
import Loader from './components/Loader';
import CodeViewer from './components/CodeViewer';

// --- DEMO DATA CONSTANTS ---

const DEMO_CODE = `import React, { useEffect, useMemo, useState } from "react";

type User = { id?: string; name: string; bioHtml?: string };

const firebaseConfig = {
  apiKey: "AIzaSyD3MO_FAKE_KEY_1234567890abcd", // hardcoded secret demo
  authDomain: "vibe-demo.firebaseapp.com",
  projectId: "vibe-demo",
};

const ANALYTICS_WRITE_KEY = "sk_live_DEMO_51N0TREAL_butLooksLikeStripe"; // hardcoded secret demo

function getButtonClasses(kind: "primary" | "danger", loading: boolean) {
  // logika klas w UI, oraz zbyt dużo odpowiedzialności w jednym miejscu
  return [
    "px-3 py-2 rounded-md text-sm font-medium transition-all",
    kind === "primary" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-red-600 hover:bg-red-500",
    loading ? "opacity-60 cursor-not-allowed" : "opacity-100 cursor-pointer",
    Math.random() > 0.5 ? "tracking-wide" : "tracking-normal", // losowość w UI
  ].join(" ");
}

export default function App() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawLog, setRawLog] = useState<string>("");

  const endpoint = useMemo(() => {
    // składanie URL w runtime bez walidacji, oraz brak encode
    return \`https://example.com/api/users?search=\${query}\`;
  }, [query]);

  useEffect(() => {
    // brak cleanup, oraz interval bez kontroli, memory leak w dłuższym runtime
    const id = setInterval(() => {
      setRawLog((prev) => prev + \`\\nPing \${new Date().toISOString()}\`);
    }, 1500);

    // celowo brak: return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // brak kontroli race condition, brak abort controller
    // brak debounce, każde wpisanie litery odpala fetch
    if (query.trim().length === 0) return;

    setLoading(true);

    fetch(endpoint, {
      headers: {
        "x-analytics-key": ANALYTICS_WRITE_KEY, // wysyłanie sekretu w headerze
      },
    })
      .then((r) => r.json())
      .then((data) => {
        // brak walidacji shape, zaufanie do danych z API
        setUsers(data.users);
      })
      .catch(() => {
        // zjadanie błędów, brak info dla użytkownika
      })
      .finally(() => setLoading(false));
  }, [endpoint]);

  const onReset = () => {
    setQuery("");
    setUsers([]);
    setRawLog("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Vibe Demo Repo</h1>
          <p className="text-sm text-slate-400">
            Firebase authDomain: {firebaseConfig.authDomain}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className={getButtonClasses("danger", false)}
            title="Reset"
          >
            Reset
          </button>

          <button
            onClick={() => alert("Pretend deploy")}
            className={getButtonClasses("primary", loading)}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Run"}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-4">
        <section className="col-span-5 bg-slate-900/40 border border-slate-800 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Search</h2>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm"
            placeholder="Type to search users..."
          />

          <p className="text-xs text-slate-500 mt-2">
            Tip: type fast to trigger many fetch calls.
          </p>

          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Raw Log</h3>
            <pre className="text-xs bg-slate-950 border border-slate-800 rounded-md p-3 h-48 overflow-auto">
              {rawLog}
            </pre>
          </div>
        </section>

        <section className="col-span-7 bg-slate-900/40 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Users</h2>
            <span className="text-xs text-slate-400">
              Loaded: {users.length}
            </span>
          </div>

          <div className="space-y-3">
            {users.map((u, idx) => (
              // key={idx} celowo, niestabilność listy
              <div
                key={idx}
                className="border border-slate-800 rounded-md p-3 bg-slate-950"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm">{u.name}</strong>
                  <span className="text-xs text-slate-500">
                    {u.id ? \`id:\${u.id}\` : "no-id"}
                  </span>
                </div>

                {/* XSS risk, render HTML bez sanitizacji */}
                <div
                  className="text-sm text-slate-300 mt-2"
                  dangerouslySetInnerHTML={{
                    __html: u.bioHtml || "<i>No bio</i>",
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}`;

const DEMO_RESULT: AnalysisResult = {
  topRisk: {
    title: "CRITICAL SECURITY & XSS VULNERABILITIES",
    description: "Your code exposes production secrets (Firebase & Stripe/Analytics) to the client-side and contains a severe Cross-Site Scripting (XSS) vulnerability via `dangerouslySetInnerHTML`. An attacker could inject malicious scripts through the user bio."
  },
  summary: "This code is a minefield of React anti-patterns, security leaks, and memory management issues.",
  costOfIgnoring: "High risk of data breach (API Keys), compromised user accounts (XSS), and browser crashes (Memory Leak).",
  recommendedAction: "Sanitize `dangerouslySetInnerHTML` immediately and move API keys to server-side environment variables.",
  items: [
    {
      id: "demo-sec-1",
      problem: "Exposed API Secrets",
      lineStart: 6,
      risk: RiskLevel.HIGH,
      vibeSmell: "Hardcoded credentials in client-side code are visible to anyone via 'View Source'.",
      simplifiedExplanation: "You pasted your secret passwords directly into the code. Everyone can steal them.",
      whyDetection: "Pattern match: `apiKey` and `sk_live` detected in source.",
      timeline: {
        now: "Secrets work (but are public)",
        soon: "Bots scrape GitHub/deployments",
        later: "$50k bill from Stripe/Firebase abuse"
      },
      minimalFix: "Move to process.env",
      suggestedFixCode: `const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
};`,
      fixChecklist: ["Revoke current keys", "Use .env file", "Restrict key usage in dashboard"]
    },
    {
      id: "demo-mem-leak",
      problem: "Memory Leak in useEffect",
      lineStart: 32,
      risk: RiskLevel.MEDIUM,
      vibeSmell: "Missing cleanup function in `useEffect` for `setInterval`. Each re-mount creates a zombie timer.",
      simplifiedExplanation: "You started a timer but never stopped it. Your browser will get slower and slower.",
      whyDetection: "React Hook pattern: `setInterval` without returning `clearInterval`.",
      timeline: {
        now: "Works fine",
        soon: "App feels sluggish after navigation",
        later: "Browser tab crashes (Out of Memory)"
      },
      minimalFix: "Add return () => clearInterval(id)",
      suggestedFixCode: `  useEffect(() => {
    const id = setInterval(() => {
      setRawLog((prev) => prev + \`\\nPing \${new Date().toISOString()}\`);
    }, 1500);

    return () => clearInterval(id); // Cleanup added
  }, []);`,
      fixChecklist: ["Assign interval to variable", "Return cleanup function", "Check for other unmounted listeners"]
    },
    {
      id: "demo-race",
      problem: "Race Condition & No Debounce",
      lineStart: 41,
      risk: RiskLevel.MEDIUM,
      vibeSmell: "Network requests fire on every keystroke without cancellation. Responses may arrive out of order (Race Condition).",
      simplifiedExplanation: "Typing 'hello' sends 5 requests. If 'he' arrives last, your user sees wrong data.",
      whyDetection: "Fetch inside `useEffect` depending on input without `AbortController`.",
      timeline: {
        now: "Fast on localhost",
        soon: "Users see wrong search results",
        later: "Server overloaded by DDoS-like traffic from valid users"
      },
      minimalFix: "Add AbortController & Debounce",
      suggestedFixCode: `  useEffect(() => {
    if (query.trim().length === 0) return;
    
    // Simple debounce + abort logic would go here
    const timeoutId = setTimeout(() => {
       setLoading(true);
       // ... fetch logic
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);`,
      fixChecklist: ["Implement Debounce (300ms)", "Use AbortController", "Handle component unmount"]
    },
    {
      id: "demo-key",
      problem: "Unstable List Keys",
      lineStart: 121,
      risk: RiskLevel.LOW,
      vibeSmell: "Using array index `key={idx}` causes render bugs and state loss when list order changes.",
      simplifiedExplanation: "React gets confused when you sort or filter this list because you named items '1, 2, 3' instead of their real IDs.",
      whyDetection: "Map iteration using index as key prop.",
      timeline: {
        now: "Renders okay",
        soon: "Input focus jumps randomly",
        later: "Data corruption in form inputs inside lists"
      },
      minimalFix: "Use u.id instead of idx",
      suggestedFixCode: `            {users.map((u) => (
              <div
                key={u.id} // Fixed: used stable ID
                className="border border-slate-800 rounded-md p-3 bg-slate-950"
              >`,
      fixChecklist: ["Ensure data has unique IDs", "Use unique ID as key", "Avoid index unless list is static"]
    },
    {
      id: "demo-xss",
      problem: "XSS Vulnerability",
      lineStart: 133,
      risk: RiskLevel.HIGH,
      vibeSmell: "Direct use of `dangerouslySetInnerHTML` with unsanitized API data. This is a text-book vector for script injection.",
      simplifiedExplanation: "You are letting the internet inject code into your website. This is how accounts get stolen.",
      whyDetection: "Usage of `dangerouslySetInnerHTML` without visible sanitization library.",
      timeline: {
        now: "Displays HTML bios",
        soon: "Malicious user sets bio to <script>...",
        later: "Complete user session hijacking"
      },
      minimalFix: "Sanitize with DOMPurify",
      suggestedFixCode: `                <div
                  className="text-sm text-slate-300 mt-2"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(u.bioHtml || "<i>No bio</i>"),
                  }}
                />`,
      fixChecklist: ["Install DOMPurify", "Wrap all dangerous HTML", "Ideally: Use Markdown instead of HTML"]
    }
  ]
};

const App: React.FC = () => {
  // Code History Management
  const [codeHistory, setCodeHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Wrapper for setCode to handle history
  const setCode = (newCode: string, addToHistory = true) => {
    if (addToHistory && newCode !== codeHistory[historyIndex]) {
        const newHistory = codeHistory.slice(0, historyIndex + 1);
        newHistory.push(newCode);
        setCodeHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    } else if (!addToHistory) {
       // Manual typing - handled in onChange but keeping this signature
    }
  };

  const currentCode = codeHistory[historyIndex];
  
  const handleUndo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          // FIX: Do not close the report or clear results. 
          // Just reverting the code is enough.
      }
  };

  const handleManualCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      const newHistory = [...codeHistory];
      newHistory[historyIndex] = val;
      setCodeHistory(newHistory);
  };

  const handleDemoLoad = () => {
      setCode(DEMO_CODE, true);
  };

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userMode, setUserMode] = useState<UserMode>(UserMode.SENIOR);
  
  // UI Modes
  const [inputMode, setInputMode] = useState<'editor' | 'github'>('editor');
  const [githubUrl, setGithubUrl] = useState('');
  
  // Security Checks
  const [checks, setChecks] = useState({
    noActiveSecrets: false,
    readOnlyAware: false
  });

  // Fixed Issues Tracking
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());

  // State for interaction
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState<string>('');
  
  // Ref for scrolling the list
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Simulates fetching code from GitHub
  const handleGithubFetch = async () => {
      if (!githubUrl.trim()) return;
      
      setAppState(AppState.ANALYZING);
      
      // Simulate network delay
      setTimeout(() => {
          // Mocked response simulating a file with a secret
          const mockCode = `import { initializeApp } from "firebase/app";

// TODO: Refactor this into env variables later
// Vibe coding session 2024
const firebaseConfig = {
  apiKey: "AIzaSyD-1234567890abcdef1234567890abcde", // Explicitly exposed for demo
  authDomain: "vibe-app.firebaseapp.com",
  projectId: "vibe-app",
};

const app = initializeApp(firebaseConfig);

export const getUserData = (userId) => {
    // Direct database access in component logic? maybe
    return db.collection('users').doc(userId).get();
}`;
          setCode(mockCode, true);
          setInputMode('editor'); // Switch back to editor to show code
          setAppState(AppState.IDLE);
          setGithubUrl('');
      }, 1500);
  };

  const handleAnalyze = async () => {
    if (!currentCode.trim()) return;

    // Reset previous fix state on new scan
    setFixedIssueIds(new Set());

    // --- DEMO OVERRIDE LOGIC ---
    // If the current code matches the Demo Code, we simulate a report
    // to ensure a consistent, perfect demo experience without burning API tokens.
    if (currentCode.trim() === DEMO_CODE.trim()) {
        setAppState(AppState.ANALYZING);
        setError(null);
        setSelectedIssueId(null);
        
        setTimeout(() => {
            setResult(DEMO_RESULT);
            setAnalysisTime("0.4");
            setAppState(AppState.RESULTS);
        }, 2000); // 2 second delay as requested
        return;
    }
    // ---------------------------

    if (!checks.noActiveSecrets || !checks.readOnlyAware) return;

    setAppState(AppState.ANALYZING);
    setError(null);
    setSelectedIssueId(null);
    const start = performance.now();

    try {
      // 1. Run Local Security Scan
      const { maskedCode, securityIssues } = scanAndMaskSecrets(currentCode);
      
      // Update UI with masked code immediately so user sees we are safe
      // IMPORTANT: We update history here so Undo works against the mask if needed
      if (maskedCode !== currentCode) {
        setCode(maskedCode, true);
      }

      // 2. Run AI Analysis on MASKED code
      const analysis = await analyzeCode(maskedCode);
      
      // 3. Merge Results
      // Prepend security issues to be at the top
      const mergedItems = [...securityIssues, ...analysis.items];
      
      // If we found security issues but AI didn't flag a "Top Risk", override it
      let finalTopRisk = analysis.topRisk;
      if (securityIssues.length > 0) {
          finalTopRisk = {
              title: "CRITICAL SECURITY LEAK DETECTED",
              description: `We detected ${securityIssues.length} hardcoded secret(s) in your code. These must be revoked immediately.`
          };
      }

      setResult({
          ...analysis,
          topRisk: finalTopRisk,
          items: mergedItems
      });

      setAppState(AppState.RESULTS);
      const end = performance.now();
      setAnalysisTime(((end - start) / 1000).toFixed(1));
    } catch (err) {
      setError("Analysis interrupted. Please ensure your API key is valid.");
      setAppState(AppState.ERROR);
    }
  };

  const handleFix = (item: AnalysisItem) => {
      if (!item.suggestedFixCode || !item.lineStart) return;

      const lines = currentCode.split('\n');
      const lineIndex = item.lineStart - 1;

      if (lineIndex >= 0 && lineIndex < lines.length) {
          // Logic: Comment out the old line, insert the new code
          const oldLine = lines[lineIndex];
          const indentation = oldLine.match(/^\s*/)?.[0] || '';
          
          // Apply fix
          // We'll replace the line directly for a cleaner "Fix" experience, 
          // but we rely on 'Undo' if they want it back.
          lines[lineIndex] = `${indentation}${item.suggestedFixCode} // Fixed by Vibe AI`;
          
          const newCode = lines.join('\n');
          setCode(newCode, true);
          
          // Update fixed status
          setFixedIssueIds(prev => {
              const next = new Set(prev);
              next.add(item.id);
              return next;
          });

          // Optional: Scroll to the fix
          setSelectedIssueId(item.id);
      }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setError(null);
    setSelectedIssueId(null);
    setChecks({ noActiveSecrets: false, readOnlyAware: false });
    setFixedIssueIds(new Set());
  };

  // Scroll to card when selectedIssueId changes (e.g. from clicking code)
  useEffect(() => {
      if (selectedIssueId && itemRefs.current.has(selectedIssueId)) {
          itemRefs.current.get(selectedIssueId)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
          });
      }
  }, [selectedIssueId]);

  // Derived metrics for display
  const criticalCount = result ? result.items.filter(i => i.risk === RiskLevel.HIGH).length : 0;
  const lineCount = currentCode.split('\n').length;

  return (
    <div className="flex flex-col h-screen w-full mx-auto gap-0 bg-tech-bg text-tech-primary overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="flex justify-between items-center border-b border-tech-border py-3 px-6 bg-tech-surface1 shrink-0 h-16 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="bg-tech-surface2 p-1.5 rounded-md border border-tech-border">
            <Zap className="text-tech-accent w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-tech-primary tracking-tight">
              Vibe Debugger
            </h1>
          </div>
        </div>

        {/* Mode Toggle (Only visible with results) */}
        {appState === AppState.RESULTS && (
          <div className="flex bg-tech-surface2 rounded-md p-0.5 border border-tech-border">
            <button
              onClick={() => setUserMode(UserMode.JUNIOR)}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
                userMode === UserMode.JUNIOR ? 'bg-tech-surface1 text-tech-primary border border-tech-border' : 'text-tech-muted hover:text-tech-secondary'
              }`}
            >
              Junior
            </button>
            <button
              onClick={() => setUserMode(UserMode.SENIOR)}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
                userMode === UserMode.SENIOR ? 'bg-tech-accent text-white' : 'text-tech-muted hover:text-tech-secondary'
              }`}
            >
              Senior
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area - Fill remaining height */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-tech-border">
        
        {/* Left Column: Code Viewer / Editor */}
        <div className="flex flex-col h-full bg-tech-bg relative min-h-0">
          
          {/* Toolbar - Fixed */}
          <div className="bg-tech-surface1 px-4 py-0 border-b border-tech-border flex justify-between items-end h-12 shrink-0 z-10">
             {/* Tabs */}
             <div className="flex space-x-1 h-full pt-2">
                <button 
                    onClick={() => setInputMode('editor')}
                    className={`px-4 text-[11px] font-medium uppercase tracking-wide border-t border-l border-r rounded-t-md transition-colors ${inputMode === 'editor' ? 'bg-tech-bg border-tech-border text-tech-primary relative top-[1px] border-b-tech-bg' : 'bg-tech-surface2 border-transparent text-tech-muted hover:text-tech-secondary'}`}
                >
                    <div className="flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Code Editor
                    </div>
                </button>
                <button 
                    onClick={() => setInputMode('github')}
                    disabled={appState === AppState.RESULTS}
                    className={`px-4 text-[11px] font-medium uppercase tracking-wide border-t border-l border-r rounded-t-md transition-colors ${inputMode === 'github' ? 'bg-tech-bg border-tech-border text-tech-primary relative top-[1px]' : 'bg-tech-surface2 border-transparent text-tech-muted hover:text-tech-secondary'}`}
                >
                     <div className="flex items-center gap-2">
                        <Github className="w-3 h-3" /> GitHub Import
                    </div>
                </button>
             </div>

             <div className="flex items-center gap-2 mb-2">
                {/* Use Demo Code Button */}
                {inputMode === 'editor' && appState !== AppState.RESULTS && (
                   <button 
                        onClick={handleDemoLoad}
                        className="p-1.5 rounded-md text-tech-accent bg-tech-surface2 border border-tech-border hover:bg-tech-accent hover:text-white transition-colors mr-1 flex items-center gap-1.5 px-2"
                        title="Load Demo Code"
                    >
                        <Play className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">Use Demo Code</span>
                    </button>
                )}

                {/* Undo Button */}
                {historyIndex > 0 && (
                    <button 
                        onClick={handleUndo}
                        className="p-1.5 rounded-md text-tech-muted hover:text-tech-primary hover:bg-tech-surface2 transition-colors"
                        title="Undo last change"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                )}

                {appState !== AppState.RESULTS && inputMode === 'editor' && (
                    <button 
                        onClick={() => {
                            setCodeHistory(['']);
                            setHistoryIndex(0);
                        }} 
                        className="text-[10px] text-tech-muted hover:text-tech-primary transition-colors uppercase font-medium px-2"
                    >
                        CLEAR
                    </button>
                )}
             </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 relative bg-tech-bg min-h-0">
            
            {/* Github Import View */}
            {inputMode === 'github' && appState !== AppState.RESULTS && (
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="w-full max-w-md space-y-4">
                        <div className="text-center mb-6">
                            <Github className="w-12 h-12 text-tech-secondary mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-tech-primary">Import Public Repository</h3>
                            <p className="text-sm text-tech-muted">Analyze the main branch of a public repository.</p>
                        </div>
                        <input 
                            type="text" 
                            placeholder="https://github.com/username/repo"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            className="w-full bg-tech-surface1 border border-tech-border rounded-md px-4 py-3 text-sm text-tech-primary focus:outline-none focus:border-tech-accent"
                        />
                        <button 
                            onClick={handleGithubFetch}
                            disabled={!githubUrl}
                            className="w-full bg-tech-accent hover:bg-[#4A5AE5] disabled:bg-tech-surface2 disabled:text-tech-muted text-white py-2.5 rounded-md text-sm font-medium transition-colors"
                        >
                            Fetch & Analyze
                        </button>
                        <p className="text-[10px] text-tech-muted text-center mt-4">
                            * Simulates a read-only fetch. Secrets will be masked.
                        </p>
                    </div>
                </div>
            )}

            {/* Code Editor View */}
            {(inputMode === 'editor' || appState === AppState.RESULTS) && (
                appState === AppState.RESULTS && result ? (
                    /* The CodeViewer handles its own scrolling internally via h-full overflow-y-auto */
                    <CodeViewer 
                        code={currentCode} 
                        issues={result.items}
                        selectedIssueId={selectedIssueId} 
                        onIssueSelect={setSelectedIssueId}
                        fixedIssueIds={fixedIssueIds}
                    />
                ) : (
                    <textarea
                        value={currentCode}
                        onChange={handleManualCodeChange}
                        placeholder="// Paste your vibe-coded solution here..."
                        className="absolute inset-0 w-full h-full bg-tech-bg p-4 font-mono text-sm resize-none focus:outline-none text-tech-secondary placeholder-tech-muted custom-scrollbar"
                        spellCheck={false}
                    />
                )
            )}
          </div>

          {/* Security & Action Area (Footer of Left Column) */}
          {appState === AppState.IDLE && inputMode === 'editor' && (
              <div className="p-4 border-t border-tech-border bg-tech-surface1 shrink-0 space-y-3 z-10">
                
                {/* Security Assumptions */}
                <div className="bg-tech-bg/50 border border-tech-border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3 h-3 text-tech-risk-medium" />
                        <span className="text-[10px] font-bold text-tech-muted uppercase tracking-wider">Security Pre-Check</span>
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-start gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={checks.noActiveSecrets}
                                onChange={(e) => setChecks(prev => ({ ...prev, noActiveSecrets: e.target.checked }))}
                                className="mt-0.5 rounded border-tech-border bg-tech-surface2 text-tech-accent focus:ring-0 w-3.5 h-3.5"
                            />
                            <span className="text-xs text-tech-secondary group-hover:text-tech-primary transition-colors select-none">
                                I have removed or masked active production secrets.
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={checks.readOnlyAware}
                                onChange={(e) => setChecks(prev => ({ ...prev, readOnlyAware: e.target.checked }))}
                                className="mt-0.5 rounded border-tech-border bg-tech-surface2 text-tech-accent focus:ring-0 w-3.5 h-3.5"
                            />
                            <span className="text-xs text-tech-secondary group-hover:text-tech-primary transition-colors select-none">
                                I understand analysis is read-only and automated.
                            </span>
                        </label>
                    </div>
                </div>

                <button
                onClick={handleAnalyze}
                disabled={!currentCode.trim() || (!checks.noActiveSecrets && currentCode !== DEMO_CODE) || (!checks.readOnlyAware && currentCode !== DEMO_CODE)}
                className={`w-full py-2.5 rounded-card font-medium text-sm flex items-center justify-center gap-2 transition-colors
                    ${(!currentCode.trim() || ((!checks.noActiveSecrets || !checks.readOnlyAware) && currentCode !== DEMO_CODE))
                    ? 'bg-tech-surface2 text-tech-muted cursor-not-allowed border border-tech-border' 
                    : 'bg-tech-accent hover:bg-[#4A5AE5] text-white'
                    }`}
                >
                    <Send className="w-4 h-4" /> Run Vibe Check
                </button>
            </div>
          )}
        </div>

        {/* Right Column: Output / Dashboard */}
        <div className="flex flex-col h-full bg-tech-surface1 relative min-h-0">
          
          {appState === AppState.IDLE && (
            <div className="flex flex-col items-center justify-center h-full text-tech-muted p-8 text-center opacity-75 overflow-y-auto">
              <Code className="w-12 h-12 mb-4 text-tech-surface2" />
              <p className="text-base font-medium text-tech-secondary">Ready for Inspection</p>
              <p className="text-xs max-w-xs mt-2 text-tech-muted">
                Paste your code or import from GitHub to detect architectural fragility and security risks.
              </p>
            </div>
          )}

          {appState === AppState.ANALYZING && <Loader />}

          {appState === AppState.ERROR && (
            <div className="flex flex-col items-center justify-center h-full text-tech-risk-high p-8 text-center overflow-y-auto">
              <ShieldAlert className="w-12 h-12 mb-4" />
              <p className="text-base font-bold">Analysis Failed</p>
              <p className="text-sm mt-2 opacity-80 text-tech-secondary">{error}</p>
              <button onClick={reset} className="mt-6 text-tech-primary underline hover:text-white text-sm">Try Again</button>
            </div>
          )}

          {appState === AppState.RESULTS && result && (
            <div className="flex flex-col h-full">
              {/* Result Toolbar - Fixed */}
              <div className="bg-tech-surface1 px-4 py-2 border-b border-tech-border flex justify-between items-center shrink-0 h-10 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-tech-secondary" />
                        <span className="text-[11px] font-mono text-tech-secondary">{analysisTime}s</span>
                    </div>
                    <div className="w-[1px] h-3 bg-tech-border"></div>
                    <div className="flex items-center gap-1.5">
                        <FileCode className="w-3 h-3 text-tech-secondary" />
                        <span className="text-[11px] font-mono text-tech-secondary">{lineCount} lines</span>
                    </div>
                    <div className="w-[1px] h-3 bg-tech-border"></div>
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`w-3 h-3 ${criticalCount > 0 ? 'text-tech-risk-high' : 'text-tech-risk-low'}`} />
                        <span className={`text-[11px] font-mono ${criticalCount > 0 ? 'text-tech-risk-high font-bold' : 'text-tech-secondary'}`}>
                            {criticalCount} Critical
                        </span>
                    </div>
                </div>
                <button 
                    onClick={reset}
                    className="text-[11px] flex items-center gap-1 text-tech-muted hover:text-tech-primary transition-colors uppercase font-medium"
                >
                    <RefreshCw className="w-3 h-3" /> New Scan
                </button>
              </div>
              
              {/* Scrollable Results Area */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar bg-tech-bg/50">
                
                {/* 1. The Discovery (Biggest Risk) */}
                <div className="mb-6">
                    <div className="bg-tech-surface1 rounded-lg p-5 border border-tech-risk-high/30 shadow-lg shadow-tech-risk-high/5">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldAlert className="w-4 h-4 text-tech-risk-high" />
                            <h2 className="text-xs font-bold text-tech-risk-high uppercase tracking-widest">Greatest Vibe Risk</h2>
                        </div>
                        <h3 className="text-lg font-bold text-tech-primary mb-2">{result.topRisk.title}</h3>
                        <p className="text-tech-secondary leading-relaxed text-sm">{result.topRisk.description}</p>
                    </div>
                </div>

                {/* 2. List of Issues */}
                {result.items.length > 0 ? (
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between pb-2 border-b border-tech-border">
                            <h3 className="text-xs font-bold text-tech-muted uppercase tracking-wider">Patterns Recognized from Real-World Incidents</h3>
                            <span className="text-[10px] bg-tech-surface2 text-tech-secondary px-2 py-0.5 rounded-full border border-tech-border">{result.items.length} Issues</span>
                        </div>
                    
                        {result.items.map((item, idx) => (
                            <div key={item.id || idx} ref={el => { if (el) itemRefs.current.set(item.id, el); }}>
                                <AnalysisCard 
                                    item={item} 
                                    userMode={userMode}
                                    isActive={selectedIssueId === item.id}
                                    onHover={setSelectedIssueId}
                                    onSelect={setSelectedIssueId}
                                    onFix={handleFix}
                                    isFixed={fixedIssueIds.has(item.id)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="py-12 flex flex-col items-center justify-center text-tech-muted opacity-60">
                         <CheckCircle className="w-12 h-12 mb-3 text-tech-risk-low" />
                         <p className="text-sm font-medium">No critical vibe issues detected.</p>
                     </div>
                )}

                {/* 3. Cost & Action Footer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 pb-4">
                    <div className="p-4 bg-tech-surface1 rounded-lg border border-tech-border">
                        <p className="text-[10px] text-tech-muted uppercase font-bold mb-2 flex items-center gap-1 tracking-wider">
                            <DollarSign className="w-3 h-3" /> Cost of Ignoring
                        </p>
                        <p className="text-sm text-tech-secondary italic">
                            {result.costOfIgnoring}
                        </p>
                    </div>
                    <div className="p-4 bg-tech-surface1 rounded-lg border border-tech-risk-low/30">
                        <p className="text-[10px] text-tech-risk-low uppercase font-bold mb-2 flex items-center gap-1 tracking-wider">
                            <ArrowRight className="w-3 h-3" /> Recommended First Step
                        </p>
                        <p className="text-sm text-tech-primary font-medium">
                            {result.recommendedAction}
                        </p>
                    </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;