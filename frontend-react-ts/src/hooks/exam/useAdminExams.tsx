import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { Section } from '../section/useSections';

export interface Exam {
    id: number;
    title: string;
    description: string;
    status: string;
    results_published: boolean;
    created_at: string;
    updated_at: string;
    sections?: Section[];
    categories?: { id: number; name: string }[];
    section_count?: number;
    question_count?: number;
    participant_count?: number;
}

export const useAdminExams = () => {
    return useQuery<Exam[], Error>({
        queryKey: ['admin-exams'],
        queryFn: async () => {
            const response = await Api.get('/api/admin/exams', {
                headers: authHeaders(),
            });
            return response.data.data as Exam[];
        },
    });
}
