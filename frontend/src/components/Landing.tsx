import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Zap,
  Eye,
  Lock,
  ChevronRight,
  GitBranch,
  Key,
  AlertTriangle,
  Github,
  ExternalLink,
} from "lucide-react";

function resolveGithubUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://github.com/${trimmed}`;
}

const DEMO_LINES = [
  { text: 'AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"', hit: true, type: "AWS_KEY" },
  { text: 'password = "db_super_secret_2024!"', hit: true, type: "PASSWORD" },
  { text: 'import os, json, logging', hit: false, type: null },
  { text: 'STRIPE_KEY = "sk_live_4eC39HqLyjWDarjtT1zdp7dc"', hit: true, type: "STRIPE_KEY" },
  { text: 'def process_request(req):', hit: false, type: null },
  { text: 'JWT_SECRET = "my-ultra-secret-key-do-not-share"', hit: true, type: "TOKEN" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Regex + ML Detection",
    desc: "Dual-engine scanning: precise regex patterns combined with a trained ML model for edge cases.",
  },
  {
    icon: Eye,
    title: "20+ Secret Types",
    desc: "AWS keys, JWTs, GitHub tokens, Stripe keys, database URLs, passwords, and more.",
  },
  {
    icon: Lock,
    title: "Risk Scoring",
    desc: "Every scan produces a 0–100 risk score so you know exactly how exposed your code is.",
  },
  {
    icon: GitBranch,
    title: "File or Paste",
    desc: "Upload any file from your repo or paste code directly — results in under a second.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Landing() {
  const navigate = useNavigate();
  const [showRepoInput, setShowRepoInput] = useState(false);
  const [repoInput, setRepoInput] = useState("");

  function openRepo() {
    if (!repoInput.trim()) return;
    window.open(resolveGithubUrl(repoInput), "_blank");
  }

  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* Background grid + glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 55% at 50% -5%, rgba(99,102,241,0.14), transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight">SecretScanner</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            className="text-sm text-white/50 hover:text-white/80 transition-colors hidden sm:block"
          >
            Docs
          </a>
          <button onClick={() => navigate("/scan")} className="btn-primary text-sm">
            Start Scanning <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-16 pb-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs text-white/60 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Regex + Machine Learning · Open Source
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
            Find secrets{" "}
            <span className="gradient-text">before hackers do</span>
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Instantly scan your code for hardcoded API keys, passwords, JWT tokens,
            and credentials — with dual regex + ML detection and a full risk report.
          </p>

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/scan")}
                className="btn-primary text-base px-7 py-3 w-full sm:w-auto"
              >
                <Shield className="w-4 h-4" />
                Scan your code now
              </button>
              <button
                onClick={() => setShowRepoInput((v) => !v)}
                className="btn-secondary text-base px-7 py-3 w-full sm:w-auto"
              >
                <Github className="w-4 h-4" />
                View Source Code
              </button>
            </div>

            <AnimatePresence>
              {showRepoInput && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden w-full max-w-sm"
                >
                  <div className="flex gap-2 mt-1">
                    <input
                      autoFocus
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && openRepo()}
                      placeholder="owner/repo or full GitHub URL"
                      className="flex-1 bg-surface-2 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all font-mono"
                    />
                    <button
                      onClick={openRepo}
                      disabled={!repoInput.trim()}
                      className="btn-secondary px-3 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Demo code card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          className="mt-16 glass-card overflow-hidden text-left max-w-2xl mx-auto"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-surface-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-white/30 font-mono">config.py</span>
          </div>
          <div className="p-4 font-mono text-sm">
            {DEMO_LINES.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.35 }}
                className={`flex items-center gap-3 py-0.5 px-2 rounded transition-all ${
                  line.hit
                    ? "bg-danger-bg border-l-2 border-danger/60"
                    : "border-l-2 border-transparent"
                }`}
              >
                <span className="text-white/20 text-xs w-4 text-right select-none">
                  {i + 1}
                </span>
                <span className={line.hit ? "text-red-300" : "text-white/50"}>
                  {line.text}
                </span>
                {line.hit && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="ml-auto badge-high text-[10px] whitespace-nowrap"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {line.type}
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
          {/* Scan progress bar */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-surface-2">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>4 secrets detected</span>
              <span className="text-red-400 font-semibold">Risk: 88 / 100</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "88%" }}
                transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={itemVariants}
              className="glass-card-hover p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-accent" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1.5">{title}</h3>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 text-center px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block">
            <div className="glass-card px-10 py-10 max-w-lg mx-auto">
              <Key className="w-8 h-8 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">
                Ready to secure your repo?
              </h2>
              <p className="text-white/45 text-sm mb-6">
                Paste your code or upload a file — results in under a second.
              </p>
              <button
                onClick={() => navigate("/scan")}
                className="btn-primary w-full justify-center"
              >
                Start Free Scan <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 px-6 text-center text-xs text-white/25">
        SecretScanner · Built with FastAPI + React · For demonstration purposes
      </footer>
    </div>
  );
}
