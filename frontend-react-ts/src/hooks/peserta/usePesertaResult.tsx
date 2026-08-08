import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { AnswerReviewItem } from '../result/useSessionAnswers';
import { SectionScore } from '../result/useAdminResults';

export interface PesertaResultData {
    published: boolean;
    total_score?: number | null;
    sections?: SectionScore[];
    answers?: AnswerReviewItem[];
    finished_at?: string;
    violation_count?: number;
}

export const usePesertaResult = (examId: number) => {
    return useQuery<PesertaResultData, Error>({
        queryKey: ['peserta-result', examId],
        queryFn: async () => {
            const response = await Api.get(`/api/exams/${examId}/result`, {
                headers: authHeaders(),
            });
            return response.data.data as PesertaResultData;
        },
    });
}
