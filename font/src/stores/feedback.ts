import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '@/utils/request';

export interface Feedback {
    id: string;
    title: string;
    type: string;
    content: string;
    userId: string;
    userName: string;
    createTime: string;
    status: number;  // 0: 待处理, 1: 已处理
    replies?: string;
    replyTimes?: string;
}


export const useFeedbackStore = defineStore('feedback', () => {
    const getRawData = (responseData: any) => {
        return responseData.map((feedback: any) => ({
            ...feedback,
            createTime: feedback.create_time,
            userId: feedback.user_id,
            userName: feedback.user_name
        }));
    }
    const feedbacks = ref<Feedback[]>([]);
    // 创建反馈
    const addFeedback = async (feedback: Omit<Feedback, 'id' | 'createTime' | 'status'>) => {
        try {
          const response = await request.post('/feedback', feedback);
            return response;
        } catch (error) {
            console.error('创建反馈失败:', error);
            throw error;
        }
    };

    // 获取所有的反馈：
    const getAllFeedbacks = async () => {
        try {
            const response = await request.get('/feedback');
            feedbacks.value = getRawData(response[0]);
            return getRawData(response[0]);
        } catch (error) {
            console.error('获取反馈列表失败:', error);
            throw error;
        }
    };

    // 获取用户反馈列表
    const getUserFeedbacks = async (userId: string) => {
        try {
            const response = await request.get('/feedback', {
                params: { userId }
            });
            feedbacks.value = getRawData(response[0])
            console.log("feedbacks, ", feedbacks.value);
            return getRawData(response[0]);
        } catch (error) {
            console.error('获取用户反馈列表失败:', error);
            throw error;
        }
    };

    // 获取反馈详情
    const getFeedbackById = async (id: number) => {
        try {
            console.log("id", id)
            const feedback = feedbacks.value.find(feedback => feedback.id === id);
            console.log("select, ", feedback);
            return feedback;
            // console.log("index, ", index);
            // if(index !== -1) {
                // return feedbacks.value[index];
            // }
        } catch (error) {
            console.error('获取反馈详情失败:', error);
            throw error;
        }
    };

    // 添加回复
    const addReply = async (id: string, content: string) => {
        try {
            const response = await request.post(`/feedback/${id}/reply`, { content });
            console.log("reply response", response);
            return response;
        } catch (error) {
            console.error('回复反馈失败:', error);
            throw error;
        }
    }

    return {
        feedbacks,
        addFeedback,
        getUserFeedbacks,
        getFeedbackById,
        getAllFeedbacks,
        addReply
    };
}); 