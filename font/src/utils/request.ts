import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

const service = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 5000
});

// 请求拦截器
service.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('vuems_token');
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }
        return config;
    },
    (error) => {
        console.log(error);
        return Promise.reject();
    }
);

// 响应拦截器
service.interceptors.response.use(
    (response) => {
        // 直接返回响应数据
        return response.data;
    },
    (error) => {
        console.log('响应错误:', error);
        if (error.response?.status === 401) {
            localStorage.clear();
            router.push('/login');
            ElMessage.error('登录已过期，请重新登录');
        } else {
            ElMessage.error(error.response?.data?.msg || error.message || '请求失败');
        }
        return Promise.reject(error);
    }
);

export default service;
