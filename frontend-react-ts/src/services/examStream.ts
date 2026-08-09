import Cookies from 'js-cookie';

const STREAM_BASE = 'http://localhost:3000';

export interface ExamStatusEvent {
  status: 'closed' | 'draft' | string;
}

export function openExamStream(
  examId: number,
  onEvent: (event: ExamStatusEvent) => void,
  onError?: () => void
): () => void {
  const token = Cookies.get('token');
  const url = `${STREAM_BASE}/api/exams/${examId}/stream?token=${encodeURIComponent(token ?? '')}`;
  const source = new EventSource(url);

  source.addEventListener('status', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as ExamStatusEvent;
      onEvent(data);
    } catch {
      // abaikan payload yang tidak valid
    }
  });

  source.onerror = () => {
    onError?.();
  };

  return () => {
    source.close();
  };
}