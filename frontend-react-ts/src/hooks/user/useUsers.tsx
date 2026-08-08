import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
}

export const useUsers = () => {
    return useQuery<User[], Error>({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await Api.get('/api/admin/users', {
                headers: authHeaders(),
            });
            return response.data.data as User[];
        },
    });
}
