import type { SupportedLanguage } from '../i18n';

export const AI_PROBLEM_HISTORY_STORAGE_KEY = 'algomiri.ai.problem-history';
export const AI_PROBLEM_HISTORY_SCHEMA_VERSION = 1;
const MAX_RECORDS = 100;
const MAX_STATEMENT_CHARS = 20_000;

export type AiProblemSource = 'curated-ai' | 'custom-pasted';
export type AiProblemHistoryStatus = 'ai-conceptual' | 'bookmarked';

export interface AiProblemHistoryRecord {
  id: string;
  title: string;
  source: AiProblemSource;
  problemId: string | null;
  topic: string | null;
  locale: SupportedLanguage;
  savedAt: string;
  updatedAt: string;
  status: AiProblemHistoryStatus;
  /** Present only after explicit consent for custom pasted problems. */
  problemStatement?: string;
}

interface StoredAiHistoryEnvelope {
  schemaVersion: number;
  updatedAt: string;
  records: AiProblemHistoryRecord[];
}

export type AiHistoryWarning =
  | 'storage-unavailable'
  | 'storage-read-failed'
  | 'storage-corrupted'
  | 'storage-newer-version'
  | 'records-skipped'
  | 'invalid-record'
  | 'storage-write-failed'
  | 'storage-delete-failed';

export interface AiHistoryLoadResult {
  records: AiProblemHistoryRecord[];
  recoveredFromError: boolean;
  warning: AiHistoryWarning | null;
}

export interface SaveAiProblemInput {
  /** Optional stable record ID when intentionally updating a known record. */
  recordId?: string | null;
  title: string;
  source: AiProblemSource;
  problemId?: string | null;
  topic?: string | null;
  locale: SupportedLanguage;
  status?: AiProblemHistoryStatus;
  problemStatement?: string | null;
  consentToStoreStatement: boolean;
}

export interface SaveAiProblemResult {
  saved: boolean;
  record: AiProblemHistoryRecord | null;
  wasDuplicateUpdate: boolean;
  warning: AiHistoryWarning | null;
}

