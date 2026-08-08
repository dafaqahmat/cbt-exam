import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface Category {
    id: number;
    name: string;
}

export const useCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await Api.get('/api/admin/categories', {
                headers: authHeaders(),
            });
            return response.data.data as Category[];
        },
    });
}