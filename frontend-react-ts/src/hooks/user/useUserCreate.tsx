import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface UserRequest {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    category_id?: number | null;
}

export const useUserCreate = () => {
    return useMutation({
        mutationFn: async (data: UserRequest) => {
            const response = await Api.post('/api/admin/users', data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
