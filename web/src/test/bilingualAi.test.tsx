import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/App';
import i18n from '../i18n';
import {
  analyzeProblem,
  askTutor,
  type AnalyzeResponseDto,
  type TutorResponseDto,
} from '../services/aiClient';

const VI_ANALYZE_RESPONSE: AnalyzeResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  notice: null,
  analysis: {
    title: 'Đổi Tiền Ít Đồng Nhất',
    plain_language_summary:
      'Tìm số đồng xu ít nhất cần dùng để tạo thành đúng tổng mục tiêu.',
    inferred_problem_type: 'Quy hoạch động',
    inputs: ['Mảng mệnh giá coins', 'Tổng mục tiêu amount'],
    outputs: ['Số đồng xu ít nhất hoặc -1 nếu không thể'],
    constraints_and_assumptions: ['Mỗi mệnh giá có thể dùng nhiều lần.'],
    edge_cases: ['amount = 0 trả về 0'],
    worked_example: {
      input_summary: 'coins = [1, 2, 5], amount = 11',
      output_summary: '3',
      walkthrough: 'Chọn 5 + 5 + 1 để đạt tổng 11 với 3 đồng xu.',
    },
    subproblem_decomposition: [
      {
        id: 'step-1',
        title: 'Xác định bài toán con theo từng số tiền',
        goal: 'Tính số đồng xu ít nhất cho từng giá trị từ 0 đến amount.',
        depends_on: [],
      },
    ],
    candidate_strategies: [
      {
        name: 'Quy hoạch động dưới lên',
        technique: 'Dynamic Programming',
        intuition: 'Tái sử dụng kết quả tối ưu của các tổng nhỏ hơn.',
        why_it_applies: 'Có cấu trúc bài toán con gối nhau.',
        time_complexity: 'O(amount * n)',
        space_complexity: 'O(amount)',
        complexity_assumptions: 'n là số mệnh giá.',
        limitations: 'Cần mảng phụ kích thước amount + 1.',
      },
    ],
    prerequisite_concepts: ['Mảng', 'Quy hoạch động'],
    clarifications_or_ambiguities: [
      'Trước khi viết code, vì sao tham lam không luôn đúng?',
    ],
    confidence_notes: 'Phân tích khái niệm do AI tạo.',
  },
  verified_match: {
    status: 'conceptual_only',
    matched_problem_id: null,
    matched_problem_title: null,
    studio_path: null,
    reason: 'Chưa có Studio tất định cho bài toán này.',
    compatibility_checks: [],
    user_input_note: 'Chỉ phân tích khái niệm — không tạo trace giả lập.',
  },
};

const EN_ANALYZE_RESPONSE: AnalyzeResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  notice: null,
  analysis: {
    title: 'Minimum Coin Change',
    plain_language_summary:
      'Find the fewest coins needed to make up the target amount.',
    inferred_problem_type: 'Dynamic Programming',
    inputs: ['coins array', 'target amount'],
    outputs: ['minimum coin count or -1'],
    constraints_and_assumptions: ['Unlimited supply of each coin.'],
    edge_cases: ['amount = 0 returns 0'],
    worked_example: {
      input_summary: 'coins = [1, 2, 5], amount = 11',
      output_summary: '3',
      walkthrough: 'Use 5 + 5 + 1 for a total of 3 coins.',
    },
    subproblem_decomposition: [
      {
        id: 'step-1',
        title: 'Define smaller amount subproblems',
        goal: 'Compute minimum coins for each amount from 0 to target.',
        depends_on: [],
      },
    ],
    candidate_strategies: [
      {
        name: 'Bottom-Up DP',
        technique: 'Dynamic Programming',
        intuition: 'Reuse optimal answers for smaller amounts.',
        why_it_applies: 'Overlapping subproblems exist.',
        time_complexity: 'O(amount * n)',
        space_complexity: 'O(amount)',
        complexity_assumptions: 'n is number of denominations.',
        limitations: 'Needs O(amount) table.',
      },
    ],
    prerequisite_concepts: ['Arrays', 'Dynamic Programming'],
    clarifications_or_ambiguities: ['Why can greedy fail for some coins?'],
    confidence_notes: 'Conceptual analysis.',
  },
  verified_match: {
    status: 'conceptual_only',
    matched_problem_id: null,
    matched_problem_title: null,
    studio_path: null,
    reason: 'No curated deterministic studio matches this problem.',
    compatibility_checks: [],
    user_input_note: 'Chỉ phân tích khái niệm — không tạo trace giả lập.',
  },
};

