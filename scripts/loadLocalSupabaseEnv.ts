import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_KONG_CONTAINER_NAME = "supabase_kong_rev-matched";
const API_URL_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/i;
const SERVICE_KEY_PATTERN = /sb_secret_[A-Za-z0-9_-]+/;

function loadDotEnvFile(filename: string) {
  const envPath = resolve(process.cwd(), filename);
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    process.env[trimmed.slice(0, separator)] ??= trimmed.slice(separator + 1);
  }
}

export function getLocalServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SERVICE_ROLE_KEY
  );
}

function loadFromSupabaseStatus() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && getLocalServiceRoleKey()) return;

  let output: string;
  try {
    output = execFileSync("npx", ["supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    });
  } catch {
    return;
  }

  for (const line of output.split("\n")) {
    const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (!match) continue;
    const [, name, value] = match;
    if (name === "API_URL") process.env.NEXT_PUBLIC_SUPABASE_URL ??= value;
    if (name === "SERVICE_ROLE_KEY") process.env.SUPABASE_SERVICE_ROLE_KEY ??= value;
  }
}

function loadServiceKeyFromDockerInspect() {
  if (getLocalServiceRoleKey()) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !API_URL_PATTERN.test(supabaseUrl)) return;

  const containerName =
    process.env.SUPABASE_KONG_CONTAINER_NAME ?? DEFAULT_KONG_CONTAINER_NAME;

  let output: string;
  try {
    output = execFileSync("docker", ["inspect", containerName], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    });
  } catch {
    return;
  }

  const serviceKeyMatch = output.match(SERVICE_KEY_PATTERN);
  if (serviceKeyMatch) {
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= serviceKeyMatch[0];
  }
}

export function loadLocalSupabaseEnv() {
  loadDotEnvFile(".env.local");
  loadFromSupabaseStatus();
  loadServiceKeyFromDockerInspect();
}
