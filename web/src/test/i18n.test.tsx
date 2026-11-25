import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
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
});
