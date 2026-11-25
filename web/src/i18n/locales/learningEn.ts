export const learningEn = {
  studio: {
    title: 'Learning Studio',
    switchProblem: 'Switch problem',
    openProblemLibrary: 'Open Problem Library',
    allProblems: 'All',
    modeSwitcher: 'Learning mode switcher',
    guidedLearning: 'Guided Learning',
    freeExploration: 'Free Exploration',
    panesLabel: 'Learning Studio panes',
    mobileTabs: {
      problem: 'Guide & Problem',
      canvas: 'Visual Canvas',
      walkthrough: 'Walkthrough',
    },
    panelLabels: {
      problemAndGuide: 'Problem and guided lesson panel',
      visualCanvas: 'Visual execution canvas panel',
      walkthrough: 'Step walkthrough and explanation panel',
    },
    perspective: 'Perspective:',
    perspectiveSwitcher: 'Micro and Macro view switcher',
    microView: 'Micro View (Execution)',
    macroView: 'Macro View (Solution Map)',
    dockLabel: 'Step details and AI Tutor',
    dockTabs: {
      explanation: 'Step Explanation',
      tutor: 'Ask AI Tutor',
    },
    saveSessionError: 'Session could not be saved to local storage.',
    notAvailableTitle: 'Problem Not Available Yet',
    notAvailableDescription:
      "We don't have a verified deterministic visual engine for {{problemId}} yet. Choose a supported interactive problem from the Problem Library.",
    browseProblemLibrary: 'Browse Problem Library',
    problemPane: {
      strategyTitle: 'Strategy',
      strategySelector: 'Solution strategy selector',
      optimizedStrategy: 'Optimized Strategy',
      stageUnlockBadge: 'Stage 3',
      lockedHint:
        'Unlocks in Stage 3 (Discover Optimization) — or switch to Free Exploration anytime.',
      problemAndRules: '{{title}} — Problem & Rules',
      examples: 'Examples',
      outputPrefix: 'Output: {{output}}',
      keyRules: 'Key Rules',
    },
    walkthrough: {
      title: 'Step Explanation',
      completedValid: 'Completed · Valid',
      completedStopped: 'Completed · Stopped',
      stepCounter: 'Step {{current}} / {{total}}',
      executionState: 'Execution State',
      complexityAndWhy: 'Complexity & Why {{strategy}}?',
    },
  },
  guided: {
    stagesNavLabel: 'Guided lesson stages',
    summaryButton: 'Summary',
    stageProgress: 'Stage {{current}} of {{total}}',
    stageStatus: {
      completed: 'Completed',
      skipped: 'Skipped',
      skippedAfterAttempt: 'Skipped After Attempt',
      attempted: 'Attempted',
    },
    feedbackCorrect: 'Great reasoning!',
    feedbackIncorrect: 'Not quite — try another option (no penalty):',
    pseudocodeRegion: 'Progressive pseudocode reveal',
    pseudocodeTitle: 'Progressive Pseudocode',
    pseudocodeSteps: '{{revealed}} / {{total}} steps',
    pseudocodeHidden:
      'Pseudocode stays hidden until you ask for it. Sketch the steps in your head first, then reveal one logical block at a time.',
    revealNextPseudocode: 'Reveal Next Pseudocode Step',
    hidePseudocode: 'Hide Pseudocode',
    stageButton: 'Stage {{number}}',
    continueToStage: 'Continue to Stage {{number}}',
    skipToStage: 'Skip to Stage {{number}}',
    finishAndViewSummary: 'Finish & View Summary',
    skipAndViewSummary: 'Skip & View Summary',
    hintsRegion: 'Progressive hints',
    revealHint: 'Reveal Hint {{next}} of {{total}}',
    hintsRevealedCount: '{{revealed}} / {{total}} revealed',
    allHintsRevealed: 'All {{total}} hints revealed for this stage.',
    predict: {
      sectionLabel: 'Predict the next step',
      title: 'Predict the Next Step',
      checkpointPaused: 'Checkpoint Paused',
      verified: 'Verified',
      activeRecall: 'Active Recall',
      choicesLabel: 'Prediction choices',
      reachedEnd:
        'Reached the final step of this trace. Reset or try a custom input to practice more predictions!',
      correct: 'Correct prediction!',
      incorrect:
        'Not quite — try again without penalty, or skip & reveal the verified next step.',
      stepToVerified: 'Step to Verified State',
      skipAndReveal: 'Skip & Reveal Next Step',
    },
    summary: {
      title: 'Local Session Summary · {{problem}}',
      savedToBrowser: 'Saved to This Browser',
      localOnlyBadge: 'Local Session Only',
      subtitle:
        'Verified activity from this browser session. Skipped stages, viewing visuals alone, and repeated clicks are never counted as completed.',
      strategiesExplored: 'Strategies Explored',
      predictionsAttempted: 'Predictions Attempted',
      firstTryCount: '{{count}} first-try',
      afterRetryCount: '{{count}} after retry',
      skippedCount: '{{count}} skipped',
      hintsUsed: 'Hints Used',
      strategyComplexity: '{{name}} · {{time}} time / {{space}} space',
      verifiedConcepts: 'Verified Concepts Completed ({{completed}} / {{total}})',
      noVerifiedStages:
        'No guided stage checks completed yet. Answer a stage check correctly to record it here.',
      skippedStagesNote:
        'Skipped stages ({{count}}): {{stages}} — revisit anytime to complete them.',
      skippedAfterAttemptNote:
        'Skipped after attempt ({{count}}): {{stages}} — retry anytime for verified completion.',
      skillsPracticed: 'Skills with Recorded Practice Evidence',
      suggestedNextTitle: 'Suggested Next Learning Activity',
      saveToLocalHistory: 'Save Session to Local History',
      viewLearningProgress: 'View Learning Progress',
      tryFreeExploration: 'Try Edge Cases in Free Exploration',
      restartLesson: 'Restart Guided Lesson',
      tryAnotherProblem: 'Try Another Problem',
      localDisclaimerLead: 'Local browser history only:',
      localDisclaimerBody:
        'Saved sessions are stored only in this browser and are not synced across devices. Finishing a guided lesson records guided progress, not independent mastery. Restarting begins a fresh session without altering previously saved records.',
    },
  },
  visualization: {
    predictToggleOn: 'Predict Next Step: On',
    predictToggleOff: 'Predict Next Step: Off',
    legend: 'Legend:',
    currentStepGoal: 'Current Step Supports Conceptual Goal:',
    currentStepComponent: 'Current Step Supports Conceptual Component:',
    openSolutionMap: 'Open Solution Map',
    openCompositionMap: 'Open Composition Map',
    macroBannerLabel: 'Synchronized Macro conceptual goal',
    playback: {
      regionLabel: 'Trace playback controls',
      stepOf: 'Step {{current}} of {{total}}',
      completedValid: 'Completed · Valid',
      completedNotFound: 'Completed · Not Found / Invalid',
      timelineLabel: 'Trace step timeline',
      transportLabel: 'Step transport controls',
      previousAria: 'Previous step',
      previous: 'Previous',
      playAria: 'Play trace',
      pauseAria: 'Pause trace',
      play: 'Play',
      pause: 'Pause',
      replay: 'Replay',
      nextAria: 'Next step',
      next: 'Next',
      resetAria: 'Reset trace',
      reset: 'Reset',
      speed: 'Speed',
      speedAria: 'Playback speed',
      blockedPlayTitle:
        'Answer or click Skip & Reveal below to continue playback',
      blockedNextTitle:
        'Answer or click Skip & Reveal below to advance past this checkpoint',
      checkpointActiveBanner:
        'Checkpoint active — answer the prediction below or click Skip & Reveal Next Step to advance.',
    },
    arrayHash: {
      title: 'Visual Execution Canvas',
      arrayRegion: 'Array state visualization',
      arrayHeader_one: 'Array ({{count}} item)',
      arrayHeader_other: 'Array ({{count}} items)',
      needComplement: 'Need complement: {{value}}',
      pairSum: 'Pair sum: {{value}}',
      emptyTitle: 'Empty Array ([])',
      emptyDescription:
        'With 0 elements, no two distinct indices can sum to {{target}}. Try a preset or enter at least two integers below.',
      solutionFound: 'Solution found: indices [{{first}}, {{second}}]',
      noPairFound: 'No valid pair found',
      noPairDescription:
        'No two distinct indices in this array sum to {{target}}.',
      hashMapRegion: 'Seen hash map visualization',
      hashMapTitle: 'Seen Hash Map (value → index)',
      hashMapSize: 'size: {{count}}',
      hashMapHit: 'Hit',
      hashMapAdded: 'Added',
      hashMapEmpty: 'Map is empty — no elements have been stored yet.',
      legendLabel: 'Highlight color legend',
      legendCurrent: 'Current / Anchor',
      legendPartner: 'Partner / Lookup',
      legendMatch: 'Confirmed Match',
      legendVisited: 'Stored / Visited',
    },
    stack: {
      title: 'Stack Execution Canvas',
      inputRegion: 'Bracket input string',
      inputHeader_one: 'Input String ({{count}} char)',
      inputHeader_other: 'Input String ({{count}} chars)',
      currentChar: 'Current: "{{char}}" (idx {{index}})',
      emptyTitle: 'Empty String ("")',
      emptyDescription:
        'Zero brackets means zero mismatches and an empty stack — valid (true)!',
      stackRegion: 'Vertical stack visualization',
      stackTitle: 'Stack State (LIFO)',
      stackSize: 'size: {{count}}',
      opPush: 'Push onto TOP',
      opPop: 'Pop from TOP',
      opCheckMatch: 'Comparing "{{char}}" with TOP "{{top}}"',
      opMismatch: 'Mismatch Detected',
      opUnclosed: 'Unclosed Brackets Remain',
      opValid: 'Balanced & Empty Stack',
      topHint: '↓ Push / Pop at TOP ↑',
      stackEmpty: 'Stack is empty',
      bottomLabel: 'Bottom',
      validTitle: 'Valid Parentheses (true)',
      validDescription:
        'Every bracket closed in proper Last-In-First-Out order and the stack ended empty.',
      invalidTitle: 'Invalid Parentheses (false)',
      invalidUnclosed:
        'Opening brackets remained unclosed on the stack when the string ended.',
      invalidMismatch:
        'A closing bracket failed to match the TOP of the stack (or the stack was empty).',
      legendLabel: 'Stack highlight color legend',
      legendCurrent: 'Current / Pushed',
      legendMatched: 'Matched / Valid',
      legendMismatch: 'Mismatch / Unclosed',
    },
    composition: {
      title: 'Composition Execution Canvas',
      coordinationLabel: 'Algorithm composition coordination',
      outerDriver: 'Outer Driver · Binary Search',
      activeBadge: 'Active',
      checking: 'checking...',
      subroutine: 'Subroutine · Greedy Packer',
      groupsPerK: 'groups / k',
      sumPerCap: 'sum / cap',
      partitionRegion: 'Contiguous partition visualization',
      arrayScanHeader: 'Array Scan & Contiguous Partitions (k = {{k}})',
      scanningBadge: 'Scanning idx {{index}} (val {{value}})',
      formedGroupsLabel: 'Formed contiguous subarrays',
      newGroupBadge: 'New Group',
      finalAnswerTitle: 'Minimized Largest Subarray Sum: {{answer}}',
      finalAnswerDetail: 'Verified exact {{k}}-subarray partition:',
      iterationsRegion: 'Binary Search iteration history',
      iterationsTitle:
        'Binary Search Iterations (click to inspect Greedy subtrace)',
      legendLabel: 'Composition highlight legend',
      legendDriver: 'BS Driver / Group 1',
      legendGreedy: 'Greedy Active / Feasible',
      legendScanning: 'Scanning / New Group Cut',
    },
    solutionMap: {
      macroBadge: 'Macro View · Conceptual DAG',
      displayModeLabel: 'Solution map display mode',
      graphMode: 'Graph',
      listMode: 'List Fallback',
      summaryPrompt:
        '{{summary}} Click any node to inspect why it is necessary, what it depends on, and which verified trace steps support it.',
      graphRegion: 'Interactive solution dependency graph',
      listRegion: 'Accessible solution dependency list',
      activeStep: 'Active Step',
      dependsOnInline: 'Depends on:',
      selectedRegion: 'Selected reasoning node details',
      supportsCurrentStep: 'Supports Current Step',
      whyButton: 'Why is this step necessary?',
      rationaleRegion: 'Step rationale',
      whyHeading: 'Why this reasoning step matters:',
      dependsOn: 'Depends On',
      entryGoal: 'Entry reasoning goal (no upstream graph dependency).',
      enables: 'Enables',
      finalGoal: 'Final outcome goal for this strategy.',
      dataFlow: 'Data Flow:',
      relevantSteps: 'Relevant Verified Execution Steps',
      inspectMicro: 'Inspect in Micro View',
      stepLockedTitle:
        'Complete or skip earlier guided checkpoints to jump here',
      jumpToStepTitle: 'Jump to verified Step {{step}}',
      stepButton: 'Step {{step}}',
      noMatchingSteps:
        'No steps in the current input trace trigger this node (try another preset to observe it).',
      skillsLabel: 'Skills:',
      disclaimer:
        'Viewing a node builds intuition; it does not count as skill mastery.',
      categories: {
        'input-model': 'Input Model',
        invariant: 'Invariant',
        operation: 'Operation',
        decision: 'Decision',
        technique: 'Technique',
        termination: 'Termination',
      },
      previewTitle: 'Conceptual Solution Map',
      previewBadge: 'Reasoning Flow',
    },
  },
  skills: {
    categories: {
      Foundations: 'Foundations',
      'Data Structures': 'Data Structures',
      'Strategy Design': 'Strategy Design',
      Analysis: 'Analysis',
      Optimization: 'Optimization',
      'Search & Monotonicity': 'Search & Monotonicity',
      'Problem Decomposition': 'Problem Decomposition',
    },
    items: {
      'array-indexing': {
        name: 'Array Indexing',
        description:
          'Reason accurately about 0-based indices, element values vs. positions, and distinct-index constraints.',
      },
      'stack-lifo': {
        name: 'Stack / LIFO',
        description:
          'Model nested obligations with Last-In-First-Out push/top/pop operations and empty-stack boundary checks.',
      },
      'brute-force': {
        name: 'Brute Force',
        description:
          'Construct a systematic baseline search (such as j > i pair enumeration) before optimizing.',
      },
      'time-space-complexity': {
        name: 'Time and Space Complexity',
        description:
          'Compare naive vs. optimized runtime and auxiliary memory tradeoffs accurately.',
      },
      'hash-map-lookup': {
        name: 'Hash Map Lookup',
        description:
          'Reformulate repeated scans into O(1) complement lookups while preserving lookup-before-insert invariants.',
      },
      'greedy-feasibility': {
        name: 'Greedy Feasibility',
        description:
          'Verify a candidate cap in O(n) via greedy contiguous packing and understand why nonnegativity is required.',
      },
      'binary-search-answer': {
        name: 'Binary Search on Answer',
        description:
          'Bound a monotonic answer space [low, high], pick mid, and safely narrow bounds until convergence.',
      },
      'algorithm-composition': {
        name: 'Algorithm Composition',
        description:
          'Coordinate a driver technique (Binary Search) with a nested feasibility subroutine (Greedy).',
      },
    },
    edges: {
      'array-indexing->brute-force':
        'Enumerating distinct pairs (i, j) safely requires reasoning about 0-based array positions and bounds.',
      'brute-force->time-space-complexity':
        'Comparing runtime and memory tradeoffs becomes concrete after analyzing a baseline O(n²) scan.',
      'array-indexing->hash-map-lookup':
        'Hash Map solutions map array values to their 0-based indices while preserving distinct-index checks.',
      'brute-force->hash-map-lookup':
        'Complement lookup is motivated directly by eliminating the repeated inner scan of Brute Force.',
      'array-indexing->greedy-feasibility':
        'Greedy contiguous subarray packing scans array indices sequentially while tracking running sums.',
      'time-space-complexity->binary-search-answer':
        'Binary Search on Answer is motivated by cutting an O(n · S) candidate scan down to O(n log S).',
      'binary-search-answer->algorithm-composition':
        'Binary Search acts as the outer driver that proposes candidate answers and halves [low, high].',
      'greedy-feasibility->algorithm-composition':
        'Greedy acts as the inner feasibility subroutine answering whether Binary Search’s candidate mid works.',
    },
    roadmapStatus: {
      'Not Started': 'Not Started',
      Introduced: 'Introduced',
      'Needs Practice': 'Needs Practice',
      'Guided Progress': 'Guided Progress',
      'Strong Guided Recall': 'Strong Guided Recall',
    },
    progressLabel: {
      'Not Yet Practiced': 'Not Yet Practiced',
      'Introduced (Viewed Only)': 'Introduced (Viewed Only)',
      'Practicing (Attempted)': 'Practicing (Attempted)',
      'Guided Progress (With Assistance)': 'Guided Progress (With Assistance)',
      'Strong Guided Recall (First-Try)': 'Strong Guided Recall (First-Try)',
      'Independently Demonstrated': 'Independently Demonstrated',
    },
  },
  roadmap: {
    title: 'Algorithm Learning Roadmap',
    personalizedBadge: 'Personalized · Local History',
    deterministicBadge: 'Deterministic Rules',
    subtitle:
      'Your next steps and skill prerequisites adapted transparently from your locally recorded Guided Learning and trace prediction evidence. All verified Studios remain open anytime.',
    viewProgressHistory: 'View Progress History',
    noticeLead: 'Transparent local roadmap:',
    noticeFirstTime:
      'No saved sessions yet in this browser — showing the recommended beginner starting path. Complete or finalize a Guided Learning session to personalize your path.',
    noticePersonalized_one:
      'Personalized from {{count}} locally saved session in this browser (not synced across devices). Recommendations use deterministic rules over verified attempts — never AI mastery scores or viewing-only counts.',
    noticePersonalized_other:
      'Personalized from {{count}} locally saved sessions in this browser (not synced across devices). Recommendations use deterministic rules over verified attempts — never AI mastery scores or viewing-only counts.',
    recommendedLabel: 'Recommended Next Activity',
    badges: {
      starter: 'Beginner Starting Path',
      review: 'Targeted Review',
      incomplete: 'Incomplete Stages',
      next: 'Next Milestone',
    },
    whyRecommended: 'Why this was recommended',
    focusSkills: 'Focus skills:',
    orChooseAnother: 'Or choose another Studio:',
    skillMapRegion: 'Skill prerequisite map',
    learningPathHeading: 'Current Learning Path',
    learningPathDescription:
      'All 3 verified interactive Studios are open anytime — prerequisites are shown as guidance, never lockouts.',
    browseLibrary: 'Browse Problem Library',
    stepLabel: 'Step 0{{index}} · {{difficulty}}',
    nextBadge: 'Next',
    skillsPracticed: 'Skills practiced:',
    suggestedPrerequisites: 'Suggested prerequisites:',
    needsReviewTitle: 'Skills Needing Review',
    toReviewCount: '{{count}} to review',
    noneFlagged: 'None flagged',
    reviewInStudio: 'Review in Studio',
    noReviewFirstTime:
      'No skills flagged for review yet — start a Guided Learning session to collect real evidence.',
    noReviewReturning:
      'No skills are currently flagged for repeated mistakes, heavy hint reliance, or contradictory evidence.',
    practicedConceptsTitle: 'Previously Practiced Concepts',
    activeSkillsCount: '{{active}} / {{total}} active',
    practicedSummary:
      '{{firstTry}} first-try · {{assisted}} assisted · {{skipped}} skipped',
    revisit: 'Revisit',
    noPracticedConcepts:
      'No concepts have active check or prediction evidence yet. Viewing a visualization alone introduces a concept, while answering stage checks and trace predictions records real practice.',
    plannedTitle: 'Planned Future Topics (Not Implemented Yet)',
    plannedBadge: 'Future Sprints',
    plannedAnchor: 'Planned anchor: {{problem}}',
    plannedTopics: {
      'two-pointers': {
        title: 'Two Pointers',
        description:
          'Coordinate two moving indices on sorted or structured arrays to avoid nested loops without extra memory.',
      },
      'sliding-window': {
        title: 'Sliding Window',
        description:
          'Expand and shrink a contiguous range while maintaining a running invariant.',
      },
      'trees-graphs': {
        title: 'Trees, Graphs & Traversals',
        description:
          'Combine BFS, DFS, and shortest-path reasoning on connected structures.',
      },
    },
    skillMap: {
      title: 'Interactive Skill Prerequisite Map',
      badge: 'Conceptual Dependencies',
      description:
        'Shows genuine learning prerequisites between concepts (not an algorithm execution trace). Select any skill with mouse or arrow keys to highlight its connections, evidence, and linked Studios.',
      viewModeLabel: 'Skill map view mode',
      visualMap: 'Visual Map',
      accessibleList: 'Accessible List',
      layeredRegion: 'Layered skill prerequisite map',
      listRegion: 'Accessible skill prerequisite list',
      layers: {
        0: 'Foundations',
        1: 'Core Patterns',
        2: 'Optimization',
        3: 'Answer Search',
        4: 'Composition',
        fallback: 'Advanced',
      },
      recommendedGoalAria: 'Recommended goal',
      goalBadge: 'Goal',
      recommendedGoalBadge: 'Recommended Goal',
      needs: 'Needs: {{skills}}',
      independentFoundation: 'Independent foundation',
      inspecting: 'Inspecting',
      inspectDetails: 'Inspect details',
      prerequisitesLabel: 'Prerequisites:',
      noneIndependent: 'None (independent foundation)',
      unlocksLabel: 'Unlocks:',
      detailsAria: 'Skill details for {{skill}}',
      recordedEvidence: 'Recorded Evidence',
      firstTry: 'First-try: {{count}}',
      assisted: 'Assisted: {{count}}',
      mistakes: 'Mistakes: {{count}}',
      skips: 'Skips: {{count}}',
      hints: 'Hints: {{count}}',
      openProblem: 'Open {{problem}}',
      prerequisitesCount: 'Prerequisites ({{count}})',
      independentNoPrereqs: 'Independent foundation — no prerequisites required.',
      preparesYouFor: 'Prepares You For',
      cautiousLead: 'Cautious labels:',
      cautiousBody:
        '“Strong Guided Recall” reflects consistent first-try answers inside Guided Learning and trace predictions — it does not claim independent mastery without a future unassisted assessment.',
    },
    engine: {
      statusReasons: {
        notStarted: 'No recorded activity on this skill yet.',
        viewedWithSkips:
          'Viewed only ({{skips}} skipped prediction(s) without attempting). Active checks are needed to build recall.',
        viewedOnly:
          'Introduced in {{views}} step(s) only — viewing visuals does not prove understanding yet.',
        needsPracticeDefault:
          'Recorded {{mistakes}} mistake/retry(s), {{skips}} skipped attempt(s), and {{hints}} hint(s) across {{checks}} check(s).',
        strongGuidedRecall:
          '{{firstTry}} first-try guided/prediction check(s) with low hint reliance. (Guided recall only — not independent mastery.)',
        guidedProgress:
          '{{firstTry}} first-try and {{assisted}} assisted check(s) completed. Additional unassisted predictions will strengthen recall.',
        mixedPredictionAccuracy:
          'Mixed signals: guided checks passed, but first-try trace prediction accuracy was low — a quick review in Predict Mode will stabilize recall.',
        mixedPredictionSkips:
          'Mixed signals: guided checks passed, but trace predictions were skipped without first-try verification.',
        mixedRetries:
          'Mixed signals: {{firstTry}} first-try check(s) alongside {{mistakes}} retry/mistake(s) — a quick review will stabilize recall.',
      },
      cta: {
        start: 'Start {{problem}}',
        startGuidedLesson: 'Start {{problem}} Guided Lesson',
        try: 'Try {{problem}}',
        review: 'Review {{problem}}',
        practiceAgain: 'Practice {{problem}} Again',
        revisit: 'Revisit {{problem}}',
        practicePredictions: 'Practice {{problem}} Predictions',
        exploreEdgeCases: 'Explore {{problem}} Edge Cases',
      },
      stepNotes: {
        ready: 'Ready to start whenever you like.',
        suggestedPrereqs:
          'Suggested prerequisites: {{skills}} (still open anytime).',
        progress:
          'Best verified stages: {{best}}/{{total}} · Predictions: {{firstTry}}/{{attempted}} first-try.',
      },
      recommendations: {
        starterTitle: 'Start with Two Sum Guided Learning',
        starterSummary:
          'Build foundational Array Indexing, Brute Force reasoning, and O(1) Hash Map Lookup before tackling harder patterns.',
        starterBullet1:
          'No local learning sessions are recorded in this browser yet.',
        starterBullet2:
          'Two Sum introduces 4 foundational skills (Array Indexing, Brute Force, Time & Space Complexity, Hash Map Lookup) that unlock later optimization topics.',
        starterBullet3:
          'Valid Parentheses (Stack / LIFO) has no prerequisites and is also immediately open if you prefer starting with Stacks.',
        reviewTitle: 'Review {{skill}} in {{problem}}',
        reviewContradictorySummary:
          'Your guided checks and trace predictions show mixed results on {{skill}}. Revisit the Studio in Predict Mode to test recall without hints.',
        reviewWeakSummary:
          'Focus on {{skill}} before moving to more complex combinations.',
        reviewBulletMarked:
          '{{skill}} is currently marked "{{status}}" ({{reason}}).',
        reviewBulletPrepares:
          'Strengthening {{skill}} prepares you for {{dependents}}.',
        reviewBulletPredict:
          'Re-practicing {{problem}} with Predict Mode enabled will build stronger first-try recall.',
        resumeTitle: 'Complete Remaining Stages in {{problem}}',
        resumeSummary:
          'You have verified {{best}} of {{total}} guided stages in {{problem}}. Opening the Studio starts a fresh session where you can jump to any stage from the stepper.',
        resumeBulletBest:
          'Your best saved session on {{problem}} verified {{best}}/{{total}} guided stages.',
        resumeBulletSkipped:
          '{{skipped}} trace prediction(s) were skipped — answering them directly builds verifiable evidence.',
        resumeBulletComplete:
          'Completing all guided stages in a fresh session ensures every core concept for this problem has recorded evidence.',
        verifyTitle: 'Practice Trace Predictions in {{problem}}',
        verifySummary:
          'You explored {{problem}}, but skipped {{skipped}} prediction(s) without first-try verification.',
        verifyBulletCount:
          'Recorded {{skipped}} skipped prediction(s) and 0 first-try predictions in {{problem}}.',
        verifyBulletReason:
          'Skipping without attempting records exposure only — actively predicting transitions tests real recall.',
        nextTwoSumTitle: 'Build Core Foundations in Two Sum',
        nextTwoSumSummary:
          'Practice Array Indexing, Brute Force, Time & Space Complexity, and Hash Map Lookup to unlock Split Array prerequisites.',
        nextTwoSumBullet1:
          'Two Sum has not been practiced yet in your local history.',
        nextTwoSumBullet2:
          'Its foundational skills (Array Indexing, Brute Force, Time & Space Complexity) are prerequisites for Greedy Feasibility and Binary Search on Answer.',
        nextValidParenthesesTitle:
          'Learn Stack / LIFO Reasoning in Valid Parentheses',
        nextValidParenthesesSummary:
          'Expand into Last-In-First-Out data structures with a dedicated vertical Stack visualization and edge-case checks.',
        nextValidParenthesesBullet1:
          'You already practiced Two Sum ({{best}}/{{total}} stages verified).',
        nextValidParenthesesBullet2:
          'Stack / LIFO is an independent foundational skill with 0 missing prerequisites and has not been practiced yet.',
        nextSplitArrayTitle:
          'Advance to Algorithm Composition: Split Array Largest Sum',
        nextSplitArraySummary:
          'Combine Binary Search on Answer with a nested O(n) Greedy feasibility subroutine.',
        nextSplitArrayBulletReady:
          'Your foundational prerequisites (Array Indexing, Brute Force, Time & Space Complexity) show solid guided progress.',
        nextSplitArrayBulletMissing:
          'Note: reviewing {{skills}} first can help, though Split Array is unlocked anytime.',
        nextSplitArrayBulletIntro:
          'Split Array introduces Algorithm Composition, Binary Search on Answer, and Greedy Feasibility.',
        drillTitle: 'Test Custom Edge Cases in {{problem}}',
        drillSummary:
          'You have completed guided sessions across all 3 verified Studios with strong guided recall. Challenge yourself with custom edge-case inputs in Free Exploration.',
        drillBullet1:
          'All {{count}} currently available verified Studios have completed guided sessions in this browser.',
        drillBullet2:
          'Guided recall is a strong foundation, though independent mastery still requires solving fresh problems without step-by-step scaffolding.',
        drillBullet3: '{{problem}} is a great next edge-case drill ({{hint}}).',
        drillHints: {
          'two-sum':
            'try duplicate values like [3, 3] (target 6), negative integers like [-3, 4, 3, 90] (target 0), or a no-solution input like [1, 2, 3] (target 100)',
          'valid-parentheses':
            'try crossed brackets like "([)]", unclosed openers like "((", a lonely closing bracket "]", or the empty string ""',
          'split-array-largest-sum':
            'try all-zero arrays like [0, 0, 0] (k = 2), exact-k splits like [1, 4, 4] (k = 3), single-element [1] (k = 1), or custom nonnegative arrays (nums[i] >= 0)',
          fallback:
            'try boundary presets and custom valid inputs inside the Studio',
        },
      },
    },
  },
  progress: {
    title: 'Learning Progress',
    localHistoryBadge: 'Local Browser History',
    subtitle:
      'Evidence-based activity recorded from your Guided Learning sessions and deterministic trace predictions.',
    practiceProblem: 'Practice a Problem',
    clearLocalHistory: 'Clear Local History',
    confirmClearAria: 'Confirm clearing local learning history',
    confirmClearTitle: 'Clear all saved learning sessions from this browser?',
    confirmClearDescription:
      'This permanently removes your {{count}} locally saved session(s) and resets all skill evidence counts.',
    confirmClearButton: 'Confirm Clear History',
    clearedFeedback: 'Local learning history cleared from this browser.',
    clearFailedFeedback: 'Could not clear local browser history.',
    savedLocallyFallback: 'Saved locally',
    noticeLead: 'Saved only in this browser:',
    noticeBody:
      'Learning history is stored locally on this device and is not synchronized across devices (no account or database is connected yet). Viewing a visualization or chatting with the AI Tutor never counts as verified mastery, and private pasted problem text or API keys are never stored.',
    emptyTitle: 'No learning sessions recorded yet',
    emptyDescription:
      'Complete or finalize a Guided Learning session in any verified Studio to record real prediction accuracy, stage checks, hints used, and skill evidence here. We never show fabricated stats or fake streaks.',
    startProblem: 'Start {{problem}}',
    statsAria: 'Progress summary statistics',
    kpi: {
      learningSessions: 'Learning Sessions',
      savedInBrowser: 'Saved in this browser',
      problemsPracticed: 'Problems Practiced',
      verifiedVisualStudios: 'Verified visual studios',
      strategiesExplored: 'Strategies Explored',
      acrossAllStudios: 'Across all verified studios',
      predictionAccuracy: 'Prediction Accuracy',
      firstTryRatio: '{{firstTry}}/{{attempted}} first-try',
      noPredictionsAttempted: 'No predictions attempted yet',
      hintsUsed: 'Hints Used',
      skillsPracticedOf: '{{practiced}} of {{total}} skills practiced',
    },
    predictionBreakdown: {
      title: 'Trace Prediction Breakdown',
      summaryBadge:
        '{{total}} total · {{attempted}} attempted · {{skipped}} skipped',
      chartAria:
        'Prediction outcomes across {{total}} question(s): {{firstTry}} first-try correct, {{retry}} solved after retry, {{skippedAttempt}} skipped after attempt, {{skippedUnattempted}} skipped without attempt, {{unresolved}} unresolved',
      firstTryCorrect: 'First-try correct:',
      solvedAfterRetry: 'Solved after retry/reveal:',
      skippedAfterAttempt: 'Skipped after attempt:',
      skippedUnattempted: 'Skipped (unattempted):',
      unresolved: 'Unresolved:',
      eventuallySolved: 'Eventually solved: {{percent}}%',
      empty:
        'No trace predictions recorded yet. Keep Predict Mode enabled during Guided Learning to test your intuition step by step.',
    },
    areasNeedingPractice: {
      title: 'Areas Needing More Practice',
      flaggedCount: '{{count}} flagged',
      lookingSteady: 'Looking steady',
      practiceInStudio: 'Practice in Studio',
      empty:
        'No specific skills are currently flagged for mistakes or heavy hint reliance. Continue exploring unpracticed skills or trying harder edge cases in Free Exploration.',
    },
    skillTracking: {
      title: 'Evidence-Based Skill Tracking',
      subtitle:
        'Distinguishes viewing, attempting, assisted answers, and first-try recall. Guided lessons cap below 100% because independent mastery requires an unassisted assessment.',
      practicedBadge: '{{practiced}} / {{total}} Practiced',
      indicatorAria: '{{skill}} evidence indicator',
      firstTry: 'First-try: {{count}}',
      assisted: 'Assisted: {{count}}',
      attempted: 'Attempted: {{count}}',
      viewed: 'Viewed: {{count}}',
      notes: {
        independent: '{{count}} independent assessment check(s) passed.',
        strongWithAssisted:
          '{{firstTry}} first-try guided/prediction check(s) correct, {{assisted}} with assistance. Independent mastery requires a future unassisted assessment.',
        strongFirstTry:
          '{{firstTry}} first-try guided/prediction check(s) correct. Independent mastery requires a future unassisted assessment.',
        guidedWithUnresolved:
          '{{firstTry}} first-try correct, {{assisted}} solved with retries/hints, {{attempted}} unresolved attempt(s).',
        guidedProgress:
          '{{firstTry}} first-try correct, {{assisted}} solved with retries/hints.',
        attemptedOnly:
          '{{attempted}} attempt(s) or skip(s) recorded — revisit guided checks and trace predictions to build accuracy.',
        viewedOnly:
          'Viewed in {{viewed}} session step(s) only. Viewing a visualization does not prove understanding yet.',
        notStarted: 'No recorded activity yet in this browser.',
      },
    },
    problemProgress: {
      title: 'Individual Problem Progress',
      sessionsCount_one: '{{count}} session',
      sessionsCount_other: '{{count}} sessions',
      notStarted: 'Not started',
      bestStages: 'Best Stages',
      strategies: 'Strategies',
      predictions: 'Predictions',
      firstTryShort: '1st try',
      hintsUsed: 'Hints Used',
      practiceAgain: 'Practice Again',
      startLesson: 'Start Lesson',
    },
    recentSessions: {
      title: 'Recent Learning Sessions',
      recordedCount: '{{count}} recorded',
      verifiedStages: 'Verified stages:',
      skippedParen: ' ({{count}} skipped)',
      predictions: 'Predictions:',
      firstTrySuffix: ' first-try',
      hints: 'Hints:',
    },
    outcomes: {
      'completed-guided': 'Guided Lesson Completed',
      'completed-with-skips': 'Completed with Skips',
      'partial-attempt': 'Partial Practice',
      'viewed-only': 'Viewed Only',
    },
    suggestionsCard: {
      title: 'Next Practice Suggestions',
      badge: 'Rule-Based · Deterministic',
      subtitle:
        'Simple suggestions derived directly from your recorded local evidence (not an AI recommendation model).',
      recommendedReview: 'Recommended Review',
      whyPrefix: 'Why:',
      items: {
        starterTwoSumTitle: 'Start with Two Sum Guided Learning',
        starterTwoSumReason:
          'You have no saved sessions yet. Two Sum introduces array indexing, Brute Force pair enumeration, and O(1) Hash Map lookups.',
        starterTwoSumCta: 'Start Two Sum Lesson',
        starterVpTitle: 'Try Stack LIFO Reasoning in Valid Parentheses',
        starterVpReason:
          'Great beginner problem for practicing Last-In-First-Out stack push/pop transitions and edge-case checking.',
        starterVpCta: 'Start Valid Parentheses',
        revisitHashMapTitle: 'Revisit Two Sum · Hash Map Complement Lookup',
        revisitHashMapReason:
          'Recorded {{mistakes}} mistake/skip(s) and {{assisted}} assisted check(s) on Hash Map Lookup. Practicing lookup-before-insert predictions will solidify this pattern.',
        revisitHashMapCta: 'Practice Two Sum Hash Map',
        revisitStackTitle: 'Practice Stack / LIFO Transitions in Valid Parentheses',
        revisitStackReason:
          'Recorded {{mistakes}} mistake/skip(s) and {{assisted}} assisted check(s) on Stack / LIFO. Step through crossed ("([)]") and unclosed ("((") presets with Predict Mode enabled.',
        revisitStackCta: 'Practice Valid Parentheses',
        revisitCompositionTitle:
          'Revisit Split Array Largest Sum · Binary Search + Greedy',
        revisitCompositionReason:
          'Recorded {{mistakes}} mistake/skip(s) across Binary Search on Answer, Greedy Feasibility, and Algorithm Composition. Inspect the Binary Search Iteration Inspector to trace how Greedy verdicts narrow [low, high].',
        revisitCompositionCta: 'Revisit Split Array Studio',
        finishStagesTitle: 'Complete Remaining Guided Stages in {{problem}}',
        finishStagesReason:
          'Your best session verified {{best}} of {{total}} guided stages. Completing the remaining checks builds stronger recall.',
        finishStagesCta: 'Continue {{problem}}',
        exploreTitle: 'Try {{problem}}',
        exploreReason:
          'You have not recorded a session on {{problem}} yet. Exploring a new problem family broadens your algorithmic toolkit.',
        exploreCta: 'Open {{problem}}',
      },
    },
  },
} as const;
