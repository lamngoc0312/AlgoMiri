import { useMemo, useState } from 'react';
import { BookOpen, Eye, MessageSquareText } from 'lucide-react';
import {
  TWO_SUM_PROBLEM,
  TWO_SUM_SOLUTION_GRAPHS,
} from '../domain/problems/twoSumDemo';
import {
  DEFAULT_TWO_SUM_INPUT,
  generateTwoSumTrace,
} from '../domain/traces/twoSumEngine';
import type { TwoSumInput, TwoSumStrategyId } from '../domain/traces/types';
import { ProblemPane } from '../features/studio/ProblemPane';
import { VisualCanvas } from '../features/studio/VisualCanvas';
import { WalkthroughPane } from '../features/studio/WalkthroughPane';
import { useTracePlayback } from '../features/studio/useTracePlayback';
import { Badge } from '../components/ui/Badge';

type MobileTab = 'problem' | 'canvas' | 'walkthrough';

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Eye }[] = [
  { id: 'problem', label: 'Problem', icon: BookOpen },
  { id: 'canvas', label: 'Visual Canvas', icon: Eye },
  { id: 'walkthrough', label: 'Walkthrough', icon: MessageSquareText },
];

export function StudioPage() {
  const [selectedStrategyId, setSelectedStrategyId] =
    useState<TwoSumStrategyId>('hash-map');
  const [currentInput, setCurrentInput] = useState<TwoSumInput>(
    DEFAULT_TWO_SUM_INPUT,
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');

  const strategy =
    TWO_SUM_PROBLEM.supportedStrategies.find((s) => s.id === selectedStrategyId) ??
    TWO_SUM_PROBLEM.supportedStrategies[0];

  const trace = useMemo(
    () => generateTwoSumTrace(selectedStrategyId, currentInput),
    [selectedStrategyId, currentInput],
  );

  const resetKey = `${selectedStrategyId}:${currentInput.nums.join(',')}:${currentInput.target}`;

  const playback = useTracePlayback({
    totalSteps: trace.steps.length,
    resetKey,
  });

  const currentStep = trace.steps[playback.stepIndex] ?? trace.steps[0];
  const solutionGraph =
    TWO_SUM_SOLUTION_GRAPHS[strategy.id] ?? TWO_SUM_SOLUTION_GRAPHS['hash-map'];

  const handleSelectStrategy = (newStrategyId: string) => {
    if (newStrategyId === 'brute-force' || newStrategyId === 'hash-map') {
      setSelectedStrategyId(newStrategyId);
    }
  };

  const handleApplyInput = (nextInput: TwoSumInput) => {
    setCurrentInput({
      nums: [...nextInput.nums],
      target: nextInput.target,
    });
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
            <Badge variant="mint">Interactive Trace</Badge>
          </div>
          <p className="mt-1 text-sm text-[#555D7A]">
            Test your own inputs, switch strategies, and step through deterministic execution traces.
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
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)_310px] lg:items-start">
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
            currentInput={currentInput}
            step={currentStep}
            stepIndex={playback.stepIndex}
            totalSteps={trace.steps.length}
            isPlaying={playback.isPlaying}
            speed={playback.speed}
            solutionGraph={solutionGraph}
            onApplyInput={handleApplyInput}
            onPrev={playback.prev}
            onNext={playback.next}
            onTogglePlay={playback.togglePlay}
            onReset={playback.reset}
            onSpeedChange={playback.setSpeed}
            onSeek={playback.goToStep}
          />
        </section>

        <section
          aria-label="Step walkthrough and explanation panel"
          className={mobileTab === 'walkthrough' ? 'block' : 'hidden lg:block'}
        >
          <WalkthroughPane
            strategy={strategy}
            step={currentStep}
            stepIndex={playback.stepIndex}
            totalSteps={trace.steps.length}
          />
        </section>
      </div>
    </div>
  );
}
