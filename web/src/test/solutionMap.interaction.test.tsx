import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Sprint 5 — Interactive Solution Map, Macro/Micro Sync & Multi-Checkpoint Guard', () => {
  it('prevents forward timeline seeking from jumping over an unresolved checkpoint even after solving Step 1', async () => {
    const user = userEvent.setup();
    renderAt('/studio/two-sum');

    // Switch to Negatives [-3, 4, 3, 90], target 0 (multi-step trace with multiple checkpoints)
    await user.click(
      screen.getByRole('button', { name: /negatives \[-3, 4, 3, 90\]/i }),
    );
    expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();

    // Solve Step 1's checkpoint correctly -> now Step 1 is resolved, but Step 2 is STILL unresolved!
    const predictSection = screen.getByRole('region', {
      name: /predict the next step/i,
    });
    await user.click(
      within(predictSection).getByRole('radio', { name: /index 1 \(value 4\)/i }),
    );

    // Drag timeline slider all the way to slider.max -> must clamp at Step 2 (index 1), NOT jump to the end!
    const slider = screen.getByLabelText(
      /trace step timeline/i,
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: slider.max } });

    expect(screen.getByText(/step 2 of/i)).toBeInTheDocument();
  });

  it('opens Macro View, inspects nodes, toggles "Why is this step necessary?", and supports List Fallback', async () => {
    const user = userEvent.setup();
    renderAt('/studio/two-sum?mode=explore');

    // Switch to Macro View (Solution Map)
    await user.click(
      screen.getByRole('button', { name: /macro view \(solution map\)/i }),
    );
    expect(
      screen.getByLabelText(/interactive solution dependency graph/i),
    ).toBeInTheDocument();

    // Select the merged decision node in Two Sum Hash Map DAG
    await user.click(
      screen.getByRole('button', { name: /lookup complement, else store/i }),
    );
    const inspector = screen.getByRole('region', {
      name: /selected reasoning node details/i,
    });
    expect(
      within(inspector).getByRole('heading', {
        name: /lookup complement, else store/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByText(/does not count as skill mastery/i),
    ).toBeInTheDocument();

    // Toggle "Why is this step necessary?"
    await user.click(
      within(inspector).getByRole('button', {
        name: /why is this step necessary\?/i,
      }),
    );
    expect(
      within(inspector).getByRole('region', { name: /step rationale/i }),
    ).toBeInTheDocument();

    // Toggle Accessible List Fallback
    await user.click(screen.getByRole('button', { name: /list fallback/i }));
    expect(
      screen.getByLabelText(/accessible solution dependency list/i),
    ).toBeInTheDocument();
  });

  it('synchronizes Macro View with strategy switching and jumps to verified steps in Micro View', async () => {
    const user = userEvent.setup();
    renderAt('/studio/two-sum?mode=explore');

    await user.click(
      screen.getByRole('button', { name: /macro view \(solution map\)/i }),
    );
    expect(screen.getByText(/hash map complement decomposition/i)).toBeInTheDocument();

    // Switch strategy to Brute Force while in Macro View
    await user.click(
      screen.getByRole('radio', { name: /brute force pair check/i }),
    );
    expect(screen.getByText(/brute force decomposition/i)).toBeInTheDocument();

    // Select termination node and click its verified Step 3 pill -> jumps to Micro View at Step 3
    await user.click(
      screen.getByRole('button', { name: /return pair or not found/i }),
    );
    const inspector = screen.getByRole('region', {
      name: /selected reasoning node details/i,
    });
    await user.click(within(inspector).getByRole('button', { name: /^step 3$/i }));

    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/solution found: indices \[0, 1\]/i)).toBeInTheDocument();
  });

  it('renders Valid Parentheses branching-and-merging Stack DAG in Macro View', async () => {
    const user = userEvent.setup();
    renderAt('/studio/valid-parentheses?mode=explore');

    await user.click(
      screen.getByRole('button', { name: /macro view \(solution map\)/i }),
    );
    expect(
      screen.getByText(/stack lifo bracket decomposition/i),
    ).toBeInTheDocument();
    const graph = screen.getByLabelText(/interactive solution dependency graph/i);
    expect(
      within(graph).getByRole('button', { name: /push opening brackets/i }),
    ).toBeInTheDocument();
    expect(
      within(graph).getByRole('button', {
        name: /match closer against top & pop/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(graph).getByRole('button', {
        name: /verify stack is empty at end/i,
      }),
    ).toBeInTheDocument();
  });
});
