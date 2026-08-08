import { AxiosError } from 'axios';

export interface ValidationErrors {
    [key: string]: string;
}

export const getValidationErrors = (error: unknown): ValidationErrors => {
    if (error instanceof AxiosError) {
        const data = error.response?.data as { errors?: ValidationErrors } | undefined;
        return data?.errors ?? {};
    }
    return {};
};