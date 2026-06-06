import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Upload,
  FileText,
  X,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Github,
} from "lucide-react";
import type { ScanResponse, ScanState } from "../types";
import Results from "./Results";

const API_BASE = "http://100.30.237.68:8000";

const DEMO_SNIPPET = `# config.py — do NOT commit this file
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

DATABASE_URL = "postgresql://admin:db_super_secret_2024!@prod.db.internal:5432/main"

STRIPE_SECRET_KEY = "sk_live_4eC39HqLyjWDarjtT1zdp7dc"

JWT_SECRET = "my-ultra-secret-jwt-signing-key-do-not-share"

GITHUB_TOKEN = "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ab"

# safe lines below
DEBUG = False
PORT = int(os.environ.get("PORT", 8000))
MAX_WORKERS = 4
`.trim();

const MAX_REPOS = 5;

function resolveGithubUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://github.com/${trimmed}`;
}

function parseRepos(input: string): string[] {
  return input
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, MAX_REPOS);
}

function mergeResults(responses: ScanResponse[]): ScanResponse {
  const results = responses.flatMap((r) => r.results);
  const high = responses.reduce((s, r) => s + r.high_confidence, 0);
  const medium = responses.reduce((s, r) => s + r.medium_confidence, 0);
  return {
    results,
    risk_score: Math.min(100, high * 22 + medium * 8),
    total_secrets: results.length,
    high_confidence: high,
    medium_confidence: medium,
    scan_time_ms: responses.reduce((s, r) => s + (r.scan_time_ms ?? 0), 0),
    lines_scanned: responses.reduce((s, r) => s + r.lines_scanned, 0),
  };
}

const SCAN_STAGES = [
  "Tokenizing input…",
  "Running regex patterns…",
  "Invoking ML classifier…",
  "Computing risk score…",
  "Finalizing report…",
];

const REPO_SCAN_STAGES = [
  "Cloning repository…",
  "Walking file tree…",
  "Running regex patterns…",
  "Invoking ML classifier…",
  "Finalizing report…",
];

interface BatchProgress {
  currentIndex: number;
  totalRepos: number;
  currentRepo: string;
}

type Tab = "paste" | "upload" | "repo";