const VI_TUTOR_RESPONSE: TutorResponseDto = {
  mode: 'ai',
  is_ai_generated: true,
  verified_execution: false,
  reply: 'Hãy thử lưu số đồng xu ít nhất cho từng tổng nhỏ hơn trước.',
  guiding_question: 'Nếu biết đáp án cho tổng i - c thì tổng i thay đổi thế nào?',
  progressive_hint: 'Khởi tạo dp[0] = 0 và cập nhật dần từ 1 đến amount.',
  mastery_disclaimer: 'Gia sư AI không xác minh việc thực thi mã.',
  notice: null,
};

describe('Phase 3C.2 — Bilingual AI Analysis & Tutor Integration', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'light';
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('safely defaults invalid or missing locale values to en in aiClient', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => EN_ANALYZE_RESPONSE,
    } as Response);

    await analyzeProblem('Given an array of integers, find the maximum sum.', {
      locale: 'fr',
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      locale: 'en',
    });

    await askTutor({
      problem_analysis: EN_ANALYZE_RESPONSE.analysis,
      action: 'hint',
      locale: 'invalid' as 'en',
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      locale: 'en',
    });
  });

  it('sends locale "vi" on Vietnamese AI Analysis and localizes Reader tabs and limitation note', async () => {
    await i18n.changeLanguage('vi');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => VI_ANALYZE_RESPONSE,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/dán một đề bài/i),
      'Cho mảng mệnh giá xu và tổng mục tiêu, tìm số đồng xu ít nhất.',
    );
    await user.click(
      screen.getByRole('button', { name: /phân tích bài toán \(ai\)/i }),
    );

    expect(await screen.findByText('Đổi Tiền Ít Đồng Nhất')).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      locale: 'vi',
    });

    // Verify all 3 localized AI Reader tabs work in Vietnamese
    expect(screen.getByRole('tab', { name: /diễn giải/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /cách tiếp cận \(1\)/i }));
    expect(
      screen.getByText(/tái sử dụng kết quả tối ưu/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('tab', { name: /ràng buộc & trường hợp biên/i }),
    );
    expect(
      screen.getByText(/việc nhận diện studio đã kiểm chứng hiện dựa trên mẫu tiếng anh/i),
    ).toBeInTheDocument();
  });

  it('safely cancels and ignores an in-flight analysis when language switches mid-request', async () => {
    let resolveInFlight!: (value: Response) => void;
    const inFlightPromise = new Promise<Response>((resolve) => {
      resolveInFlight = resolve;
    });
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(inFlightPromise);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/paste a problem statement/i),
      'Given coin denominations and a target amount, find minimum coins.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    // Switch language while request is still in-flight
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');

    // Now resolve the outdated English response — it must be ignored, not rendered or mislabeled
    resolveInFlight({
      ok: true,
      status: 200,
      json: async () => EN_ANALYZE_RESPONSE,
    } as Response);

    await waitFor(() => {
      expect(screen.queryByText('Minimum Coin Change')).not.toBeInTheDocument();
    });
  });

  it('preserves previous analysis and shows localized error when regeneration in another language fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => EN_ANALYZE_RESPONSE,
      } as Response)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/paste a problem statement/i),
      'Given coin denominations and a target amount, find minimum coins.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );
    expect(await screen.findByText('Minimum Coin Change')).toBeInTheDocument();

    // Switch to Vietnamese and click explicit regenerate
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');
    await user.click(
      screen.getByRole('button', { name: /tạo lại bằng tiếng việt/i }),
    );

    // Localized Vietnamese network error is shown AND old English analysis stays intact
    expect(
      await screen.findByText(/không thể kết nối tới máy chủ algomiri api/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Minimum Coin Change')).toBeInTheDocument();
    expect(
      screen.getByText(/phân tích này được tạo bằng/i),
    ).toBeInTheDocument();
  });

  it('renders localized Vietnamese Offline Demo card without fabricating analysis', async () => {
    await i18n.changeLanguage('vi');
    const offlineResponse: AnalyzeResponseDto = {
      ...VI_ANALYZE_RESPONSE,
      mode: 'offline-demo',
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => offlineResponse,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/dán một đề bài/i),
      'Đảo ngược một số nguyên 32-bit có dấu và trả về 0 nếu tràn số.',
    );
    await user.click(
      screen.getByRole('button', { name: /phân tích bài toán \(ai\)/i }),
    );

    expect(
      await screen.findByText(/phân tích ai trực tiếp chưa được bật trên máy chủ này/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/thử một bài học tương tác đã kiểm chứng/i),
    ).toBeInTheDocument();
  });

  it('sends locale "vi" from Studio AI Tutor, preserves replies across tab switches, and works in Dark Mode', async () => {
    await i18n.changeLanguage('vi');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => VI_TUTOR_RESPONSE,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/studio/two-sum']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole('button', { name: /giao diện tối/i })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');

    const tutorTab = await screen.findByRole('tab', { name: /hỏi gia sư ai/i });
    await user.click(tutorTab);
    await user.click(screen.getByRole('button', { name: /cho một gợi ý/i }));

    expect(
      await screen.findByText(/hãy thử lưu số đồng xu ít nhất/i),
    ).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      locale: 'vi',
      action: 'hint',
    });

    // Switch to Explanation tab and back — Tutor reply persists
    await user.click(screen.getAllByRole('tab', { name: /giải thích bước/i })[0]);
    await user.click(screen.getAllByRole('tab', { name: /hỏi gia sư ai/i })[0]);
    expect(
      screen.getByText(/hãy thử lưu số đồng xu ít nhất/i),
    ).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('aborts an in-flight regeneration on Clear and prevents late responses from repopulating Landing', async () => {
    let resolveRegen!: (value: Response) => void;
    let regenSignal: AbortSignal | undefined;

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => EN_ANALYZE_RESPONSE,
      } as Response)
      .mockImplementationOnce((_url, init) => {
        regenSignal = init?.signal ?? undefined;
        return new Promise<Response>((resolve) => {
          resolveRegen = resolve;
        });
      });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/paste a problem statement/i),
      'Given coin denominations and a target amount, find minimum coins.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );
    expect(await screen.findByText('Minimum Coin Change')).toBeInTheDocument();

    // Switch to Vietnamese and start regeneration (stays pending)
    await user.selectOptions(screen.getAllByLabelText(/language/i)[0], 'vi');
    await user.click(
      screen.getByRole('button', { name: /tạo lại bằng tiếng việt/i }),
    );
    expect(regenSignal).toBeDefined();
    expect(regenSignal?.aborted).toBe(false);

    // Click Clear while regeneration is in progress
    await user.click(screen.getByRole('button', { name: /^xóa$/i }));

    expect(regenSignal?.aborted).toBe(true);
    expect(screen.queryByText('Minimum Coin Change')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /phân tích bài toán \(ai\)/i }),
    ).toBeEnabled();

    // Resolve the late response anyway — it must NOT repopulate the page
    resolveRegen({
      ok: true,
      status: 200,
      json: async () => VI_ANALYZE_RESPONSE,
    } as Response);

    await new Promise((r) => setTimeout(r, 25));
    expect(screen.queryByText('Đổi Tiền Ít Đồng Nhất')).not.toBeInTheDocument();
  });

  it('aborts a pending analysis request cleanly on unmount/navigation', async () => {
    let pendingSignal: AbortSignal | undefined;
    let resolvePending!: (value: Response) => void;

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((_url, init) => {
      pendingSignal = init?.signal ?? undefined;
      return new Promise<Response>((resolve) => {
        resolvePending = resolve;
      });
    });

    const user = userEvent.setup();
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/paste a problem statement/i),
      'Given coin denominations and a target amount, find minimum coins.',
    );
    await user.click(
      screen.getByRole('button', { name: /analyze problem \(ai\)/i }),
    );

    expect(pendingSignal).toBeDefined();
    expect(pendingSignal?.aborted).toBe(false);

    unmount();
    expect(pendingSignal?.aborted).toBe(true);

    // Resolving after unmount should settle cleanly without throwing
    resolvePending({
      ok: true,
      status: 200,
      json: async () => EN_ANALYZE_RESPONSE,
    } as Response);
    await new Promise((r) => setTimeout(r, 20));
  });

  it('localizes HTTP 429, 504, 413, and 503 API errors in Vietnamese without leaking raw English backend text', async () => {
    await i18n.changeLanguage('vi');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '20' }),
        json: async () => ({
          detail: 'Rate limit exceeded. Please wait before sending another request.',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 504,
        headers: new Headers(),
        json: async () => ({
          detail: 'AI request timed out. Please retry in a moment.',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 413,
        headers: new Headers(),
        json: async () => ({
          detail: 'Request payload exceeds the 65536-byte limit.',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => VI_ANALYZE_RESPONSE,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers(),
        json: async () => ({
          detail: 'AI provider is temporarily unavailable. Please retry in a moment.',
        }),
      } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/dán một đề bài/i),
      'Cho mảng mệnh giá xu và tổng mục tiêu, tìm số đồng xu ít nhất.',
    );
    await user.click(
      screen.getByRole('button', { name: /phân tích bài toán \(ai\)/i }),
    );

    // 429 localized in Vietnamese with preserved retry-after duration
    const rateAlert = await screen.findByRole('alert');
    expect(rateAlert).toHaveTextContent(/đã vượt quá giới hạn tần suất yêu cầu/i);
    expect(rateAlert).toHaveTextContent(/~20 giây/i);
    expect(rateAlert).not.toHaveTextContent(/rate limit exceeded/i);

    // Retry -> 504 localized gateway timeout
    await user.click(screen.getByRole('button', { name: /thử lại/i }));
    const timeoutAlert = await screen.findByRole('alert');
    expect(timeoutAlert).toHaveTextContent(/hết thời gian chờ trên máy chủ/i);
    expect(timeoutAlert).not.toHaveTextContent(/AI request timed out/i);

    // Retry -> 413 localized payload too large
    await user.click(screen.getByRole('button', { name: /thử lại/i }));
    const payloadAlert = await screen.findByRole('alert');
    expect(payloadAlert).toHaveTextContent(/vượt quá giới hạn dung lượng/i);
    expect(payloadAlert).not.toHaveTextContent(/65536-byte/i);

    // Retry -> analysis succeeds, then Tutor hits 503 localized service unavailable
    await user.click(screen.getByRole('button', { name: /thử lại/i }));
    expect(await screen.findByText('Đổi Tiền Ít Đồng Nhất')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /hỏi gia sư ai/i }));
    await user.click(screen.getByRole('button', { name: /cho một gợi ý/i }));

    const tutorAlert = await screen.findByRole('alert');
    expect(tutorAlert).toHaveTextContent(/dịch vụ ai tạm thời không khả dụng/i);
    expect(tutorAlert).not.toHaveTextContent(/temporarily unavailable/i);
  });

  it('presents localized verified-matching metadata in Vietnamese without leaking English compatibility checks', async () => {
    await i18n.changeLanguage('vi');
    const verifiedViResponse: AnalyzeResponseDto = {
      ...VI_ANALYZE_RESPONSE,
      verified_match: {
        status: 'verified',
        matched_problem_id: 'two-sum',
        matched_problem_title: 'Two Sum',
        studio_path: '/studio/two-sum',
        reason: 'Matches AlgoMiri verified Two Sum engine.',
        compatibility_checks: ['Distinct 0-based indices confirmed.'],
        user_input_note: 'Opening Studio loads curated samples first.',
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => verifiedViResponse,
    } as Response);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/dán một đề bài/i),
      'Two Sum: Given an array of integers nums and target, find two distinct indices summing to target.',
    );
    await user.click(
      screen.getByRole('button', { name: /phân tích bài toán \(ai\)/i }),
    );
    expect(await screen.findByText('Đổi Tiền Ít Đồng Nhất')).toBeInTheDocument();

    await user.click(
      screen.getByRole('tab', { name: /ràng buộc & trường hợp biên/i }),
    );
    expect(
      screen.getByText(/đối chiếu studio đã kiểm chứng/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/đã khớp với studio tất định đã kiểm chứng cho two sum/i),
    ).toBeInTheDocument();
    // English-only backend compatibility checks are NOT leaked in Vietnamese UI
    expect(
      screen.queryByText(/distinct 0-based indices confirmed/i),
    ).not.toBeInTheDocument();

    // Switching to English shows the English compatibility checks cleanly
    await user.selectOptions(screen.getAllByLabelText(/ngôn ngữ|language/i)[0], 'en');
    await user.click(
      screen.getByRole('tab', { name: /constraints & edge cases/i }),
    );
    expect(
      screen.getByText(/distinct 0-based indices confirmed/i),
    ).toBeInTheDocument();
  });
});
