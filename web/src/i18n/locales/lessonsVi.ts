export const lessonsVi = {
  lessons: {
    'two-sum': {
      suggestedNextActivity:
        'Hãy chuyển sang Tự do khám phá và thử các trường hợp biên như [3, 3] (target 6), [-3, 4, 3, 90] (target 0), hoặc [1, 2, 3] (target 100) khi bật chế độ Dự đoán — sau đó tự viết lời giải Two Sum trên trình soạn thảo của bạn mà không xem lại!',
      stages: {
        understand: {
          shortTitle: 'Hiểu đề',
          title: 'Giai đoạn 1: Hiểu rõ bài toán',
          goal: 'Làm rõ dữ liệu đầu vào, đầu ra và quy tắc hai chỉ số phân biệt trước khi chọn thuật toán.',
          conceptLearned: 'Phân tích bài toán & Ràng buộc hai chỉ số phân biệt',
          narrative:
            'Trước khi nghĩ đến vòng lặp hay cấu trúc dữ liệu, hãy kiểm tra xem một đáp án hợp lệ trông như thế nào. Ta nhận vào một Mảng (Array) số nguyên (dương, 0 hoặc âm) cùng số nguyên target, và phải trả về hai Chỉ số (Index) KHÁC NHAU sao cho tổng hai giá trị tại đó bằng target.',
          question: {
            prompt:
              'Giả sử nums = [3, 2, 4] và target = 6. Liệu [0, 0] có phải đáp án hợp lệ vì nums[0] + nums[0] = 3 + 3 = 6 không?',
            options: {
              'yes-same-index': {
                label: 'Có — chỉ số 0 cộng với chính nó bằng 6.',
                feedback:
                  'Cẩn thận nhé! Đề bài không cho phép dùng cùng một phần tử hai lần. Hai chỉ số phải khác nhau (i != j). Hãy xem chỉ số 1 và 2: 2 + 4 = 6.',
              },
              'no-distinct-required': {
                label:
                  'Không — hai chỉ số phải khác nhau, nên đáp án đúng là [1, 2].',
                feedback:
                  'Chính xác! Dù 3 + 3 = 6, chỉ số 0 không thể ghép với chính nó. Chỉ số 1 (giá trị 2) và chỉ số 2 (giá trị 4) là hai vị trí phân biệt có tổng bằng 6.',
              },
              'no-solution': {
                label: 'Không có đáp án hợp lệ trong [3, 2, 4].',
                feedback:
                  'Hãy kiểm tra các cặp khác nhé! nums[1] (2) + nums[2] (4) = 6 dùng hai chỉ số phân biệt.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Đọc kỹ quy tắc về chỉ số: nếu một phần tử chỉ xuất hiện một lần ở chỉ số 0, bạn có được chọn chỉ số 0 hai lần không?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Đáp án hợp lệ phải là cặp hai vị trí KHÁC NHAU (i != j). Giá trị giống nhau chỉ hợp lệ khi chúng nằm ở hai chỉ số tách biệt.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Trong [3, 2, 4] với target = 6, chỉ số 0 không thể tự ghép với chính nó. Thay vào đó hãy xét chỉ số 1 và 2: nums[1] (2) + nums[2] (4) = 6.',
            },
          },
        },
        'discover-brute-force': {
          shortTitle: 'Vét cạn',
          title: 'Giai đoạn 2: Khám phá cách duyệt cặp Vét cạn',
          goal: 'Xây dựng chiến lược đầu tiên đơn giản, đáng tin cậy để kiểm tra có hệ thống mọi cặp chỉ số phân biệt.',
          conceptLearned: 'Duyệt cặp có hệ thống (j > i)',
          narrative:
            'Bước khởi đầu tốt luôn là tìm một cách làm đơn giản nhưng chắc chắn đúng. Nếu ta cố định một chỉ số mốc i, thì con trỏ ghép cặp j nên bắt đầu từ đâu để kiểm tra mỗi cặp đúng một lần và không bao giờ ghép phần tử với chính nó?',
          question: {
            prompt:
              'Với chỉ số mốc i đã cố định, con trỏ vòng trong j nên bắt đầu từ đâu?',
            options: {
              'start-zero': {
                label: 'Bắt đầu j từ 0 để kiểm tra mọi chỉ số.',
                feedback:
                  'Bắt đầu từ 0 sẽ gặp lúc j = i (dùng lại cùng một phần tử!) và lặp lại các cặp đã kiểm tra trước đó.',
              },
              'start-i': {
                label: 'Bắt đầu j từ i để bao gồm cả phần tử mốc.',
                feedback:
                  'Nếu j bắt đầu từ i, phép kiểm tra đầu tiên sẽ ghép nums[i] với chính nó, vi phạm quy tắc hai chỉ số phân biệt.',
              },
              'start-i-plus-1': {
                label: 'Bắt đầu j từ i + 1 và quét đến cuối mảng.',
                feedback:
                  'Chuẩn xác! Bắt đầu j từ i + 1 đảm bảo i != j và kiểm tra mỗi cặp không thứ tự đúng một lần. Hãy chạy từng bước chiến lược Vét cạn (Brute Force) trên khung trực quan hóa để quan sát!',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Nếu bạn đã kiểm tra mọi cặp có chứa chỉ số 0, bạn có cần kiểm tra lại chỉ số 0 khi i chuyển sang 1 không?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Ta cần con trỏ j thỏa hai điều kiện: không bao giờ bằng i, và không lặp lại cặp cũ như (1, 0) sau khi đã xét (0, 1).',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Bắt đầu j tại i + 1 và quét sang phải đến cuối mảng. Điều này đảm bảo i < j, tự động tránh tự ghép và tránh kiểm tra trùng cặp.',
            },
          },
        },
        'discover-optimization': {
          shortTitle: 'Tối ưu hóa',
          title: 'Giai đoạn 3: Khám phá tra cứu phần bù bằng Bảng băm',
          goal: 'Nhận ra công việc lặp lại của Vét cạn và thay vòng quét trong bằng tra cứu Bảng băm (Hash Map) O(1).',
          conceptLearned: 'Đổi góc nhìn sang phần bù & Tra cứu trước khi thêm',
          narrative:
            'Vét cạn (Brute Force) chạy đúng, nhưng với mỗi phần tử i nó phải quét lại phần còn lại của mảng — tốn O(n²). Thay vì hỏi "có số nào phía sau cộng với nums[i] bằng target không?", hãy đảo ngược câu hỏi: khi đang nhìn nums[i], bạn đã biết chính xác duy nhất giá trị phần bù mình cần tìm!',
          question: {
            prompt:
              'Khi đang xét nums[i], vì sao chiến lược Bảng băm (Hash Map) phải kiểm tra (target - nums[i]) có trong bảng đã duyệt hay chưa TRƯỚC KHI lưu nums[i] vào bảng?',
            options: {
              'avoid-self-match': {
                label:
                  'Để phần tử hiện tại không bao giờ vô tình tự khớp với chính nó khi target = 2 * nums[i].',
                feedback:
                  'Chính xác! Kiểm tra trước đảm bảo mọi kết quả tìm thấy trong Bảng băm đều đến từ một chỉ số đứng trước i. Giờ hãy khám phá Bảng băm trên khung trực quan hóa và dự đoán bước tiếp theo nhé!',
              },
              'save-memory': {
                label: 'Để giảm độ phức tạp bộ nhớ từ O(n) xuống O(1).',
                feedback:
                  'Bảng băm vẫn dùng O(n) bộ nhớ trong trường hợp xấu nhất. Thứ tự tra cứu trước hay thêm trước quyết định tính đúng đắn (hai chỉ số khác nhau), không phải bộ nhớ.',
              },
              'order-does-not-matter': {
                label:
                  'Thứ tự không quan trọng — thêm trước rồi tra cứu vẫn cho kết quả giống nhau.',
                feedback:
                  'Hãy nhẩm với nums = [3, 2, 4], target = 6: nếu bạn lưu 3 → 0 trước khi tra cứu 6 - 3 = 3, bạn sẽ khớp nhầm chỉ số 0 với chính nó!',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Hãy thử với nums = [3, 2, 4] và target = 6. Điều gì xảy ra tại i = 0 nếu bạn thêm 3 vào Bảng băm trước khi kiểm tra 6 - 3 có trong bảng hay không?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Bảng băm đã duyệt chỉ nên chứa các phần tử nằm chặt bên trái chỉ số i tại thời điểm bạn tra cứu phần bù.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Luôn kiểm tra seen.has(target - nums[i]) TRƯỚC khi gọi seen.set(nums[i], i). Cách này đảm bảo chỉ số tìm thấy luôn nhỏ hơn hẳn i.',
            },
          },
        },
        'build-solution': {
          shortTitle: 'Xây mã giả',
          title: 'Giai đoạn 4: Xây dựng lời giải bằng Mã giả',
          goal: 'Chuyển suy luận trực quan thành Mã giả (Pseudocode) có cấu trúc từng bước — chỉ mở phần bạn cần.',
          conceptLearned: 'Chuyển đổi suy luận trực quan thành Mã giả',
          narrative:
            'Sau khi đã theo dõi trực quan cả hai chiến lược, hãy biến ý tưởng Bảng băm (Hash Map) thành Mã giả (Pseudocode) từng bước. Hãy tự nghĩ bước tiếp theo trước khi mở từng khối, rồi cài đặt bằng ngôn ngữ bạn thích.',
          question: {
            prompt:
              'Trước khi mở Mã giả: mỗi mục trong Bảng băm đã duyệt (seen) nên lưu khóa (key) và giá trị (value) là gì?',
            options: {
              'key-index-val-number': {
                label: 'Key = chỉ số (index), Value = giá trị phần tử',
                feedback:
                  'Hãy nghĩ xem ta cần tra cứu bằng thông tin nào: ta biết GIÁ TRỊ phần bù cần tìm và muốn lấy ra CHỈ SỐ của nó trong thời gian O(1).',
              },
              'key-number-val-index': {
                label: 'Key = giá trị phần tử, Value = chỉ số (index)',
                feedback:
                  'Chính xác! Dùng giá trị làm khóa giúp ta hỏi "đã gặp phần bù chưa?" trong O(1) và lấy ngay lại chỉ số đã lưu của nó.',
              },
              'key-sum-val-bool': {
                label: 'Key = tổng của cặp, Value = true/false',
                feedback:
                  'Lưu tổng các cặp sẽ buộc phải duyệt lại tất cả các cặp. Lưu từng giá trị đã gặp → chỉ số giúp giải Two Sum chỉ trong một lượt duyệt.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Khi tính complement = target - nums[i], bạn đã biết thông tin gì trong tay và muốn Bảng băm trả về thông tin gì?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Bảng băm cho phép tra cứu O(1) theo KHÓA (key). Vì ta tra cứu số phần bù để lấy vị trí trong mảng, khóa phải là chính giá trị số đó.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Lưu value → index vào bảng. Với mỗi i: tính complement, kiểm tra complement có trong seen không, nếu có trả về [seen[complement], i], ngược lại lưu seen[nums[i]] = i.',
            },
          },
        },
      },
      pseudocode: {
        'pseudo-1': {
          title: '1. Khởi tạo bộ nhớ Bảng băm',
          reason:
            'Tạo một bảng rỗng để ghi nhớ từng giá trị đã duyệt cùng chỉ số của nó.',
        },
        'pseudo-2': {
          title: '2. Duyệt mảng và tính phần bù',
          reason:
            'Đi qua mảng một lượt duy nhất và tính chính xác giá trị còn thiếu.',
        },
        'pseudo-3': {
          title: '3. Tra cứu TRƯỚC khi thêm',
          reason:
            'Đảm bảo hai chỉ số phân biệt vì chỉ kiểm tra các phần tử đã duyệt trước đó.',
        },
        'pseudo-4': {
          title: '4. Lưu giá trị hiện tại & xử lý không tìm thấy',
          reason:
            'Ghi lại phần tử hiện tại cho các bước sau, hoặc báo không tìm thấy sau vòng lặp.',
        },
      },
    },
    'valid-parentheses': {
      suggestedNextActivity:
        'Hãy chuyển sang Tự do khám phá và thử các chuỗi ngoặc lắt léo như "([)]", "((", "]" và "" khi bật chế độ Dự đoán — sau đó tự cài đặt Valid Parentheses mà không cần nhìn lại!',
      stages: {
        'vp-understand': {
          shortTitle: 'Quy tắc cân bằng',
          title: 'Giai đoạn 1: Hiểu quy tắc dấu ngoặc cân bằng',
          goal: 'Hiểu vì sao chỉ đếm số ngoặc mở và ngoặc đóng là chưa đủ — thứ tự lồng nhau mới quyết định.',
          conceptLearned: 'Thứ tự ngoặc lồng nhau (Quy tắc LIFO)',
          narrative:
            'Một chuỗi ngoặc hợp lệ phải khớp cả về LOẠI ngoặc lẫn THỨ TỰ. Dấu ngoặc mở gần nhất luôn phải là dấu ngoặc được đóng đầu tiên.',
          question: {
            prompt:
              'Xét chuỗi "([)]". Nó có một "(", một ")", một "[" và một "]". Chuỗi này có hợp lệ không?',
            options: {
              'vp-q1-valid': {
                label:
                  'Có — mỗi dấu ngoặc mở đều có một dấu ngoặc đóng tương ứng ở đâu đó.',
                feedback:
                  'Chỉ đếm số lượng là chưa đủ! Vì "[" được mở bên trong "(", nên "[" bắt buộc phải đóng TRƯỚC khi ")" xuất hiện.',
              },
              'vp-q1-invalid': {
                label:
                  'Không — "[" được mở gần nhất, nên ")" không thể đóng trước "]".',
                feedback:
                  'Chính xác! Dấu ngoặc mở trong cùng phải đóng trước. Quy tắc Vào sau - Ra trước (LIFO) đó là cốt lõi của bài toán này.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Trong "([)]", khi ký tự ")" xuất hiện thì dấu ngoặc nào vẫn đang chờ được đóng ở bên trong?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Các cặp ngoặc không được đan chéo nhau: ngoặc "[" bên trong phải đóng trước khi ngoặc "(" bên ngoài đóng.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Vì "[" mở sau cùng nên nó phải đóng đầu tiên — việc ")" đến trước "]" khiến "([)]" không hợp lệ.',
            },
          },
        },
        'vp-why-stack': {
          shortTitle: 'Vì sao dùng Stack?',
          title: 'Giai đoạn 2: Khám phá vì sao Ngăn xếp phù hợp',
          goal: 'Liên kết trực tiếp nguyên tắc "mở sau cùng thì đóng đầu tiên" với cấu trúc dữ liệu Ngăn xếp (Stack).',
          conceptLearned: 'Trực giác Ngăn xếp Vào sau - Ra trước (LIFO)',
          narrative:
            'Hãy tưởng tượng việc xếp chồng đĩa: bạn đặt mỗi dấu ngoặc mở mới lên ĐỈNH (TOP), và khi một dấu ngoặc đóng đến, bạn chỉ cần kiểm tra đúng chiếc đĩa đang nằm trên ĐỈNH.',
          question: {
            prompt:
              'Khi duyệt "{[]}" từ trái sang phải, sau khi đọc "{" và "[", dấu ngoặc nào đang nằm trên ĐỈNH của Ngăn xếp (Stack)?',
            options: {
              'vp-q2-curly': {
                label: '"{" vì nó xuất hiện đầu tiên.',
                feedback:
                  'Hàng đợi (Queue) mới lấy phần tử vào đầu tiên, còn Ngăn xếp (Stack) theo nguyên tắc Vào sau - Ra trước: phần tử mới nhất nằm trên ĐỈNH.',
              },
              'vp-q2-square': {
                label: '"[" vì nó được đẩy vào gần đây nhất.',
                feedback:
                  'Chuẩn xác! "[" nằm ở ĐỈNH, nên khi "]" đến ngay sau đó, nó khớp ngay với ĐỈNH và lấy "[" ra khỏi ngăn xếp.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Nếu bạn đặt "{" xuống trước rồi xếp "[" lên trên, ký tự nào đang ở ĐỈNH?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Ngăn xếp (Stack) tuân theo nguyên tắc Vào sau - Ra trước (LIFO): phần tử mới đẩy vào luôn ở trên ĐỈNH.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Đẩy "{" rồi đẩy "[" sẽ để "[" ở trên ĐỈNH — sẵn sàng khớp với ký tự "]" tiếp theo.',
            },
          },
        },
        'vp-trace-ops': {
          shortTitle: 'Theo dõi & Lỗi',
          title: 'Giai đoạn 3: Theo dõi Push, Pop & Trường hợp biên',
          goal: 'Quan sát các thao tác push/pop và nhận ra hai cách khiến chuỗi ngoặc không hợp lệ.',
          conceptLearned: 'Trường hợp không khớp & Ngoặc mở chưa đóng',
          narrative:
            'Hãy thử các mẫu như "(]" (không khớp), "]" (ngăn xếp rỗng), và "((" (còn ngoặc chưa đóng) trên khung trực quan hóa Ngăn xếp và dự đoán từng bước.',
          question: {
            prompt:
              'Điều gì xảy ra ở cuối chuỗi "((" nếu bạn quên kiểm tra xem Ngăn xếp (Stack) có rỗng hay không?',
            options: {
              'vp-q3-false-positive': {
                label:
                  'Bạn sẽ trả về nhầm true vì không có lỗi không khớp nào xảy ra trong vòng lặp.',
                feedback:
                  'Chính xác! "((" chỉ đẩy vào mà không bao giờ gặp ngoặc đóng, nên kiểm tra stack.length === 0 ở cuối là bắt buộc.',
              },
              'vp-q3-crash': {
                label: 'Vòng lặp sẽ báo lỗi không khớp ở ký tự "(" thứ hai.',
                feedback:
                  'Hai dấu ngoặc mở liên tiếp hoàn toàn bình thường (như "(())") — chúng chỉ sai nếu đến cuối chuỗi vẫn chưa được đóng.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Với "((", thuật toán có bao giờ gặp dấu ngoặc đóng để phát hiện không khớp không?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Cả hai ký tự "(" đều chỉ được đẩy vào ngăn xếp. Khi vòng lặp kết thúc, ngăn xếp vẫn còn 2 phần tử.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'CHỈ trả về true khi ngăn xếp rỗng hoàn toàn ở cuối chuỗi; nếu không thì vẫn còn ngoặc mở chưa đóng.',
            },
          },
        },
        'vp-build-pseudo': {
          shortTitle: 'Xây mã giả',
          title: 'Giai đoạn 4: Xây dựng Mã giả từng bước',
          goal: 'Biến các bước push, kiểm tra đỉnh, pop và kiểm tra ngăn xếp rỗng thành Mã giả gọn gàng.',
          conceptLearned: 'Chuyển suy luận Ngăn xếp thành Mã giả',
          narrative:
            'Chỉ mở từng khối Mã giả (Pseudocode) sau khi bạn đã tự hình dung bước tiếp theo, rồi thử viết lại bằng ngôn ngữ lập trình bạn quen dùng.',
          question: {
            prompt:
              'Nếu một dấu ngoặc đóng xuất hiện khi Ngăn xếp đang rỗng (như "]"), thuật toán nên trả về gì?',
            options: {
              'vp-q4-push': {
                label: 'Đẩy "]" vào ngăn xếp và tiếp tục duyệt.',
                feedback:
                  'Một dấu ngoặc đóng không bao giờ có thể khớp với ngoặc mở xuất hiện sau nó — chuỗi đã sai ngay tại đây.',
              },
              'vp-q4-false': {
                label: 'Trả về false ngay lập tức.',
                feedback:
                  'Chính xác! Kiểm tra ngăn xếp rỗng trước khi pop vừa tránh lỗi truy cập vừa thoát sớm với kết quả false.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Một dấu ngoặc đóng như "]" có thể nào được ghép cặp với một dấu ngoặc mở đứng SAU nó không?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Nếu ngăn xếp rỗng khi gặp ngoặc đóng, nghĩa là không có ngoặc mở nào trước đó để ghép cặp.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Kiểm tra `if stack is empty or top != matching_open[ch]: return false` trước khi gọi pop.',
            },
          },
        },
      },
      pseudocode: {
        'vp-pseudo-1': {
          title: '1. Khởi tạo ngăn xếp rỗng & bảng cặp ngoặc',
          reason:
            'Lưu các ngoặc mở chưa đóng và ánh xạ mỗi ngoặc đóng sang ngoặc mở tương ứng.',
        },
        'vp-pseudo-2': {
          title: '2. Đẩy các dấu ngoặc mở vào ngăn xếp',
          reason:
            'Mỗi ngoặc mở nằm chờ ở ĐỈNH ngăn xếp để gặp ngoặc đóng tương ứng.',
        },
        'vp-pseudo-3': {
          title: '3. Kiểm tra & lấy ra khi gặp ngoặc đóng',
          reason:
            'Từ chối ngay nếu ngăn xếp rỗng hoặc ĐỈNH không khớp; ngược lại thì pop.',
        },
        'vp-pseudo-4': {
          title: '4. Kiểm tra ngăn xếp rỗng ở cuối',
          reason:
            'Đảm bảo không còn ngoặc mở nào bị bỏ quên sau khi duyệt hết chuỗi.',
        },
      },
    },
    'split-array-largest-sum': {
      suggestedNextActivity:
        'Hãy chuyển sang Tự do khám phá để so sánh các mẫu như [1, 4, 4] (k = 3), [0, 0, 0] (k = 2), và k = 1 so với k = n — đồng thời bấm vào các vòng lặp Tìm kiếm nhị phân để xem mỗi lượt Tham lam thu hẹp [low, high] ra sao!',
      stages: {
        'sa-stage-1-understand': {
          shortTitle: 'Phân hoạch',
          title: 'Giai đoạn 1: Mảng con liên tiếp & Mục tiêu Minimax',
          goal: 'Hiểu khái niệm mảng con liên tiếp và ý nghĩa của "làm nhỏ nhất tổng lớn nhất".',
          conceptLearned: 'Phân hoạch liên tiếp & Mục tiêu Minimax',
          narrative:
            'Ta không được sắp xếp lại nums — chỉ được đặt k - 1 vách ngăn giữa các phần tử liền kề để tạo thành k nhóm liên tiếp không rỗng. Với mỗi cách chia, ta nhìn vào nhóm có tổng nặng nhất, và muốn tìm cách chia sao cho nhóm nặng nhất đó nhỏ nhất có thể.',
          question: {
            prompt:
              'Với nums = [7, 2, 5, 10, 8] và k = 2, chia thành [7, 2, 5] và [10, 8] cho tổng hai nhóm là 14 và 18. Vậy "tổng mảng con lớn nhất" của cách chia này là bao nhiêu?',
            options: {
              'sa-q1-18': {
                label: '18 — giá trị lớn hơn trong hai tổng nhóm (14 và 18).',
                feedback:
                  'Chính xác! Với mỗi cách chia, ta đo điểm nghẽn (tổng nhóm lớn nhất = 18), và mục tiêu là làm điểm nghẽn này nhỏ nhất có thể.',
              },
              'sa-q1-32': {
                label: '32 — tổng của cả hai nhóm cộng lại.',
                feedback:
                  '32 là tổng toàn bộ mảng (luôn cố định dù chia kiểu gì!). Ta cần lấy max(14, 18) = 18.',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Nếu hai xe tải chở 14 kg và 18 kg, xe nào quyết định tải trọng nặng nhất?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Với một cách chia, lấy MAX trong k tổng mảng con. Xét trên mọi cách chia, ta muốn tìm MIN của giá trị MAX đó.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Hai tổng mảng con là 7+2+5 = 14 và 10+8 = 18, nên tổng lớn nhất của cách chia này là max(14, 18) = 18.',
            },
          },
        },
        'sa-stage-2-feasibility': {
          shortTitle: 'Tính khả thi',
          title: 'Giai đoạn 2: Biến bài toán tối ưu thành câu hỏi Có/Không',
          goal: 'Thấy cách câu hỏi "có thể giữ mọi tổng nhóm <= X với tối đa k nhóm không?" mở khóa bài toán.',
          conceptLearned: 'Chuyển sang bài toán quyết định & Tinh chỉnh đúng k nhóm',
          narrative:
            'Chọn trực tiếp k - 1 vị trí cắt có số tổ hợp tăng theo hàm mũ. Thay vào đó, hãy chọn một ngưỡng ứng viên X và hỏi câu hỏi Có/Không đơn giản hơn: liệu có thể chia nums thành TỐI ĐA k nhóm liên tiếp mà mỗi nhóm có tổng <= X không?',
          question: {
            prompt:
              'Giả sử k = 3, nums = [1, 4, 4] (đều không âm), và ta gom được thành chỉ 2 nhóm ([1], [4, 4]) dưới ngưỡng X = 8. Ta vẫn có thể tách thành ĐÚNG k = 3 nhóm không rỗng có tổng <= 8 chứ?',
            options: {
              'sa-q2-yes': {
                label:
                  'Có — tách [4, 4] thành [4] và [4]; với số không âm, việc tách nhóm không bao giờ làm tăng tổng!',
                feedback:
                  'Chuẩn xác! Vì 1 <= k <= n và nums[i] >= 0, mọi cách chia dùng <= k nhóm đều luôn tách tiếp được thành đúng k nhóm không rỗng mà không vượt quá X.',
              },
              'sa-q2-no': {
                label: 'Không — dùng ít hơn k nhóm nghĩa là ngưỡng X = 8 không hợp lệ.',
                feedback:
                  'Vì n = 3 >= k = 3 và mọi phần tử >= 0, tách một nhóm nhiều phần tử thành các phần nhỏ hơn chỉ giữ tổng luôn <= 8!',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Nếu [4, 4] có tổng 8 <= 8, khi bạn tách [4, 4] thành [4] và [4] thì tổng mỗi nhóm là bao nhiêu?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Tách một nhóm gồm các số không âm sẽ tạo ra hai tổng không âm nhỏ hơn hoặc bằng tổng ban đầu.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Vì n >= k và nums[i] >= 0, ta luôn có thể tách các nhóm có từ 2 phần tử trở lên cho đến khi đủ đúng k nhóm không rỗng, tất cả vẫn <= X.',
            },
          },
        },
        'sa-stage-3-greedy': {
          shortTitle: 'Kiểm tra Tham lam',
          title: 'Giai đoạn 3: Vì sao gom nhóm Tham lam đúng (Quy tắc không âm)',
          goal: 'Hiểu cách thuật toán Tham lam (Greedy) O(n) kiểm tra ngưỡng X và vì sao số âm sẽ làm hỏng nó.',
          conceptLearned: 'Gom nhóm liên tiếp Tham lam & Điều kiện số không âm',
          narrative:
            'Để kiểm tra ngưỡng X có khả thi không, hãy duyệt từ trái sang phải và nhồi từng phần tử vào nhóm hiện tại chừng nào runningSum + nums[i] <= X; chỉ mở nhóm mới khi bắt buộc. Trì hoãn việc cắt nhóm càng muộn càng tốt sẽ chừa nhiều khoảng trống nhất cho phần mảng còn lại.',
          question: {
            prompt:
              'Vì sao bước kiểm tra tính khả thi Tham lam (Greedy) này đòi hỏi mọi số trong nums đều không âm (nums[i] >= 0)?',
            options: {
              'sa-q3-nonneg': {
                label:
                  'Nếu có số âm, tổng đang vượt X có thể giảm xuống <= X ở các phần tử sau, nên cắt ngay khi tổng > X sẽ không còn an toàn.',
                feedback:
                  'Chính xác! Tính không âm đảm bảo tổng cộng dồn chỉ tăng khi thêm phần tử, nên ngay khi runningSum + nums[i] > X, việc cắt nhóm là bắt buộc.',
              },
              'sa-q3-mod': {
                label:
                  'Vì phép chia lấy phần nguyên trong Tìm kiếm nhị phân bị lỗi với số âm.',
                feedback:
                  'Tìm kiếm nhị phân vẫn chạy được trên miền số âm, nhưng chính hàm kiểm tra Tham lam (Greedy) bị phá vỡ khi số âm phía sau có thể kéo tổng đang vượt ngưỡng trở lại hợp lệ!',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Thử tưởng tượng nums = [6, 5, -10] và ngưỡng X = 8. Tại chỉ số 1 tổng lên 11 > 8, nhưng điều gì xảy ra nếu gom thêm -10?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Tham lam (Greedy) cắt nhóm ngay khi runningSum + nums[i] > X vì nó giả định các phần tử sau không bao giờ làm giảm tổng.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Điều kiện không âm đảm bảo tổng mảng con tăng đơn điệu khi thêm phần tử, giúp quyết định cắt nhóm của Tham lam vừa tối ưu cục bộ vừa tối ưu toàn cục.',
            },
          },
        },
        'sa-stage-4-bs-answer': {
          shortTitle: 'Tìm kiếm nhị phân',
          title: 'Giai đoạn 4: Tính đơn điệu & Tìm kiếm nhị phân trên đáp án',
          goal: 'Hiểu vì sao Tìm kiếm nhị phân (Binary Search) và Tham lam (Greedy) cần kết hợp với nhau.',
          conceptLearned: 'Tính khả thi đơn điệu & Tìm kiếm nhị phân trên đáp án',
          narrative:
            'Thử từng ngưỡng X từ max(nums) đến sum(nums) thì đúng nhưng nếu giá trị lên tới 10^9 thì quét tuyến tính quá chậm! Ngược lại, Tìm kiếm nhị phân một mình không biết ngưỡng nào đạt yêu cầu. Khi kết hợp: tính khả thi có dạng đơn điệu (false, false, ..., true, true), nên Tìm kiếm nhị phân chia đôi đoạn [max(nums), sum(nums)] trong khi Tham lam kiểm tra từng điểm giữa mid!',
          question: {
            prompt:
              'Nếu Tham lam báo ngưỡng ứng viên mid = 15 KHÔNG KHẢ THI (cần nhiều hơn k nhóm), ta suy ra ngay được điều gì về mọi ngưỡng <= 15?',
            options: {
              'sa-q4-all-fail': {
                label:
                  'Mọi ngưỡng <= 15 cũng không khả thi, nên ta có thể đặt an toàn low = 16.',
                feedback:
                  'Đúng rồi! Siết ngưỡng nhỏ hơn 15 không bao giờ làm giảm số nhóm cần dùng, nên ta loại bỏ toàn bộ đoạn <= 15 chỉ trong một bước.',
              },
              'sa-q4-smaller-works': {
                label:
                  'Một ngưỡng nhỏ hơn như 12 vẫn có thể chạy được, nên ta cần xét [low, 14].',
                feedback:
                  'Ngưỡng nhỏ hơn cho phép chứa ÍT hơn trong mỗi nhóm, nên số nhóm cần dùng chỉ có thể nhiều hơn hoặc bằng — không bao giờ ít hơn!',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Nếu bạn không thể xếp sách vào k thùng sức chứa 15 kg, liệu bạn có xếp được số sách đó vào k thùng sức chứa 14 kg không?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Sức chứa nhỏ hơn không bao giờ cần ít thùng hơn. Tính khả thi theo sức chứa luôn có dạng: F, F, ..., F, T, T, ..., T.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Khi mid = 15 không khả thi (F), mọi ngưỡng <= 15 đều là F, nên ta đẩy an toàn low lên mid + 1 = 16.',
            },
          },
        },
        'sa-stage-5-compose': {
          shortTitle: 'Ghép mã giả',
          title: 'Giai đoạn 5: Kết hợp hai kỹ thuật & Xây Mã giả',
          goal: 'Viết Mã giả mô-đun gọn gàng: hàm phụ Tham lam được gọi bên trong vòng lặp Tìm kiếm nhị phân.',
          conceptLearned: 'Kết hợp mô-đun Vòng điều phối + Hàm con',
          narrative:
            'Khi hai kỹ thuật phối hợp, hãy tách rõ chúng trong mã nguồn: viết một hàm phụ Tham lam gọn `canSplit(nums, k, maxSum)`, rồi gọi nó bên trong vòng lặp Tìm kiếm nhị phân `while low < high`.',
          question: {
            prompt:
              'Khi `canSplit(nums, k, mid)` trả về TRUE, vì sao ta đặt `high = mid` thay vì `high = mid - 1`?',
            options: {
              'sa-q5-keep-mid': {
                label:
                  'Vì chính mid có thể là đáp án khả thi nhỏ nhất — bỏ mid có thể làm mất đáp án tối ưu!',
                feedback:
                  'Chuẩn xác! Giữ `high = mid` bảo toàn bất biến rằng `high` luôn là một đáp án khả thi đã biết cho đến khi `low === high`.',
              },
              'sa-q5-infinite': {
                label: 'Đặt high = mid - 1 sẽ khiến chương trình chạy chậm hơn.',
                feedback:
                  'Đây là lỗi đúng đắn, không phải tốc độ: nếu mid chính là ngưỡng khả thi nhỏ nhất, đặt `high = mid - 1` sẽ loại đáp án đúng khỏi `[low, high]`!',
              },
            },
          },
          hints: {
            1: {
              label: 'Gợi ý 1 · Câu hỏi khái niệm',
              text: 'Giả sử đáp án tối ưu là 18, và Tìm kiếm nhị phân thử mid = 18 (trả về feasible = true). Điều gì xảy ra nếu bạn đặt high = 17?',
            },
            2: {
              label: 'Gợi ý 2 · Định hướng suy luận',
              text: 'Ta muốn đoạn [low, high] LUÔN chứa đáp án tối ưu sau mỗi vòng lặp.',
            },
            3: {
              label: 'Gợi ý 3 · Bước tiếp theo cụ thể',
              text: 'Giữ high = mid khi khả thi (vì mid có thể tối ưu) và đặt low = mid + 1 khi không khả thi (vì mid chắc chắn loại).',
            },
          },
        },
      },
      pseudocode: {
        'sa-pseudo-1': {
          title: '1. Hàm phụ kiểm tra khả thi Tham lam (O(n) thời gian, O(1) bộ nhớ phụ)',
          reason:
            'Đếm số nhóm liên tiếp ít nhất cần dùng để mỗi nhóm có tổng <= maxSum.',
        },
        'sa-pseudo-2': {
          title: '2. Khởi tạo biên đáp án cho Tìm kiếm nhị phân',
          reason: 'Tổng lớn nhất tối ưu chắc chắn nằm trong [max(nums), sum(nums)].',
        },
        'sa-pseudo-3': {
          title: '3. Vòng lặp Tìm kiếm nhị phân gọi hàm Tham lam',
          reason:
            'Chia đôi khoảng ứng viên trong khi vẫn giữ đáp án tối ưu bên trong [low, high].',
        },
        'sa-pseudo-4': {
          title: '4. Trả về giá trị tối ưu khi hội tụ',
          reason:
            'Khi low == high, low chính là tổng mảng con lớn nhất nhỏ nhất có thể.',
        },
      },
    },
  },
} as const;
