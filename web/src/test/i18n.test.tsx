import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { ProgressPage } from '../pages/ProgressPage';
import { RoadmapPage } from '../pages/RoadmapPage';
import { buildLearningSession } from '../domain/learning/analytics';
import type { LearningRepository } from '../services/learningRepository';
import i18n, {
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
} from '../i18n';
import { en } from '../i18n/locales/en';
import { vi } from '../i18n/locales/vi';

function flattenStrings(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value).reduce<Record<string, string>>(
    (all, [key, child]) => ({
      ...all,
      ...flattenStrings(child, prefix ? `${prefix}.${key}` : key),
    }),
    {},
  );
}

function placeholders(value: string) {
  return [...value.matchAll(/{{\s*([^}\s]+)\s*}}/g)]
    .map((match) => match[1])
    .sort();
}

function createMemoryRepo(
  sessions: ReturnType<typeof buildLearningSession>[],
): LearningRepository {
  let stored = [...sessions];
  return {
    loadSessions: () => ({
      sessions: stored,
      recoveredFromError: false,
      migratedFromVersion: null,
      warningMessage: null,
    }),
    saveSession: (session) => {
      stored = [session, ...stored.filter((s) => s.sessionId !== session.sessionId)];
      return { saved: true, wasDuplicateUpdate: false, warningMessage: null };
    },
    clearHistory: () => {
      stored = [];
      return { cleared: true, warningMessage: null };
    },
    hasSession: (sessionId) => stored.some((s) => s.sessionId === sessionId),
    getStorageInfo: () => ({
      backend: 'browser-local-storage',
      schemaVersion: 1,
      syncedAcrossDevices: false,
      available: true,
    }),
  };
}

describe('UI localization', () => {
  it('keeps English and Vietnamese resource keys and placeholders synchronized', () => {
    const english = flattenStrings(en);
    const vietnamese = flattenStrings(vi);

    expect(Object.keys(vietnamese).sort()).toEqual(Object.keys(english).sort());
    for (const key of Object.keys(english)) {
      expect(placeholders(vietnamese[key]), key).toEqual(placeholders(english[key]));
    }
  });

  it('switches the shell to Vietnamese and persists the selection', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getAllByLabelText('Language')[0], 'vi');

    expect((await screen.findAllByRole('link', { name: 'Trang chủ' })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Bài toán' }).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('vi');
    expect(document.documentElement.lang).toBe('vi');
  });

  it('uses English for an invalid stored language', () => {
    const storage = {
      getItem: () => 'fr',
    };

    expect(readStoredLanguage(storage)).toBe('en');
    expect(
      readStoredLanguage({
        getItem: () => {
          throw new DOMException('Storage blocked');
        },
      }),
    ).toBe('en');
  });

  it('falls back to English when a Vietnamese translation is missing', async () => {
    i18n.addResource('en', 'translation', 'test.fallbackProbe', 'English fallback');
    await i18n.changeLanguage('vi');

    expect(i18n.t('test.fallbackProbe' as never)).toBe('English fallback');

    await waitFor(() => expect(i18n.resolvedLanguage).toBe('vi'));
  });

  it('switches language mid-session in Learning Studio without losing Guided Learning progress', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/studio/two-sum']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Answer Stage 1 correctly and reveal 1 hint in English
    await user.click(
      screen.getByRole('radio', {
        name: /No — the two indices must be distinct/i,
      }),
    );
    expect(screen.getByText('Great reasoning!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reveal Hint 1 of 3/i }));

    // Switch to Vietnamese mid-session
    await user.selectOptions(screen.getAllByLabelText('Language')[0], 'vi');

    // Progress (completed badge, feedback, revealed hint count) stays intact in Vietnamese
    expect(await screen.findByText('Suy luận rất tốt!')).toBeInTheDocument();
    expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();
    expect(screen.getByText(/Đã mở 1 \/ 3/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Studio học tập' })).toBeInTheDocument();
    expect(screen.getByText('Khung trực quan hóa thực thi')).toBeInTheDocument();
    expect(screen.getByText('Dự đoán bước tiếp theo')).toBeInTheDocument();
  });

  it('renders Roadmap and Interactive Skill Map in Vietnamese including generated recommendations', async () => {
    await i18n.changeLanguage('vi');
    const repo = createMemoryRepo([]);

    render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <RoadmapPage repository={repo} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Lộ trình học thuật toán' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bắt đầu với bài học có hướng dẫn Two Sum'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bản đồ kỹ năng tiên quyết tương tác'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Chỉ số Mảng (Array Indexing)').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Lộ trình học hiện tại')).toBeInTheDocument();
  });

  it('renders Progress Page in Vietnamese for both empty and recorded sessions including clear dialog', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('vi');

    // Empty state
    const emptyRepo = createMemoryRepo([]);
    const { unmount } = render(
      <MemoryRouter initialEntries={['/progress']}>
        <ProgressPage repository={emptyRepo} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Tiến độ học tập' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có phiên học nào được ghi nhận'),
    ).toBeInTheDocument();
    expect(screen.getByText('Gợi ý luyện tập tiếp theo')).toBeInTheDocument();
    unmount();

    // Recorded session state + clear confirmation dialog
    const session = buildLearningSession({
      sessionId: 'vi-session-1',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'guided',
      strategiesExplored: ['brute-force', 'hash-map'],
      startedAt: '2026-11-25T10:00:00.000Z',
      completedAt: '2026-11-25T10:15:00.000Z',
      stageIds: ['understand', 'discover-brute-force', 'discover-optimization', 'build-solution'],
      stageStatuses: {
        understand: 'completed',
        'discover-brute-force': 'completed',
        'discover-optimization': 'completed',
        'build-solution': 'completed',
      },
      hintsByStage: { understand: 1 },
      predictionRecords: {},
    });

    const recordedRepo = createMemoryRepo([session]);
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <ProgressPage repository={recordedRepo} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Phiên học')).toBeInTheDocument();
    expect(screen.getByText('Độ chính xác dự đoán')).toBeInTheDocument();
    expect(screen.getByText('Theo dõi kỹ năng dựa trên bằng chứng')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành bài học có hướng dẫn')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Xóa lịch sử cục bộ/i }));
    expect(
      screen.getByText('Xóa toàn bộ phiên học đã lưu trên trình duyệt này?'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Xác nhận xóa lịch sử/i }));
    expect(
      screen.getByText('Đã xóa lịch sử học tập cục bộ khỏi trình duyệt này.'),
    ).toBeInTheDocument();
  });
});
