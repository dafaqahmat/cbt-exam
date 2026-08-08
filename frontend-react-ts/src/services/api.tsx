/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';

const Api = axios.create({
    baseURL: 'http://localhost:3000'
})

export const imageUrl = (path: string): string => {
    if (!path) return '';
    return `http://localhost:3000${path}`;
}

export default Api
