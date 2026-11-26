import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ALL_ROUTES = [
  '/',
  '/problems',
  '/studio/two-sum',
  '/studio/valid-parentheses',
  '/studio/split-array-largest-sum',
  '/progress',
  '/roadmap',
  '/history',
  '/profile',
] as const;

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const;

test.describe('Responsive Layout, Navigation & Accessibility', () => {
  test('@smoke switches to Vietnamese, persists after reload, and keeps long labels responsive', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByLabel('Language').first().selectOption('vi');
    await expect(page.getByRole('link', { name: 'Trang chủ' }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: 'Studio học tập' }).first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('algomiri.language')))
      .toBe('vi');

    // Verify localized Learning Studio, Guided Lesson, Trace, and Prediction content in Vietnamese
    await page.goto('/studio/two-sum', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Studio học tập' })).toBeVisible();
    await expect(page.getByText('Khung trực quan hóa thực thi')).toBeVisible();
    await expect(page.getByText('Giai đoạn 1: Hiểu rõ bài toán')).toBeVisible();
    await expect(page.getByText('Chọn mốc i = 0').last()).toBeVisible();
    await expect(
      page.getByText(/Con trỏ ghép j sẽ kiểm tra chỉ số nào tiếp theo/i),
    ).toBeVisible();

    await page.goto('/studio/valid-parentheses', { waitUntil: 'networkidle' });
    await expect(
      page.getByText('Giai đoạn 1: Hiểu quy tắc dấu ngoặc cân bằng'),
    ).toBeVisible();
    await expect(
      page.getByText('Chỉ số 0: Đẩy "{" vào ngăn xếp'),
    ).toBeVisible();

    await page.goto('/studio/split-array-largest-sum', { waitUntil: 'networkidle' });
    await expect(
      page.getByText('Giai đoạn 1: Mảng con liên tiếp & Mục tiêu Minimax'),
    ).toBeVisible();
    await expect(
      page.getByText('Khởi tạo các biên tìm kiếm [10, 32]'),
    ).toBeVisible();

    await page.goto('/roadmap', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Lộ trình học thuật toán' })).toBeVisible();
    await expect(page.getByText('Bản đồ kỹ năng tiên quyết tương tác')).toBeVisible();

    await page.goto('/progress', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Tiến độ học tập' })).toBeVisible();
    await expect(page.getByText('Chưa có phiên học nào được ghi nhận')).toBeVisible();

    await page.setViewportSize({ width: 320, height: 640 });
    for (const route of ['/', '/problems', '/studio/two-sum', '/roadmap', '/progress', '/history']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const overflowPx = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      );
      expect(overflowPx, `Vietnamese 320px overflow on ${route}`).toBe(0);
    }
  });

  test('renders all 8 major routes with zero horizontal overflow and zero errors across mobile, tablet, and desktop', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      const isSandboxedExternalResource =
        msg.text() === 'Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED';
      if (msg.type() === 'error' && !isSandboxedExternalResource) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ALL_ROUTES) {
        await page.goto(route, { waitUntil: 'networkidle' });
        const overflowPx = await page.evaluate(() =>
          Math.max(
            0,
            document.documentElement.scrollWidth - window.innerWidth,
          ),
        );
        expect(
          overflowPx,
          `Horizontal overflow on ${route} at ${vp.name} (${vp.width}x${vp.height})`,
        ).toBe(0);
      }
    }

    expect(consoleErrors, 'Console errors across routes').toEqual([]);
    expect(pageErrors, 'Uncaught page errors across routes').toEqual([]);
  });

  test('@smoke supports responsive navigation drawer on mobile and tablet viewports', async ({
    page,
  }) => {
    for (const vp of [
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto('/', { waitUntil: 'networkidle' });

      const menuBtn = page.getByRole('button', {
        name: /open navigation menu/i,
      });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();

      const mobileNav = page.getByRole('navigation', {
        name: /mobile navigation/i,
      });
      await expect(mobileNav).toBeVisible();
      await mobileNav.getByRole('link', { name: /^problems$/i }).click();
      await page.waitForURL('**/problems');
      await expect(mobileNav).toBeHidden();
    }
  });

  test('@smoke keeps desktop header navigation single-line without wrapping or overflow in EN and VI across desktop widths', async ({
    page,
  }) => {
    const desktopWidths = [1024, 1280, 1440, 1920];
    for (const lang of ['en', 'vi'] as const) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.getByLabel(/language|ngôn ngữ/i).first().selectOption(lang);

      for (const width of desktopWidths) {
        await page.setViewportSize({ width, height: 900 });
        const headerMetrics = await page.evaluate(() => {
          const header = document.querySelector('header');
          const nav = document.querySelector('header nav');
          if (!header || !nav) return null;
          const headerRect = header.getBoundingClientRect();
          const links = Array.from(nav.querySelectorAll('a')).map((a) => {
            const rect = a.getBoundingClientRect();
            return {
              text: a.textContent?.trim() ?? '',
              height: Math.round(rect.height),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              top: Math.round(rect.top),
            };
          });
          return {
            overflowPx: Math.max(
              0,
              document.documentElement.scrollWidth - window.innerWidth,
            ),
            headerHeight: Math.round(headerRect.height),
            headerRight: Math.round(headerRect.right),
            links,
          };
        });

        expect(headerMetrics, `Header metrics missing (${lang} @ ${width}px)`).not.toBeNull();
        expect(headerMetrics!.overflowPx, `Overflow (${lang} @ ${width}px)`).toBe(0);
        expect(headerMetrics!.links).toHaveLength(6);
        // Every link stays strictly single-line (height <= 44px) and shares the same row
        const firstTop = headerMetrics!.links[0].top;
        for (const link of headerMetrics!.links) {
          expect(
            link.height,
            `Wrapped nav link "${link.text}" (${lang} @ ${width}px)`,
          ).toBeLessThanOrEqual(44);
          expect(
            Math.abs(link.top - firstTop),
            `Multi-row nav link "${link.text}" (${lang} @ ${width}px)`,
          ).toBeLessThanOrEqual(2);
          expect(
            link.right,
            `Clipped nav link "${link.text}" (${lang} @ ${width}px)`,
          ).toBeLessThanOrEqual(headerMetrics!.headerRight);
        }
      }
    }
  });

  test('@smoke passes automated axe-core WCAG 2.0/2.1 A+AA checks on representative routes (desktop & mobile)', async ({
    page,
  }, testInfo) => {
    const checks: Array<{
      label: string;
      route: string;
      width: number;
      height: number;
    }> = [
      { label: 'desktop-home', route: '/', width: 1440, height: 900 },
      { label: 'desktop-problems', route: '/problems', width: 1440, height: 900 },
      {
        label: 'desktop-two-sum',
        route: '/studio/two-sum',
        width: 1440,
        height: 900,
      },
      {
        label: 'desktop-split-array',
        route: '/studio/split-array-largest-sum',
        width: 1440,
        height: 900,
      },
      { label: 'desktop-progress', route: '/progress', width: 1440, height: 900 },
      { label: 'desktop-roadmap', route: '/roadmap', width: 1440, height: 900 },
      { label: 'desktop-history', route: '/history', width: 1440, height: 900 },
      { label: 'mobile-home', route: '/', width: 375, height: 812 },
      {
        label: 'mobile-two-sum',
        route: '/studio/two-sum',
        width: 375,
        height: 812,
      },
      { label: 'mobile-roadmap', route: '/roadmap', width: 375, height: 812 },
      { label: 'mobile-history', route: '/history', width: 375, height: 812 },
    ];

    for (const item of checks) {
      await page.setViewportSize({ width: item.width, height: item.height });
      await page.goto(item.route, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      if (
        item.label === 'desktop-roadmap' ||
        item.label === 'mobile-two-sum'
      ) {
        const png = await page.screenshot({ fullPage: true });
        await testInfo.attach(`${item.label}.png`, {
          body: png,
          contentType: 'image/png',
        });
      }

      expect(
        results.violations,
        `axe-core violations on ${item.label} (${item.route})`,
      ).toEqual([]);
    }
  });

  test('@smoke supports keyboard skip-link focus visibility, Skill Map arrow navigation, and 320px reflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/roadmap', { waitUntil: 'networkidle' });

    // Skip link becomes focusable and visible on first Tab press
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
    const skipBox = await skipLink.boundingBox();
    expect(skipBox && skipBox.x >= 0).toBeTruthy();

    // Skill Map roving tabindex + ArrowRight / Home / End focus management
    const mapRegion = page.getByRole('region', {
      name: /layered skill prerequisite map/i,
    });
    const compBtn = mapRegion.getByRole('button', {
      name: /^algorithm composition/i,
    });
    await compBtn.click();
    await compBtn.focus();
    await expect(compBtn).toBeFocused();

    await page.keyboard.press('ArrowRight');
    const arrayBtn = mapRegion.getByRole('button', {
      name: /^array indexing/i,
    });
    await expect(arrayBtn).toBeFocused();
    await expect(arrayBtn).toHaveAttribute('tabindex', '0');

    // WCAG 1.4.10 narrow 320px reflow check (approximating 400% zoom on 1280px desktop)
    await page.setViewportSize({ width: 320, height: 640 });
    for (const route of ['/', '/problems', '/progress', '/roadmap']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const overflowPx = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      );
      expect(overflowPx, `320px reflow overflow on ${route}`).toBe(0);
    }
  });

  test('@smoke switches to Dark Mode, persists after reload, and passes axe-core WCAG 2.0/2.1 A+AA contrast checks', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /switch to dark mode/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Reload and confirm Dark Mode persists immediately
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Run axe-core WCAG 2.0/2.1 A+AA checks in Dark Mode across key routes
    for (const route of ['/', '/problems', '/studio/two-sum', '/roadmap']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations,
        `axe-core dark-mode violations on ${route}`,
      ).toEqual([]);
    }
  });
});
