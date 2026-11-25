export const tracesVi = {
  traces: {
    highlights: {
      anchorI: 'Mốc i',
      partnerJ: 'Ghép j',
      currentI: 'Hiện tại i',
      inMap: 'Trong bảng',
      stored: 'Đã lưu',
      matchLabel: 'Khớp ({{label}})',
      scan: 'Duyệt',
      cutGroup: 'Tách G{{group}}',
    },
    twoSum: {
      notEnoughTitle: 'Không đủ phần tử',
      emptyBruteForce:
        'Mảng đang rỗng nên không có cặp nào để kiểm tra. Trả về không tìm thấy.',
      emptyHashMap:
        'Mảng đang rỗng nên không thể tạo cặp nào. Trả về không tìm thấy.',
      singleElement:
        'Mảng chỉ có 1 phần tử. Two Sum yêu cầu hai chỉ số phân biệt nên không có cặp hợp lệ nào.',
      selectAnchorTitle: 'Chọn mốc i = {{i}}',
      selectAnchorExplanation:
        'Cố định mốc i tại chỉ số {{i}} (giá trị {{val}}). Tiếp theo, quét các chỉ số ghép cặp j bắt đầu từ {{nextJ}} để không bao giờ ghép một phần tử với chính nó.',
      comparePairTitle:
        'Kiểm tra cặp ({{i}}, {{j}}): {{valI}} + {{valJ}} = {{sum}}',
      comparePairMatch:
        'Thử chỉ số ghép j = {{j}} (giá trị {{valJ}}). Cộng {{valI}} + {{valJ}} được {{sum}}, khớp với target {{target}}!',
      comparePairMismatch:
        'Thử chỉ số ghép j = {{j}} (giá trị {{valJ}}). Cộng {{valI}} + {{valJ}} được {{sum}}, khác {{target}}. Tiếp tục quét.',
      foundTitle: 'Tìm thấy cặp khớp: [{{first}}, {{second}}]',
      foundBruteForce:
        'Xác nhận hai chỉ số phân biệt [{{first}}, {{second}}] vì nums[{{first}}] ({{valFirst}}) + nums[{{second}}] ({{valSecond}}) = {{target}}. Trả về [{{first}}, {{second}}] và dừng sớm.',
      foundHashMap:
        'Hai chỉ số phân biệt [{{first}}, {{second}}] có tổng bằng {{target}} ({{valFirst}} + {{valSecond}} = {{target}}). Trả về [{{first}}, {{second}}] chỉ sau một lượt duyệt.',
      lookupHitTitle: 'Xét i = {{i}}: tìm thấy giá trị bù {{complement}}!',
      lookupHitExplanation:
        'Tại chỉ số {{i}}, nums[{{i}}] = {{current}}. Ta cần giá trị bù {{target}} - {{current}} = {{complement}}. Tra cứu Bảng băm (Hash Map) trước khi thêm {{current}} tìm thấy {{complement}} ở chỉ số trước đó {{compIdx}}.',
      lookupMissTitle: 'Xét i = {{i}}: cần giá trị bù {{complement}}',
      lookupMissExplanation:
        'Tại chỉ số {{i}}, nums[{{i}}] = {{current}}. Để đạt target {{target}}, ta cần {{target}} - {{current}} = {{complement}}. Kiểm tra Bảng băm trước cho thấy {{complement}} chưa có trong bảng.',
      storeValueTitle: 'Lưu {{current}} → chỉ số {{i}}',
      storeValueExplanation:
        'Vì chưa tìm thấy {{complement}}, lưu {{current}} → chỉ số {{i}} vào Bảng băm để các phần tử sau có thể tra cứu trong O(1).',
      noPairTitle: 'Không tìm thấy cặp hợp lệ',
      noPairBruteForce:
        'Đã kiểm tra mọi cặp chỉ số phân biệt (i < j) trong mảng nhưng không có cặp nào có tổng bằng {{target}}. Trả về không tìm thấy.',
      noPairHashMap:
        'Đã duyệt hết toàn bộ {{count}} phần tử nhưng không tìm thấy giá trị bù nào khớp với target {{target}}. Trả về không tìm thấy.',
    },
    validParentheses: {
      emptyValidTitle: 'Chuỗi rỗng là hợp lệ (true)',
      emptyValidExplanation:
        'Chuỗi rỗng không có dấu ngoặc mở hay đóng nào bị lệch và Ngăn xếp (Stack) đang rỗng — nên kết quả là hợp lệ (true).',
      pushTitle: 'Chỉ số {{i}}: Đẩy "{{ch}}" vào ngăn xếp',
      pushExplanation:
        '"{{ch}}" là dấu ngoặc mở. Đẩy vào ĐỈNH ngăn xếp để ghi nhớ rằng sau này ta cần một dấu "{{expected}}" tương ứng.',
      emptyStackMismatchTitle:
        'Chỉ số {{i}}: "{{ch}}" không có ngoặc mở tương ứng (Không hợp lệ)',
      emptyStackMismatchExplanation:
        '"{{ch}}" là dấu ngoặc đóng cần ghép với "{{expected}}", nhưng Ngăn xếp đang rỗng! Không có ngoặc mở nào để khớp nên trả về false ngay.',
      checkMatchTitle: 'Chỉ số {{i}}: So sánh "{{ch}}" với đỉnh "{{top}}"',
      checkMatchHit:
        '"{{ch}}" khớp với dấu ngoặc mở gần nhất "{{top}}" trên đỉnh Ngăn xếp! Bước tiếp theo sẽ lấy "{{top}}" ra.',
      checkMatchMiss:
        '"{{ch}}" không khớp với đỉnh "{{top}}" (đang chờ "{{expected}}"). Thứ tự lồng ngoặc đã bị phá vỡ!',
      mismatchTitle: 'Không khớp: cần "{{expected}}", nhưng gặp "{{ch}}"',
      mismatchExplanation:
        'Vì "{{top}}" được mở gần nhất nên nó phải được đóng bằng "{{expected}}" trước khi gặp "{{ch}}". Dừng sớm và trả về false.',
      popTitle: 'Lấy "{{top}}" ra (khớp với "{{ch}}")',
      popExplanation:
        'Đã lấy "{{top}}" ra khỏi Ngăn xếp vì "{{ch}}" đóng nó chính xác. Số phần tử còn lại trong ngăn xếp: {{size}}.',
      unclosedTitle_one: 'Hết chuỗi: còn {{count}} dấu ngoặc chưa đóng',
      unclosedTitle_other: 'Hết chuỗi: còn {{count}} dấu ngoặc chưa đóng',
      unclosedExplanation_one:
        'Đã duyệt hết mọi ký tự, nhưng vẫn còn {{count}} dấu ngoặc mở trên Ngăn xếp chưa có ngoặc đóng tương ứng. Trả về false.',
      unclosedExplanation_other:
        'Đã duyệt hết mọi ký tự, nhưng vẫn còn {{count}} dấu ngoặc mở trên Ngăn xếp chưa có ngoặc đóng tương ứng. Trả về false.',
      validTitle: 'Ngăn xếp rỗng: Chuỗi ngoặc hợp lệ (true)',
      validExplanation:
        'Mọi dấu ngoặc đóng đều khớp với dấu ngoặc mở gần nhất và Ngăn xếp rỗng hoàn toàn khi kết thúc. Trả về true!',
    },
    splitArray: {
      initBoundsTitle: 'Khởi tạo các biên tìm kiếm [{{low}}, {{high}}]',
      initBoundsExplanation:
        'Mọi mảng con không rỗng phải chứa ít nhất phần tử lớn nhất (low = max(nums) = {{low}}), và không tổng mảng con nào vượt quá tổng cả mảng (high = sum(nums) = {{high}}).',
      selectMidTitle:
        'Tìm kiếm nhị phân vòng #{{iter}}: Thử ngưỡng tổng lớn nhất mid = {{mid}}',
      selectMidExplanation:
        'Tìm kiếm nhị phân chọn điểm giữa mid = {{low}} + floor(({{high}} - {{low}}) / 2) = {{mid}}, rồi hỏi hàm kiểm tra Tham lam (Greedy): "Có thể chia nums thành tối đa {{k}} nhóm sao cho mỗi nhóm có tổng <= {{mid}} không?"',
      greedyStartTitle:
        'Kiểm tra Tham lam #{{iter}}: Gom mảng con với tổng <= {{mid}}',
      greedyStartExplanation:
        'Bắt đầu quét Tham lam cho ngưỡng ứng viên mid = {{mid}}. Vì mọi số đều không âm, gom càng nhiều phần tử vào mỗi nhóm càng giúp giảm tối đa số nhóm cần dùng.',
      greedyFirstTitle:
        'Duyệt chỉ số 0 ({{val}}): Mở Nhóm 1 (tổng = {{sum}} <= {{mid}})',
      greedyFirstExplanation:
        'Đặt phần tử đầu tiên nums[0] = {{val}} vào Nhóm 1. Vì mid >= max(nums), điều kiện {{val}} <= {{mid}} luôn đúng.',
      greedyAddTitle:
        'Duyệt chỉ số {{idx}} ({{val}}): Thêm vào Nhóm {{group}} ({{prevSum}} + {{val}} = {{sum}} <= {{mid}})',
      greedyAddExplanation:
        'Thêm {{val}} vẫn giữ tổng của Nhóm {{group}} ở mức {{sum}} <= {{mid}}, nên giữ {{val}} trong Nhóm {{group}} theo chiến lược Tham lam.',
      greedyNewGroupTitle:
        'Duyệt chỉ số {{idx}} ({{val}}): {{wouldBe}} > {{mid}} → Mở Nhóm {{group}}',
      greedyNewGroupExplanation:
        'Thêm {{val}} sẽ đẩy tổng nhóm trước lên {{wouldBe}} > {{mid}}. Cắt tại đây và mở Nhóm {{group}} bắt đầu từ {{val}}.',
      greedyResultFeasibleTitle:
        'Kết quả Tham lam: {{groups}} <= {{k}} nhóm → mid = {{mid}} khả thi',
      greedyResultInfeasibleTitle:
        'Kết quả Tham lam: {{groups}} > {{k}} nhóm → mid = {{mid}} quá nhỏ',
      greedyResultFeasibleExplanation_one:
        'Thuật toán Tham lam chỉ cần {{count}} nhóm (<= k = {{k}}) với mỗi nhóm có tổng <= {{mid}}. Vì 1 <= k <= n và các giá trị không âm, {{count}} nhóm này luôn tách được thành đúng {{k}} nhóm không rỗng mà không tăng tổng lớn nhất!',
      greedyResultFeasibleExplanation_other:
        'Thuật toán Tham lam chỉ cần {{count}} nhóm (<= k = {{k}}) với mỗi nhóm có tổng <= {{mid}}. Vì 1 <= k <= n và các giá trị không âm, {{count}} nhóm này luôn tách được thành đúng {{k}} nhóm không rỗng mà không tăng tổng lớn nhất!',
      greedyResultInfeasibleExplanation:
        'Ngay cả khi gom theo cách Tham lam vẫn cần {{groups}} nhóm (> k = {{k}}). Do đó không có cách chia {{k}} nhóm hợp lệ nào đạt tổng lớn nhất <= {{mid}}.',
      decisionFeasible: 'Khả thi → high = {{mid}}',
      decisionInfeasible: 'Không khả thi → low = {{nextLow}}',
      decisionConverged: 'Hội tụ: đáp án = {{low}}',
      updateBoundsTitle:
        'Cập nhật biên: {{decision}} (biên mới [{{low}}, {{high}}])',
      updateBoundsFeasibleExplanation:
        'Vì mid = {{mid}} khả thi, giữ {{mid}} làm ứng viên hợp lệ và tìm tiếp trong [{{low}}, {{high}}] xem còn tổng lớn nhất nào nhỏ hơn nữa không.',
      updateBoundsInfeasibleExplanation:
        'Vì mid = {{mid}} không khả thi, mọi ngưỡng <= {{mid}} cũng thất bại theo tính đơn điệu. Nâng low lên {{mid}} + 1 = {{low}} và tìm trong [{{low}}, {{high}}].',
      convergedTitle: 'Hội tụ tại low = high = {{low}} (Đáp án tối ưu)',
      convergedExplanation_one:
        'Các biên tìm kiếm đã hội tụ tại low = high = {{low}}. Hiển thị ở trên là cách phân hoạch đã kiểm chứng thành đúng {{count}} mảng con không rỗng với tổng mảng con lớn nhất bằng {{low}}.',
      convergedExplanation_other:
        'Các biên tìm kiếm đã hội tụ tại low = high = {{low}}. Hiển thị ở trên là cách phân hoạch đã kiểm chứng thành đúng {{count}} mảng con không rỗng với tổng mảng con lớn nhất bằng {{low}}.',
    },
  },
  predictions: {
    twoSum: {
      bfSelectAnchor: {
        question:
          'Mốc i đang ở chỉ số {{i}} (giá trị {{valI}}). Con trỏ ghép j sẽ kiểm tra chỉ số nào tiếp theo?',
        optNextJ: 'Chỉ số {{nextJ}} (giá trị {{valNextJ}})',
        fbNextJ:
          'Chính xác! Con trỏ ghép j bắt đầu từ i + 1 = {{nextJ}} để kiểm tra các cặp phân biệt mà không dùng lại chỉ số {{i}}.',
        optSameI: 'Chỉ số {{i}} (trùng với mốc i)',
        fbSameI:
          'Chưa đúng — không được phép ghép chỉ số {{i}} với chính nó vì hai chỉ số phải khác nhau.',
        optJumpEnd: 'Chỉ số {{lastIdx}} (nhảy tới cuối mảng)',
        optRestartZero: 'Chỉ số 0 (quét lại từ đầu mảng)',
        fbJumpEnd:
          'Vét cạn (Brute Force) quét tuần tự từ i + 1 ({{nextJ}}) chứ không nhảy thẳng tới cuối mảng.',
        fbRestartZero:
          'Các cặp chứa chỉ số 0 đã được kiểm tra khi i = 0, nên ta bắt đầu từ i + 1 ({{nextJ}}).',
      },
      bfFound: {
        question:
          'Ta vừa tính nums[{{i}}] + nums[{{j}}] = {{valI}} + {{valJ}} = {{sum}} (target là {{target}}). Điều gì xảy ra tiếp theo?',
        optConfirm: 'Xác nhận khớp và trả về [{{i}}, {{j}}]',
        fbConfirm:
          'Đúng rồi! {{sum}} bằng target {{target}} với hai chỉ số phân biệt {{i}} và {{j}}, nên thuật toán dừng sớm và trả về [{{i}}, {{j}}].',
        optAdvance: 'Bỏ qua cặp này và tiếp tục tăng j',
        fbAdvance:
          'Vì {{valI}} + {{valJ}} đã bằng {{target}}, không cần quét thêm nữa.',
        optNotFound: 'Báo không có lời giải',
        fbNotFound:
          'Hãy nhìn lại tổng: {{valI}} + {{valJ}} = {{sum}}, khớp đúng với target {{target}}!',
      },
      bfMoveJ: {
        question:
          '{{valI}} + {{valJ}} = {{sum}} ≠ {{target}}. Con trỏ nào sẽ di chuyển tiếp theo?',
        optMoveJ:
          'Giữ i = {{i}} và tăng j lên {{nextJ}} (giá trị {{valNextJ}})',
        fbMoveJ:
          'Chính xác! Vì j chưa đến cuối mảng, ta giữ nguyên mốc i = {{i}} và thử j = {{nextJ}} tiếp theo.',
        optMoveI: 'Tăng mốc i lên {{nextI}} ngay lập tức',
        fbMoveI:
          'Chưa vội — vẫn còn các chỉ số ghép chưa kiểm tra sau j = {{j}} cho mốc i = {{i}}.',
        optStop: 'Dừng lại và báo không tìm thấy',
        fbStop:
          'Ta chưa kiểm tra hết các cặp! Vẫn còn các chỉ số phía sau j = {{j}}.',
      },
      bfMoveI: {
        question:
          '{{valI}} + {{valJ}} = {{sum}} ≠ {{target}} và j đã đến cuối mảng. Điều gì xảy ra tiếp theo?',
        optNextAnchor: 'Tăng mốc i lên {{nextI}} (giá trị {{valNextI}})',
        fbNextAnchor:
          'Chính xác! Mọi cặp với i = {{i}} đã được kiểm tra, nên vòng ngoài tăng i lên {{nextI}}.',
        optResetJ: 'Giữ i = {{i}} và quay j về 0',
        fbResetJ:
          'Quay j về 0 sẽ lặp lại các cặp đã kiểm tra và ghép i với chính nó.',
        optStop: 'Dừng ngay và báo không tìm thấy',
        fbStop:
          'Vẫn còn các chỉ số mốc khác để thử bắt đầu từ i = {{nextI}}.',
      },
      bfNotFound: {
        question:
          '{{valI}} + {{valJ}} = {{sum}} ≠ {{target}} và đây là cặp phân biệt cuối cùng. Điều gì xảy ra tiếp theo?',
        optReport: 'Kết thúc và báo không tìm thấy cặp hợp lệ',
        fbReport:
          'Chính xác! Mọi cặp chỉ số phân biệt (i < j) đều đã được thử nhưng không khớp {{target}}, nên thuật toán trả về không tìm thấy.',
        optSame: 'Kiểm tra thêm các cặp có i = j',
        fbSame:
          'Two Sum không cho phép dùng cùng một chỉ số hai lần nên ta không bao giờ xét i = j.',
        optFallback: 'Trả về [0, 1] làm phương án dự phòng',
        fbFallback:
          'Không bao giờ trả về cặp sai — khi không có cặp nào có tổng bằng {{target}}, kết quả đúng phải là không tìm thấy.',
      },
      hmLookupMiss: {
        question:
          'Giá trị bù {{complement}} chưa có trong Bảng băm đã duyệt. Thuật toán sẽ làm gì tiếp theo?',
        optStoreCurrent: 'Lưu {{val}} → chỉ số {{i}} vào Bảng băm',
        fbStoreCurrent:
          'Đúng rồi! Lưu {{val}} → chỉ số {{i}} giúp các phần tử sau tìm thấy {{val}} trong O(1) nếu cần nó làm giá trị bù.',
        optStoreComp:
          'Lưu giá trị bù {{complement}} → chỉ số {{i}} vào Bảng băm',
        fbStoreComp:
          'Cẩn thận: chỉ số {{i}} chứa giá trị {{val}}, không phải {{complement}}. Ta lưu đúng thứ đã gặp ({{val}} → {{i}}).',
        optSkipStore: 'Giữ nguyên Bảng băm và đi tiếp',
        fbSkipStore:
          'Nếu không lưu {{val}} → {{i}}, các phần tử sau sẽ không biết {{val}} từng xuất hiện ở chỉ số {{i}}!',
      },
      hmStoreEnd: {
        question:
          'Ta đã lưu phần tử cuối cùng của mảng. Điều gì xảy ra tiếp theo?',
        optNotFound: 'Kết thúc lượt duyệt và báo không tìm thấy cặp hợp lệ',
        fbNotFound:
          'Chính xác! Mọi chỉ số đều đã được xét nhưng không có giá trị bù nào khớp target {{target}}.',
        optRestart: 'Quét lại mảng lần thứ hai từ chỉ số 0',
        fbRestart:
          'Chiến lược Bảng băm (Hash Map) chỉ cần một lượt duyệt duy nhất — nếu tồn tại cặp hợp lệ thì phần tử đứng sau đã tìm thấy phần tử đứng trước rồi.',
        optSelf: 'Ghép phần tử cuối với chính nó',
        fbSelf:
          'Yêu cầu hai chỉ số phân biệt nên một phần tử không bao giờ tự ghép với chính nó.',
      },
      hmStoreNext: {
        question:
          'Tiếp theo ta sang i = {{nextI}} (nums[{{nextI}}] = {{nextVal}}), nên cần giá trị bù {{target}} - {{nextVal}} = {{nextComp}}. Bảng băm có tìm thấy {{nextComp}} không?',
        optWillHit: 'Có — {{nextComp}} đã có sẵn trong Bảng băm!',
        fbWillHitTrue:
          'Chuẩn xác! {{nextComp}} đã được lưu từ một chỉ số trước đó nên tra cứu thành công trong O(1).',
        fbWillHitFalse:
          'Hãy nhìn bảng Bảng băm ở trên: {{nextComp}} chưa được lưu nên lượt tra cứu này sẽ không thấy.',
        optWillMiss: 'Không — {{nextComp}} chưa có trong Bảng băm.',
        fbWillMissTrue:
          'Chính xác! {{nextComp}} chưa có trong Bảng băm nên sau khi kiểm tra ta sẽ lưu {{nextVal}} → {{nextI}}.',
        fbWillMissFalse:
          'Nhìn kỹ bảng Bảng băm ở trên nhé — {{nextComp}} đã được lưu sẵn ở đó rồi!',
      },
      hmLookupHit: {
        question:
          'Tra cứu giá trị bù thành công! Cặp chỉ số phân biệt nào sẽ được trả về tiếp theo?',
        optCorrectPair: '[{{first}}, {{second}}]',
        fbCorrectPair:
          'Đúng rồi! nums[{{first}}] ({{valFirst}}) + nums[{{second}}] ({{valSecond}}) = {{target}}.',
        optSelfPair: '[{{second}}, {{second}}]',
        fbSelfPair:
          'Hai chỉ số phải phân biệt — giá trị bù khớp đến từ chỉ số trước đó {{first}}, không phải {{second}}.',
        optValuesPair: '[{{valFirst}}, {{valSecond}}] (giá trị thay vì chỉ số)',
        fbValuesPair:
          'Two Sum yêu cầu trả về các chỉ số [{{first}}, {{second}}], không phải giá trị phần tử.',
      },
    },
    validParentheses: {
      push: {
        question:
          'Ký tự tiếp theo ở chỉ số {{index}} là "{{ch}}". Ngăn xếp (Stack) nên làm gì?',
        optPush: 'Đẩy "{{ch}}" lên ĐỈNH ngăn xếp',
        fbPush:
          'Chính xác! "{{ch}}" là dấu ngoặc mở nên ta đẩy nó lên ĐỈNH để chờ dấu ngoặc đóng tương ứng.',
        optPop: 'Lấy phần tử ở ĐỈNH ngăn xếp ra',
        fbPop:
          'Ta chỉ lấy ra khi gặp dấu ngoặc đóng khớp. "{{ch}}" mở ra một cặp mới.',
        optFalse: 'Dừng ngay và trả về Không hợp lệ (false)',
        fbFalse:
          'Một dấu ngoặc mở "{{ch}}" không bao giờ gây lỗi ngay lập tức — hãy đẩy vào và tiếp tục duyệt.',
      },
      checkMatch: {
        question:
          'Ký tự tiếp theo là ngoặc đóng "{{ch}}", và ĐỈNH ngăn xếp là "{{top}}". Chúng có khớp nhau không?',
        optYes: 'Có — "{{top}}" và "{{ch}}" tạo thành cặp hợp lệ',
        fbYesTrue:
          'Chuẩn xác! "{{ch}}" đóng chính xác dấu ngoặc mở gần nhất "{{top}}".',
        fbYesFalse:
          'Chưa đúng — "{{top}}" đang chờ "{{expected}}", không phải "{{ch}}".',
        optNo: 'Không — "{{ch}}" không khớp với đỉnh "{{top}}"',
        fbNoTrue:
          'Chính xác! "{{top}}" phải được đóng bằng "{{expected}}" trước khi gặp "{{ch}}".',
        fbNoFalse:
          'Nhìn kỹ nhé: "{{top}}" và "{{ch}}" là một cặp ngoặc khớp nhau!',
      },
      pop: {
        question:
          'Đỉnh "{{top}}" đã khớp với "{{ch}}". Điều gì xảy ra với Ngăn xếp tiếp theo?',
        optPop: 'Lấy "{{top}}" ra khỏi ĐỈNH ngăn xếp',
        fbPop:
          'Đúng rồi! Lấy "{{top}}" ra sẽ hoàn tất cặp đó và để lộ dấu ngoặc bên ngoài nằm ngay dưới nó.',
        optPush: 'Đẩy "{{ch}}" vào ngăn xếp',
        fbPush:
          'Không bao giờ đẩy ngoặc đóng vào ngăn xếp — chúng triệt tiêu ngoặc mở khớp ở ĐỈNH.',
        optClear: 'Xóa sạch toàn bộ ngăn xếp ngay lập tức',
        fbClear:
          'Chỉ lấy đúng một ngoặc ở ĐỈNH đã khớp; các ngoặc ngoài bên dưới vẫn cần ngoặc đóng riêng của chúng.',
      },
      mismatch: {
        question: 'Kết quả tiếp theo sau khi kiểm tra "{{ch}}" là gì?',
        optInvalid: 'Phát hiện không khớp và trả về Không hợp lệ (false)',
        fbInvalid:
          'Chính xác! Khi một ngoặc đóng không khớp ĐỈNH (hoặc ngăn xếp rỗng), chuỗi chắc chắn không hợp lệ.',
        optIgnore: 'Bỏ qua lỗi không khớp và tiếp tục duyệt',
        fbIgnore:
          'Mọi ngoặc đóng đều phải khớp ngay theo thứ tự LIFO — một lỗi không khớp làm hỏng toàn bộ chuỗi.',
      },
      unclosed: {
        question_one:
          'Đã duyệt đến cuối chuỗi và vẫn còn {{count}} dấu ngoặc trên ngăn xếp. Chuỗi có hợp lệ không?',
        question_other:
          'Đã duyệt đến cuối chuỗi và vẫn còn {{count}} dấu ngoặc trên ngăn xếp. Chuỗi có hợp lệ không?',
        optInvalid: 'Không — vẫn còn ngoặc chưa đóng, trả về Không hợp lệ (false)',
        fbInvalid:
          'Chính xác! Một chuỗi hợp lệ phải để lại Ngăn xếp hoàn toàn rỗng khi duyệt xong.',
        optValid: 'Có — không có lỗi không khớp nào trong lúc duyệt',
        fbValid:
          'Cẩn thận nhé! Các ngoặc mở chưa đóng như "((" không gây lỗi khớp, nên kiểm tra stack.length === 0 ở cuối là bắt buộc.',
      },
      valid: {
        question:
          'Đã duyệt đến cuối chuỗi và Ngăn xếp rỗng. Kết quả cuối cùng là gì?',
        optValid: 'Trả về Hợp lệ (true)',
        fbValid:
          'Đúng rồi! Mọi ngoặc mở đã được đóng đúng thứ tự LIFO và không còn gì dư trên ngăn xếp.',
        optInvalid: 'Trả về Không hợp lệ (false)',
        fbInvalid:
          'Không có lỗi không khớp nào và ngăn xếp rỗng ở cuối nghĩa là chuỗi ngoặc hoàn toàn cân bằng (true).',
      },
    },
    splitArray: {
      selectMid: {
        question:
          'Các biên tìm kiếm hiện tại là [{{low}}, {{high}}]. Tìm kiếm nhị phân sẽ thử ngưỡng ứng viên mid nào tiếp theo?',
        optCorrect: 'mid = {{mid}}',
        fbCorrectLowEq:
          'Chính xác! Với [{{low}}, {{high}}], điểm giữa làm tròn xuống là {{low}} + floor(({{high}} - {{low}}) / 2) = {{mid}}.',
        fbCorrectGeneral:
          'Chính xác! mid = {{low}} + floor(({{high}} - {{low}}) / 2) = {{mid}}.',
        optLow: 'mid = {{low}} (thử thẳng low)',
        fbLow:
          'Thử tuyến tính tại low chỉ loại được 1 giá trị khi thất bại; thử điểm giữa {{mid}} giúp chia đôi khoảng tìm kiếm!',
        optHigh: 'mid = {{high}} (thử high)',
        fbHigh:
          'Khi low < high, điểm giữa làm tròn xuống luôn nhỏ hơn hẳn {{high}} (ở đây là {{mid}}), đảm bảo vòng lặp luôn thu hẹp biên.',
        optOutOfRange: 'mid = {{aboveHigh}} (vượt quá high)',
        fbOutOfRange:
          'Tìm kiếm nhị phân chỉ thử các ứng viên trong [{{low}}, {{high}}]; {{aboveHigh}} nằm ngoài các biên đang xét.',
      },
      greedyStart: {
        question:
          'Tìm kiếm nhị phân đã chọn mid = {{mid}}. Hàm con Tham lam (Greedy) lồng bên trong sẽ trả lời câu hỏi nào?',
        optAskGreedy:
          'Có thể gom nums thành tối đa {{k}} nhóm liên tiếp với mỗi tổng <= {{mid}} không?',
        fbAskGreedy:
          'Đúng rồi! Tìm kiếm nhị phân giao việc kiểm tra tính khả thi cho mid = {{mid}} cho hàm gom nhóm Tham lam O(n).',
        optSort: 'Sắp xếp nums trước để các số bằng nhau đứng cạnh nhau',
        fbSort:
          'Các mảng con bắt buộc phải liên tiếp theo thứ tự gốc, nên ta không bao giờ được sắp xếp hay đổi chỗ nums!',
      },
      greedyFirst: {
        question:
          'Quét Tham lam bắt đầu ở chỉ số 0 (giá trị {{val}}) với ngưỡng mid = {{mid}}. Điều gì xảy ra đầu tiên?',
        optStartG1: 'Đặt {{val}} vào Nhóm 1 (tổng hiện tại = {{val}})',
        fbStartG1:
          'Chính xác! Vì mid = {{mid}} >= max(nums), phần tử đầu tiên {{val}} luôn nằm gọn trong Nhóm 1.',
        optReject: 'Từ chối ngay vì {{val}} > {{mid}}',
        fbReject:
          'Vì low khởi tạo bằng max(nums), mid luôn >= mọi phần tử đơn lẻ, kể cả {{val}}.',
      },
      greedyStep: {
        question:
          'Tổng nhóm hiện tại là {{prevSum}} và phần tử kế tiếp là nums[{{idx}}] = {{val}} (ngưỡng mid = {{mid}}). {{val}} có vừa vào nhóm hiện tại không?',
        optFits:
          'Có — {{prevSum}} + {{val}} = {{newSum}} <= {{mid}}, giữ trong nhóm hiện tại',
        fbFitsTrue:
          'Chuẩn xác! {{newSum}} <= {{mid}} nên Tham lam gom {{val}} vào nhóm hiện tại để tiết kiệm lượt tách nhóm cho phần sau.',
        fbFitsFalse:
          'Kiểm tra lại tổng: {{prevSum}} + {{val}} = {{newSum}}, đã vượt ngưỡng mid = {{mid}}!',
        optCut:
          'Không — {{prevSum}} + {{val}} = {{newSum}} > {{mid}}, mở nhóm mới',
        fbCutTrue:
          'Chính xác! {{newSum}} > {{mid}} nên ta phải cắt trước chỉ số {{idx}} và mở Nhóm {{nextGroup}} với {{val}}.',
        fbCutFalse:
          'Thực ra {{prevSum}} + {{val}} = {{newSum}} <= {{mid}} nên Tham lam chưa cần mở nhóm mới.',
      },
      greedyResult: {
        question_one:
          'Thuật toán Tham lam quét xong với {{count}} nhóm, trong khi ta được phép dùng k = {{k}} nhóm. Ngưỡng mid = {{mid}} có khả thi không?',
        question_other:
          'Thuật toán Tham lam quét xong với {{count}} nhóm, trong khi ta được phép dùng k = {{k}} nhóm. Ngưỡng mid = {{mid}} có khả thi không?',
        optFeasible: 'Khả thi (true) — {{groups}} <= {{k}}',
        fbFeasibleTrue:
          'Đúng rồi! Dùng {{groups}} <= {{k}} nhóm chứng minh tồn tại cách chia {{k}} nhóm hợp lệ có tổng lớn nhất <= {{mid}}.',
        fbFeasibleFalse:
          'Ta đã dùng tới {{groups}} nhóm, nhiều hơn k = {{k}}, nên mid = {{mid}} quá nhỏ.',
        optInfeasible: 'Không khả thi (false) — {{groups}} > {{k}}',
        fbInfeasibleTrue:
          'Chính xác! Ngay cả gom Tham lam cũng cần {{groups}} > {{k}} nhóm, nên mid = {{mid}} là bất khả thi.',
        fbInfeasibleFalse:
          'Hãy nhìn số nhóm: {{groups}} <= {{k}}, nên mid = {{mid}} là khả thi!',
      },
      bsUpdate: {
        questionFeasible:
          'Tham lam báo mid = {{mid}} là khả thi trên [{{low}}, {{high}}]. Tìm kiếm nhị phân nên cập nhật các biên tìm kiếm thế nào?',
        questionInfeasible:
          'Tham lam báo mid = {{mid}} là không khả thi trên [{{low}}, {{high}}]. Tìm kiếm nhị phân nên cập nhật các biên tìm kiếm thế nào?',
        optSetHigh: 'Đặt high = {{mid}} (tìm trên [{{low}}, {{mid}}])',
        fbSetHighTrue:
          'Chính xác! {{mid}} đạt yêu cầu nên giữ {{mid}} làm ứng viên và kiểm tra xem trong [{{low}}, {{mid}}] còn đáp án nhỏ hơn không.',
        fbSetHighFalse:
          'Vì {{mid}} thất bại nên mọi ngưỡng <= {{mid}} cũng thất bại — đặt high = {{mid}} sẽ vứt bỏ toàn bộ đáp án hợp lệ!',
        optSetLow: 'Đặt low = {{nextLow}} (tìm trên [{{nextLow}}, {{high}}])',
        fbSetLowTrue:
          'Chính xác! Vì {{mid}} quá nhỏ, tổng lớn nhất khả thi nhỏ nhất phải từ {{nextLow}} trở lên.',
        fbSetLowFalse:
          'Cẩn thận! Chính {{mid}} có thể đã là đáp án tối ưu, nên đẩy low lên {{nextLow}} có thể bỏ sót đáp án đúng!',
      },
      bsConverged: {
        question:
          'Các biên tìm kiếm đã gặp nhau tại low = high = {{low}}. Tổng mảng con lớn nhất nhỏ nhất là bao nhiêu?',
        optLow: 'Trả về {{low}}',
        fbLow:
          'Đúng rồi! Khi low === high === {{low}}, {{low}} đã được chứng minh khả thi còn {{prevVal}} (nếu > max) không khả thi.',
        optPlusOne: 'Trả về {{nextVal}}',
        fbPlusOne:
          'Vì high luôn giữ một biên khả thi đã biết (hoặc sum(nums)), low === high === {{low}} chắc chắn khả thi!',
      },
    },
  },
} as const;
