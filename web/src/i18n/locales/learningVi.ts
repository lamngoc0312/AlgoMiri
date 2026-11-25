export const learningVi = {
  studio: {
    title: 'Studio học tập',
    switchProblem: 'Chuyển bài toán',
    openProblemLibrary: 'Mở Thư viện bài toán',
    allProblems: 'Tất cả',
    modeSwitcher: 'Chuyển chế độ học tập',
    guidedLearning: 'Học có hướng dẫn',
    freeExploration: 'Tự do khám phá',
    panesLabel: 'Các khung trong Studio học tập',
    mobileTabs: {
      problem: 'Hướng dẫn & Đề bài',
      canvas: 'Trực quan hóa',
      walkthrough: 'Giải thích bước',
    },
    panelLabels: {
      problemAndGuide: 'Khung đề bài và bài học có hướng dẫn',
      visualCanvas: 'Khung trực quan hóa thực thi',
      walkthrough: 'Khung giải thích từng bước',
    },
    perspective: 'Góc nhìn:',
    perspectiveSwitcher: 'Chuyển góc nhìn Vi mô và Vĩ mô',
    microView: 'Góc nhìn Vi mô (Thực thi)',
    macroView: 'Góc nhìn Vĩ mô (Solution Map)',
    dockLabel: 'Chi tiết bước và Gia sư AI',
    dockTabs: {
      explanation: 'Giải thích bước',
      tutor: 'Hỏi Gia sư AI',
    },
    saveSessionError: 'Không thể lưu phiên học vào bộ nhớ trình duyệt.',
    notAvailableTitle: 'Bài toán chưa khả dụng',
    notAvailableDescription:
      'Hiện chưa có engine trực quan tất định đã kiểm chứng cho {{problemId}}. Hãy chọn một bài toán tương tác được hỗ trợ trong Thư viện bài toán.',
    browseProblemLibrary: 'Khám phá Thư viện bài toán',
    problemPane: {
      strategyTitle: 'Chiến lược',
      strategySelector: 'Chọn chiến lược giải',
      optimizedStrategy: 'Chiến lược tối ưu',
      stageUnlockBadge: 'Giai đoạn 3',
      lockedHint:
        'Mở khóa ở Giai đoạn 3 (Khám phá tối ưu hóa) — hoặc chuyển sang Tự do khám phá bất cứ lúc nào.',
      problemAndRules: '{{title}} — Đề bài & Quy tắc',
      examples: 'Ví dụ',
      outputPrefix: 'Đầu ra: {{output}}',
      keyRules: 'Quy tắc chính',
    },
    walkthrough: {
      title: 'Giải thích bước',
      completedValid: 'Hoàn tất · Hợp lệ',
      completedStopped: 'Hoàn tất · Đã dừng',
      stepCounter: 'Bước {{current}} / {{total}}',
      executionState: 'Trạng thái thực thi',
      complexityAndWhy: 'Độ phức tạp & Vì sao chọn {{strategy}}?',
    },
  },
  guided: {
    stagesNavLabel: 'Các giai đoạn của bài học có hướng dẫn',
    summaryButton: 'Tổng kết',
    stageProgress: 'Giai đoạn {{current}} / {{total}}',
    stageStatus: {
      completed: 'Đã hoàn thành',
      skipped: 'Đã bỏ qua',
      skippedAfterAttempt: 'Bỏ qua sau khi thử',
      attempted: 'Đã thử',
    },
    feedbackCorrect: 'Suy luận rất tốt!',
    feedbackIncorrect: 'Chưa chính xác — hãy thử đáp án khác (không bị trừ điểm):',
    pseudocodeRegion: 'Hiển thị mã giả từng bước',
    pseudocodeTitle: 'Mã giả (Pseudocode) từng bước',
    pseudocodeSteps: '{{revealed}} / {{total}} bước',
    pseudocodeHidden:
      'Mã giả được ẩn cho đến khi bạn yêu cầu. Hãy phác thảo các bước trong đầu trước, sau đó mở dần từng khối logic.',
    revealNextPseudocode: 'Mở bước mã giả tiếp theo',
    hidePseudocode: 'Ẩn mã giả',
    stageButton: 'Giai đoạn {{number}}',
    continueToStage: 'Tiếp tục sang Giai đoạn {{number}}',
    skipToStage: 'Bỏ qua sang Giai đoạn {{number}}',
    finishAndViewSummary: 'Hoàn thành & Xem tổng kết',
    skipAndViewSummary: 'Bỏ qua & Xem tổng kết',
    hintsRegion: 'Gợi ý từng mức',
    revealHint: 'Mở gợi ý {{next}} / {{total}}',
    hintsRevealedCount: 'Đã mở {{revealed}} / {{total}}',
    allHintsRevealed: 'Đã mở toàn bộ {{total}} gợi ý cho giai đoạn này.',
    predict: {
      sectionLabel: 'Dự đoán bước tiếp theo',
      title: 'Dự đoán bước tiếp theo',
      checkpointPaused: 'Tạm dừng tại điểm kiểm tra',
      verified: 'Đã xác nhận',
      activeRecall: 'Chủ động gợi nhớ',
      choicesLabel: 'Các lựa chọn dự đoán',
      reachedEnd:
        'Đã đến bước cuối của chuỗi thực thi. Hãy Đặt lại hoặc thử input tùy chỉnh để luyện thêm dự đoán!',
      correct: 'Dự đoán chính xác!',
      incorrect:
        'Chưa đúng — hãy thử lại không bị trừ điểm, hoặc bấm Bỏ qua & Xem bước tiếp theo.',
      stepToVerified: 'Chuyển sang trạng thái đã kiểm chứng',
      skipAndReveal: 'Bỏ qua & Xem bước tiếp theo',
    },
    summary: {
      title: 'Tổng kết phiên học cục bộ · {{problem}}',
      savedToBrowser: 'Đã lưu trên trình duyệt này',
      localOnlyBadge: 'Chỉ lưu cục bộ',
      subtitle:
        'Hoạt động đã xác thực trong phiên trình duyệt này. Giai đoạn bỏ qua, chỉ xem trực quan hóa hoặc bấm lặp lại không được tính là đã hoàn thành.',
      strategiesExplored: 'Chiến lược đã khám phá',
      predictionsAttempted: 'Dự đoán đã thực hiện',
      firstTryCount: '{{count}} đúng ngay lần đầu',
      afterRetryCount: '{{count}} sau khi thử lại',
      skippedCount: '{{count}} đã bỏ qua',
      hintsUsed: 'Số gợi ý đã dùng',
      strategyComplexity: '{{name}} · Thời gian {{time}} / Bộ nhớ {{space}}',
      verifiedConcepts: 'Khái niệm đã hoàn thành ({{completed}} / {{total}})',
      noVerifiedStages:
        'Chưa có câu hỏi giai đoạn nào được hoàn thành. Hãy trả lời đúng một câu hỏi giai đoạn để ghi nhận tại đây.',
      skippedStagesNote:
        'Giai đoạn đã bỏ qua ({{count}}): {{stages}} — bạn có thể quay lại hoàn thành bất cứ lúc nào.',
      skippedAfterAttemptNote:
        'Bỏ qua sau khi thử ({{count}}): {{stages}} — hãy thử lại bất cứ lúc nào để xác nhận hoàn thành.',
      skillsPracticed: 'Kỹ năng đã ghi nhận bằng chứng luyện tập',
      suggestedNextTitle: 'Hoạt động học tập tiếp theo được gợi ý',
      saveToLocalHistory: 'Lưu phiên vào lịch sử cục bộ',
      viewLearningProgress: 'Xem tiến độ học tập',
      tryFreeExploration: 'Thử trường hợp biên ở Tự do khám phá',
      restartLesson: 'Học lại từ đầu',
      tryAnotherProblem: 'Thử bài toán khác',
      localDisclaimerLead: 'Chỉ lưu lịch sử trên trình duyệt này:',
      localDisclaimerBody:
        'Các phiên đã lưu chỉ nằm trên trình duyệt hiện tại và không đồng bộ giữa các thiết bị. Hoàn thành bài học có hướng dẫn ghi nhận tiến độ có hướng dẫn, không phải mức thành thạo độc lập. Bắt đầu lại sẽ tạo phiên mới mà không sửa các bản ghi đã lưu.',
    },
  },
  visualization: {
    predictToggleOn: 'Dự đoán bước tiếp: Bật',
    predictToggleOff: 'Dự đoán bước tiếp: Tắt',
    legend: 'Chú thích:',
    currentStepGoal: 'Bước hiện tại hỗ trợ mục tiêu khái niệm:',
    currentStepComponent: 'Bước hiện tại hỗ trợ thành phần khái niệm:',
    openSolutionMap: 'Mở Solution Map',
    openCompositionMap: 'Mở Sơ đồ kết hợp',
    macroBannerLabel: 'Mục tiêu khái niệm Vĩ mô đồng bộ',
    playback: {
      regionLabel: 'Điều khiển phát chuỗi thực thi',
      stepOf: 'Bước {{current}} / {{total}}',
      completedValid: 'Hoàn tất · Hợp lệ',
      completedNotFound: 'Hoàn tất · Không tìm thấy / Không hợp lệ',
      timelineLabel: 'Thanh tiến độ các bước thực thi',
      transportLabel: 'Nút điều hướng bước thực thi',
      previousAria: 'Bước trước',
      previous: 'Trước',
      playAria: 'Phát chuỗi thực thi',
      pauseAria: 'Tạm dừng chuỗi thực thi',
      play: 'Phát',
      pause: 'Tạm dừng',
      replay: 'Phát lại',
      nextAria: 'Bước tiếp theo',
      next: 'Tiếp',
      resetAria: 'Đặt lại chuỗi thực thi',
      reset: 'Đặt lại',
      speed: 'Tốc độ',
      speedAria: 'Tốc độ phát',
      blockedPlayTitle:
        'Trả lời hoặc bấm Bỏ qua & Xem bước tiếp theo bên dưới để tiếp tục phát',
      blockedNextTitle:
        'Trả lời hoặc bấm Bỏ qua & Xem bước tiếp theo bên dưới để qua điểm kiểm tra này',
      checkpointActiveBanner:
        'Đang ở điểm kiểm tra — hãy trả lời câu hỏi dự đoán bên dưới hoặc bấm Bỏ qua & Xem bước tiếp theo để tiếp tục.',
    },
    arrayHash: {
      title: 'Khung trực quan hóa thực thi',
      arrayRegion: 'Trực quan hóa trạng thái mảng',
      arrayHeader_one: 'Mảng ({{count}} phần tử)',
      arrayHeader_other: 'Mảng ({{count}} phần tử)',
      needComplement: 'Cần phần bù: {{value}}',
      pairSum: 'Tổng cặp: {{value}}',
      emptyTitle: 'Mảng rỗng ([])',
      emptyDescription:
        'Với 0 phần tử, không có hai chỉ số phân biệt nào có tổng bằng {{target}}. Hãy thử một mẫu có sẵn hoặc nhập ít nhất hai số nguyên bên dưới.',
      solutionFound: 'Tìm thấy lời giải: chỉ số [{{first}}, {{second}}]',
      noPairFound: 'Không tìm thấy cặp hợp lệ',
      noPairDescription:
        'Không có hai chỉ số phân biệt nào trong mảng này có tổng bằng {{target}}.',
      hashMapRegion: 'Trực quan hóa Bảng băm đã duyệt',
      hashMapTitle: 'Bảng băm đã duyệt (giá trị → chỉ số)',
      hashMapSize: 'kích thước: {{count}}',
      hashMapHit: 'Khớp',
      hashMapAdded: 'Đã thêm',
      hashMapEmpty: 'Bảng băm đang trống — chưa có phần tử nào được lưu.',
      legendLabel: 'Chú thích màu đánh dấu',
      legendCurrent: 'Hiện tại / Mốc',
      legendPartner: 'Phần tử ghép / Tra cứu',
      legendMatch: 'Khớp chính xác',
      legendVisited: 'Đã lưu / Đã duyệt',
    },
    stack: {
      title: 'Khung trực quan hóa Ngăn xếp (Stack)',
      inputRegion: 'Chuỗi dấu ngoặc đầu vào',
      inputHeader_one: 'Chuỗi đầu vào ({{count}} ký tự)',
      inputHeader_other: 'Chuỗi đầu vào ({{count}} ký tự)',
      currentChar: 'Hiện tại: "{{char}}" (idx {{index}})',
      emptyTitle: 'Chuỗi rỗng ("")',
      emptyDescription:
        'Không có dấu ngoặc nào đồng nghĩa không có cặp sai và ngăn xếp rỗng — hợp lệ (true)!',
      stackRegion: 'Trực quan hóa Ngăn xếp theo chiều dọc',
      stackTitle: 'Trạng thái Ngăn xếp (LIFO)',
      stackSize: 'kích thước: {{count}}',
      opPush: 'Đẩy (Push) lên ĐỈNH',
      opPop: 'Lấy (Pop) từ ĐỈNH',
      opCheckMatch: 'So sánh "{{char}}" với ĐỈNH "{{top}}"',
      opMismatch: 'Phát hiện không khớp',
      opUnclosed: 'Còn dấu ngoặc mở chưa đóng',
      opValid: 'Cân bằng & Ngăn xếp rỗng',
      topHint: '↓ Push / Pop tại ĐỈNH ↑',
      stackEmpty: 'Ngăn xếp đang rỗng',
      bottomLabel: 'Đáy',
      validTitle: 'Chuỗi ngoặc hợp lệ (true)',
      validDescription:
        'Mọi dấu ngoặc đều đóng đúng thứ tự Vào sau - Ra trước (LIFO) và ngăn xếp kết thúc rỗng.',
      invalidTitle: 'Chuỗi ngoặc không hợp lệ (false)',
      invalidUnclosed:
        'Vẫn còn dấu ngoặc mở chưa được đóng trong ngăn xếp khi hết chuỗi.',
      invalidMismatch:
        'Một dấu ngoặc đóng không khớp với đỉnh ngăn xếp (hoặc ngăn xếp đang rỗng).',
      legendLabel: 'Chú thích màu đánh dấu Ngăn xếp',
      legendCurrent: 'Hiện tại / Đã đẩy vào',
      legendMatched: 'Đã khớp / Hợp lệ',
      legendMismatch: 'Không khớp / Chưa đóng',
    },
    composition: {
      title: 'Khung trực quan hóa Kết hợp thuật toán',
      coordinationLabel: 'Điều phối kết hợp thuật toán',
      outerDriver: 'Vòng ngoài · Tìm kiếm nhị phân',
      activeBadge: 'Đang chạy',
      checking: 'đang kiểm tra...',
      subroutine: 'Hàm con · Gom nhóm Tham lam (Greedy)',
      groupsPerK: 'nhóm / k',
      sumPerCap: 'tổng / ngưỡng',
      partitionRegion: 'Trực quan hóa phân hoạch liên tiếp',
      arrayScanHeader: 'Duyệt mảng & Phân hoạch liên tiếp (k = {{k}})',
      scanningBadge: 'Đang duyệt idx {{index}} (giá trị {{value}})',
      formedGroupsLabel: 'Các mảng con liên tiếp đã tạo',
      newGroupBadge: 'Nhóm mới',
      finalAnswerTitle: 'Tổng mảng con lớn nhất nhỏ nhất: {{answer}}',
      finalAnswerDetail: 'Phân hoạch chính xác {{k}} mảng con đã kiểm chứng:',
      iterationsRegion: 'Lịch sử các lần lặp Tìm kiếm nhị phân',
      iterationsTitle:
        'Các vòng lặp Binary Search (bấm để xem chuỗi con Greedy)',
      legendLabel: 'Chú thích màu kết hợp thuật toán',
      legendDriver: 'Binary Search / Nhóm 1',
      legendGreedy: 'Greedy đang chạy / Khả thi',
      legendScanning: 'Đang duyệt / Tách nhóm mới',
    },
    solutionMap: {
      macroBadge: 'Góc nhìn Vĩ mô · DAG khái niệm',
      displayModeLabel: 'Chế độ hiển thị Solution Map',
      graphMode: 'Đồ thị',
      listMode: 'Danh sách dễ tiếp cận',
      summaryPrompt:
        '{{summary}} Bấm vào bất kỳ nút nào để xem vì sao bước này cần thiết, nó phụ thuộc vào gì và các bước thực thi đã kiểm chứng nào hỗ trợ nó.',
      graphRegion: 'Đồ thị phụ thuộc lời giải tương tác',
      listRegion: 'Danh sách phụ thuộc lời giải dễ tiếp cận',
      activeStep: 'Bước hiện tại',
      dependsOnInline: 'Phụ thuộc vào:',
      selectedRegion: 'Chi tiết nút suy luận đang chọn',
      supportsCurrentStep: 'Hỗ trợ bước hiện tại',
      whyButton: 'Vì sao bước này cần thiết?',
      rationaleRegion: 'Lý do của bước suy luận',
      whyHeading: 'Vì sao bước suy luận này quan trọng:',
      dependsOn: 'Phụ thuộc vào',
      entryGoal: 'Mục tiêu suy luận khởi đầu (không có phụ thuộc trước đó).',
      enables: 'Mở đường cho',
      finalGoal: 'Mục tiêu kết quả cuối cùng của chiến lược này.',
      dataFlow: 'Luồng dữ liệu:',
      relevantSteps: 'Các bước thực thi đã kiểm chứng liên quan',
      inspectMicro: 'Xem ở Góc nhìn Vi mô',
      stepLockedTitle:
        'Hoàn thành hoặc bỏ qua các điểm kiểm tra trước đó để nhảy đến bước này',
      jumpToStepTitle: 'Nhảy tới Bước {{step}} đã kiểm chứng',
      stepButton: 'Bước {{step}}',
      noMatchingSteps:
        'Không có bước nào trong chuỗi thực thi của input hiện tại kích hoạt nút này (hãy thử mẫu input khác).',
      skillsLabel: 'Kỹ năng:',
      disclaimer:
        'Xem một nút giúp xây dựng trực giác; không được tính là đã thành thạo kỹ năng.',
      categories: {
        'input-model': 'Mô hình đầu vào',
        invariant: 'Bất biến',
        operation: 'Thao tác',
        decision: 'Quyết định',
        technique: 'Kỹ thuật',
        termination: 'Điều kiện dừng',
      },
      previewTitle: 'Solution Map khái niệm',
      previewBadge: 'Luồng suy luận',
    },
  },
  skills: {
    categories: {
      Foundations: 'Nền tảng',
      'Data Structures': 'Cấu trúc dữ liệu',
      'Strategy Design': 'Thiết kế chiến lược',
      Analysis: 'Phân tích',
      Optimization: 'Tối ưu hóa',
      'Search & Monotonicity': 'Tìm kiếm & Tính đơn điệu',
      'Problem Decomposition': 'Phân rã bài toán',
    },
    items: {
      'array-indexing': {
        name: 'Chỉ số Mảng (Array Indexing)',
        description:
          'Suy luận chính xác về chỉ số bắt đầu từ 0, phân biệt giá trị với vị trí phần tử và ràng buộc hai chỉ số khác nhau.',
      },
      'stack-lifo': {
        name: 'Ngăn xếp (Stack / LIFO)',
        description:
          'Mô hình hóa các cặp lồng nhau bằng thao tác push/top/pop theo nguyên tắc Vào sau - Ra trước và kiểm tra biên ngăn xếp rỗng.',
      },
      'brute-force': {
        name: 'Vét cạn (Brute Force)',
        description:
          'Xây dựng lời giải nền tảng có hệ thống (như duyệt mọi cặp j > i) trước khi tối ưu hóa.',
      },
      'time-space-complexity': {
        name: 'Độ phức tạp thời gian & không gian',
        description:
          'So sánh chính xác sự đánh đổi giữa thời gian chạy và bộ nhớ phụ của cách làm cơ bản và cách tối ưu.',
      },
      'hash-map-lookup': {
        name: 'Tra cứu Bảng băm (Hash Map)',
        description:
          'Biến các vòng lặp quét lặp lại thành tra cứu phần bù O(1) đồng thời giữ đúng bất biến tra cứu trước khi thêm.',
      },
      'greedy-feasibility': {
        name: 'Kiểm tra khả thi Tham lam (Greedy)',
        description:
          'Kiểm chứng một ngưỡng ứng viên trong O(n) bằng cách gom nhóm liên tiếp và hiểu vì sao mảng cần chứa số không âm.',
      },
      'binary-search-answer': {
        name: 'Tìm kiếm nhị phân trên đáp án',
        description:
          'Chặn không gian đáp án đơn điệu [low, high], chọn mid và thu hẹp biên an toàn cho đến khi hội tụ.',
      },
      'algorithm-composition': {
        name: 'Kết hợp thuật toán',
        description:
          'Phối hợp thuật toán điều phối vòng ngoài (Binary Search) với hàm con kiểm tra tính khả thi lồng bên trong (Greedy).',
      },
    },
    edges: {
      'array-indexing->brute-force':
        'Duyệt an toàn các cặp chỉ số phân biệt (i, j) đòi hỏi hiểu rõ chỉ số mảng bắt đầu từ 0 và biên duyệt.',
      'brute-force->time-space-complexity':
        'Việc so sánh đánh đổi thời gian và bộ nhớ trở nên rõ ràng sau khi phân tích cách quét nền tảng O(n²).',
      'array-indexing->hash-map-lookup':
        'Lời giải Hash Map ánh xạ giá trị mảng sang chỉ số bắt đầu từ 0 và vẫn đảm bảo ràng buộc hai chỉ số khác nhau.',
      'brute-force->hash-map-lookup':
        'Ý tưởng tra cứu phần bù xuất phát trực tiếp từ việc loại bỏ vòng quét trong lặp đi lặp lại của Vét cạn (Brute Force).',
      'array-indexing->greedy-feasibility':
        'Cách gom mảng con liên tiếp bằng Greedy duyệt tuần tự qua các chỉ số mảng và cộng dồn tổng hiện tại.',
      'time-space-complexity->binary-search-answer':
        'Tìm kiếm nhị phân trên đáp án ra đời để giảm độ phức tạp từ quét tuyến tính O(n · S) xuống O(n log S).',
      'binary-search-answer->algorithm-composition':
        'Binary Search đóng vai trò vòng ngoài đề xuất ngưỡng ứng viên và chia đôi đoạn [low, high].',
      'greedy-feasibility->algorithm-composition':
        'Greedy đóng vai trò hàm con kiểm tra tính khả thi để trả lời xem giá trị mid của Binary Search có đạt yêu cầu không.',
    },
    roadmapStatus: {
      'Not Started': 'Chưa bắt đầu',
      Introduced: 'Đã làm quen',
      'Needs Practice': 'Cần luyện thêm',
      'Guided Progress': 'Tiến bộ có hướng dẫn',
      'Strong Guided Recall': 'Ghi nhớ tốt có hướng dẫn',
    },
    progressLabel: {
      'Not Yet Practiced': 'Chưa luyện tập',
      'Introduced (Viewed Only)': 'Đã làm quen (Chỉ xem)',
      'Practicing (Attempted)': 'Đang luyện tập (Đã thử)',
      'Guided Progress (With Assistance)': 'Tiến bộ có hướng dẫn (Có trợ giúp)',
      'Strong Guided Recall (First-Try)': 'Ghi nhớ tốt có hướng dẫn (Đúng lần đầu)',
      'Independently Demonstrated': 'Đã chứng minh độc lập',
    },
  },
  roadmap: {
    title: 'Lộ trình học thuật toán',
    personalizedBadge: 'Cá nhân hóa · Lịch sử cục bộ',
    deterministicBadge: 'Quy tắc tất định',
    subtitle:
      'Các bước tiếp theo và điều kiện tiên quyết kỹ năng được điều chỉnh minh bạch từ lịch sử Học có hướng dẫn và dự đoán bước thực thi lưu cục bộ. Mọi Studio đã kiểm chứng luôn mở sẵn.',
    viewProgressHistory: 'Xem lịch sử tiến độ',
    noticeLead: 'Lộ trình cục bộ minh bạch:',
    noticeFirstTime:
      'Chưa có phiên học nào được lưu trên trình duyệt này — đang hiển thị lộ trình khởi đầu cho người mới. Hãy hoàn thành một phiên Học có hướng dẫn để cá nhân hóa lộ trình.',
    noticePersonalized_one:
      'Được cá nhân hóa từ {{count}} phiên học lưu cục bộ trên trình duyệt này (không đồng bộ giữa các thiết bị). Gợi ý dựa trên quy tắc tất định từ các lần làm bài đã xác thực — không dùng điểm thành thạo AI hay lượt chỉ xem.',
    noticePersonalized_other:
      'Được cá nhân hóa từ {{count}} phiên học lưu cục bộ trên trình duyệt này (không đồng bộ giữa các thiết bị). Gợi ý dựa trên quy tắc tất định từ các lần làm bài đã xác thực — không dùng điểm thành thạo AI hay lượt chỉ xem.',
    recommendedLabel: 'Hoạt động tiếp theo được đề xuất',
    badges: {
      starter: 'Lộ trình khởi đầu cơ bản',
      review: 'Ôn tập có trọng tâm',
      incomplete: 'Còn giai đoạn chưa xong',
      next: 'Cột mốc tiếp theo',
    },
    whyRecommended: 'Vì sao hoạt động này được đề xuất',
    focusSkills: 'Kỹ năng trọng tâm:',
    orChooseAnother: 'Hoặc chọn Studio khác:',
    skillMapRegion: 'Bản đồ kỹ năng tiên quyết',
    learningPathHeading: 'Lộ trình học hiện tại',
    learningPathDescription:
      'Cả 3 Studio trực quan đã kiểm chứng đều mở sẵn bất cứ lúc nào — kỹ năng tiên quyết chỉ đóng vai trò hướng dẫn, không khóa bài.',
    browseLibrary: 'Khám phá Thư viện bài toán',
    stepLabel: 'Bước 0{{index}} · {{difficulty}}',
    nextBadge: 'Tiếp theo',
    skillsPracticed: 'Kỹ năng luyện tập:',
    suggestedPrerequisites: 'Kiến thức tiên quyết gợi ý:',
    needsReviewTitle: 'Kỹ năng cần ôn tập',
    toReviewCount: '{{count}} cần ôn',
    noneFlagged: 'Không có mục nào',
    reviewInStudio: 'Ôn tập trong Studio',
    noReviewFirstTime:
      'Chưa có kỹ năng nào bị đánh dấu cần ôn — hãy bắt đầu một phiên Học có hướng dẫn để thu thập bằng chứng thực tế.',
    noReviewReturning:
      'Hiện chưa có kỹ năng nào bị đánh dấu do lỗi lặp lại, phụ thuộc nhiều vào gợi ý hoặc tín hiệu mâu thuẫn.',
    practicedConceptsTitle: 'Các khái niệm đã luyện tập',
    activeSkillsCount: '{{active}} / {{total}} đang hoạt động',
    practicedSummary:
      '{{firstTry}} đúng lần đầu · {{assisted}} có trợ giúp · {{skipped}} bỏ qua',
    revisit: 'Xem lại',
    noPracticedConcepts:
      'Chưa có khái niệm nào có bằng chứng kiểm tra hoặc dự đoán. Chỉ xem trực quan hóa chỉ giúp làm quen, còn trả lời câu hỏi giai đoạn và dự đoán bước mới ghi nhận luyện tập thực sự.',
    plannedTitle: 'Chủ đề dự kiến trong tương lai (Chưa triển khai)',
    plannedBadge: 'Các giai đoạn sau',
    plannedAnchor: 'Bài toán mẫu dự kiến: {{problem}}',
    plannedTopics: {
      'two-pointers': {
        title: 'Hai con trỏ (Two Pointers)',
        description:
          'Phối hợp hai chỉ số di chuyển trên mảng đã sắp xếp hoặc có cấu trúc để tránh vòng lặp lồng nhau mà không tốn thêm bộ nhớ.',
      },
      'sliding-window': {
        title: 'Cửa sổ trượt (Sliding Window)',
        description:
          'Mở rộng và thu hẹp một đoạn liên tiếp trong khi vẫn duy trì một bất biến cập nhật liên tục.',
      },
      'trees-graphs': {
        title: 'Cây, Đồ thị & Duyệt đồ thị',
        description:
          'Kết hợp BFS, DFS và suy luận đường đi ngắn nhất trên các cấu trúc liên kết.',
      },
    },
    skillMap: {
      title: 'Bản đồ kỹ năng tiên quyết tương tác',
      badge: 'Phụ thuộc khái niệm',
      description:
        'Hiển thị mối quan hệ tiên quyết thực sự giữa các khái niệm (không phải chuỗi thực thi thuật toán). Chọn bất kỳ kỹ năng nào bằng chuột hoặc phím mũi tên để làm nổi bật kết nối, bằng chứng và Studio liên quan.',
      viewModeLabel: 'Chế độ hiển thị bản đồ kỹ năng',
      visualMap: 'Bản đồ trực quan',
      accessibleList: 'Danh sách dễ tiếp cận',
      layeredRegion: 'Bản đồ kỹ năng tiên quyết theo tầng',
      listRegion: 'Danh sách kỹ năng tiên quyết dễ tiếp cận',
      layers: {
        0: 'Nền tảng',
        1: 'Mẫu cốt lõi',
        2: 'Tối ưu hóa',
        3: 'Tìm kiếm đáp án',
        4: 'Kết hợp',
        fallback: 'Nâng cao',
      },
      recommendedGoalAria: 'Mục tiêu được đề xuất',
      goalBadge: 'Mục tiêu',
      recommendedGoalBadge: 'Mục tiêu đề xuất',
      needs: 'Cần trước: {{skills}}',
      independentFoundation: 'Nền tảng độc lập',
      inspecting: 'Đang xem',
      inspectDetails: 'Xem chi tiết',
      prerequisitesLabel: 'Tiên quyết:',
      noneIndependent: 'Không có (nền tảng độc lập)',
      unlocksLabel: 'Mở đường cho:',
      detailsAria: 'Chi tiết kỹ năng {{skill}}',
      recordedEvidence: 'Bằng chứng đã ghi nhận',
      firstTry: 'Đúng lần đầu: {{count}}',
      assisted: 'Có trợ giúp: {{count}}',
      mistakes: 'Lỗi/Thử lại: {{count}}',
      skips: 'Bỏ qua: {{count}}',
      hints: 'Gợi ý: {{count}}',
      openProblem: 'Mở {{problem}}',
      prerequisitesCount: 'Tiên quyết ({{count}})',
      independentNoPrereqs: 'Nền tảng độc lập — không yêu cầu kiến thức tiên quyết.',
      preparesYouFor: 'Chuẩn bị cho bạn học tiếp',
      cautiousLead: 'Nhãn đánh giá thận trọng:',
      cautiousBody:
        '“Ghi nhớ tốt có hướng dẫn” phản ánh việc trả lời đúng ngay lần đầu ổn định trong Học có hướng dẫn và dự đoán bước — không khẳng định thành thạo độc lập khi chưa có bài đánh giá không trợ giúp.',
    },
    engine: {
      statusReasons: {
        notStarted: 'Chưa có hoạt động nào được ghi nhận cho kỹ năng này.',
        viewedWithSkips:
          'Mới chỉ xem ({{skips}} dự đoán bị bỏ qua chưa thử). Cần làm câu hỏi kiểm tra chủ động để xây dựng trí nhớ.',
        viewedOnly:
          'Mới làm quen qua {{views}} bước — chỉ xem trực quan hóa chưa chứng minh bạn đã hiểu.',
        needsPracticeDefault:
          'Đã ghi nhận {{mistakes}} lỗi/lần thử lại, {{skips}} lần bỏ qua sau khi thử và {{hints}} gợi ý qua {{checks}} lượt kiểm tra.',
        strongGuidedRecall:
          '{{firstTry}} lượt kiểm tra/dự đoán đúng ngay lần đầu với ít phụ thuộc gợi ý. (Chỉ là ghi nhớ có hướng dẫn — chưa phải thành thạo độc lập.)',
        guidedProgress:
          'Đã hoàn thành {{firstTry}} lượt đúng lần đầu và {{assisted}} lượt có trợ giúp. Thêm các dự đoán không gợi ý sẽ củng cố kỹ năng.',
        mixedPredictionAccuracy:
          'Tín hiệu chưa đồng nhất: đã vượt qua câu hỏi hướng dẫn nhưng tỷ lệ đúng lần đầu ở dự đoán bước còn thấp — ôn nhanh với chế độ Dự đoán sẽ giúp chắc kiến thức hơn.',
        mixedPredictionSkips:
          'Tín hiệu chưa đồng nhất: đã vượt qua câu hỏi hướng dẫn nhưng đã bỏ qua các bước dự đoán mà chưa xác thực lần đầu.',
        mixedRetries:
          'Tín hiệu chưa đồng nhất: {{firstTry}} lượt đúng lần đầu đi kèm {{mistakes}} lỗi/lần thử lại — ôn nhanh sẽ giúp ổn định khả năng ghi nhớ.',
      },
      cta: {
        start: 'Bắt đầu {{problem}}',
        startGuidedLesson: 'Bắt đầu bài học {{problem}}',
        try: 'Thử {{problem}}',
        review: 'Ôn tập {{problem}}',
        practiceAgain: 'Luyện lại {{problem}}',
        revisit: 'Xem lại {{problem}}',
        practicePredictions: 'Luyện dự đoán {{problem}}',
        exploreEdgeCases: 'Khám phá trường hợp biên {{problem}}',
      },
      stepNotes: {
        ready: 'Sẵn sàng bắt đầu bất cứ lúc nào bạn muốn.',
        suggestedPrereqs:
          'Kiến thức tiên quyết gợi ý: {{skills}} (vẫn luôn mở sẵn bất cứ lúc nào).',
        progress:
          'Giai đoạn tốt nhất: {{best}}/{{total}} · Dự đoán: {{firstTry}}/{{attempted}} đúng lần đầu.',
      },
      recommendations: {
        starterTitle: 'Bắt đầu với bài học có hướng dẫn Two Sum',
        starterSummary:
          'Xây dựng nền tảng Chỉ số Mảng, tư duy Vét cạn (Brute Force) và Tra cứu Bảng băm (Hash Map) O(1) trước khi học các mẫu khó hơn.',
        starterBullet1:
          'Chưa có phiên học cục bộ nào được ghi nhận trên trình duyệt này.',
        starterBullet2:
          'Two Sum giới thiệu 4 kỹ năng nền tảng (Chỉ số Mảng, Vét cạn, Độ phức tạp thời gian & không gian, Tra cứu Bảng băm) làm nền cho các chủ đề tối ưu sau này.',
        starterBullet3:
          'Valid Parentheses (Ngăn xếp / LIFO) không cần kiến thức tiên quyết và cũng mở sẵn nếu bạn muốn bắt đầu với Stack.',
        reviewTitle: 'Ôn tập {{skill}} trong {{problem}}',
        reviewContradictorySummary:
          'Câu hỏi hướng dẫn và dự đoán bước thực thi của bạn cho thấy kết quả chưa đồng nhất ở kỹ năng {{skill}}. Hãy quay lại Studio ở chế độ Dự đoán để tự kiểm tra không dùng gợi ý.',
        reviewWeakSummary:
          'Tập trung củng cố {{skill}} trước khi chuyển sang các tổ hợp phức tạp hơn.',
        reviewBulletMarked:
          '{{skill}} hiện đang ở trạng thái "{{status}}" ({{reason}}).',
        reviewBulletPrepares:
          'Củng cố {{skill}} giúp bạn chuẩn bị tốt cho {{dependents}}.',
        reviewBulletPredict:
          'Luyện lại {{problem}} khi bật chế độ Dự đoán sẽ giúp tăng tỷ lệ đúng ngay lần đầu.',
        resumeTitle: 'Hoàn thành các giai đoạn còn lại của {{problem}}',
        resumeSummary:
          'Bạn đã xác thực {{best}} / {{total}} giai đoạn có hướng dẫn ở bài {{problem}}. Mở Studio sẽ tạo phiên mới để bạn nhảy nhanh đến bất kỳ giai đoạn nào từ thanh tiến trình.',
        resumeBulletBest:
          'Phiên tốt nhất của bạn ở bài {{problem}} đã xác thực {{best}}/{{total}} giai đoạn có hướng dẫn.',
        resumeBulletSkipped:
          'Đã bỏ qua {{skipped}} lượt dự đoán bước — trả lời trực tiếp sẽ tạo bằng chứng học tập rõ ràng hơn.',
        resumeBulletComplete:
          'Hoàn thành toàn bộ các giai đoạn có hướng dẫn trong phiên mới giúp mọi khái niệm cốt lõi của bài đều có bằng chứng ghi nhận.',
        verifyTitle: 'Luyện dự đoán bước thực thi trong {{problem}}',
        verifySummary:
          'Bạn đã khám phá {{problem}}, nhưng đã bỏ qua {{skipped}} lượt dự đoán mà chưa xác thực lần đầu.',
        verifyBulletCount:
          'Đã ghi nhận {{skipped}} lượt dự đoán bị bỏ qua và 0 lượt đúng ngay lần đầu ở bài {{problem}}.',
        verifyBulletReason:
          'Bỏ qua khi chưa thử chỉ ghi nhận mức độ tiếp xúc — chủ động dự đoán chuyển trạng thái mới kiểm chứng khả năng hiểu thực sự.',
        nextTwoSumTitle: 'Xây dựng nền tảng cốt lõi với Two Sum',
        nextTwoSumSummary:
          'Luyện Chỉ số Mảng, Vét cạn (Brute Force), Độ phức tạp thời gian & không gian và Tra cứu Bảng băm để sẵn sàng cho Split Array.',
        nextTwoSumBullet1:
          'Two Sum chưa được luyện tập trong lịch sử cục bộ của bạn.',
        nextTwoSumBullet2:
          'Các kỹ năng nền tảng của bài (Chỉ số Mảng, Vét cạn, Độ phức tạp) là bước đệm cho Greedy và Tìm kiếm nhị phân trên đáp án.',
        nextValidParenthesesTitle:
          'Học tư duy Ngăn xếp (Stack / LIFO) qua Valid Parentheses',
        nextValidParenthesesSummary:
          'Mở rộng sang cấu trúc dữ liệu Vào sau - Ra trước với trực quan hóa Ngăn xếp theo chiều dọc và các trường hợp biên.',
        nextValidParenthesesBullet1:
          'Bạn đã luyện Two Sum (đã xác thực {{best}}/{{total}} giai đoạn).',
        nextValidParenthesesBullet2:
          'Ngăn xếp (Stack / LIFO) là kỹ năng nền tảng độc lập, không thiếu điều kiện tiên quyết và chưa được luyện tập.',
        nextSplitArrayTitle:
          'Tiến tới Kết hợp thuật toán: Split Array Largest Sum',
        nextSplitArraySummary:
          'Kết hợp Tìm kiếm nhị phân trên đáp án với hàm con kiểm tra khả thi Greedy O(n) lồng bên trong.',
        nextSplitArrayBulletReady:
          'Các kỹ năng nền tảng của bạn (Chỉ số Mảng, Vét cạn, Độ phức tạp) đã có tiến bộ vững vàng.',
        nextSplitArrayBulletMissing:
          'Lưu ý: ôn trước {{skills}} sẽ hữu ích hơn, nhưng Split Array vẫn luôn mở sẵn bất cứ lúc nào.',
        nextSplitArrayBulletIntro:
          'Split Array giới thiệu Kết hợp thuật toán, Tìm kiếm nhị phân trên đáp án và Kiểm tra khả thi Tham lam (Greedy).',
        drillTitle: 'Thử thách trường hợp biên tùy chỉnh ở {{problem}}',
        drillSummary:
          'Bạn đã hoàn thành các phiên có hướng dẫn trên cả 3 Studio đã kiểm chứng với khả năng ghi nhớ tốt. Hãy tự thử thách bằng input biên tùy chỉnh ở chế độ Tự do khám phá.',
        drillBullet1:
          'Cả {{count}} Studio đã kiểm chứng hiện có đều đã hoàn thành phiên có hướng dẫn trên trình duyệt này.',
        drillBullet2:
          'Ghi nhớ có hướng dẫn là nền tảng tốt, nhưng thành thạo độc lập vẫn cần tự giải bài mới không có gợi ý từng bước.',
        drillBullet3:
          '{{problem}} là bài luyện trường hợp biên tiếp theo rất phù hợp ({{hint}}).',
        drillHints: {
          'two-sum':
            'thử giá trị trùng như [3, 3] (target 6), số âm như [-3, 4, 3, 90] (target 0), hoặc mảng không có lời giải như [1, 2, 3] (target 100)',
          'valid-parentheses':
            'thử ngoặc đan chéo như "([)]", ngoặc mở chưa đóng như "((", ngoặc đóng lẻ "]" hoặc chuỗi rỗng ""',
          'split-array-largest-sum':
            'thử mảng toàn số 0 như [0, 0, 0] (k = 2), chia đúng k phần như [1, 4, 4] (k = 3), mảng 1 phần tử [1] (k = 1), hoặc mảng số không âm tùy chỉnh (nums[i] >= 0)',
          fallback:
            'thử các mẫu biên có sẵn và input hợp lệ tùy chỉnh trong Studio',
        },
      },
    },
  },
  progress: {
    title: 'Tiến độ học tập',
    localHistoryBadge: 'Lịch sử cục bộ trình duyệt',
    subtitle:
      'Hoạt động dựa trên bằng chứng được ghi nhận từ các phiên Học có hướng dẫn và dự đoán bước thực thi tất định của bạn.',
    practiceProblem: 'Luyện một bài toán',
    clearLocalHistory: 'Xóa lịch sử cục bộ',
    confirmClearAria: 'Xác nhận xóa lịch sử học tập cục bộ',
    confirmClearTitle: 'Xóa toàn bộ phiên học đã lưu trên trình duyệt này?',
    confirmClearDescription:
      'Hành động này sẽ xóa vĩnh viễn {{count}} phiên học đã lưu cục bộ và đặt lại toàn bộ số liệu bằng chứng kỹ năng.',
    confirmClearButton: 'Xác nhận xóa lịch sử',
    clearedFeedback: 'Đã xóa lịch sử học tập cục bộ khỏi trình duyệt này.',
    clearFailedFeedback: 'Không thể xóa lịch sử trình duyệt cục bộ.',
    savedLocallyFallback: 'Đã lưu cục bộ',
    noticeLead: 'Chỉ lưu trên trình duyệt này:',
    noticeBody:
      'Lịch sử học tập được lưu cục bộ trên thiết bị này và không đồng bộ giữa các thiết bị (hiện chưa kết nối tài khoản hoặc cơ sở dữ liệu). Chỉ xem trực quan hóa hoặc trò chuyện với Gia sư AI không bao giờ được tính là thành thạo đã xác thực, và đề bài riêng hay khóa API không bao giờ được lưu.',
    emptyTitle: 'Chưa có phiên học nào được ghi nhận',
    emptyDescription:
      'Hoàn thành một phiên Học có hướng dẫn trong bất kỳ Studio đã kiểm chứng nào để ghi nhận độ chính xác dự đoán thực tế, câu hỏi giai đoạn, số gợi ý đã dùng và bằng chứng kỹ năng tại đây. Chúng tôi không bao giờ hiển thị số liệu hay chuỗi ngày giả.',
    startProblem: 'Bắt đầu {{problem}}',
    statsAria: 'Thống kê tổng quan tiến độ',
    kpi: {
      learningSessions: 'Phiên học',
      savedInBrowser: 'Đã lưu trên trình duyệt này',
      problemsPracticed: 'Bài toán đã luyện',
      verifiedVisualStudios: 'Studio trực quan đã kiểm chứng',
      strategiesExplored: 'Chiến lược đã khám phá',
      acrossAllStudios: 'Trên tất cả Studio đã kiểm chứng',
      predictionAccuracy: 'Độ chính xác dự đoán',
      firstTryRatio: '{{firstTry}}/{{attempted}} đúng lần đầu',
      noPredictionsAttempted: 'Chưa có lượt dự đoán nào',
      hintsUsed: 'Gợi ý đã dùng',
      skillsPracticedOf: 'Đã luyện {{practiced}} / {{total}} kỹ năng',
    },
    predictionBreakdown: {
      title: 'Phân tích kết quả dự đoán bước',
      summaryBadge:
        'Tổng {{total}} · Đã thử {{attempted}} · Bỏ qua {{skipped}}',
      chartAria:
        'Kết quả dự đoán trên {{total}} câu hỏi: {{firstTry}} đúng ngay lần đầu, {{retry}} đúng sau khi thử lại, {{skippedAttempt}} bỏ qua sau khi thử, {{skippedUnattempted}} bỏ qua chưa thử, {{unresolved}} chưa giải xong',
      firstTryCorrect: 'Đúng ngay lần đầu:',
      solvedAfterRetry: 'Đúng sau khi thử lại / xem gợi ý:',
      skippedAfterAttempt: 'Bỏ qua sau khi thử:',
      skippedUnattempted: 'Bỏ qua (chưa thử):',
      unresolved: 'Chưa hoàn thành:',
      eventuallySolved: 'Tỷ lệ cuối cùng giải đúng: {{percent}}%',
      empty:
        'Chưa có lượt dự đoán bước nào được ghi nhận. Hãy giữ chế độ Dự đoán bật trong Học có hướng dẫn để kiểm tra trực giác từng bước.',
    },
    areasNeedingPractice: {
      title: 'Kỹ năng cần luyện thêm',
      flaggedCount: '{{count}} mục cần chú ý',
      lookingSteady: 'Đang tiến triển ổn định',
      practiceInStudio: 'Luyện trong Studio',
      empty:
        'Hiện chưa có kỹ năng nào bị đánh dấu do sai nhiều hoặc phụ thuộc gợi ý. Hãy tiếp tục khám phá các kỹ năng chưa luyện hoặc thử trường hợp biên khó hơn ở Tự do khám phá.',
    },
    skillTracking: {
      title: 'Theo dõi kỹ năng dựa trên bằng chứng',
      subtitle:
        'Phân biệt rõ giữa chỉ xem, đã thử, trả lời có trợ giúp và đúng ngay lần đầu. Bài học có hướng dẫn giới hạn dưới 100% vì thành thạo độc lập đòi hỏi bài đánh giá không trợ giúp.',
      practicedBadge: 'Đã luyện {{practiced}} / {{total}}',
      indicatorAria: 'Thanh chỉ báo bằng chứng của kỹ năng {{skill}}',
      firstTry: 'Đúng lần đầu: {{count}}',
      assisted: 'Có trợ giúp: {{count}}',
      attempted: 'Đã thử: {{count}}',
      viewed: 'Chỉ xem: {{count}}',
      notes: {
        independent: 'Đã vượt qua {{count}} lượt đánh giá độc lập.',
        strongWithAssisted:
          '{{firstTry}} lượt kiểm tra/dự đoán đúng ngay lần đầu, {{assisted}} lượt có trợ giúp. Thành thạo độc lập cần một bài đánh giá không trợ giúp trong tương lai.',
        strongFirstTry:
          '{{firstTry}} lượt kiểm tra/dự đoán đúng ngay lần đầu. Thành thạo độc lập cần một bài đánh giá không trợ giúp trong tương lai.',
        guidedWithUnresolved:
          '{{firstTry}} lượt đúng lần đầu, {{assisted}} lượt đúng sau khi thử lại/dùng gợi ý, {{attempted}} lượt chưa hoàn thành.',
        guidedProgress:
          '{{firstTry}} lượt đúng lần đầu, {{assisted}} lượt đúng sau khi thử lại/dùng gợi ý.',
        attemptedOnly:
          'Đã ghi nhận {{attempted}} lượt thử hoặc bỏ qua — hãy ôn lại câu hỏi hướng dẫn và dự đoán bước để tăng độ chính xác.',
        viewedOnly:
          'Mới chỉ xem trong {{viewed}} bước. Chỉ xem trực quan hóa chưa chứng minh bạn đã hiểu.',
        notStarted: 'Chưa có hoạt động nào được ghi nhận trên trình duyệt này.',
      },
    },
    problemProgress: {
      title: 'Tiến độ từng bài toán',
      sessionsCount_one: '{{count}} phiên',
      sessionsCount_other: '{{count}} phiên',
      notStarted: 'Chưa bắt đầu',
      bestStages: 'Giai đoạn tốt nhất',
      strategies: 'Chiến lược',
      predictions: 'Dự đoán',
      firstTryShort: 'lần đầu',
      hintsUsed: 'Gợi ý đã dùng',
      practiceAgain: 'Luyện lại',
      startLesson: 'Bắt đầu bài học',
    },
    recentSessions: {
      title: 'Các phiên học gần đây',
      recordedCount: '{{count}} phiên đã ghi nhận',
      verifiedStages: 'Giai đoạn đã xác thực:',
      skippedParen: ' (bỏ qua {{count}})',
      predictions: 'Dự đoán:',
      firstTrySuffix: ' đúng lần đầu',
      hints: 'Gợi ý:',
    },
    outcomes: {
      'completed-guided': 'Hoàn thành bài học có hướng dẫn',
      'completed-with-skips': 'Hoàn thành có bỏ qua',
      'partial-attempt': 'Luyện tập một phần',
      'viewed-only': 'Chỉ xem',
    },
    suggestionsCard: {
      title: 'Gợi ý luyện tập tiếp theo',
      badge: 'Theo quy tắc · Tất định',
      subtitle:
        'Các gợi ý đơn giản rút trực tiếp từ bằng chứng cục bộ của bạn (không phải mô hình gợi ý AI).',
      recommendedReview: 'Nên ôn tập',
      whyPrefix: 'Lý do:',
      items: {
        starterTwoSumTitle: 'Bắt đầu với bài học có hướng dẫn Two Sum',
        starterTwoSumReason:
          'Bạn chưa có phiên học nào được lưu. Two Sum giới thiệu chỉ số mảng, duyệt cặp Vét cạn (Brute Force) và tra cứu Bảng băm (Hash Map) O(1).',
        starterTwoSumCta: 'Bắt đầu bài học Two Sum',
        starterVpTitle: 'Thử tư duy Ngăn xếp (LIFO) với Valid Parentheses',
        starterVpReason:
          'Bài tập mở đầu rất tốt để luyện các thao tác push/pop của Ngăn xếp Vào sau - Ra trước và kiểm tra trường hợp biên.',
        starterVpCta: 'Bắt đầu Valid Parentheses',
        revisitHashMapTitle: 'Ôn lại Two Sum · Tra cứu phần bù bằng Hash Map',
        revisitHashMapReason:
          'Đã ghi nhận {{mistakes}} lỗi/bỏ qua và {{assisted}} lượt có trợ giúp ở kỹ năng Tra cứu Bảng băm. Luyện dự đoán tra cứu-trước-khi-thêm sẽ giúp bạn nắm chắc mẫu này.',
        revisitHashMapCta: 'Luyện Two Sum Hash Map',
        revisitStackTitle:
          'Luyện thao tác Ngăn xếp (Stack / LIFO) trong Valid Parentheses',
        revisitStackReason:
          'Đã ghi nhận {{mistakes}} lỗi/bỏ qua và {{assisted}} lượt có trợ giúp ở kỹ năng Ngăn xếp (Stack / LIFO). Hãy đi qua các mẫu ngoặc đan chéo ("([)]") và chưa đóng ("((") với chế độ Dự đoán.',
        revisitStackCta: 'Luyện Valid Parentheses',
        revisitCompositionTitle:
          'Ôn lại Split Array Largest Sum · Binary Search + Greedy',
        revisitCompositionReason:
          'Đã ghi nhận {{mistakes}} lỗi/bỏ qua trên Tìm kiếm nhị phân trên đáp án, Kiểm tra khả thi Greedy và Kết hợp thuật toán. Hãy xem thanh Lịch sử vòng lặp Binary Search để theo dõi cách kết quả Greedy thu hẹp [low, high].',
        revisitCompositionCta: 'Ôn lại Studio Split Array',
        finishStagesTitle: 'Hoàn thành các giai đoạn còn lại của {{problem}}',
        finishStagesReason:
          'Phiên tốt nhất của bạn đã xác thực {{best}} / {{total}} giai đoạn có hướng dẫn. Hoàn thành các câu hỏi còn lại sẽ giúp ghi nhớ vững hơn.',
        finishStagesCta: 'Tiếp tục {{problem}}',
        exploreTitle: 'Thử bài {{problem}}',
        exploreReason:
          'Bạn chưa có phiên học nào cho bài {{problem}}. Khám phá một dạng bài mới sẽ mở rộng bộ công cụ thuật toán của bạn.',
        exploreCta: 'Mở {{problem}}',
      },
    },
  },
} as const;
