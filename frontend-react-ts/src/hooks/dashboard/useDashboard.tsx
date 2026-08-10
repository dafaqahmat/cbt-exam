import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface NameValue {
    name: string;
    value: number;
}

export interface ExamSessionsItem {
    exam_title: string;
    participant_count: number;
}

export interface ScoreBucket {
    label: string;
    count: number;
}

export interface RecentSession {
    user_name: string;
    username: string;
    exam_title: string;
    total_score: number | null;
    finished_at: string | null;
}

export interface DashboardData {
    total_peserta: number;
    total_exams: number;
    active_exams: number;
    draft_exams: number;
    closed_exams: number;
    total_sessions: number;
    finished_sessions: number;
    average_score: number | null;
    exams_by_status: NameValue[];
    participants_by_category: NameValue[];
    sessions_per_exam: ExamSessionsItem[];
    score_distribution: ScoreBucket[];
    recent_sessions: RecentSession[];
}

export const useDashboard = () => {
    return useQuery<DashboardData, Error>({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const response = await Api.get('/api/admin/dashboard', {
                headers: authHeaders(),
            });
            return response.data.data as DashboardData;
        },
    });
}