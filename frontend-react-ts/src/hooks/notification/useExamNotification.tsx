import { useMutation, useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface NotifyPreview {
    exam_title: string;
    categories: { id: number; name: string }[];
    recipient_count: number;
}

export interface NotifyResult {
    exam_title: string;
    total_recipients: number;
    sent: number;
    failed: number;
    error: string;
}

export const useNotifyPreview = (examId: number) => {
    return useQuery<NotifyPreview, Error>({
        queryKey: ['notify-preview', examId],
        queryFn: async () => {
            const response = await Api.get(`/api/admin/exams/${examId}/notify/preview`, {
                headers: authHeaders(),
            });
            return response.data.data as NotifyPreview;
        },
    });
}

export const useSendExamNotification = () => {
    return useMutation({
        mutationFn: async ({ examId, message }: { examId: number, message: string }) => {
            const response = await Api.post(`/api/admin/exams/${examId}/notify`, { message }, {
                headers: authHeaders(),
            });
            return response.data.data as NotifyResult;
        }
    });
}