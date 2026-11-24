import { test, expect } from '@playwright/test';

test.describe('End-to-End Learning Journeys (Live Local Servers)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.localStorage.clear());
  });

  test('@smoke Journey 1, 2 & 6: Guided Two Sum -> Checkpoints -> Macro/Micro -> Local Persistence -> Personalized Roadmap', async ({
    page,
  }, testInfo) => {
    // 1. Landing -> Problems Library -> Verify accurate stage counts
    await page.getByRole('link', { name: /browse problem library/i }).click();
    await page.waitForURL('**/problems');
    await expect(page.getByText('5-stage Guided Lesson')).toBeVisible();
    await expect(page.getByText('4-stage Guided Lesson')).toHaveCount(2);

    // 2. Open Two Sum Guided Learning
    await page
      .locator('a[href="/studio/two-sum"]', { hasText: /start guided lesson/i })
      .first()
      .click();
    await page.waitForURL('**/studio/two-sum');

    // Checkpoint blocks Play/Next until learner answers or skips
    const playBtn = page.getByRole('button', { name: /play trace/i });
    const nextBtn = page.getByRole('button', { name: 'Next step', exact: true });
    await expect(playBtn).toBeDisabled();
    await expect(nextBtn).toBeDisabled();

    // Answer Stage 1 check & Step 1 prediction correctly
    await page
      .getByRole('radio', { name: /no — the two indices must be distinct/i })
      .click();
    await page
      .getByRole('region', { name: /predict the next step/i })
      .getByRole('radio', { name: /index 1 \(value 7\)/i })
      .click();
    await expect(playBtn).toBeEnabled();
    await expect(nextBtn).toBeEnabled();

    // Advance to Stage 3 (unlocks Hash Map) and toggle Macro/Micro views
    await page.getByRole('button', { name: /continue to stage 2/i }).click();
    await page.getByRole('button', { name: /skip to stage 3/i }).click();
    await expect(
      page.getByLabel(/seen hash map visualization/i),
    ).toBeVisible();

    await page
      .getByRole('button', { name: /macro view \(solution map\)/i })
      .click();
    await expect(
      page.getByText(/macro view · conceptual dag/i),
    ).toBeVisible();
    await page
      .getByRole('button', { name: /micro view \(execution\)/i })
      .click();

    // Finish to Session Summary -> Confirm saved locally -> Reload Progress Page
    await page.getByRole('button', { name: /skip to stage 4/i }).click();
    await page.getByRole('button', { name: /skip & view summary/i }).click();
    await expect(page.getByText(/saved to this browser/i)).toBeVisible();

    await page.getByRole('link', { name: /view learning progress/i }).click();
    await page.waitForURL('**/progress');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('progress-total-sessions')).toHaveText('1');
    await expect(page.getByTestId('progress-prediction-accuracy')).toHaveText(
      '100%',
    );

    // 3. Personalized Roadmap reflects saved session & offers Accessible List fallback
    await page.goto('/roadmap', { waitUntil: 'networkidle' });
    await expect(page.locator('#recommended-next-heading')).toContainText(
      /complete remaining stages in two sum/i,
    );
    await expect(
      page.getByRole('link', { name: /practice two sum again/i }).first(),
    ).toBeVisible();

    const roadmapPng = await page.screenshot({ fullPage: true });
    await testInfo.attach('personalized-roadmap-after-session.png', {
      body: roadmapPng,
      contentType: 'image/png',
    });

    await page.getByRole('button', { name: /accessible list/i }).click();
    await expect(
      page.getByRole('region', { name: /accessible skill prerequisite list/i }),
    ).toBeVisible();
  });

  test('Journey 3 & 4: Valid Parentheses Stack presets and Split Array negative-input validation', async ({
    page,
  }) => {
    // Valid Parentheses
    await page.goto('/studio/valid-parentheses?mode=explore', {
      waitUntil: 'networkidle',
    });
    await page.getByRole('button', { name: /crossed "\(\[\)\]"/i }).click();
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible();

    // Split Array Largest Sum rejects negative integers cleanly
    await page.goto('/studio/split-array-largest-sum?mode=explore', {
      waitUntil: 'networkidle',
    });
    const numsInput = page.getByLabel(/array \(nums/i);
    await numsInput.fill('-5, 2, 3');
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByRole('alert').first()).toContainText(
      /negative value -5 is not allowed/i,
    );
  });

  test('@smoke Journey 5: Live FastAPI AI Offline-Demo mode, Tutor disclaimer, stale warning, and unavailable-backend recovery', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const textarea = page.getByLabel(/paste a problem statement/i);
    await textarea.fill(
      'Given coin denominations and a target amount, find the minimum number of coins needed to make up that amount.',
    );

    // 1. Live FastAPI offline-demo analysis + AI Tutor
    await page.getByRole('button', { name: /analyze problem \(ai\)/i }).click();
    await expect(
      page.getByText(/offline demo mode \(no live ai key\)/i),
    ).toBeVisible();
    await expect(
      page.getByText(/^conceptual analysis only$/i),
    ).toBeVisible();

    await page
      .getByRole('button', { name: /give a conceptual hint/i })
      .click();
    await expect(
      page.getByText(/does not verify code execution/i),
    ).toBeVisible();

    // 2. Editing statement triggers stale-analysis warning
    await textarea.fill(
      'Given coin denominations and a target amount, count all distinct combinations.',
    );
    await expect(
      page.getByText(/outdated analysis — problem statement changed/i),
    ).toBeVisible();

    // 3. Simulate unavailable backend -> honest error alert -> retry recovers cleanly
    let failNext = true;
    await page.route('**/api/analyze', async (route) => {
      if (failNext) {
        failNext = false;
        await route.abort('connectionrefused');
        return;
      }
      await route.continue();
    });

    await page
      .getByRole('button', { name: /re-analyze updated text/i })
      .click();
    await expect(page.getByRole('alert').first()).toContainText(
      /could not reach the algomiri api/i,
    );

    await page.getByRole('button', { name: /^retry$/i }).click();
    await expect(
      page.getByText(/outdated analysis — problem statement changed/i),
    ).toBeHidden();
    await expect(
      page.getByText(/offline demo mode \(no live ai key\)/i),
    ).toBeVisible();
  });
});
