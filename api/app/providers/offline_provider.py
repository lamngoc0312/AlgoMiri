from __future__ import annotations

from ..schemas import (
    CandidateStrategy,
    DecompositionStep,
    ImageExtractionPayload,
    Locale,
    ProblemAnalysis,
    TutorPayload,
    TutorRequest,
    WorkedExample,
)

OFFLINE_NOTICE = (
    "Offline Demo Mode: GEMINI_API_KEY is not configured on the server. "
    "No live AI API call was made — showing a structured offline template so you can "
    "test the workflow safely."
)

OFFLINE_NOTICE_VI = (
    "Chế độ demo ngoại tuyến: GEMINI_API_KEY chưa được cấu hình trên máy chủ. "
    "Không có lệnh gọi API AI trực tiếp nào được thực hiện — đây là nội dung mẫu "
    "có cấu trúc để bạn thử quy trình một cách an toàn."
)


def offline_notice(locale: Locale) -> str:
    return OFFLINE_NOTICE_VI if locale == "vi" else OFFLINE_NOTICE


class OfflineDemoProvider:
    """Explicitly labeled offline fallback when no LLM API key is configured."""

    async def aclose(self) -> None:
        return None

    async def analyze_problem(
        self, problem_statement: str, locale: Locale = "en"
    ) -> ProblemAnalysis:
        if locale == "vi":
            return self._analyze_problem_vi(problem_statement)

        first_line = problem_statement.strip().splitlines()[0][:80]
        return ProblemAnalysis(
            title=f"Offline Conceptual Draft: {first_line}",
            inferred_problem_type="General Algorithm Problem (Offline Template)",
            plain_language_summary=(
                "Live AI analysis is currently offline because GEMINI_API_KEY is not set on the server. "
                "Start by listing the exact inputs, desired output, and smallest non-trivial example "
                "before choosing a data structure or strategy."
            ),
            inputs=["Input structure described in your pasted statement"],
            outputs=["Expected output format specified by the problem"],
            constraints_and_assumptions=[
                "Verify input size limits (n) and whether negative or duplicate values are allowed.",
                "Offline template: configure GEMINI_API_KEY in api/.env for live AI analysis.",
            ],
            clarifications_or_ambiguities=[
                "Live AI ambiguity detection requires a configured server-side LLM API key.",
            ],
            worked_example=WorkedExample(
                input_summary="Pick a tiny 3–4 element example from your problem statement.",
                output_summary="Compute the expected output by hand first.",
                walkthrough=(
                    "Trace the example manually to notice what information you repeatedly look up "
                    "or maintain as you scan the input."
                ),
            ),
            edge_cases=[
                "Empty or minimum-size input",
                "Duplicate values or boundary values (0, negative numbers if allowed)",
                "No-solution or already-sorted input",
            ],
            prerequisite_concepts=[
                "Input/Output Modeling",
                "Brute-Force Baseline",
                "Time & Space Complexity Tradeoffs",
            ],
            subproblem_decomposition=[
                DecompositionStep(
                    id="step-1",
                    title="Clarify constraints & edge cases",
                    goal="Confirm input bounds, duplicates, ordering, and return format.",
                    depends_on=[],
                ),
                DecompositionStep(
                    id="step-2",
                    title="Derive a simple baseline",
                    goal="Find a guaranteed-correct brute-force approach to understand the problem.",
                    depends_on=["step-1"],
                ),
                DecompositionStep(
                    id="step-3",
                    title="Spot repeated work & optimize",
                    goal="Identify which lookup or invariant a data structure (Hash Map, Stack, Binary Search) can speed up.",
                    depends_on=["step-2"],
                ),
            ],
            candidate_strategies=[
                CandidateStrategy(
                    name="Direct Brute-Force Baseline",
                    technique="Exhaustive Enumeration",
                    intuition="Test all valid combinations directly to verify your understanding of the rules.",
                    why_it_applies="Always provides a clear correctness baseline before optimizing.",
                    time_complexity="Depends on problem (often O(n²) or higher)",
                    space_complexity="O(1) auxiliary",
                    complexity_assumptions="Assumes direct iteration without extra lookup tables.",
                    limitations="May be too slow for large input sizes.",
                ),
            ],
            confidence_notes=(
                "Offline template only — no live LLM analyzed your statement. "
                "Set GEMINI_API_KEY in api/.env to enable real structured AI analysis."
            ),
        )

    def _analyze_problem_vi(self, problem_statement: str) -> ProblemAnalysis:
        first_line = problem_statement.strip().splitlines()[0][:80]
        return ProblemAnalysis(
            title=f"Bản nháp khái niệm ngoại tuyến: {first_line}",
            inferred_problem_type="Bài toán thuật toán tổng quát (mẫu ngoại tuyến)",
            plain_language_summary=(
                "Phân tích AI trực tiếp hiện không hoạt động vì GEMINI_API_KEY chưa được "
                "cấu hình trên máy chủ. Trước khi chọn cấu trúc dữ liệu hoặc chiến lược, "
                "hãy liệt kê chính xác đầu vào, đầu ra mong muốn và ví dụ nhỏ nhất có ý nghĩa."
            ),
            inputs=["Cấu trúc đầu vào được mô tả trong đề bài bạn đã cung cấp"],
            outputs=["Định dạng đầu ra mà đề bài yêu cầu"],
            constraints_and_assumptions=[
                "Hãy kiểm tra giới hạn kích thước đầu vào (n) và xem số âm hoặc giá trị trùng lặp có được phép hay không.",
                "Mẫu ngoại tuyến: cấu hình GEMINI_API_KEY trong api/.env để bật phân tích AI trực tiếp.",
            ],
            clarifications_or_ambiguities=[
                "Cần cấu hình khóa API cho LLM phía máy chủ để phát hiện điểm mơ hồ bằng AI trực tiếp."
            ],
            worked_example=WorkedExample(
                input_summary="Chọn một ví dụ nhỏ gồm 3–4 phần tử từ đề bài.",
                output_summary="Trước tiên, hãy tự tính kết quả mong đợi.",
                walkthrough=(
                    "Mô phỏng ví dụ bằng tay để nhận ra thông tin nào bạn phải tra cứu "
                    "hoặc duy trì lặp đi lặp lại khi duyệt đầu vào."
                ),
            ),
            edge_cases=[
                "Đầu vào rỗng hoặc có kích thước nhỏ nhất",
                "Giá trị trùng lặp hoặc giá trị biên (0, số âm nếu được phép)",
                "Không có lời giải hoặc đầu vào đã được sắp xếp",
            ],
            prerequisite_concepts=[
                "Mô hình hóa đầu vào/đầu ra",
                "Đường cơ sở Brute Force",
                "Đánh đổi độ phức tạp thời gian và không gian",
            ],
            subproblem_decomposition=[
                DecompositionStep(
                    id="step-1",
                    title="Làm rõ ràng buộc và trường hợp biên",
                    goal="Xác nhận giới hạn đầu vào, giá trị trùng lặp, thứ tự và định dạng trả về.",
                    depends_on=[],
                ),
                DecompositionStep(
                    id="step-2",
                    title="Xây dựng đường cơ sở đơn giản",
                    goal="Tìm cách Brute Force chắc chắn đúng để hiểu rõ bài toán.",
                    depends_on=["step-1"],
                ),
                DecompositionStep(
                    id="step-3",
                    title="Nhận ra công việc lặp lại và tối ưu",
                    goal="Xác định phép tra cứu hoặc bất biến mà Hash Map, Stack hay Binary Search có thể tăng tốc.",
                    depends_on=["step-2"],
                ),
            ],
            candidate_strategies=[
                CandidateStrategy(
                    name="Đường cơ sở Brute Force trực tiếp",
                    technique="Liệt kê toàn bộ",
                    intuition="Thử trực tiếp mọi tổ hợp hợp lệ để kiểm tra cách bạn hiểu các quy tắc.",
                    why_it_applies="Luôn tạo ra một đường cơ sở rõ ràng về tính đúng đắn trước khi tối ưu.",
                    time_complexity="Tùy bài toán (thường là O(n²) hoặc cao hơn)",
                    space_complexity="O(1) bộ nhớ phụ trợ",
                    complexity_assumptions="Giả sử duyệt trực tiếp mà không dùng bảng tra cứu bổ sung.",
                    limitations="Có thể quá chậm khi kích thước đầu vào lớn.",
                )
            ],
            confidence_notes=(
                "Đây chỉ là mẫu ngoại tuyến — không có LLM trực tiếp nào phân tích đề bài. "
                "Hãy cấu hình GEMINI_API_KEY trong api/.env để bật phân tích AI có cấu trúc."
            ),
        )

    async def tutor(self, request: TutorRequest) -> TutorPayload:
        if request.locale == "vi":
            return self._tutor_vi(request)

        action_replies: dict[str, tuple[str, str, str]] = {
            "simplify": (
                f"In simple terms, focus on what '{request.problem_analysis.title}' asks you to return from a tiny 3-element example before thinking about code.",
                "What would the answer be for the smallest possible valid input?",
                "Write down the input and output for 1 tiny example and 1 edge case.",
            ),
            "hint": (
                "Start by identifying what work a simple brute-force approach repeats over and over.",
                "Which value or relationship do you keep searching for during each step?",
                "Ask whether remembering visited values (Hash Map/Stack) or narrowing a monotonic range (Binary Search) avoids that repeated scan.",
            ),
            "why_technique": (
                f"For {request.selected_strategy or 'this technique'}, the goal is to match the data structure or search pattern to the exact bottleneck in the brute-force approach.",
                "What operation becomes faster when you use this technique, and what does it cost in memory or assumptions?",
                "Check both the time speedup and every prerequisite constraint (such as sorted order or nonnegative values).",
            ),
            "compare_strategies": (
                "Compare strategies along three axes: how easy it is to prove correct, time complexity as n grows, and extra memory or input assumptions required.",
                "Which constraint in the problem makes the faster strategy valid (or invalid)?",
                "Try tracing both approaches on a 4-element example to feel the difference in operations.",
            ),
            "explain_prerequisite": (
                "A prerequisite concept is a small building block (like distinct-index bounds, LIFO order, or monotonicity) that the main strategy relies on.",
                "Which single rule in this problem feels least clear right now?",
                "Test that rule on a 2-element edge case to see why breaking it causes a wrong answer.",
            ),
            "check_assumption": (
                "A great way to test an assumption is to try constructing the smallest counterexample that breaks it.",
                "What happens if your input has duplicates, zeros, negative numbers, or only 1 element?",
                "Check every constraint in the problem statement against your current idea.",
            ),
            "custom_question": (
                "Offline Demo Tutor cannot answer open-ended custom questions with a live LLM until GEMINI_API_KEY is configured on the server.",
                "Can you test your question on a tiny 3-element example by hand first?",
                "Configure GEMINI_API_KEY in api/.env to enable live conversational tutoring.",
            ),
        }

        reply, question, hint = action_replies.get(
            request.action,
            action_replies["hint"],
        )
        return TutorPayload(
            reply=reply,
            guiding_question=question,
            progressive_hint=hint,
        )

    def _tutor_vi(self, request: TutorRequest) -> TutorPayload:
        action_replies: dict[str, tuple[str, str, str]] = {
            "simplify": (
                f"Nói đơn giản, trước khi nghĩ đến mã, hãy tập trung vào kết quả mà '{request.problem_analysis.title}' yêu cầu với một ví dụ nhỏ gồm 3 phần tử.",
                "Kết quả của đầu vào hợp lệ nhỏ nhất sẽ là gì?",
                "Hãy viết đầu vào và đầu ra cho một ví dụ nhỏ cùng một trường hợp biên.",
            ),
            "hint": (
                "Hãy bắt đầu bằng cách xác định công việc mà cách Brute Force đơn giản lặp đi lặp lại.",
                "Ở mỗi bước, bạn liên tục tìm kiếm giá trị hoặc mối quan hệ nào?",
                "Hãy xem việc ghi nhớ các giá trị đã gặp bằng Hash Map/Stack hoặc thu hẹp một miền đơn điệu bằng Binary Search có tránh được lần duyệt lặp lại đó không.",
            ),
            "why_technique": (
                f"Với {request.selected_strategy or 'kỹ thuật này'}, mục tiêu là ghép cấu trúc dữ liệu hoặc mẫu tìm kiếm với đúng nút thắt của cách Brute Force.",
                "Phép toán nào nhanh hơn nhờ kỹ thuật này, và bạn phải đánh đổi bộ nhớ hoặc giả định nào?",
                "Hãy kiểm tra cả mức cải thiện thời gian lẫn mọi ràng buộc tiên quyết, chẳng hạn thứ tự đã sắp xếp hoặc các giá trị không âm.",
            ),
            "compare_strategies": (
                "Hãy so sánh các chiến lược theo ba tiêu chí: mức độ dễ chứng minh đúng, độ phức tạp thời gian khi n tăng và bộ nhớ phụ trợ hoặc giả định đầu vào cần thiết.",
                "Ràng buộc nào của bài toán khiến chiến lược nhanh hơn trở nên hợp lệ hoặc không hợp lệ?",
                "Thử mô phỏng cả hai cách trên một ví dụ 4 phần tử để cảm nhận sự khác biệt về số phép toán.",
            ),
            "explain_prerequisite": (
                "Khái niệm tiên quyết là một viên gạch nhỏ, như chỉ số khác nhau, thứ tự LIFO hoặc tính đơn điệu, mà chiến lược chính dựa vào.",
                "Quy tắc riêng lẻ nào trong bài toán này hiện khiến bạn chưa rõ nhất?",
                "Hãy kiểm tra quy tắc đó trên một trường hợp biên gồm 2 phần tử để thấy vì sao vi phạm nó dẫn đến kết quả sai.",
            ),
            "check_assumption": (
                "Một cách tốt để kiểm tra giả định là tạo ra phản ví dụ nhỏ nhất có thể phá vỡ nó.",
                "Điều gì xảy ra nếu đầu vào có giá trị trùng lặp, số 0, số âm hoặc chỉ một phần tử?",
                "Hãy đối chiếu từng ràng buộc trong đề bài với ý tưởng hiện tại của bạn.",
            ),
            "custom_question": (
                "Gia sư demo ngoại tuyến chưa thể trả lời câu hỏi mở bằng LLM trực tiếp cho đến khi GEMINI_API_KEY được cấu hình trên máy chủ.",
                "Bạn có thể thử kiểm tra câu hỏi của mình bằng tay trên một ví dụ nhỏ gồm 3 phần tử không?",
                "Hãy cấu hình GEMINI_API_KEY trong api/.env để bật gia sư hội thoại trực tiếp.",
            ),
        }
        reply, question, hint = action_replies.get(
            request.action, action_replies["hint"]
        )
        return TutorPayload(
            reply=reply,
            guiding_question=question,
            progressive_hint=hint,
        )

    async def extract_problem_from_images(
        self, images: list[tuple[str, bytes]]
    ) -> ImageExtractionPayload:
        return ImageExtractionPayload(
            extracted_text=(
                "Live vision extraction is unavailable because GEMINI_API_KEY is not configured on the server. "
                "Please type or paste the problem statement manually."
            ),
            diagram_notes=[],
            uncertain_regions=[
                f"{len(images)} uploaded image(s) were not processed because live AI is offline."
            ],
        )
