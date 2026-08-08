import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export const useQuestionDelete = () => {
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await Api.delete(`/api/admin/questions/${id}`, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
