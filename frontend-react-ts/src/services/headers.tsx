import Cookies from 'js-cookie';

export const authHeaders = () => ({
    Authorization: `Bearer ${Cookies.get('token')}`,
});
