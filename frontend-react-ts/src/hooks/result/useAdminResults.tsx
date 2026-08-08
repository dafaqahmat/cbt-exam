import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { Exam } from '../exam/useAdminExams';
import { User } from '../user/useUsers';

export interface SectionScore {
    section_id: number;
    title: string;
    order: number;
    score: number | null;
    status: string;
}

export interface AdminResultItem {
    session_id: number;
    user: User;
    status: string;
    started_at: string;
    finished_at: string | null;
    total_score: number | null;
    violation_count: number;
    sections: SectionScore[];
}

export interface AdminResultsData {
    exam: Exam;
    results: AdminResultItem[];
}

export const useAdminResults = (examId: number) => {
    return useQuery<AdminResultsData, Error>({
        queryKey: ['admin-results', examId],
        queryFn: async () => {
            const response = await Api.get(`/api/admin/exams/${examId}/results`, {
                headers: authHeaders(),
            });
            return response.data.data as AdminResultsData;
        },
    });
}
