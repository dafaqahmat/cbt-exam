import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface SessionInfo {
    status: string;
    violation_count: number;
    total_score: number | null;
    started_at: string;
}

export interface PesertaExam {
    id: number;
    title: string;
    description: string;
    status: string;
    results_published: boolean;
    section_count: number;
    total_duration_minutes: number;
    session: SessionInfo | null;
}

export const usePesertaExams = () => {
    return useQuery<PesertaExam[], Error>({
        queryKey: ['peserta-exams'],
        queryFn: async () => {
            const response = await Api.get('/api/exams', {
                headers: authHeaders(),
            });
            return response.data.data as PesertaExam[];
        },
    });
}
