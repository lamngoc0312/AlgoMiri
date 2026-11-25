import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import { getAllProblemModules } from '../domain/problems/registry';
import i18n from '../i18n';
import { localizeLesson } from '../i18n/learningLocalization';

describe('Phase 3B.2A — Full Bilingual Curated Guided Lessons', () => {
  it('provides complete Vietnamese translations for every curated stage, option, hint, pseudocode explanation, and next activity without silent English fallback', () => {
    const modules = getAllProblemModules();
    expect(modules.map((m) => m.id)).toEqual([
      'two-sum',
      'valid-parentheses',
      'split-array-largest-sum',
    ]);

    const tEn = i18n.getFixedT('en');
    const tVi = i18n.getFixedT('vi');

    for (const mod of modules) {
      const enLesson = localizeLesson(tEn, mod.id, mod.lesson);
      const viLesson = localizeLesson(tVi, mod.id, mod.lesson);

      expect(viLesson.suggestedNextActivity).toBeTruthy();
      expect(viLesson.suggestedNextActivity).not.toBe(
        enLesson.suggestedNextActivity,
      );
      expect(viLesson.pseudocodeStageId).toBe(mod.lesson.pseudocodeStageId);
      expect(viLesson.stages.length).toBe(mod.lesson.stages.length);

      mod.lesson.stages.forEach((origStage, idx) => {
        const enStage = enLesson.stages[idx];
        const viStage = viLesson.stages[idx];

        // Stable identifiers & logic flags preserved
        expect(viStage.id).toBe(origStage.id);
        expect(viStage.stageNumber).toBe(origStage.stageNumber);
        expect(viStage.recommendedStrategy).toBe(origStage.recommendedStrategy);
        expect(viStage.lockedStrategyIds).toEqual(origStage.lockedStrategyIds);

        // No silent English fallback on any instructional field
        expect(viStage.shortTitle).not.toBe(enStage.shortTitle);
        expect(viStage.title).not.toBe(enStage.title);
        expect(viStage.goal).not.toBe(enStage.goal);
        expect(viStage.conceptLearned).not.toBe(enStage.conceptLearned);
        expect(viStage.narrative).not.toBe(enStage.narrative);
        expect(viStage.question.prompt).not.toBe(enStage.question.prompt);

        expect(viStage.question.options.length).toBe(
          origStage.question.options.length,
        );
        origStage.question.options.forEach((origOpt, optIdx) => {
          const enOpt = enStage.question.options[optIdx];
          const viOpt = viStage.question.options[optIdx];
          expect(viOpt.id).toBe(origOpt.id);
          expect(viOpt.isCorrect).toBe(origOpt.isCorrect);
          expect(viOpt.label).not.toBe(enOpt.label);
          expect(viOpt.feedback).not.toBe(enOpt.feedback);
        });

        // Progressive hints
        const origHints = mod.lesson.hintsByStage[origStage.id] ?? [];
        const enHints = enLesson.hintsByStage[origStage.id] ?? [];
        const viHints = viLesson.hintsByStage[origStage.id] ?? [];
        expect(viHints.length).toBe(origHints.length);
        origHints.forEach((origHint, hintIdx) => {
          expect(viHints[hintIdx].level).toBe(origHint.level);
          expect(viHints[hintIdx].label).not.toBe(enHints[hintIdx].label);
          expect(viHints[hintIdx].text).not.toBe(enHints[hintIdx].text);
        });
      });

      // Pseudocode titles & reasons localized, syntax lines preserved verbatim
      expect(viLesson.pseudocodeBlocks.length).toBe(
        mod.lesson.pseudocodeBlocks.length,
      );
      mod.lesson.pseudocodeBlocks.forEach((origBlock, blockIdx) => {
        const enBlock = enLesson.pseudocodeBlocks[blockIdx];
        const viBlock = viLesson.pseudocodeBlocks[blockIdx];
        expect(viBlock.id).toBe(origBlock.id);
        expect(viBlock.stepNumber).toBe(origBlock.stepNumber);
        expect(viBlock.title).not.toBe(enBlock.title);
        expect(viBlock.reason).not.toBe(enBlock.reason);
        expect(viBlock.lines).toEqual(origBlock.lines);
      });
    }
  });

  const studioScenarios = [
    {
      name: 'Two Sum',
      route: '/studio/two-sum',
      viStage1Title: 'Giai đoạn 1: Hiểu rõ bài toán',
      enStage1Title: 'Stage 1: Understand the Problem',
      viCorrectOption: /Không — hai chỉ số phải khác nhau/i,
      viFeedback: /Dù 3 \+ 3 = 6, chỉ số 0 không thể ghép với chính nó/i,
      enFeedback: /Even though 3 \+ 3 = 6, index 0 cannot pair with itself/i,
      viHint1Text: /nếu một phần tử chỉ xuất hiện một lần ở chỉ số 0/i,
      enHint1Text: /if an element appears once at index 0/i,
      viPseudoStageBtn: /Xây mã giả/i,
      viPseudoBlock1Title: '1. Khởi tạo bộ nhớ Bảng băm',
      codeLineSnippet: /create empty map seen/i,
      viConceptBadge: 'Phân tích bài toán & Ràng buộc hai chỉ số phân biệt',
    },
    {
      name: 'Valid Parentheses',
      route: '/studio/valid-parentheses',
      viStage1Title: 'Giai đoạn 1: Hiểu quy tắc dấu ngoặc cân bằng',
      enStage1Title: 'Stage 1: Understand Balanced Brackets',
      viCorrectOption: /Không — "\[" được mở gần nhất/i,
      viFeedback: /Dấu ngoặc mở trong cùng phải đóng trước/i,
      enFeedback: /The innermost open bracket must close first/i,
      viHint1Text: /khi ký tự "\)" xuất hiện thì dấu ngoặc nào/i,
      enHint1Text: /which bracket is still waiting to close/i,
      viPseudoStageBtn: /Xây mã giả/i,
      viPseudoBlock1Title: '1. Khởi tạo ngăn xếp rỗng & bảng cặp ngoặc',
      codeLineSnippet: /create empty stack/i,
      viConceptBadge: 'Thứ tự ngoặc lồng nhau (Quy tắc LIFO)',
    },
    {
      name: 'Split Array Largest Sum',
      route: '/studio/split-array-largest-sum',
      viStage1Title: 'Giai đoạn 1: Mảng con liên tiếp & Mục tiêu Minimax',
      enStage1Title: 'Stage 1: Contiguous Partitions & Minimax Goal',
      viCorrectOption: /18 — giá trị lớn hơn trong hai tổng nhóm/i,
      viFeedback: /ta đo điểm nghẽn \(tổng nhóm lớn nhất = 18\)/i,
      enFeedback: /we measure its bottleneck \(max group sum = 18\)/i,
      viHint1Text: /hai xe tải chở 14 kg và 18 kg/i,
      enHint1Text: /two trucks carry 14 kg and 18 kg/i,
      viPseudoStageBtn: /Ghép mã giả/i,
      viPseudoBlock1Title:
        '1. Hàm phụ kiểm tra khả thi Tham lam (O(n) thời gian, O(1) bộ nhớ phụ)',
      codeLineSnippet: /function canSplit\(nums, k, maxSum\):/i,
      viConceptBadge: 'Phân hoạch liên tiếp & Mục tiêu Minimax',
    },
  ] as const;

  for (const scenario of studioScenarios) {
    it(`supports full VI <-> EN switching, hints, pseudocode reveal, and summary without losing progress in ${scenario.name}`, async () => {
      const user = userEvent.setup();
      await i18n.changeLanguage('vi');

      render(
        <MemoryRouter initialEntries={[scenario.route]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      // 1. Guided Learning opens in Vietnamese
      expect(screen.getByText(scenario.viStage1Title)).toBeInTheDocument();

      // 2. Answer Stage 1 correctly and reveal Hint 1 in Vietnamese
      await user.click(
        screen.getByRole('radio', { name: scenario.viCorrectOption }),
      );
      expect(screen.getByText('Suy luận rất tốt!')).toBeInTheDocument();
      expect(screen.getByText(scenario.viFeedback)).toBeInTheDocument();
      expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Mở gợi ý 1 \/ 3/i }));
      expect(screen.getByText(scenario.viHint1Text)).toBeInTheDocument();

      // 3. Switch to English mid-lesson -> progress & revealed hint preserved
      await user.selectOptions(screen.getAllByLabelText('Ngôn ngữ')[0], 'en');
      expect(await screen.findByText(scenario.enStage1Title)).toBeInTheDocument();
      expect(screen.getByText('Great reasoning!')).toBeInTheDocument();
      expect(screen.getByText(scenario.enFeedback)).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText(scenario.enHint1Text)).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 3 revealed/i)).toBeInTheDocument();

      // 4. Switch back to Vietnamese -> content returns to Vietnamese, progress intact
      await user.selectOptions(screen.getAllByLabelText('Language')[0], 'vi');
      expect(await screen.findByText(scenario.viStage1Title)).toBeInTheDocument();
      expect(screen.getByText('Đã hoàn thành')).toBeInTheDocument();
      expect(screen.getByText(scenario.viHint1Text)).toBeInTheDocument();

      // 5. Navigate to Pseudocode stage and reveal step 1 (Vietnamese explanation + untranslated code)
      await user.click(
        screen.getByRole('button', { name: scenario.viPseudoStageBtn }),
      );
      await user.click(
        screen.getByRole('button', { name: /Mở bước mã giả tiếp theo/i }),
      );
      expect(screen.getByText(scenario.viPseudoBlock1Title)).toBeInTheDocument();
      expect(screen.getByText(scenario.codeLineSnippet)).toBeInTheDocument();

      // 6. Open Summary -> Vietnamese concept badge & localized next activity
      await user.click(screen.getByRole('button', { name: 'Tổng kết' }));
      expect(screen.getByText(scenario.viConceptBadge)).toBeInTheDocument();
      expect(
        screen.getByText(/Hãy chuyển sang Tự do khám phá/i),
      ).toBeInTheDocument();
    });
  }
});
