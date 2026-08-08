import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { Question } from '../question/useAdminQuestions';

export interface AnswerReviewItem extends Question {
    question_id: number;
    selected_option: string;
    is_correct: boolean;
}

export interface SessionAnswersData {
    session_id: number;
    total_score: number | null;
    answers: AnswerReviewItem[];
}

export const useSessionAnswers = (sessionId: number, enabled: boolean) => {
    return useQuery<SessionAnswersData, Error>({
        queryKey: ['session-answers', sessionId],
        enabled,
        queryFn: async () => {
            const response = await Api.get(`/api/admin/sessions/${sessionId}/answers`, {
                headers: authHeaders(),
            });
            return response.data.data as SessionAnswersData;
        },
    });
}
