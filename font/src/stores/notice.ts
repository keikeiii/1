import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/utils/request';
import type { ApiResponse } from '@/types/api';

export interface Notice {
    id: number;
    title: string;
    content: string;
    create_time: string;
    create_user_id: number;
}

export const useNoticeStore = defineStore('notice', () => {
    const notices = ref<Notice[]>([]);
    const readNoticeIds = ref<number[]>([]);

    // 计算属性：未读消息
    const unreadNotices = computed(() => {
        return notices.value.filter(notice => !readNoticeIds.value.includes(notice.id));
    });

    // 计算属性：已读消息
    const readNotices = computed(() => {
        return notices.value.filter(notice => readNoticeIds.value.includes(notice.id));
    });

    // 获取通知列表
    const getNotices = async () => {
        try {
            const response = await request.get<ApiResponse<Notice[]>>('/system/notices');
            if (response.code === 200) {
                notices.value = response.data;
                // 初始化时从localStorage加载已读消息ID
                readNoticeIds.value = JSON.parse(localStorage.getItem('readNoticeIds') || '[]');
                return response.data;
            }
            throw new Error(response.msg || '获取通知列表失败');
        } catch (error) {
            console.error('获取通知列表失败:', error);
            throw error;
        }
    };

    // 发布通知
    const publishNotice = async (data: { title: string; content: string }) => {
        try {
            const response = await request.post<ApiResponse<Notice>>('/system/notices', {
                ...data,
                createUserId: localStorage.getItem('user_id'),
                createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });

            if (response.code === 200) {
                notices.value.unshift(response.data);
                return response.data;
            }
            throw new Error(response.msg || '发布通知失败');
        } catch (error) {
            console.error('发布通知失败:', error);
            throw error;
        }
    };

    // 标记消息为已读
    const markAsRead = (id: number) => {
        if (!readNoticeIds.value.includes(id)) {
            readNoticeIds.value.push(id);
            localStorage.setItem('readNoticeIds', JSON.stringify(readNoticeIds.value));
            window.dispatchEvent(new Event('unread-messages-updated'));
        }
    };

    // 标记所有为已读
    const markAllAsRead = () => {
        const allIds = notices.value.map(notice => notice.id);
        readNoticeIds.value = [...new Set([...readNoticeIds.value, ...allIds])];
        localStorage.setItem('readNoticeIds', JSON.stringify(readNoticeIds.value));
        window.dispatchEvent(new Event('unread-messages-updated'));
    };

    return {
        notices,
        unreadNotices,
        readNotices,
        getNotices,
        publishNotice,
        markAsRead,
        markAllAsRead
    };
}); 