import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface CategoryRequest {
    name: string;
}

export const useCategoryCreate = () => {
    return useMutation({
        mutationFn: async (data: CategoryRequest) => {
            const response = await Api.post('/api/admin/categories', data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};