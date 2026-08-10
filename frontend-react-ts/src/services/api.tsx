/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';
import Cookies from 'js-cookie';

const Api = axios.create({
    baseURL: 'http://localhost:3000'
})

let sessionExpired = false;

Api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !sessionExpired && !window.location.pathname.startsWith('/login')) {
            sessionExpired = true;
            Cookies.remove('token');
            Cookies.remove('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const imageUrl = (path: string): string => {
    if (!path) return '';
    return `http://localhost:3000${path}`;
}

export default Api