export default function Scanner() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("paste");

  // paste / upload state
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // repo state
  const [repoUrl, setRepoUrl] = useState("");

  // shared scan state
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // batch progress state
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const repos = parseRepos(repoUrl);
  const isIdle = scanState === "idle" || scanState === "error";
  const canScan = isIdle && (
    tab === "paste" ? text.trim().length > 0 :
    tab === "upload" ? file !== null :
    repos.length > 0
  );

  // ── helpers ──────────────────────────────────────────────────────────────────

  function startStageAnimation(stages: string[]) {
    setProgress(0);
    setStageIdx(0);
    const interval = setInterval(() => {
      setStageIdx((i) => {
        const next = Math.min(i + 1, stages.length - 1);
        setProgress(Math.round(((next + 1) / stages.length) * 90));
        return next;
      });
    }, 400);
    return interval;
  }

  async function finalize(res: Response) {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail ?? "Scan failed");
    }
    const data: ScanResponse = await res.json();
    setProgress(100);
    await new Promise((r) => setTimeout(r, 300));
    setScanData(data);
    setScanState("done");
  }

  function handleError(e: unknown, interval?: ReturnType<typeof setInterval>) {
    if (interval) clearInterval(interval);
    setError(e instanceof Error ? e.message : "Network error — is the backend running?");
    setScanState("error");
  }

  async function fetchRepoScan(url: string): Promise<ScanResponse> {
    const res = await fetch(`${API_BASE}/scan-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: resolveGithubUrl(url) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail ?? `Scan failed for ${url}`);
    }
    return res.json();
  }

  // ── scan handlers ─────────────────────────────────────────────────────────────

  const runScan = useCallback(async () => {
    setScanState("scanning");
    setError(null);
    setScanData(null);
    const interval = startStageAnimation(SCAN_STAGES);

    try {
      const form = new FormData();
      if (tab === "paste") {
        form.append("text", text);
      } else if (file) {
        form.append("file", file);
      }
      const res = await fetch(`${API_BASE}/scan`, { method: "POST", body: form });
      clearInterval(interval);
      await finalize(res);
    } catch (e) {
      handleError(e, interval);
    }
  }, [tab, text, file]);

  const runBatchScan = useCallback(async () => {
    const targets = parseRepos(repoUrl);
    if (!targets.length) return;

    setScanState("scanning");
    setError(null);
    setScanData(null);
    setProgress(0);

    const responses: ScanResponse[] = [];

    try {
      for (let i = 0; i < targets.length; i++) {
        setBatchProgress({
          currentIndex: i + 1,
          totalRepos: targets.length,
          currentRepo: targets[i],
        });
        setProgress(Math.round((i / targets.length) * 90));
        const data = await fetchRepoScan(targets[i]);
        responses.push(data);
      }

      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      setScanData(mergeResults(responses));
      setScanState("done");
    } catch (e) {
      handleError(e);
    } finally {
      setBatchProgress(null);
    }
  }, [repoUrl]);

  const handleScan = tab === "repo" ? runBatchScan : runScan;

  const reset = () => {
    setScanState("idle");
    setScanData(null);
    setError(null);
    setProgress(0);
    setFile(null);
    setBatchProgress(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setTab("upload");
    }
  }, []);

  const stages = tab === "repo" ? REPO_SCAN_STAGES : SCAN_STAGES;

  if (scanState === "done" && scanData) {
    return <Results data={scanData} onReset={reset} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,102,241,0.1), transparent 60%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center gap-4 px-6 py-5 max-w-5xl mx-auto w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-white/80 tracking-tight text-sm">SecretScanner</span>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Scan for secrets</h1>
            <p className="text-white/45 text-sm">
              Upload a file, paste code, or point at a GitHub repo.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-surface-2 rounded-lg border border-white/[0.06] mb-5">
            {([
              { id: "paste", label: "Paste Code", icon: <FileText className="w-4 h-4" /> },
              { id: "upload", label: "Upload File", icon: <Upload className="w-4 h-4" /> },
              { id: "repo", label: "GitHub Repo", icon: <Github className="w-4 h-4" /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? "bg-surface-3 text-white shadow border border-white/[0.08]"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "paste" && (
              <motion.div
                key="paste"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <textarea
                    className="w-full h-64 font-mono text-sm text-white/80 bg-surface-1 border border-white/[0.07] rounded-xl p-4 resize-none focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/20"
                    placeholder={"# Paste your code here...\npassword = \"super_secret\"\nAPI_KEY = \"...\""}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {text && (
                      <button
                        onClick={() => setText("")}
                        className="text-white/25 hover:text-white/50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setText(DEMO_SNIPPET)}
                      className="text-xs text-accent/60 hover:text-accent transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Load demo
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                    dragOver
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : file
                      ? "border-success/40 bg-success/5"
                      : "border-white/[0.1] hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".py,.js,.ts,.jsx,.tsx,.go,.rb,.java,.php,.env,.txt,.yml,.yaml,.json,.toml,.sh,.bash,.zsh"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                    }}
                  />
                  {file ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-success" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium text-sm">{file.name}</p>
                        <p className="text-white/35 text-xs mt-1">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white/40" />
                      </div>
                      <div className="text-center">
                        <p className="text-white/60 text-sm font-medium">Drop a file here</p>
                        <p className="text-white/30 text-xs mt-1">
                          .py .js .ts .go .env .yml .json and more
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "repo" && (
              <motion.div
                key="repo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                        <Github className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">GitHub Repositories</p>
                        <p className="text-white/35 text-xs mt-0.5">
                          One per line · max {MAX_REPOS} repos · public only
                        </p>
                      </div>
                    </div>
                    {repos.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                        {repos.length} / {MAX_REPOS}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder={"owner/repo\nhttps://github.com/owner/another-repo\nowner/third-repo"}
                    rows={4}
                    className="w-full bg-surface-2 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all font-mono resize-none"
                    spellCheck={false}
                  />

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-white/25 text-xs">
                      Accepts <code className="text-white/40">owner/repo</code> or full GitHub URLs.
                    </p>
                    <button
                      disabled={repos.length !== 1}
                      onClick={() => window.open(resolveGithubUrl(repos[0]), "_blank")}
                      className="ml-4 flex-shrink-0 flex items-center gap-1.5 text-xs text-accent/60 hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      <Github className="w-3.5 h-3.5" />
                      View on GitHub
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-danger-bg border border-danger-border text-sm text-red-300"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scan button */}
          <div className="mt-5">
            {scanState === "scanning" ? (
              <ScanningProgress
                progress={progress}
                stage={stages[stageIdx]}
                batchProgress={batchProgress}
              />
            ) : (
              <button
                onClick={handleScan}
                disabled={!canScan}
                className={`btn-primary w-full justify-center py-3 text-base transition-all duration-200 ${
                  !canScan ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                }`}
              >
                {tab === "repo" ? <Github className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                {tab === "repo"
                  ? repos.length > 1 ? `Scan ${repos.length} Repos` : "Scan Repo"
                  : "Run Security Scan"}
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function ScanningProgress({
  progress,
  stage,
  batchProgress,
}: {
  progress: number;
  stage: string;
  batchProgress?: BatchProgress | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center scan-pulse">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">
            {batchProgress
              ? `Scanning ${batchProgress.currentIndex} / ${batchProgress.totalRepos}`
              : "Scanning…"}
          </p>
          <p className="text-white/40 text-xs mt-0.5 truncate">
            {batchProgress ? batchProgress.currentRepo : stage}
          </p>
        </div>
        <span className="text-accent font-semibold text-sm tabular-nums">{progress}%</span>
      </div>

      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden relative">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full relative"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s linear infinite",
          }}
        />
        <motion.div
          animate={{ x: ["0%", "400%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 h-full w-8 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
          }}
        />
      </div>

      <p className="text-white/25 text-xs mt-3 text-center">
        Analyzing patterns with regex + ML classifier…
      </p>
    </motion.div>
  );
}
