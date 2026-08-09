import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface ExamRequest {
    title: string;
    description: string;
    status: string;
    category_ids: number[];
}

export const useExamCreate = () => {
    return useMutation({
        mutationFn: async (data: ExamRequest) => {
            const response = await Api.post('/api/admin/exams', data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
