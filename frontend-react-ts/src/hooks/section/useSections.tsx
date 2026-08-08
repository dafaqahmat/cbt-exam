import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface Section {
    id: number;
    exam_id: number;
    title: string;
    order: number;
    duration_minutes: number;
    break_after_seconds: number;
    question_count?: number;
}

export const useSections = (examId: number) => {
    return useQuery<Section[], Error>({
        queryKey: ['sections', examId],
        queryFn: async () => {
            const response = await Api.get(`/api/admin/exams/${examId}/sections`, {
                headers: authHeaders(),
            });
            return response.data.data as Section[];
        },
    });
}
