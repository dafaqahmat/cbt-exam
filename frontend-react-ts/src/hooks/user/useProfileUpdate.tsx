import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface ProfileUpdateRequest {
    name: string;
    username: string;
    email: string;
    password?: string;
}

export const useProfileUpdate = () => {
    return useMutation({
        mutationFn: async (data: ProfileUpdateRequest) => {
            const response = await Api.put('/api/admin/profile', data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
}