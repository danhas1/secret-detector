import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Brain,
  Clock,
  Hash,
  TrendingUp,
  FileSearch,
} from "lucide-react";
import type { ScanResponse, Finding } from "../types";
import { riskLabel, riskColor, riskStrokeColor, SECRET_TYPE_LABELS } from "../lib/utils";

interface Props {
  data: ScanResponse;
  onReset: () => void;
}

const SECRET_ICONS: Record<string, string> = {
  AWS_KEY: "☁️",
  AWS_SECRET: "🔑",
  JWT: "🪙",
  PRIVATE_KEY: "🗝️",
  GITHUB_TOKEN: "🐙",
  GITHUB_OAUTH: "🐙",
  GITHUB_APP: "🐙",
  OPENAI_KEY: "🤖",
  SLACK_TOKEN: "💬",
  STRIPE_KEY: "💳",
  PASSWORD: "🔐",
  API_KEY: "🔑",
  SECRET: "🤫",
  TOKEN: "🎫",
  BEARER_TOKEN: "🎫",
  DATABASE_URL: "🗄️",
  EMAIL_CREDS: "📧",
  CREDENTIALS: "🔒",
  UNKNOWN: "❓",
};

function RiskGauge({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = riskStrokeColor(score);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" className="transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <motion.circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`text-3xl font-extrabold tabular-nums ${riskColor(score)}`}
        >
          {score}
        </motion.span>
        <span className="text-white/40 text-xs mt-0.5 font-medium">{riskLabel(score)}</span>
      </div>
    </div>
  );
}

function FindingRow({ finding, index }: { finding: Finding; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(finding.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = revealed
    ? finding.value
    : finding.value.length > 8
    ? finding.value.slice(0, 4) + "████████████" + finding.value.slice(-4)
    : "████████";

  const icon = SECRET_ICONS[finding.type] ?? "🔐";
  const label = SECRET_TYPE_LABELS[finding.type] ?? finding.type;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`border-b border-white/[0.04] group transition-colors hover:bg-white/[0.02] ${
        finding.confidence === "HIGH" ? "hover:bg-danger-bg/30" : "hover:bg-warning-bg/20"
      }`}
    >
      {/* Type */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{icon}</span>
          <div>
            <p className="text-white text-sm font-medium">{label}</p>
            {finding.description && (
              <p className="text-white/35 text-xs mt-0.5 truncate max-w-[180px]">
                {finding.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Value */}
      <td className="px-4 py-3.5 max-w-xs">
        <div className="flex items-center gap-2">
          <code
            className={`text-xs font-mono truncate max-w-[220px] transition-all duration-300 ${
              revealed ? "text-white/80" : "text-white/30 tracking-widest select-none"
            }`}
          >
            {displayValue}
          </code>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setRevealed((r) => !r)}
              className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all"
              title={revealed ? "Hide" : "Reveal"}
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </td>

      {/* Confidence */}
      <td className="px-4 py-3.5">
        {finding.confidence === "HIGH" ? (
          <span className="badge-high">
            <AlertTriangle className="w-2.5 h-2.5" />
            HIGH
          </span>
        ) : (
          <span className="badge-medium">
            <TrendingUp className="w-2.5 h-2.5" />
            MEDIUM
          </span>
        )}
      </td>

      {/* Method */}
      <td className="px-4 py-3.5">
        <span className="badge-method">
          {finding.method === "regex" ? (
            <Zap className="w-2.5 h-2.5" />
          ) : (
            <Brain className="w-2.5 h-2.5" />
          )}
          {finding.method}
        </span>
      </td>

      {/* Location */}
      <td className="px-4 py-3.5">
        <span className="text-white/35 text-xs font-mono">
          {(() => {
            const { file, line } = finding;
            if (!file && line == null) return <span className="text-white/15">—</span>;
            if (!file) return `input : ${line}`;
            if (line == null) return file;
            return `${file} : ${line}`;
          })()}
        </span>
      </td>
    </motion.tr>
  );
}

export default function Results({ data, onReset }: Props) {
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM">("ALL");

  const filtered = data.results.filter(
    (r) => filter === "ALL" || r.confidence === filter
  );

  const isEmpty = data.results.length === 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Scan Results</h1>
              <p className="text-white/35 text-xs">
                {data.lines_scanned} lines scanned in {(data.scan_time_ms ?? 0).toFixed(2)}ms
              </p>
            </div>
          </div>
          <button onClick={onReset} className="btn-secondary text-sm">
            <RotateCcw className="w-3.5 h-3.5" />
            New Scan
          </button>
        </motion.div>

        {/* Summary cards row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* Risk score card */}
          <div className="glass-card p-6 col-span-1 flex flex-col items-center text-center">
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-4">
              Risk Score
            </p>
            <RiskGauge score={data.risk_score} />
            <p className="text-white/30 text-xs mt-4 leading-relaxed">
              {data.risk_score === 0
                ? "No secrets detected. Clean scan!"
                : data.risk_score >= 85
                ? "Critical — rotate secrets immediately"
                : data.risk_score >= 60
                ? "High risk — address before deployment"
                : "Low risk — review findings below"}
            </p>
          </div>

          {/* Stats */}
          <div className="glass-card p-6 col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            <StatCard
              icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
              label="High Confidence"
              value={data.high_confidence}
              color="text-red-400"
              bg="bg-danger-bg"
              border="border-danger-border"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-yellow-400" />}
              label="Medium Confidence"
              value={data.medium_confidence}
              color="text-yellow-400"
              bg="bg-warning-bg"
              border="border-warning-border"
            />
            <StatCard
              icon={<Hash className="w-4 h-4 text-accent" />}
              label="Total Secrets"
              value={data.total_secrets}
              color="text-accent"
              bg="bg-accent/10"
              border="border-accent/20"
            />
            <StatCard
              icon={<Clock className="w-4 h-4 text-success" />}
              label="Scan Time"
              value={`${(data.scan_time_ms ?? 0).toFixed(2)}ms`}
              color="text-success"
              bg="bg-success/10"
              border="border-success/30"
            />
          </div>
        </motion.div>

        {/* Findings table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          {/* Table header row */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-white/40" />
              <h2 className="text-white font-semibold text-sm">Findings</h2>
              {data.total_secrets > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-white/[0.06] text-white/60">
                  {data.total_secrets}
                </span>
              )}
            </div>
            {/* Filters */}
            {!isEmpty && (
              <div className="flex gap-1">
                {(["ALL", "HIGH", "MEDIUM"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      filter === f
                        ? "bg-white/[0.08] text-white border border-white/[0.12]"
                        : "text-white/35 hover:text-white/60"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isEmpty ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Secret Type", "Value", "Confidence", "Method", "Location"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-white/30 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((finding, i) => (
                      <FindingRow key={`${finding.type}-${i}`} finding={finding} index={i} />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">
                  No {filter.toLowerCase()} confidence findings.
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer note */}
        {!isEmpty && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/20 text-xs mt-6"
          >
            Hover any row to reveal / copy the secret value. Rotate all flagged credentials immediately.
          </motion.p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${bg} ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-white/45 text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-5"
      >
        <CheckCircle className="w-8 h-8 text-success" />
      </motion.div>
      <h3 className="text-white font-semibold text-lg mb-2">All clear!</h3>
      <p className="text-white/40 text-sm max-w-xs leading-relaxed">
        No secrets detected in the scanned input. Your code looks clean — no hardcoded credentials found.
      </p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-success/8 border border-success/15 text-success text-xs font-medium"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Passed security scan
      </motion.div>
    </motion.div>
  );
}
