// ---------------------------------------------------------------------------
// SubmissionStore — file-based persistence for prototype submission records.
//
// Phase 1: reads/writes data/submissions.json via fs/promises.
// Phase 2: swap this module for a DB-backed implementation — the interface
// stays the same so routes and consumers don't change.
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Types
//
// These align with the frontend shared contracts in src/shared/types/delivery.ts.
// The backend can't import from the frontend tree (separate tsconfig), so these
// are kept in sync by convention. Shared type names match across both sides.
// ---------------------------------------------------------------------------

export interface SubmissionPage {
  route: string;
  title: string;
  description: string;
  html: string;
}

export interface SubmissionBrandConfig {
  colors: { primary: string; secondary: string; background: string; text: string; border: string };
  typography: { fontFamily: string; fontWeightRegular: number; fontWeightBold: number; baseSizePx: number };
  borderRadius: { button: string; card: string; input: string };
  spacing: { unit: number; scale: number[] };
  logoUrl: string;
  companyName: string;
  buttonStyle: 'pill' | 'rounded' | 'square';
}

/** Submission origin — which module created this record. Mirrors SubmissionSource in shared/types/delivery.ts */
export type SubmissionSource = 'prototype-lab' | 'solutions-studio';

/** AI provider/model info. Mirrors ProviderInfo in shared/types/delivery.ts */
export interface ProviderInfo {
  provider: string;
  model: string;
}

/** Per-stage summary for display. Mirrors StageSummaryItem in shared/types/delivery.ts */
export interface StageSummaryItem {
  stage: string;
  label: string;
  status: string;
  artifactCount: number;
}

// -- Base fields shared by all submission records --
interface SubmissionBase {
  id: string;
  timestamp: string;
  createdAt: string;
  source: SubmissionSource;
  /** Human-readable summary shown in Delivery Hub table */
  readmeSummary: string;
}

// -- Prototype Lab submissions (original shape) --
export interface PrototypeSubmission extends SubmissionBase {
  source: 'prototype-lab';
  pageCount: number;
  brandName: string;
  routeList: string[];
  /** Stored for re-download. Added in Phase 1.1. */
  pages?: SubmissionPage[];
  /** Stored for re-download. Added in Phase 1.1. */
  brandConfig?: SubmissionBrandConfig;
}

// -- Solutions Studio submissions --
export interface StudioSubmission extends SubmissionBase {
  source: 'solutions-studio';
  /** SDLC pipeline run identifier */
  runId: string;
  /** Project name from the pipeline request */
  projectName: string;
  /** Number of artifacts produced across all stages */
  artifactCount: number;
  /** Per-stage summary for display */
  stageSummary: StageSummaryItem[];
  /** Provider/model that generated the output */
  provider: ProviderInfo | null;
}

export type SubmissionRecord = PrototypeSubmission | StudioSubmission;

// ---------------------------------------------------------------------------
// File path — relative to backend/catalog root
// ---------------------------------------------------------------------------

const DATA_DIR = join(import.meta.dirname ?? process.cwd(), '..', '..', 'data');
const FILE_PATH = join(DATA_DIR, 'submissions.json');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function readAll(): Promise<SubmissionRecord[]> {
  try {
    const raw = await readFile(FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SubmissionRecord[];
    return [];
  } catch {
    // File doesn't exist yet or is invalid — start fresh
    return [];
  }
}

async function writeAll(records: SubmissionRecord[]): Promise<void> {
  await mkdir(dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(records, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getSubmissions(): Promise<SubmissionRecord[]> {
  const records = await readAll();
  // Newest first
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSubmission(id: string): Promise<SubmissionRecord | null> {
  const records = await readAll();
  return records.find((r) => r.id === id) ?? null;
}

export async function addSubmission(record: SubmissionRecord): Promise<SubmissionRecord> {
  const records = await readAll();
  records.push(record);
  await writeAll(records);
  return record;
}
