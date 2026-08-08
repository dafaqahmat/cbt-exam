import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';

interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
}

export const useLogin = () => {
    return useMutation({
        mutationFn: async (data: LoginRequest) => {
            const response = await Api.post('/api/login', data);
            return response.data as { success: boolean; message: string; data: LoginResponse };
        }
    });
};
