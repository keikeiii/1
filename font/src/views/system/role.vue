<template>
    <div>
        <div class="container">
            <div class="handle-box">
                <el-input
                    v-model="query.roleName"
                    placeholder="角色名称"
                    class="handle-input mr10"
                ></el-input>
                <el-button type="primary" :icon="Search" @click="getData">搜索</el-button>
                <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
            </div>
            <el-table :data="tableData" border class="table" ref="multipleTable" v-loading="loading">
                <el-table-column prop="id" label="序号" width="70" align="center">
                    <template #default="scope">
                        {{ (query.pageIndex - 1) * query.pageSize + scope.$index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column prop="roleName" label="角色名称" width="200"></el-table-column>
                <el-table-column prop="roleKey" label="角色标识" width="200"></el-table-column>
                <el-table-column prop="status" label="状态" align="center" width="160">
                    <template #default="scope">
                        <el-switch
                            v-model="scope.row.status"
                            :active-value="1"
                            :inactive-value="0"
                            @change="handleStatusChange(scope.row)"
                        ></el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="240"></el-table-column>
                <el-table-column label="操作" min-width="220" align="center">
                    <template #default="scope">
                        <div class="operation-buttons">
                            <el-button 
                                type="primary"
                                link
                                :icon="Edit"
                                @click="handleEdit(scope.row)"
                            >编辑</el-button>
                            <el-button
                                type="warning"
                                link
                                :icon="Setting"
                                @click="handlePermission(scope.row)"
                            >权限</el-button>
                            <el-button
                                type="danger"
                                link
                                :icon="Delete"
                                @click="handleDelete(scope.$index)"
                            >删除</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <el-pagination
                    background
                    layout="total, prev, pager, next"
                    :current-page="query.pageIndex"
                    :page-size="query.pageSize"
                    :total="pageTotal"
                    @current-change="handlePageChange"
                ></el-pagination>
            </div>
        </div>

        <!-- 编辑弹出框 -->
        <el-dialog
            :title="editForm.id === 0 ? '新增角色' : '编辑角色'"
            v-model="editVisible"
            width="30%"
        >
            <el-form label-width="80px">
                <el-form-item label="角色名称">
                    <el-input v-model="editForm.roleName" placeholder="请输入角色名称"></el-input>
                </el-form-item>
                <el-form-item label="角色标识">
                    <el-input v-model="editForm.roleKey" placeholder="请输入角色标识"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="editVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveEdit">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 权限分配弹出框 -->
        <el-dialog
            title="分配权限"
            v-model="permVisible"
            width="30%"
        >
            <el-tree
                ref="permTree"
                :data="permissionData"
                :props="defaultProps"
                show-checkbox
                node-key="id"
                :default-checked-keys="checkedKeys"
                :check-strictly="false"
            ></el-tree>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="permVisible = false">取 消</el-button>
                    <el-button type="primary" @click="savePermission">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from '@vue/runtime-core';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Edit, Setting, Delete } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

interface RoleListResponse {
    list: TableItem[];
    total: number;
}

interface RolePermissionResponse {
    menuIds: number[];
}

interface TableItem {
    id: number;
    roleName: string;
    roleKey: string;
    status: number;
    createTime: string;
    updateTime: string;
    permissions?: string[];
}

interface EditForm {
    id: number;
    roleName: string;
    roleKey: string;
}

const query = reactive({
    roleName: '',
    pageIndex: 1,
    pageSize: 10
});

const tableData = ref<TableItem[]>([]);
const pageTotal = ref(0);
const loading = ref(false);
const editVisible = ref(false);
const permVisible = ref(false);

const editForm = reactive<EditForm>({
    id: 0,
    roleName: '',
    roleKey: ''
});

const currentRole = ref<TableItem | null>(null);
const checkedKeys = ref<number[]>([]);

const permissionData = ref([]);

const defaultProps = {
    children: 'children',
    label: 'label'
};

// 获取角色列表
const getData = async () => {
    try {
        loading.value = true;
        const res = await request.post<RoleListResponse>('/system/role/list', {
            roleName: query.roleName.trim(),
            pageNum: query.pageIndex,
            pageSize: query.pageSize
        });
        
        if (res.code === 200 && res.data) {
            tableData.value = res.data.list;
            pageTotal.value = res.data.total;
        } else {
            ElMessage.error(res.msg || '获取数据失败');
            tableData.value = [];
            pageTotal.value = 0;
        }
    } catch (error: any) {
        console.error('获取角色列表失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '获取数据失败');
        tableData.value = [];
        pageTotal.value = 0;
    } finally {
        loading.value = false;
    }
};

// 新增角色
const handleAdd = () => {
    editForm.id = 0;
    editForm.roleName = '';
    editForm.roleKey = '';
    editVisible.value = true;
};

// 编辑角色
const handleEdit = (row: TableItem) => {
    Object.assign(editForm, {
        id: row.id,
        roleName: row.roleName,
        roleKey: row.roleKey
    });
    editVisible.value = true;
};

// 保存角色
const saveEdit = async () => {
    try {
        const url = editForm.id === 0 ? '/system/role/add' : '/system/role/update';
        const res = await request.post<ApiResponse<null>>(url, {
            id: editForm.id || undefined,
            roleName: editForm.roleName,
            roleKey: editForm.roleKey
        });

        if (res.code === 200) {
            ElMessage.success(editForm.id === 0 ? '新增成功' : '更新成功');
            editVisible.value = false;
            getData();
        } else {
            ElMessage.error(res.msg || (editForm.id === 0 ? '新增失败' : '更新失败'));
        }
    } catch (error: any) {
        console.error('保存角色失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '保存失败');
    }
};

// 更改角色状态
const handleStatusChange = async (row: TableItem) => {
    try {
        const res = await request.post<ApiResponse<null>>('/system/role/status', {
            id: row.id,
            status: row.status
        });
        if (res.code === 200) {
            ElMessage.success('状态更新成功');
        } else {
            ElMessage.error(res.msg || '状态更新失败');
            row.status = row.status === 1 ? 0 : 1; // 失败时恢复状态
        }
    } catch (error: any) {
        console.error('更新状态失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '状态更新失败');
        row.status = row.status === 1 ? 0 : 1; // 失败时恢复状态
    }
};

// 删除角色
const handleDelete = (index: number) => {
    const role = tableData.value[index];
    if (!role) {
        ElMessage.error('角色数据不存在');
        return;
    }

    ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
        type: 'warning'
    })
        .then(async () => {
            try {
                const res = await request.post<ApiResponse<null>>('/system/role/delete', {
                    id: role.id
                });
                if (res.code === 200) {
                    ElMessage.success('删除成功');
                    getData();
                } else {
                    ElMessage.error(res.msg || '删除失败');
                }
            } catch (error: any) {
                console.error('删除角色失败:', error);
                ElMessage.error(error.response?.data?.msg || error.message || '删除失败');
            }
        })
        .catch(() => {
            // 用户取消删除操作
        });
};

// 获取菜单树
const getMenuTree = async () => {
    try {
        const res = await request.get('/system/menu/tree');
        if (res.code === 200) {
            permissionData.value = res.data;
        } else {
            ElMessage.error(res.msg || '获取菜单数据失败');
        }
    } catch (error: any) {
        console.error('获取菜单树失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '获取菜单数据失败');
    }
};

// 获取角色的菜单权限
const getRoleMenus = async (roleId: number) => {
    try {
        const res = await request.get(`/system/menu/role/menus/${roleId}`);
        if (res.code === 200) {
            // 只设置完全选中的节点，不包括半选节点
            const permTree = permissionData.value;
            const menuIds = res.data;
            
            // 过滤出所有叶子节点（没有子节点的节点）
            const leafMenuIds = menuIds.filter(id => {
                const findNode = (nodes) => {
                    for (let node of nodes) {
                        if (node.id === id) {
                            return !node.children || node.children.length === 0;
                        }
                        if (node.children) {
                            const found = findNode(node.children);
                            if (found !== undefined) return found;
                        }
                    }
                };
                return findNode(permTree);
            });
            
            checkedKeys.value = leafMenuIds;
        } else {
            ElMessage.error(res.msg || '获取角色菜单失败');
        }
    } catch (error: any) {
        console.error('获取角色菜单失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '获取角色菜单失败');
    }
};

// 处理权限分配
const handlePermission = async (row: TableItem) => {
    currentRole.value = row;
    await getMenuTree();
    await getRoleMenus(row.id);
    permVisible.value = true;
};

// 保存权限
const savePermission = async () => {
    if (!currentRole.value) return;
    
    try {
        // 获取选中的节点和半选中的节点
        const checkedKeys = permTree.value?.getCheckedKeys() || [];
        const halfCheckedKeys = permTree.value?.getHalfCheckedKeys() || [];
        const menuIds = [...checkedKeys, ...halfCheckedKeys];
        
        const res = await request.post('/system/menu/role/menus', {
            roleId: currentRole.value.id,
            menuIds: menuIds
        });

        if (res.code === 200) {
            ElMessage.success('权限分配成功');
            permVisible.value = false;
            // 重新获取角色的菜单权限
            await getRoleMenus(currentRole.value.id);
            // 重新获取角色列表
            await getData();
        } else {
            ElMessage.error(res.msg || '权限分配失败');
        }
    } catch (error: any) {
        console.error('保存权限失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '保存权限失败');
    }
};

// 分页导航
const handlePageChange = (val: number) => {
    query.pageIndex = val;
    getData();
};

const permTree = ref();

// 初始化
getData();
</script>

<style scoped>
.handle-box {
    margin-bottom: 20px;
}

.handle-input {
    width: 200px;
}

.mr10 {
    margin-right: 10px;
}

.container {
    padding: 20px;
    background-color: var(--el-bg-color);
}

.table {
    width: 100%;
    font-size: 14px;
}

.operation-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
}

.pagination {
    margin: 20px 0;
    text-align: right;
}

:deep(.el-button--link) {
    padding: 4px 8px;
    height: auto;
    font-size: 14px;
}

:deep(.el-button--link.el-button--primary) {
    color: var(--el-color-primary);
}

:deep(.el-button--link.el-button--primary:hover) {
    color: var(--el-color-primary-light-3);
}

:deep(.el-button--link.el-button--warning) {
    color: var(--el-color-warning);
}

:deep(.el-button--link.el-button--warning:hover) {
    color: var(--el-color-warning-light-3);
}

:deep(.el-button--link.el-button--danger) {
    color: var(--el-color-danger);
}

:deep(.el-button--link.el-button--danger:hover) {
    color: var(--el-color-danger-light-3);
}

:deep(.el-dialog__body) {
    padding: 20px 25px;
}

:deep(.el-form-item) {
    margin-bottom: 20px;
}

:deep(.el-switch) {
    margin: 6px 0;
}

:deep(.el-table) {
    width: 100% !important;
}

:deep(.el-table__body) {
    width: 100% !important;
}

:deep(.el-table__header) {
    width: 100% !important;
}
</style>