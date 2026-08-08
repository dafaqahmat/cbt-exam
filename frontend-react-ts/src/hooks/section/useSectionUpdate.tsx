import { useMutation } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { SectionRequest } from './useSectionCreate';

export const useSectionUpdate = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: SectionRequest }) => {
            const response = await Api.put(`/api/admin/sections/${id}`, data, {
                headers: authHeaders(),
            });
            return response.data;
        }
    });
};
