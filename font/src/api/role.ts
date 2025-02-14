import request from '../utils/request';

export interface RoleQueryParams {
  roleName?: string;
  status?: number;
  pageNum: number;
  pageSize: number;
}

export interface RoleForm {
  id?: number;
  roleName: string;
  roleKey: string;
  status: number;
  permissions?: string[];
}

// 获取角色列表
export function getRoleList(params: RoleQueryParams) {
  return request({
    url: '/api/system/role/list',
    method: 'get',
    params
  });
}

// 创建角色
export function createRole(data: RoleForm) {
  return request({
    url: '/api/system/role/create',
    method: 'post',
    data
  });
}

// 更新角色
export function updateRole(data: RoleForm) {
  return request({
    url: '/api/system/role/update',
    method: 'put',
    data
  });
}

// 删除角色
export function deleteRole(id: number) {
  return request({
    url: `/api/system/role/delete/${id}`,
    method: 'delete'
  });
} 