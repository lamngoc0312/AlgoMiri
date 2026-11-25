import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  AiClientError,
  extractProblemFromImages,
  inspectProblemUrl,
  type AllowedImageMimeType,
  type ImageExtractionResponseDto,
  type ImageInputDto,
  type InspectUrlResponseDto,
} from '../../services/aiClient';
import type { LibraryProblemItem } from '../../domain/problems/libraryCatalog';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export type ComposerMode = 'text' | 'url' | 'image';

const ALLOWED_MIME_TYPES: readonly AllowedImageMimeType[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
];
const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface LocalImageAttachment {
  id: string;
  filename: string;
  mimeType: AllowedImageMimeType;
  sizeBytes: number;
  previewUrl: string;
  base64Data: string;
}

interface ProblemComposerProps {
  problemInput: string;
  prefillProblem?: LibraryProblemItem;
  analyzing: boolean;
  feedback: {
    type: 'empty' | 'unsupported' | 'error';
    message: string;
    canRetry?: boolean;
  } | null;
  onProblemInputChange: (nextText: string) => void;
  onAnalyzeText: (overrideText?: string) => void;
  onOpenCuratedStudio: (event: FormEvent) => void;
  onFillTwoSum: () => void;
  onFillValidParentheses: () => void;
  onFillSplitArray: () => void;
}

function fileToBase64(file: File): Promise<{ previewUrl: string; base64Data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error(`Invalid image encoding for ${file.name}.`));
        return;
      }
      resolve({
        previewUrl: dataUrl,
        base64Data: dataUrl.slice(commaIndex + 1),
      });
    };
    reader.readAsDataURL(file);
  });
}

