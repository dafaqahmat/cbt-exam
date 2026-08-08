import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface UserUpdateRequest {
    name: string;
    username: string;
    email: string;
    password?: string;
    role: string;
}

export const useUserUpdate = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: UserUpdateRequest }) => {
            const response = await Api.put(`/api/admin/users/${id}`, data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
