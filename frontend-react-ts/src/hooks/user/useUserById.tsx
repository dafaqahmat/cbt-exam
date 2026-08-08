import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { User } from './useUsers';

export const useUserById = (id: number) => {
    return useQuery<User, Error>({
        queryKey: ['user', id],
        queryFn: async () => {
            const response = await Api.get('/api/admin/users', {
                headers: authHeaders(),
            });
            const users = response.data.data as User[];
            return users.find((u) => u.id === id) as User;
        },
    });
};
