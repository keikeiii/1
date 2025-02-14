import request from '../utils/request';

export const login = (data: {
    username: string;
    password: string;
}) => {
    return request({
        url: '/auth/login',
        method: 'post',
        data
    });
};

export const register = (data: {
    username: string;
    password: string;
    realName?: string;
    phone?: string;
    email?: string;
}) => {
    return request({
        url: '/auth/register',
        method: 'post',
        data
    });
};

export const registerAdmin = (data: {
    username: string;
    password: string;
    realName?: string;
    phone?: string;
    email?: string;
    secretKey: string;
}) => {
    return request({
        url: '/auth/register-admin',
        method: 'post',
        data
    });
};

export const getUserInfo = () => {
    return request({
        url: '/protected',
        method: 'get'
    });
}; 