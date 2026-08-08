import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface UploadResult {
    success: boolean;
    message: string;
    data: {
        url: string;
    };
}

export const useUploadImage = () => {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            const response = await Api.post('/api/admin/upload', formData, {
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data as UploadResult;
        }
    });
};
