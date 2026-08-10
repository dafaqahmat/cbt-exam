import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface ReportFilters {
    start: string;
    end: string;
    exam_id?: string;
    category_id?: string;
}

export interface ReportExamItem {
    exam_id: number;
    exam_title: string;
    exam_status: string;
    participant_count: number;
    finished_count: number;
    average_score: number | null;
    max_score: number | null;
    min_score: number | null;
}

export interface ReportData {
    total_exams: number;
    total_participants: number;
    exams: ReportExamItem[];
}

export const useReport = (filters: ReportFilters, enabled: boolean) => {
    return useQuery<ReportData, Error>({
        queryKey: ['admin-report', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.start) params.set('start', filters.start);
            if (filters.end) params.set('end', filters.end);
            if (filters.exam_id) params.set('exam_id', filters.exam_id);
            if (filters.category_id) params.set('category_id', filters.category_id);

            const response = await Api.get(`/api/admin/reports?${params.toString()}`, {
                headers: authHeaders(),
            });
            return response.data.data as ReportData;
        },
        enabled,
    });
}