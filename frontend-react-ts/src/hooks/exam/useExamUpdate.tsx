import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { ExamRequest } from './useExamCreate';

export const useExamUpdate = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: ExamRequest }) => {
            const response = await Api.put(`/api/admin/exams/${id}`, data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
