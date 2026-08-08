import Api from '../../services/api';
import { authHeaders } from '../../services/headers';
import { Question } from '../question/useAdminQuestions';
import { Section } from '../section/useSections';

export interface CurrentState {
    phase: string;
    section?: Section;
    questions?: Question[];
    remaining_seconds?: number;
    break_remaining_seconds?: number;
    next_section?: Section;
    total_score?: number | null;
}

export const startExam = async (examId: number): Promise<CurrentState> => {
    const response = await Api.post(`/api/exams/${examId}/start`, {}, {
        headers: authHeaders(),
    });
    return response.data.data as CurrentState;
};

export const getCurrentState = async (examId: number): Promise<CurrentState> => {
    const response = await Api.get(`/api/exams/${examId}/current`, {
        headers: authHeaders(),
    });
    return response.data.data as CurrentState;
};

export const getSectionQuestions = async (sectionId: number): Promise<CurrentState> => {
    const response = await Api.get(`/api/sections/${sectionId}/questions`, {
        headers: authHeaders(),
    });
    return response.data.data as CurrentState;
};

export const submitSection = async (sectionId: number, answers: { question_id: number, selected_option: string }[]): Promise<CurrentState> => {
    const response = await Api.post(`/api/sections/${sectionId}/submit`, { answers }, {
        headers: authHeaders(),
    });
    return response.data.data as CurrentState;
};

export const startSection = async (sectionId: number): Promise<CurrentState> => {
    const response = await Api.post(`/api/sections/${sectionId}/start`, {}, {
        headers: authHeaders(),
    });
    return response.data.data as CurrentState;
};

export const reportViolation = async (examId: number): Promise<void> => {
    await Api.post(`/api/exams/${examId}/violation`, {}, {
        headers: authHeaders(),
    });
};
