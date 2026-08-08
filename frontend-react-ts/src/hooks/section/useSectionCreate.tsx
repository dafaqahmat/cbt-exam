import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface SectionRequest {
    title: string;
    order: number;
    duration_minutes: number;
    break_after_seconds: number;
}

export const useSectionCreate = () => {
    return useMutation({
        mutationFn: async ({ examId, data }: { examId: number, data: SectionRequest }) => {
            const response = await Api.post(`/api/admin/exams/${examId}/sections`, data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
