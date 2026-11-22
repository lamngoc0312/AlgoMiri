import { useState } from 'react';
import { BookOpen, Eye, MessageSquareText } from 'lucide-react';
import {
  TWO_SUM_PREVIEW_STEPS,
  TWO_SUM_PROBLEM,
  TWO_SUM_SOLUTION_GRAPHS,
} from '../domain/problems/twoSumDemo';
import { ProblemPane } from '../features/studio/ProblemPane';
import { VisualCanvas } from '../features/studio/VisualCanvas';
import { WalkthroughPane } from '../features/studio/WalkthroughPane';
import { Badge } from '../components/ui/Badge';

type MobileTab = 'problem' | 'canvas' | 'walkthrough';

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Eye }[] = [
  { id: 'problem', label: 'Problem', icon: BookOpen },
  { id: 'canvas', label: 'Visual Canvas', icon: Eye },
  { id: 'walkthrough', label: 'Walkthrough', icon: MessageSquareText },
];

export function StudioPage() {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('hash-map');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');

  const strategy =
    TWO_SUM_PROBLEM.supportedStrategies.find((s) => s.id === selectedStrategyId) ??
    TWO_SUM_PROBLEM.supportedStrategies[0];

  const steps = TWO_SUM_PREVIEW_STEPS[strategy.id] ?? TWO_SUM_PREVIEW_STEPS['hash-map'];
  const clampedIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[clampedIndex];
  const solutionGraph =
    TWO_SUM_SOLUTION_GRAPHS[strategy.id] ?? TWO_SUM_SOLUTION_GRAPHS['hash-map'];

  const handleSelectStrategy = (newStrategyId: string) => {
    setSelectedStrategyId(newStrategyId);
    setStepIndex(0);
  };

  const handlePrev = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleReset = () => {
    setStepIndex(0);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Studio Top Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#20253B]">
              Learning Studio
            </h1>
            <Badge variant="indigo">Two Sum</Badge>
            <Badge variant="demo">Sprint 1 Preview</Badge>
          </div>
          <p className="mt-1 text-sm text-[#555D7A]">
            Switch strategies on the left, inspect the visual state in the center, and step through the reasoning on the right.
          </p>
        </div>
      </div>

      {/* Mobile Tab Bar (< 1024px) */}
      <div
        role="tablist"
        aria-label="Learning Studio panes"
        className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-[#E3E7F2] bg-white p-1.5 lg:hidden"
      >
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = mobileTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMobileTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#645BE8] text-white shadow-xs'
                  : 'text-[#555D7A] hover:bg-[#F7F8FC]'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Responsive 3-Column Desktop Grid / Mobile Tabbed Panes */}
      <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)_320px] lg:items-start">
        <section
          aria-label="Problem and strategy panel"
          className={mobileTab === 'problem' ? 'block' : 'hidden lg:block'}
        >
          <ProblemPane
            problem={TWO_SUM_PROBLEM}
            selectedStrategyId={strategy.id}
            onSelectStrategy={handleSelectStrategy}
          />
        </section>

        <section
          aria-label="Visual execution canvas panel"
          className={mobileTab === 'canvas' ? 'block' : 'hidden lg:block'}
        >
          <VisualCanvas
            strategy={strategy}
            step={currentStep}
            solutionGraph={solutionGraph}
          />
        </section>

        <section
          aria-label="Step walkthrough and controls panel"
          className={mobileTab === 'walkthrough' ? 'block' : 'hidden lg:block'}
        >
          <WalkthroughPane
            step={currentStep}
            stepIndex={clampedIndex}
            totalSteps={steps.length}
            onPrev={handlePrev}
            onNext={handleNext}
            onReset={handleReset}
          />
        </section>
      </div>
    </div>
  );
}
