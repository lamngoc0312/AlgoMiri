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
] as const;

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const;

test.describe('Responsive Layout, Navigation & Accessibility', () => {
  test('renders all 7 major routes with zero horizontal overflow and zero errors across mobile, tablet, and desktop', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
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
      { label: 'mobile-home', route: '/', width: 375, height: 812 },
      {
        label: 'mobile-two-sum',
        route: '/studio/two-sum',
        width: 375,
        height: 812,
      },
      { label: 'mobile-roadmap', route: '/roadmap', width: 375, height: 812 },
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
});
