import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { Question } from './useAdminQuestions';

export const useQuestionById = (id: number) => {
    return useQuery<Question, Error>({
        queryKey: ['admin-question', id],
        queryFn: async () => {
            const response = await Api.get(`/api/admin/questions/${id}`, {
                headers: authHeaders(),
            });
            return response.data.data as Question;
        },
    });
};
