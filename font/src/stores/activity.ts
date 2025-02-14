import { defineStore } from 'pinia';
import { ref, computed } from '@vue/runtime-dom';
import { useUserStore } from './user';
import request from '../utils/request';
import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '../utils/request';

export interface Activity {
    id: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    address: string;
    max_participants: number;
    status: number;
    image?: string;
    appliedCount?: number;
    applications?: Application[];
    createTime?: string;
    createUserId?: number;
    rating?: {
        score: number;
        comment: string;
        rateTime: string;
    };
    isApplied?: boolean;
}

export interface Application {
    id?: string;
    activityId: string;
    userId: string;
    name: string;
    phone: string;
    remark: string;
    applyTime: string;
    status?: number;
    rating?: {
        score: number;
        comment: string;
        rateTime: string;
    };
}

// 服务器返回的活动数据格式
export interface ServerActivity {
    id: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    address: string;
    maxParticipants: number;
    status: number;
    image?: string;
    appliedCount?: number;
    createTime?: string;
    createUserId?: number;
    applications?: Application[];
}

interface ActivityResponse {
    list: ServerActivity[];
    total: number;
    pageNum: number;
    pageSize: number;
}

export const useActivityStore = defineStore('activity', () => {
    const userStore = useUserStore();
    const activities = ref<Activity[]>([]);

    // 加载活动列表
    const loadActivities = async (params?: {
        name?: string;
        status?: string | number;
        pageNum?: number;
        pageSize?: number;
    }) => {
        try {
            const response = await request.get<ApiResponse<ActivityResponse>>('/system/activities', { params });

            if (response.code === 200 && response.data) {
                // 获取活动列表
                const activityList = response.data.list;
                
                // 为每个活动获取报名记录
                const activitiesWithApplications = await Promise.all(
                    activityList.map(async (activity) => {
                        try {
                            const applications = await getActivityApplications(activity.id);
                            return {
                                ...activity,
                                applications,
                                appliedCount: applications?.length || 0,
                                maxParticipants: activity.max_participants || 0
                            };
                        } catch (error) {
                            console.error(`获取活动 ${activity.id} 的报名记录失败:`, error);
                            return {
                                ...activity,
                                applications: [],
                                appliedCount: 0,
                                maxParticipants: activity.max_participants || 0
                            };
                        }
                    })
                );

                activities.value = activitiesWithApplications;
                return {
                    ...response.data,
                    list: activitiesWithApplications
                };
            }
            throw new Error(response.msg || '获取活动列表失败');
        } catch (error) {
            console.error('获取活动列表失败:', error);
            throw error;
        }
    };

    // 报名活动
    const applyActivity = (activityId: number, userId: string) => {
        const activity = activities.value.find((a: Activity) => a.id === activityId);
        if (activity) {
            if (!activity.applications) {
                activity.applications = [];
            }
            activity.applications.push({
                id: Math.random().toString(36).substring(2, 11),
                activityId: activityId.toString(),
                userId,
                name: '',
                phone: '',
                remark: '',
                applyTime: new Date().toISOString(),
                status: 1
            });
            activity.appliedCount = (activity.appliedCount || 0) + 1;
        }
    };

    // 添加活动评价
    const addActivityRating = async (activityId: number, ratingData: { score: number; comment: string }) => {
        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                throw new Error('请先登录');
            }

            const response = await request.post<ApiResponse<any>>(
                `/system/activities/${activityId}/rate/${userId}`,
                ratingData
            );
            
            if (response.code === 200) {
                return response.data;
            }
            throw new Error(response.msg || '评价失败');
        } catch (error) {
            console.error('评价失败:', error);
            throw error;
        }
    };

    // 获取用户的活动报名记录
    const getUserActivities = async (params: {
        userId: string;
        name?: string;
        status?: number;
        pageNum?: number;
        pageSize?: number;
    }) => {
        try {
            const response = await request.get<ApiResponse<{
                list: Activity[];
                total: number;
                pageNum: number;
                pageSize: number;
            }>>('/system/activities/user', { params });

            if (response.code === 200 && response.data) {
                activities.value = response.data.list;
                return response.data;
            }
            throw new Error(response.msg || '获取用户活动列表失败');
        } catch (error) {
            console.error('获取用户活动列表失败:', error);
            throw error;
        }
    };

    // 过滤活动列表
    const filteredActivities = computed(() => {
        return activities.value;
    });

    // 更新活动
    const updateActivity = async (activity: Activity) => {
        try {
            console.log('准备更新活动，数据:', activity);
            const updateData = {
                id: activity.id,
                name: activity.name,
                description: activity.description,
                start_time: activity.startTime,
                end_time: activity.endTime,
                address: activity.address,
                max_participants: activity.max_participants,
                status: activity.status,
                image: activity.image
            };
            
            const response = await request.put<ApiResponse<ServerActivity>>(`/system/activities/${activity.id}`, updateData);
            
            if (!response || response.code !== 200) {
                throw new Error((response && response.msg) || '更新活动失败');
            }

            // 更新本地状态
            const index = activities.value.findIndex(a => a.id === activity.id);
            if (index !== -1 && response.data) {
                const serverActivity = response.data as unknown as ServerActivity;
                const updatedActivity = {
                    ...serverActivity,
                    applications: activities.value[index].applications || []
                };
                activities.value[index] = updatedActivity;
            }
            return response.data;
        } catch (error: any) {
            console.error('更新活动失败:', error);
            throw error;
        }
    };

    const addActivity = async (activity: Partial<Activity>) => {
        try {
            console.log('准备发送创建活动请求，数据:', activity);
            const response = await request.post<ApiResponse<ServerActivity>>('/system/activities', activity);
            console.log('服务器完整响应:', response);
            console.log('响应数据:', response.data);
            
            if (response.data && response.code === 200) {
                const serverActivity = response.data as unknown as ServerActivity;
                const newActivity: Activity = {
                    ...serverActivity,
                    applications: [],
                    isApplied: false
                };
                console.log('新创建的活动数据:', newActivity);
                activities.value.push(newActivity);
                return newActivity;
            }
            
            throw new Error('创建活动失败：响应格式异常');
        } catch (error: any) {
            console.error('创建活动失败，详细错误:', error);
            throw error;
        }
    };

    const deleteActivity = async (id: number) => {
        try {
            console.log('准备删除活动，ID:', id);
            const response = await request.delete<ApiResponse<null>>(`/system/activities/${id}`);
            console.log('完整响应:', response);
            
            // 获取响应数据，可能在response或response.data中
            const responseData = response.data || response;
            console.log('响应数据:', responseData);
            
            // 检查响应是否存在
            if (!responseData) {
                throw new Error('服务器没有返回响应');
            }
            
            // 检查响应中的code字段
            if (responseData.code === 200) {
                // 删除成功后，从本地状态中移除
                const index = activities.value.findIndex((a: Activity) => a.id === id);
                if (index !== -1) {
                    activities.value.splice(index, 1);
                }
                return true;
            }
            
            // 如果响应不成功，抛出错误
            throw new Error(responseData.msg || '删除活动失败');
        } catch (error: any) {
            console.error('删除活动失败:', error);
            // 如果是404错误（活动不存在），也认为是删除成功
            if (error.response?.status === 404) {
                const index = activities.value.findIndex((a: Activity) => a.id === id);
                if (index !== -1) {
                    activities.value.splice(index, 1);
                }
                return true;
            }
            // 如果是我们主动抛出的错误，直接传递
            if (error.message) {
                throw error;
            }
            // 其他错误则抛出通用错误消息
            throw new Error('删除活动失败，请稍后重试');
        }
    };

    const addActivityApply = async (applyData: {
        activityId: string;
        userId: string;
        name: string;
        phone: string;
        remark: string;
    }) => {
        try {
            const response = await request.post<ApiResponse<any>>('/system/activities/apply', applyData);
            
            if (response.code === 200) {
                // 更新本地状态
                const activity = activities.value.find(a => a.id === Number(applyData.activityId));
                if (activity) {
                    if (!activity.applications) {
                        activity.applications = [];
                    }
                    activity.applications.push({
                        ...applyData,
                        applyTime: new Date().toISOString(),
                        status: 1
                    });
                    activity.appliedCount = (activity.appliedCount || 0) + 1;
                }
                return true;
            }
            throw new Error(response.msg || '报名失败');
        } catch (error: any) {
            console.error('活动报名失败:', error);
            throw error;
        }
    };

    const getActivityDetail = async (id: number) => {
        try {
            const response = await request.get<ApiResponse<Activity>>(
                `/system/activities/${id}/detail`
            );
            
            if (response.code === 200) {
                return response.data;
            }
            throw new Error(response.msg || '获取活动详情失败');
        } catch (error) {
            console.error('获取活动详情失败:', error);
            throw error;
        }
    };

    const getActivityApplications = async (activityId: number) => {
        try {
            const response = await request.get<ApiResponse<Application[]>>(
                `/system/activities/${activityId}/applications`
            );
            
            if (response.code === 200) {
                return response.data;
            }
            throw new Error(response.msg || '获取报名记录失败');
        } catch (error) {
            console.error('获取报名记录失败:', error);
            throw error;
        }
    };

    return {
        activities,
        loadActivities,
        applyActivity,
        addActivityRating,
        getUserActivities,
        filteredActivities,
        updateActivity,
        addActivity,
        deleteActivity,
        addActivityApply,
        getActivityDetail,
        getActivityApplications
    };
}); 