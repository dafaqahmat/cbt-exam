import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export const useExamPublish = () => {
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await Api.post(`/api/admin/exams/${id}/publish`, {}, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
