import { useQuery } from '@tanstack/react-query';
import Api from '../../services/api';
import { authHeaders } from '../../services/headers';

export interface Question {
    id: number;
    section_id: number;
    type: string;
    question_text: string;
    question_image: string;
    option_a_text: string;
    option_a_image: string;
    option_b_text: string;
    option_b_image: string;
    option_c_text: string;
    option_c_image: string;
    option_d_text: string;
    option_d_image: string;
    correct_answer: string;
    points: number;
}

export const useAdminQuestions = (sectionId: number) => {
    return useQuery<Question[], Error>({
        queryKey: ['admin-questions', sectionId],
        queryFn: async () => {
            const response = await Api.get(`/api/admin/sections/${sectionId}/questions`, {
                headers: authHeaders(),
            });
            return response.data.data as Question[];
        },
    });
}
