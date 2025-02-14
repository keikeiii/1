import { defineStore } from 'pinia';
import request from '@/utils/request';  // 改用 request 工具

interface Resource {
    id: string;
    name: string;
    type: string;  // such as 'court', 'activity-room';
    location: string;
    capacity: number;
    description: string;
}

interface Booking {
    id: string;
    resourceId: string;
    applicationId: string;  // 关联的申请ID
    startTime: string;
    endTime: string;
    status: number;  // 0: 待审核, 1: 已通过, 2: 已拒绝
    userName?: string;
}

export const useResourceStore = defineStore('resource', {
    state: () => ({
        resources: [] as Resource[],
        bookings: [] as Booking[]
    }),

    actions: {
        async loadResources() {
            try {
                const response = await request.get('/resource/list');
                console.log("loadResources response", response);
                if (response.code === 200) {
                    this.resources = response.data;
                    return response.data;
                }
            } catch (error) {
                console.error('加载资源列表失败:', error);
                throw error;
            }
        },

        async addResource(resource: Omit<Resource, 'id'>) {
            try {
                const response = await request.post('/resource/create', resource);
                console.log("addResource response", response);
                if (response.code === 200) {
                    await this.loadResources();
                    return response.data;
                }
            } catch (error) {
                console.error('添加资源失败:', error);
                throw error;
            }
        },

        async deleteResource(id: string) {
            try {
                const response = await request.delete(`/resource/${id}`);
                console.log("deleteResource response", response);
                if (response.code === 200) {
                    this.resources = this.resources.filter(r => r.id !== id);
                    return response.data;
                }
            } catch (error) {
                console.error('删除资源失败:', error);
                throw error;
            }
        },

        async loadResourceBookings(resourceId: string) {
            try {
                const response = await request.get(`/resource/${resourceId}/bookings`);
                console.log("loadResourceBookings response", response);
                if (response.code === 200) {
                    this.bookings = response.data;
                    return response.data;
                }
            } catch (error) {
                console.error('加载资源预订记录失败:', error);
                throw error;
            }
        },

        async addBooking(booking: Omit<Booking, 'id'>) {
            try {
                const response = await request.post('/resource/booking/create', booking);
                console.log("addBooking response", response);
                if (response.code === 200) {
                    await this.loadResourceBookings(booking.resourceId);
                    return response.data;
                }
            } catch (error) {
                console.error('添加预订失败:', error);
                throw error;
            }
        },

        getResourceBookings(resourceId: string) {
            return this.bookings.filter(b => b.resourceId === resourceId);
        },

        isTimeSlotAvailable(resourceId: string, startTime: string, endTime: string) {
            const existingBookings = this.getResourceBookings(resourceId);
            return !existingBookings.some(booking => {
                return (
                    (new Date(startTime) >= new Date(booking.startTime) && 
                     new Date(startTime) < new Date(booking.endTime)) ||
                    (new Date(endTime) > new Date(booking.startTime) && 
                     new Date(endTime) <= new Date(booking.endTime))
                );
            });
        },

        async loadResourcesByType(type: string) {
            try {
                const response = await request.get(`/resource/list/${type}`);
                console.log("loadResourcesByType response", response);
                if (response.code === 200) {
                    return response.data;
                }
            } catch (error) {
                console.error('加载资源列表失败:', error);
                throw error;
            }
        },

        async getResourceSchedule(resourceId: string) {
            try {
                const response = await request.get(`/resource/${resourceId}/schedule`);
                console.log("getResourceSchedule response", response);
                if (response.code === 200) {
                    this.bookings = response.data;
                    return response.data;
                }
            } catch (error) {
                console.error('获取资源日程失败:', error);
                throw error;
            }
        }
    }
}); 