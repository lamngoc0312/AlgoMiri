import type { SupportedLanguage } from '../i18n';

export const AI_PROBLEM_HISTORY_STORAGE_KEY = 'algomiri.ai.problem-history';
export const AI_PROBLEM_HISTORY_SCHEMA_VERSION = 1;
const MAX_RECORDS = 100;
const MAX_STATEMENT_CHARS = 20_000;

export type AiProblemSource = 'curated-ai' | 'custom-pasted';

export interface AiProblemHistoryRecord {
  id: string;
  title: string;
  source: AiProblemSource;
  problemId: string | null;
  topic: string | null;
  locale: SupportedLanguage;
  savedAt: string;
  updatedAt: string;
  status: 'ai-conceptual';
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
  title: string;
  source: AiProblemSource;
  problemId?: string | null;
  topic?: string | null;
  locale: SupportedLanguage;
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

  if (
    !id ||
    !title ||
    !savedAt ||
    !updatedAt ||
    !source ||
    !locale ||
    raw.status !== 'ai-conceptual'
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
    status: 'ai-conceptual',
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

function duplicateKey(record: Pick<AiProblemHistoryRecord, 'source' | 'problemId' | 'title' | 'locale'>): string {
  return [
    record.source,
    record.problemId ?? record.title.toLocaleLowerCase(record.locale),
    record.locale,
  ].join(':');
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
    const candidate = {
      source: input.source,
      problemId: cleanText(input.problemId, 120),
      title,
      locale: input.locale,
    };
    const existing = loaded.records.find(
      (record) => duplicateKey(record) === duplicateKey(candidate),
    );
    const statement =
      input.source === 'custom-pasted' &&
      input.consentToStoreStatement &&
      typeof input.problemStatement === 'string'
        ? input.problemStatement.trim().slice(0, MAX_STATEMENT_CHARS)
        : undefined;
    const record: AiProblemHistoryRecord = {
      id: existing?.id ?? createId(),
      title,
      source: input.source,
      problemId: candidate.problemId,
      topic: cleanText(input.topic, 120),
      locale: input.locale,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      status: 'ai-conceptual',
      ...(statement ? { problemStatement: statement } : {}),
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
