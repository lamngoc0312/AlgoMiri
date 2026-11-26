import type { TFunction } from 'i18next';
import { AiClientError } from './aiClient';

/**
 * Formats an AI API error into a safe, localized user-facing message based on
 * structured AiClientError kind and HTTP status rather than displaying raw
 * backend English strings or exposing sensitive internal details.
 */
export function formatAiErrorMessage(
  err: unknown,
  t: TFunction,
  options: {
    fallbackKey: 'landing.validation.analysisFailed' | 'aiTutor.error';
    suggestedWaitKey: 'landing.validation.suggestedWait' | 'aiTutor.suggestedWait';
  },
): string {
  if (!(err instanceof AiClientError)) {
    return t(options.fallbackKey);
  }

  let baseMessage: string;
  switch (err.kind) {
    case 'network':
      baseMessage = t('aiAnalysis.errors.network');
      break;
    case 'timeout':
      baseMessage =
        err.status === 504
          ? t('aiAnalysis.errors.gatewayTimeout')
          : t('aiAnalysis.errors.timeout');
      break;
    case 'rate_limit':
      baseMessage = t('aiAnalysis.errors.rateLimit');
      break;
    case 'validation':
      baseMessage =
        err.status === 413
          ? t('aiAnalysis.errors.payloadTooLarge')
          : t('aiAnalysis.errors.validation');
      break;
    case 'server':
      baseMessage =
        err.status === 503
          ? t('aiAnalysis.errors.serviceUnavailable')
          : err.status === 502
            ? t('aiAnalysis.errors.badGateway')
            : t('aiAnalysis.errors.server');
      break;
    default:
      baseMessage = t(options.fallbackKey);
      break;
  }

  if (err.retryAfterSeconds) {
    const waitHint = t(options.suggestedWaitKey, {
      seconds: err.retryAfterSeconds,
    });
    return `${baseMessage} (${waitHint})`;
  }

  return baseMessage;
}