function formatKb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProblemComposer({
  problemInput,
  prefillProblem,
  analyzing,
  feedback,
  onProblemInputChange,
  onAnalyzeText,
  onOpenCuratedStudio,
  onFillTwoSum,
  onFillValidParentheses,
  onFillSplitArray,
}: ProblemComposerProps) {
  const [composerMode, setComposerMode] = useState<ComposerMode>('text');

  // URL mode state
  const [urlInput, setUrlInput] = useState('');
  const [inspectingUrl, setInspectingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<InspectUrlResponseDto | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlDraftText, setUrlDraftText] = useState('');

  // Image mode state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState<LocalImageAttachment[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [extractingImages, setExtractingImages] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<ImageExtractionResponseDto | null>(null);
  const [confirmedTextDraft, setConfirmedTextDraft] = useState('');

  const handleInspectUrl = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Paste an HTTPS problem URL (for example, a LeetCode or GitHub link).');
      return;
    }

    setInspectingUrl(true);
    setUrlError(null);
    setUrlResult(null);
    setUrlDraftText('');

    try {
      const result = await inspectProblemUrl(trimmed);
      setUrlResult(result);
      if (result.extracted_text) {
        setUrlDraftText(result.extracted_text);
      }
    } catch (err) {
      setUrlError(
        err instanceof AiClientError
          ? err.message
          : 'Could not inspect this URL. Please check that it is a valid HTTPS link.',
      );
    } finally {
      setInspectingUrl(false);
    }
  };

  const addImageFiles = async (fileList: FileList | File[]) => {
    setImageError(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    if (attachments.length + incoming.length > MAX_IMAGE_COUNT) {
      setImageError(`You can upload up to ${MAX_IMAGE_COUNT} screenshots at a time.`);
      return;
    }

    const nextItems: LocalImageAttachment[] = [];
    for (const file of incoming) {
      if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedImageMimeType)) {
        setImageError(
          `Unsupported file "${file.name}". Please upload PNG, JPEG, or WebP screenshots.`,
        );
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`"${file.name}" exceeds the 4 MB per-image limit.`);
        return;
      }
      try {
        const { previewUrl, base64Data } = await fileToBase64(file);
        nextItems.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          filename: file.name,
          mimeType: file.type as AllowedImageMimeType,
          sizeBytes: file.size,
          previewUrl,
          base64Data,
        });
      } catch (err) {
        setImageError(
          err instanceof Error ? err.message : 'Could not read the selected image.',
        );
        return;
      }
    }

    setAttachments((prev) => [...prev, ...nextItems]);
    setExtractionResult(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void addImageFiles(event.target.files);
      event.target.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      void addImageFiles(event.dataTransfer.files);
    }
  };

  const handleExtractFromImages = async () => {
    if (attachments.length === 0) {
      setImageError('Add at least one PNG, JPEG, or WebP screenshot first.');
      return;
    }
    setExtractingImages(true);
    setImageError(null);

    try {
      const payload: ImageInputDto[] = attachments.map((item) => ({
        filename: item.filename,
        mime_type: item.mimeType,
        data_base64: item.base64Data,
      }));
      const result = await extractProblemFromImages(payload);
      setExtractionResult(result);
      setConfirmedTextDraft(result.extracted_text);
    } catch (err) {
      setImageError(
        err instanceof AiClientError
          ? err.message
          : 'Could not extract text from the uploaded screenshot(s). Please retry.',
      );
    } finally {
      setExtractingImages(false);
    }
  };

  const handleConfirmExtractedAndAnalyze = (draftText: string) => {
    const trimmed = draftText.trim();
    if (trimmed.length < 10) return;
    onProblemInputChange(trimmed);
    setComposerMode('text');
    onAnalyzeText(trimmed);
  };

  return (
    <Card className="text-left p-5 sm:p-7 shadow-[0_10px_32px_rgba(24,27,46,0.06)] space-y-5">
      {/* Pin-UI-Inspired Liquid Tabs Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Problem input mode"
          className="flex flex-wrap sm:inline-flex w-full sm:w-auto rounded-xl border border-[#E4E7F1] bg-[#F4F5FA] p-1 gap-1"
        >
          {(
            [
              { id: 'text', label: 'Problem Text', icon: FileText },
              { id: 'url', label: 'Problem URL', icon: Link2 },
              { id: 'image', label: 'Screenshot', icon: ImageIcon },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = composerMode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setComposerMode(id)}
                className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-[#181B2E] shadow-xs ring-1 ring-[#E4E7F1]'
                    : 'text-[#4E5672] hover:text-[#181B2E]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? 'text-[#645BE8]' : ''}`}
                  aria-hidden="true"
                />
                {label}
              </button>
            );
          })}
        </div>

        {prefillProblem && composerMode === 'text' && (
          <Badge variant="indigo">{prefillProblem.title}</Badge>
        )}
      </div>

      {/* MODE 1: Paste Problem Text */}
      {composerMode === 'text' && (
        <form onSubmit={onOpenCuratedStudio} className="space-y-4">
          <div>
            <label htmlFor="problem-input" className="sr-only">
              Paste a problem statement
            </label>
            <textarea
              id="problem-input"
              rows={4}
              value={problemInput}
              onChange={(e) => onProblemInputChange(e.target.value)}
              placeholder="Paste any algorithm problem statement to analyze its inputs, approach, and intuition..."
              className="w-full rounded-xl border border-[#D7DCEB] bg-[#F8F9FC] p-4 text-base leading-relaxed text-[#181B2E] placeholder:text-[#4E5672]/75 focus:border-[#645BE8] focus:bg-white focus:outline-none"
            />
          </div>

          {analyzing && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-xl border border-[#D8DCFF] bg-[#EEF0FF]/60 px-4 py-3 text-sm font-medium text-[#4F46D8]"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Analyzing problem structure, example, and key reasoning steps...
            </div>
          )}

          {feedback && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] p-4 text-sm leading-relaxed text-[#181B2E]"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="h-5 w-5 shrink-0 text-[#9A630A] mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="font-semibold text-[#9A630A]">
                    {feedback.type === 'unsupported'
                      ? 'Not supported in current demo'
                      : feedback.type === 'error'
                        ? 'Analysis request failed'
                        : 'Add a problem statement'}
                  </p>
                  <p className="text-[#4E5672]">{feedback.message}</p>
                </div>
              </div>
              {feedback.canRetry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyzeText()}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1 text-xs text-[#4E5672]">
              <span className="font-medium pr-1">Try sample:</span>
              <Button type="button" variant="ghost" size="sm" onClick={onFillTwoSum}>
                Load Two Sum sample
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFillValidParentheses}
              >
                Valid Parentheses
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFillSplitArray}
              >
                Split Array
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                title="Opens a built-in curated Studio example if your statement strictly matches one"
              >
                Open Curated Studio
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={analyzing}
                onClick={() => onAnalyzeText()}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Analyze Problem (AI)
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* MODE 2: Safe Problem URL Inspection */}
      {composerMode === 'url' && (
        <div className="space-y-4">
          <form onSubmit={handleInspectUrl} className="space-y-3">
            <label htmlFor="problem-url-input" className="sr-only">
              Paste a problem URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="problem-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                placeholder="https://leetcode.com/problems/reverse-integer/"
                className="h-12 flex-1 rounded-xl border border-[#D7DCEB] bg-[#F8F9FC] px-4 text-base text-[#181B2E] placeholder:text-[#7A829E] focus:border-[#645BE8] focus:bg-white focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={inspectingUrl}
              >
                {inspectingUrl ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                )}
                Inspect URL
              </Button>
            </div>
            <p className="text-sm text-[#4E5672]">
              Identifies canonical problem links safely. AlgoMiri never scrapes
              proprietary sites like LeetCode — only explicitly allowlisted public
              raw text files are fetched automatically.
            </p>
          </form>

          {urlError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] p-4 text-sm text-[#9A630A]"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{urlError}</span>
            </div>
          )}

          {urlResult && (
            <div className="rounded-xl border border-[#E4E7F1] bg-[#F8F9FC] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="indigo">{urlResult.source_name}</Badge>
                  {urlResult.slug && (
                    <span className="font-mono text-xs text-[#4E5672]">
                      {urlResult.slug}
                    </span>
                  )}
                </div>
                <a
                  href={urlResult.canonical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#645BE8] hover:text-[#4F46D8]"
                >
                  Open original problem
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              {urlResult.display_title && (
                <h3 className="text-lg font-bold text-[#181B2E]">
                  {urlResult.display_title}
                </h3>
              )}

              <p className="text-sm leading-relaxed text-[#4E5672]">
                {urlResult.message}
              </p>

              {urlResult.verified_match?.studio_path && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BDECE2] bg-[#E6F8F4]/70 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A594B]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Verified Studio available for {urlResult.verified_match.matched_problem_title}
                  </span>
                  <Link
                    to={urlResult.verified_match.studio_path}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#16B89D] px-3.5 text-sm font-semibold text-white hover:bg-[#0E967F]"
                  >
                    Open Verified Studio
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}

              {urlResult.retrieval_status === 'fetched' && urlResult.extracted_text ? (
                <div className="space-y-3 border-t border-[#E4E7F1] pt-4">
                  <label
                    htmlFor="url-extracted-confirm"
                    className="block text-sm font-bold text-[#181B2E]"
                  >
                    Review fetched text before analyzing:
                  </label>
                  <textarea
                    id="url-extracted-confirm"
                    rows={4}
                    value={urlDraftText}
                    onChange={(e) => setUrlDraftText(e.target.value)}
                    className="w-full rounded-xl border border-[#D7DCEB] bg-white p-3.5 text-sm leading-relaxed text-[#181B2E] focus:border-[#645BE8] focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleConfirmExtractedAndAnalyze(urlDraftText)}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Confirm &amp; Analyze
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setComposerMode('text')}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Paste Problem Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComposerMode('image')}
                  >
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    Upload Screenshot
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Dynamic Drop Zone for Problem Screenshots */}
      {composerMode === 'image' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload problem screenshots"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-7 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-[#645BE8] bg-[#EEF0FF]/60'
                : 'border-[#D7DCEB] bg-[#F8F9FC] hover:border-[#645BE8]/70 hover:bg-[#EEF0FF]/25'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E4E7F1] text-[#645BE8] shadow-2xs">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#181B2E]">
                Drop problem screenshots here, or click to browse
              </p>
              <p className="text-sm text-[#4E5672]">
                PNG, JPEG, or WebP · Up to 3 images · Max 4 MB each
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Choose screenshot files"
            />
          </div>

          <p className="flex items-center gap-1.5 text-xs text-[#4E5672]">
            <ShieldCheck className="h-4 w-4 text-[#16B89D] shrink-0" aria-hidden="true" />
            Images are processed in memory for transcription and are not stored by default.
          </p>

          {imageError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[#F1B34C] bg-[#FEF6E6] p-4 text-sm text-[#9A630A]"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{imageError}</span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="space-y-3">
              <ul className="grid gap-3 sm:grid-cols-3">
                {attachments.map((item) => (
                  <li
                    key={item.id}
                    className="relative flex items-center gap-3 rounded-xl border border-[#E4E7F1] bg-white p-2.5"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover border border-[#E4E7F1]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#181B2E]">
                        {item.filename}
                      </p>
                      <p className="text-xs text-[#4E5672]">
                        {formatKb(item.sizeBytes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.filename}`}
                      onClick={() => {
                        setAttachments((prev) =>
                          prev.filter((att) => att.id !== item.id),
                        );
                        setExtractionResult(null);
                      }}
                      className="rounded-lg p-1 text-[#4E5672] hover:bg-[#F4F5FA] hover:text-[#181B2E] cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={extractingImages}
                  onClick={() => void handleExtractFromImages()}
                >
                  {extractingImages ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  Extract Problem Text
                </Button>
              </div>
            </div>
          )}

          {/* Learner Confirmation Step Before Running Analysis */}
          {extractionResult && (
            <div className="rounded-xl border border-[#D8DCFF] bg-[#F8F9FC] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-bold text-[#181B2E]">
                  Confirm Extracted Problem Text
                </span>
                <Badge
                  variant={
                    extractionResult.mode === 'offline-demo' ? 'demo' : 'indigo'
                  }
                >
                  {extractionResult.mode === 'offline-demo'
                    ? 'Vision Offline'
                    : 'Review Before Analyzing'}
                </Badge>
              </div>

              <label htmlFor="extracted-image-confirm" className="sr-only">
                Confirm extracted problem text
              </label>
              <textarea
                id="extracted-image-confirm"
                rows={5}
                value={confirmedTextDraft}
                onChange={(e) => setConfirmedTextDraft(e.target.value)}
                className="w-full rounded-xl border border-[#D7DCEB] bg-white p-4 text-base leading-relaxed text-[#181B2E] focus:border-[#645BE8] focus:outline-none"
              />

              {extractionResult.diagram_notes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4E5672]">
                    Observed Diagrams / Tables
                  </p>
                  <ul className="space-y-1 text-sm text-[#181B2E]">
                    {extractionResult.diagram_notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {extractionResult.uncertain_regions.length > 0 && (
                <div className="rounded-xl border border-[#F1B34C] bg-[#FEF6E6] px-4 py-3 space-y-1 text-sm text-[#9A630A]">
                  <p className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Please verify unclear or missing details:
                  </p>
                  <ul className="space-y-0.5">
                    {extractionResult.uncertain_regions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onProblemInputChange(confirmedTextDraft);
                    setComposerMode('text');
                  }}
                >
                  Edit in Text Tab
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={
                    analyzing ||
                    extractionResult.mode === 'offline-demo' ||
                    confirmedTextDraft.trim().length < 10
                  }
                  onClick={() =>
                    handleConfirmExtractedAndAnalyze(confirmedTextDraft)
                  }
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Confirm &amp; Analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
