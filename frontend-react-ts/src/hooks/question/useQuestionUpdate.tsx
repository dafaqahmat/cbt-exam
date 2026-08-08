import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { QuestionRequest } from './useQuestionCreate';

export const useQuestionUpdate = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: QuestionRequest }) => {
            const response = await Api.put(`/api/admin/questions/${id}`, data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
