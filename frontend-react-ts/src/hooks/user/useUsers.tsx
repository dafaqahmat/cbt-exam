import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    category_id?: number | null;
    category_name?: string;
}

export const useUsers = (role?: 'peserta' | 'admin') => {
    return useQuery<User[], Error>({
        queryKey: role ? ['users', role] : ['users'],
        queryFn: async () => {
            const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users';
            const response = await Api.get(url, {
                headers: authHeaders(),
            });
            return response.data.data as User[];
        },
    });
}