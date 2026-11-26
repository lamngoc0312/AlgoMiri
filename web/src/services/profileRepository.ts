export const LOCAL_PROFILE_STORAGE_KEY = 'algomiri.profile.local';
export const LOCAL_PROFILE_SCHEMA_VERSION = 1;
export const MAX_DISPLAY_NAME_LENGTH = 40;

export interface LocalProfile {
  displayName: string | null;
  updatedAt: string | null;
}

interface StoredProfileEnvelope {
  schemaVersion: number;
  displayName: string | null;
  updatedAt: string;
}

export interface ProfileRepository {
  load(): LocalProfile;
  saveDisplayName(rawName: string): {
    saved: boolean;
    profile: LocalProfile;
    error: 'invalid' | 'storage-failed' | null;
  };
}

function stripControlChars(value: string): string {
  return Array.from(value)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips control characters, collapses whitespace, and enforces length limits.
 * Empty input returns `null` (clears optional display name cleanly).
 */
export function sanitizeDisplayName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = stripControlChars(raw);
  if (!cleaned) return null;
  return cleaned.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export class LocalStorageProfileRepository implements ProfileRepository {
  private readonly storageKey: string;
  private readonly getStorage: () => Storage | null;

  constructor(
    storageKey = LOCAL_PROFILE_STORAGE_KEY,
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

  load(): LocalProfile {
    const storage = this.getStorage();
    if (!storage) return { displayName: null, updatedAt: null };
    try {
      const raw = storage.getItem(this.storageKey);
      if (!raw) return { displayName: null, updatedAt: null };
      const parsed = JSON.parse(raw) as Partial<StoredProfileEnvelope>;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.schemaVersion !== 'number' ||
        parsed.schemaVersion > LOCAL_PROFILE_SCHEMA_VERSION
      ) {
        return { displayName: null, updatedAt: null };
      }
      return {
        displayName: sanitizeDisplayName(parsed.displayName),
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      };
    } catch {
      return { displayName: null, updatedAt: null };
    }
  }

  saveDisplayName(rawName: string): {
    saved: boolean;
    profile: LocalProfile;
    error: 'invalid' | 'storage-failed' | null;
  } {
    const trimmedRaw = stripControlChars(rawName);
    if (trimmedRaw.length > MAX_DISPLAY_NAME_LENGTH) {
      return {
        saved: false,
        profile: this.load(),
        error: 'invalid',
      };
    }

    const displayName = sanitizeDisplayName(trimmedRaw);
    const updatedAt = new Date().toISOString();
    const profile: LocalProfile = { displayName, updatedAt };
    const storage = this.getStorage();
    if (!storage) {
      return { saved: false, profile: this.load(), error: 'storage-failed' };
    }

    try {
      const envelope: StoredProfileEnvelope = {
        schemaVersion: LOCAL_PROFILE_SCHEMA_VERSION,
        displayName,
        updatedAt,
      };
      storage.setItem(this.storageKey, JSON.stringify(envelope));
      return { saved: true, profile, error: null };
    } catch {
      return { saved: false, profile: this.load(), error: 'storage-failed' };
    }
  }
}

export const defaultProfileRepository: ProfileRepository =
  new LocalStorageProfileRepository();
