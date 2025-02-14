import { defineStore } from 'pinia';
import { ref } from 'vue';
import { updateProfile, changePassword as changePasswordApi} from '@/api/user';
import type { ProfileUpdateParams } from '@/api/user';

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('vuems_token') || '');
    const userId = ref(localStorage.getItem('user_id') || '');
    const userInfo = ref({})
    const userName = ref(localStorage.getItem('vuems_name') || '');
    const login = async (loginData: { username: string; password: string }) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            if (data.code === 200 && data.data.token) {
                token.value = data.data.token;
                userId.value = String(data.data.userInfo.id);
                
                // 使用正确的token键名
                localStorage.setItem('vuems_token', data.data.token);
                localStorage.setItem('user_id', String(data.data.userInfo.id));
                localStorage.setItem('vuems_name', data.data.userInfo.username);
                localStorage.setItem('vuems_real_name', data.data.userInfo.real_name);
                localStorage.setItem('vuems_phone', data.data.userInfo.phone);
                localStorage.setItem('vuems_avatar', data.data.userInfo.avatar);
                localStorage.setItem('vuems_building_no', data.data.userInfo.building_no);
                localStorage.setItem('vuems_room_no', data.data.userInfo.room_no);
              
                return data;
            } else {
                throw new Error(data.msg || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    };

    // 检查登录状态
    const checkLogin = () => {
        const currentToken = localStorage.getItem('vuems_token');
        if (!currentToken) {
            return false;
        }
        token.value = currentToken;
        return true;
    };

    // 登出
    const logout = () => {
        token.value = '';
        userId.value = '';
        localStorage.removeItem('vuems_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('vuems_name');
    };
    
    // 用户信息修改：
    const updateUserProfile = async (profileData: ProfileUpdateParams) => {
        try {
            const { data } = await updateProfile(profileData);
            // 更新本地存储
            localStorage.setItem('vuems_name', profileData.nickname);
            localStorage.setItem('vuems_phone', profileData.phone);
            localStorage.setItem('vuems_building_no', profileData.buildingNo);
            localStorage.setItem('vuems_room_no', profileData.roomNo);
            localStorage.setItem('vuems_real_name', profileData.realName);
            
            // 更新 store 中的用户信息
            userInfo.value = {
                ...userInfo.value,
                ...data
            };
            
            return data;
        } catch (error) {
            console.error('更新用户信息失败:', error);
            throw error;
        }
    };

    // 用户修改密码：
  const changePassword = async (passwordData: { id: number; oldPassword: string; newPassword: string }) => {
        try {
          const response = await changePasswordApi(passwordData);
          return response;
        } catch (error) {
          console.log("修改用户密码错误：", error)
          throw error;
        }
      }

    return {
        token,
        userId,
        userName,
        login,
        logout,
        checkLogin,
        updateUserProfile,
        changePassword
    };
}); 