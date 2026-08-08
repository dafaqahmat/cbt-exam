import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export const useCategoryUpdate = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: { name: string } }) => {
            const response = await Api.put(`/api/admin/categories/${id}`, data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};