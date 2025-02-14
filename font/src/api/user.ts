import request from '../utils/request';

export interface UserQueryParams {
    username?: string;
    phone?: string;
    status?: number;
    pageNum: number;
    pageSize: number;
}

export interface UserForm {
    id?: number;
    username: string;
    password?: string;
    realName: string;
    phone: string;
    email: string;
    status?: number;
}

export interface ProfileUpdateParams {
    id: number;
    nickname: string;
    realName: string;
    phone: string;
    buildingNo: string;
    roomNo: string;
}

// 获取用户列表
export function getUserList(params: UserQueryParams) {
    return request({
        url: '/api/system/user/list',
        method: 'post',
        params
    });
}

// 添加用户
export function addUser(data: UserForm) {
    return request({
        url: '/api/system/user/add',
        method: 'post',
        data
    });
}

// 更新用户
export function updateUser(data: UserForm) {
    return request({
        url: `/api/system/user/update`,
        method: 'put',
        data
    });
}

// 删除用户
export function deleteUser(id: number) {
    return request({
        url: `/api/system/user/delete/${id}`,
        method: 'delete'
    });
}

// 修改用户状态
export function changeUserStatus(id: number, status: number) {
    return request({
        url: `/api/system/user/status`, 
        method: 'put',
        data: { id, status }
    });
}

// 更新个人资料
export function updateProfile(data: ProfileUpdateParams) {
    return request({
        url: 'system/user/info',
        method: 'put',
        data
    });
} 

// 修改密码：
export function changePassword(data: { id: number; oldPassword: string; newPassword: string }) {
  return request({
    url: '/system/user/password',
    method: 'put',
    data
  });
}