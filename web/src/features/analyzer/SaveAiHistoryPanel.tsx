import { useState } from 'react';
import { BookmarkPlus, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface SaveAiHistoryPanelProps {
  isCustomProblem: boolean;
  saved: boolean;
  saving: boolean;
  error: boolean;
  onSave: (consentToStoreStatement: boolean) => void;
}

export function SaveAiHistoryPanel({
  isCustomProblem,
  saved,
  saving,
  error,
  onSave,
}: SaveAiHistoryPanelProps) {
  const { t } = useTranslation();
  const [showOptions, setShowOptions] = useState(false);
  const [consent, setConsent] = useState(false);

  if (saved) {
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent-teal-border)] bg-[var(--accent-teal-soft)]/60 px-4 py-3"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-teal-text)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {t('aiHistory.save.saved')}
        </span>
        <Link to="/history" className="text-sm font-semibold text-[var(--accent-blue-link)] hover:underline">
          {t('aiHistory.save.viewHistory')}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {t('aiHistory.save.title')}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
            {t('aiHistory.save.metadataOnly')}
          </p>
        </div>
        {!showOptions ? (
          <Button variant="secondary" size="sm" onClick={() => setShowOptions(true)}>
            <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
            {t('aiHistory.save.action')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={() => onSave(consent)}
          >
            <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
            {saving ? t('aiHistory.save.saving') : t('aiHistory.save.confirm')}
          </Button>
        )}
      </div>

      {showOptions && isCustomProblem && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--accent-amber-border)] bg-[var(--accent-amber-soft)]/45 p-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent-blue-solid)]"
          />
          <span>
            <span className="block font-semibold text-[var(--text-primary)]">
              {t('aiHistory.save.consentLabel')}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--text-secondary)]">
              {t('aiHistory.save.consentExplanation')}
            </span>
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--accent-coral-text)]">
          {t('aiHistory.save.error')}
        </p>
      )}
    </div>
  );
}