export interface AiProblemHistoryRepository {
  load(): AiHistoryLoadResult;
  save(input: SaveAiProblemInput): SaveAiProblemResult;
  remove(recordId: string): { removed: boolean; warning: AiHistoryWarning | null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanDate(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

export function sanitizeAiHistoryRecord(raw: unknown): AiProblemHistoryRecord | null {
  if (!isRecord(raw)) return null;
  const id = cleanText(raw.id, 120);
  const title = cleanText(raw.title, 160);
  const savedAt = cleanDate(raw.savedAt);
  const updatedAt = cleanDate(raw.updatedAt);
  const source =
    raw.source === 'curated-ai' || raw.source === 'custom-pasted'
      ? raw.source
      : null;
  const locale = raw.locale === 'en' || raw.locale === 'vi' ? raw.locale : null;

  const status: AiProblemHistoryStatus | null =
    raw.status === 'ai-conceptual' || raw.status === 'bookmarked'
      ? raw.status
      : null;

  if (
    !id ||
    !title ||
    !savedAt ||
    !updatedAt ||
    !source ||
    !locale ||
    !status
  ) {
    return null;
  }

  const problemId = cleanText(raw.problemId, 120);
  const topic = cleanText(raw.topic, 120);
  const problemStatement =
    source === 'custom-pasted' && typeof raw.problemStatement === 'string'
      ? raw.problemStatement.trim().slice(0, MAX_STATEMENT_CHARS)
      : undefined;

  return {
    id,
    title,
    source,
    problemId,
    topic,
    locale,
    savedAt,
    updatedAt,
    status,
    ...(problemStatement ? { problemStatement } : {}),
  };
}

function deduplicate(records: AiProblemHistoryRecord[]): AiProblemHistoryRecord[] {
  const byId = new Map<string, AiProblemHistoryRecord>();
  for (const record of records) byId.set(record.id, record);
  return [...byId.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_RECORDS);
}

export function normalizeStatementIdentity(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function findMatchingRecord(
  records: AiProblemHistoryRecord[],
  candidate: {
    recordId: string | null;
    source: AiProblemSource;
    problemId: string | null;
    locale: SupportedLanguage;
    statement?: string;
  },
): AiProblemHistoryRecord | undefined {
  // 1. Explicit stable record identity always wins when source matches.
  if (candidate.recordId) {
    const byId = records.find(
      (record) =>
        record.id === candidate.recordId && record.source === candidate.source,
    );
    if (byId) return byId;
  }

  // 2. Curated problems deduplicate only on genuine curated problemId + locale.
  if (candidate.source === 'curated-ai' && candidate.problemId) {
    return records.find(
      (record) =>
        record.source === 'curated-ai' &&
        record.problemId === candidate.problemId &&
        record.locale === candidate.locale,
    );
  }

  // 3. Custom problems NEVER deduplicate by title or matched problem family.
  //    Only deduplicate when BOTH records store identical normalized statements
  //    in the same locale; otherwise keep separate records.
  if (candidate.source === 'custom-pasted' && candidate.statement) {
    const normalizedCandidate = normalizeStatementIdentity(candidate.statement);
    return records.find(
      (record) =>
        record.source === 'custom-pasted' &&
        record.locale === candidate.locale &&
        typeof record.problemStatement === 'string' &&
        normalizeStatementIdentity(record.problemStatement) === normalizedCandidate,
    );
  }

  return undefined;
}

function createId(): string {
  try {
    return `ai-${crypto.randomUUID()}`;
  } catch {
    return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export class LocalStorageAiProblemHistoryRepository
  implements AiProblemHistoryRepository
{
  private readonly storageKey: string;
  private readonly getStorage: () => Storage | null;

  constructor(
    storageKey = AI_PROBLEM_HISTORY_STORAGE_KEY,
    customStorage?: Storage | null,
  ) {
    this.storageKey = storageKey;
    this.getStorage = () => {
      if (customStorage !== undefined) return customStorage;
      try {
        return typeof window !== 'undefined' ? window.localStorage : null;
      } catch {
        return null;
      }
    };
  }

  private write(records: AiProblemHistoryRecord[]): boolean {
    const storage = this.getStorage();
    if (!storage) return false;
    const envelope: StoredAiHistoryEnvelope = {
      schemaVersion: AI_PROBLEM_HISTORY_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      records: deduplicate(records),
    };
    storage.setItem(this.storageKey, JSON.stringify(envelope));
    return true;
  }

  load(): AiHistoryLoadResult {
    const storage = this.getStorage();
    if (!storage) {
      return { records: [], recoveredFromError: true, warning: 'storage-unavailable' };
    }

    let text: string | null;
    try {
      text = storage.getItem(this.storageKey);
    } catch {
      return { records: [], recoveredFromError: true, warning: 'storage-read-failed' };
    }
    if (!text) return { records: [], recoveredFromError: false, warning: null };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { records: [], recoveredFromError: true, warning: 'storage-corrupted' };
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.records)) {
      return { records: [], recoveredFromError: true, warning: 'storage-corrupted' };
    }
    if (
      typeof parsed.schemaVersion !== 'number' ||
      parsed.schemaVersion > AI_PROBLEM_HISTORY_SCHEMA_VERSION
    ) {
      return { records: [], recoveredFromError: true, warning: 'storage-newer-version' };
    }

    const records = deduplicate(
      parsed.records
        .map(sanitizeAiHistoryRecord)
        .filter((record): record is AiProblemHistoryRecord => record !== null),
    );
    const skipped = records.length < parsed.records.length;
    return {
      records,
      recoveredFromError: skipped,
      warning: skipped ? 'records-skipped' : null,
    };
  }

  save(input: SaveAiProblemInput): SaveAiProblemResult {
    const title = cleanText(input.title, 160);
    if (!title || (input.locale !== 'en' && input.locale !== 'vi')) {
      return { saved: false, record: null, wasDuplicateUpdate: false, warning: 'invalid-record' };
    }

    const loaded = this.load();
    const now = new Date().toISOString();
    const requestedStatus: AiProblemHistoryStatus =
      input.status === 'bookmarked' ? 'bookmarked' : 'ai-conceptual';
    const statement =
      input.source === 'custom-pasted' &&
      input.consentToStoreStatement &&
      typeof input.problemStatement === 'string'
        ? input.problemStatement.trim().slice(0, MAX_STATEMENT_CHARS)
        : undefined;
    const candidate = {
      recordId: cleanText(input.recordId, 120),
      source: input.source,
      problemId: cleanText(input.problemId, 120),
      locale: input.locale,
      statement,
    };
    const existing = findMatchingRecord(loaded.records, candidate);
    // Preserve 'ai-conceptual' status if a curated problem was already analyzed and is bookmarked again offline.
    const nextStatus: AiProblemHistoryStatus =
      existing?.status === 'ai-conceptual' ? 'ai-conceptual' : requestedStatus;
    const preservedStatement =
      statement ??
      (input.source === 'custom-pasted' && input.consentToStoreStatement
        ? existing?.problemStatement
        : undefined);
    const record: AiProblemHistoryRecord = {
      id: existing?.id ?? createId(),
      title,
      source: input.source,
      problemId: candidate.problemId,
      topic: cleanText(input.topic, 120),
      locale: input.locale,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      status: nextStatus,
      ...(preservedStatement ? { problemStatement: preservedStatement } : {}),
    };
    const next = existing
      ? loaded.records.map((item) => (item.id === existing.id ? record : item))
      : [record, ...loaded.records];

    try {
      if (!this.write(next)) {
        return { saved: false, record: null, wasDuplicateUpdate: false, warning: 'storage-unavailable' };
      }
      return { saved: true, record, wasDuplicateUpdate: Boolean(existing), warning: null };
    } catch {
      return { saved: false, record: null, wasDuplicateUpdate: false, warning: 'storage-write-failed' };
    }
  }

  remove(recordId: string): { removed: boolean; warning: AiHistoryWarning | null } {
    const loaded = this.load();
    const exists = loaded.records.some((record) => record.id === recordId);
    if (!exists) return { removed: false, warning: null };
    try {
      if (!this.write(loaded.records.filter((record) => record.id !== recordId))) {
        return { removed: false, warning: 'storage-unavailable' };
      }
      return { removed: true, warning: null };
    } catch {
      return { removed: false, warning: 'storage-delete-failed' };
    }
  }
}

export const defaultAiProblemHistoryRepository: AiProblemHistoryRepository =
  new LocalStorageAiProblemHistoryRepository();
