import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { User } from './useUsers';

export const useProfile = () => {
    return useQuery<User, Error>({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await Api.get('/api/admin/profile', {
                headers: authHeaders(),
            });
            return response.data.data as User;
        },
    });
}