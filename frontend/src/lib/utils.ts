import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function riskLabel(score: number): string {
  if (score === 0) return "Clean";
  if (score < 30) return "Low Risk";
  if (score < 60) return "Medium Risk";
  if (score < 85) return "High Risk";
  return "Critical";
}

export function riskColor(score: number): string {
  if (score === 0) return "text-success";
  if (score < 30) return "text-success";
  if (score < 60) return "text-warning";
  if (score < 85) return "text-orange-400";
  return "text-danger";
}

export function riskStrokeColor(score: number): string {
  if (score === 0) return "#10b981";
  if (score < 30) return "#10b981";
  if (score < 60) return "#f59e0b";
  if (score < 85) return "#f97316";
  return "#ef4444";
}

export const SECRET_TYPE_LABELS: Record<string, string> = {
  AWS_KEY: "AWS Access Key",
  AWS_SECRET: "AWS Secret Key",
  JWT: "JSON Web Token",
  PRIVATE_KEY: "Private Key",
  GITHUB_TOKEN: "GitHub Token",
  GITHUB_OAUTH: "GitHub OAuth",
  GITHUB_APP: "GitHub App Token",
  OPENAI_KEY: "OpenAI Key",
  SLACK_TOKEN: "Slack Token",
  STRIPE_KEY: "Stripe Secret",
  PASSWORD: "Password",
  API_KEY: "API Key",
  SECRET: "Secret Value",
  TOKEN: "Auth Token",
  BEARER_TOKEN: "Bearer Token",
  DATABASE_URL: "Database URL",
  EMAIL_CREDS: "Email Credentials",
  CREDENTIALS: "Credentials",
  UNKNOWN: "Unknown Secret",
};
