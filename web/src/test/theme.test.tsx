import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import {
  readStoredTheme,
  THEME_STORAGE_KEY,
} from '../theme/themeStorage';
import { LANGUAGE_STORAGE_KEY } from '../i18n';
import type { TutorResponseDto } from '../services/aiClient';

const MOCK_TUTOR: TutorResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  reply: 'Keep track of visited values in a Hash Map so complement lookup is O(1).',
  guiding_question: 'Which value do we search for when nums[i] = 7 and target = 9?',
  progressive_hint: 'Check 9 - 7 = 2.',
  mastery_disclaimer:
    'AI tutoring supports conceptual understanding and does not verify code execution or measure long-term skill mastery.',
  notice: null,
};

describe('Phase 3A.1 — Light & Dark Theme System', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles between Light and Dark mode, persists in localStorage, and stays independent of language', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(document.documentElement.dataset.theme).toBe('light');

    // Switch to Dark Mode
    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Switching language to Vietnamese preserves Dark Mode and translates the toggle label
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('vi');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(
      await screen.findByRole('button', { name: /chuyển sang giao diện sáng/i }),
    ).toBeInTheDocument();

    // Switch back to Light Mode in Vietnamese
    await user.click(
      screen.getByRole('button', { name: /chuyển sang giao diện sáng/i }),
    );
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('falls back safely to light mode for invalid or blocked localStorage', () => {
    expect(readStoredTheme({ getItem: () => 'sepia' })).toBe('light');
    expect(
      readStoredTheme({
        getItem: () => {
          throw new DOMException('Blocked');
        },
      }),
    ).toBe('light');
  });

  it('preserves active Guided Learning progress and AI Tutor reply when toggling theme mid-session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_TUTOR,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/studio/two-sum']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    // Answer Stage 1 check correctly
    await user.click(
      screen.getByRole('radio', {
        name: /no — the two indices must be distinct/i,
      }),
    );
    expect(screen.getByText(/great reasoning!/i)).toBeInTheDocument();

    // Open Ask AI Tutor tab and generate a response
    await user.click(screen.getByRole('tab', { name: /^ask ai tutor$/i }));
    await user.click(screen.getByRole('button', { name: /give a hint/i }));
    expect(await screen.findByText(/check 9 - 7 = 2\./i)).toBeInTheDocument();

    // Toggle Dark Mode mid-lesson -> both Guided Stage completion & Tutor reply stay intact
    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByText(/great reasoning!/i)).toBeInTheDocument();
    expect(screen.getByText(/check 9 - 7 = 2\./i)).toBeInTheDocument();
  });
});
