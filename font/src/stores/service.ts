import { defineStore } from 'pinia';
// import { useResourceStore } from './resource';
import request from '../utils/request';

interface ServiceRating {
    score: number;
    comment: string;
    rateTime: string;
} 

interface ServiceApply {
    id: string;
    user_id: string;
    name: string;
    building: string;
    room: string;
    phone: string;
    type: string;
    detail: string;
    description: string;
    applyTime: string;
    status: number;
    rating?: ServiceRating;
    resourceId: string;
    useTime: string[];
}

export const useServiceStore = defineStore('service', {
    state: () => ({
        applications: [] as ServiceApply[]
    }),

    actions: {
        async loadApplications() {
            try {
                const response = await request.get('/service-apply/list');
                if (response.code === 200) {
                    this.applications = response.data;
                    return response.data;
                }
            } catch (error) {
                console.error('加载申请列表失败:', error);
                throw error;
            }
        },

        async loadUserApplications(userId: string) {
            try {
                const response = await request.get(`/service-apply/user/${userId}`);
                if (response.code === 200) {
                    this.applications = response.data;
                    return response.data;
                }
            } catch (error) {
                console.error('加载用户申请列表失败:', error);
                throw error;
            }
        },

        async addApplication(application: Omit<ServiceApply, 'id' | 'applyTime' | 'status'>) {
            try {
                const response = await request.post('/service-apply/create', application);
                if (response.code === 200) {
                    await this.loadUserApplications(application.user_id);
                    return response.data;
                }
            } catch (error) {
                console.error('提交申请失败:', error);
                throw error;
            }
        },

        async updateApplicationStatus(id: string, status: number) {
            try {
                const response = await request.put(`/service-apply/${id}/status`, { status });
                if (response.code === 200) {
                    // 更新本地状态
                    const index = this.applications.findIndex(app => app.id === id);
                    if (index !== -1) {
                        this.applications[index].status = status;
                    }
                    return response.data;
                }
            } catch (error) {
                console.error('更新申请状态失败:', error);
                throw error;
            }
        },

        async addRating(applyId: string, ratingData: { score: number; comment: string }) {
            try {
                const response = await request.post(`/service-rating/${applyId}/rating`, ratingData);
                if (response.code === 200) {
                    // 更新本地应用列表中的评价信息
                    const index = this.applications.findIndex(app => app.id === applyId);
                    if (index !== -1) {
                        this.applications[index].rating = {
                            ...ratingData,
                            rateTime: new Date().toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            })
                        };
                    }
                    return response.data;
                }
            } catch (error: any) {
                throw new Error(error.response?.data?.msg || '提交评价失败');
            }
        },
        
        async getRating(applyId: string) {
            try {
                const response = await request.get(`/service-rating/${applyId}/rating`);
                if (response.code === 200) {
                    return response.data;
                }
            } catch (error: any) {
                console.error('获取评价失败:', error);
                throw new Error(error.response?.data?.msg || '获取评价失败');
            }
        }
    }
    
}); 