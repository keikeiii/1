<template>
    <div>
        <div class="container">
            <div class="handle-box">
                <el-input
                    v-model="query.username"
                    placeholder="用户名"
                    class="handle-input mr10"
                ></el-input>
                <el-input
                    v-model="query.phone"
                    placeholder="手机号"
                    class="handle-input mr10"
                ></el-input>
                <el-button type="primary" :icon="Search" @click="getData">搜索</el-button>
                <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
            </div>
            <el-table :data="tableData" border class="table" ref="multipleTable" v-loading="loading">
                <el-table-column label="ID" width="55" align="center">
                    <template #default="scope">
                        {{ scope.$index + 1 + (query.pageIndex - 1) * query.pageSize }}
                    </template>
                </el-table-column>
                <el-table-column prop="username" label="用户名"></el-table-column>
                <el-table-column prop="realName" label="真实姓名"></el-table-column>
                <el-table-column prop="phone" label="手机号"></el-table-column>
                <el-table-column prop="status" label="状态" align="center">
                    <template #default="scope">
                        <el-switch
                            v-model="scope.row.status"
                            :active-value="1"
                            :inactive-value="0"
                            @change="handleStatusChange(scope.row)"
                        ></el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间"></el-table-column>
                <el-table-column label="操作" width="220" align="center">
                    <template #default="scope">
                        <el-button text :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button text :icon="Delete" class="red" @click="handleDelete(scope.$index)">删除</el-button>
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
            :title="editForm.id === 0 ? '新增用户' : '编辑用户'"
            v-model="editVisible"
            width="30%"
        >
            <el-form label-width="70px">
                <el-form-item label="用户名">
                    <el-input v-model="editForm.username" disabled></el-input>
                </el-form-item>
                <el-form-item label="真实姓名">
                    <el-input v-model="editForm.realName"></el-input>
                </el-form-item>
                <el-form-item label="手机号">
                    <el-input v-model="editForm.phone"></el-input>
                </el-form-item>
                <el-form-item label="角色">
                    <el-select v-model="editForm.roleId" placeholder="请选择角色">
                        <el-option
                            v-for="role in roleOptions"
                            :key="role.id"
                            :label="role.roleName"
                            :value="role.id"
                        ></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="editVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveEdit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { Edit, Delete, Search, Plus, Picture } from '@element-plus/icons-vue';
import request from '@/utils/request';

interface Query {
    username: string;
    phone: string;
    pageIndex: number;
    pageSize: number;
}

interface EditForm {
    id: number;
    username: string;
    realName: string;
    phone: string;
    roleId: number;
}

interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

interface UserData {
    id: number;
    username: string;
    realName: string;
    phone: string;
    avatar: string;
    status: number;
    createTime: string;
    updateTime: string;
    roleName: string;
    roleKey: string;
}

interface UserDataResponse {
    id: number;
    username: string;
    real_name: string;
    phone: string;
    avatar: string;
    status: number;
    create_time: string;
    update_time: string;
    role_name: string;
    role_key: string;
}

interface UserListResponse {
    list: UserDataResponse[];
    total: number;
    pageNum: number;
    pageSize: number;
}

interface RoleOption {
    id: number;
    roleName: string;
    roleKey: string;
}

const query = reactive<Query>({
    username: '',
    phone: '',
    pageIndex: 1,
    pageSize: 10
});

const tableData = ref<UserData[]>([]);
const pageTotal = ref(0);
const loading = ref(false);
const editVisible = ref(false);
const editForm = reactive<EditForm>({
    id: 0,
    username: '',
    realName: '',
    phone: '',
    roleId: 0
});
const roleOptions = ref<RoleOption[]>([]);

// 获取表格数据
const getData = async () => {
    loading.value = true;
    try {
        const res = await request.post<UserListResponse>('/system/user/list', {
            username: query.username.trim(),
            phone: query.phone.trim(),
            pageNum: query.pageIndex,
            pageSize: query.pageSize
        });

        if (res.code === 200) {
            // 修改数据映射，使用计算后的索引作为显示ID
            tableData.value = res.data.list.map((item, index) => ({
                displayId: index + 1 + (query.pageIndex - 1) * query.pageSize, // 添加显示用的ID
                id: item.id, // 保留原始ID用于后端操作
                username: item.username,
                realName: item.real_name,
                phone: item.phone,
                avatar: item.avatar,
                status: item.status,
                createTime: item.create_time ? new Date(item.create_time).toLocaleString() : '',
                updateTime: item.update_time ? new Date(item.update_time).toLocaleString() : '',
                roleName: item.role_name || '未分配',
                roleKey: item.role_key || ''
            }));
            pageTotal.value = res.data.total;
            query.pageIndex = res.data.pageNum;
            query.pageSize = res.data.pageSize;
        } else {
            ElMessage.error(res.msg || '获取数据失败');
            tableData.value = [];
            pageTotal.value = 0;
        }
    } catch (error: any) {
        console.error('获取用户列表失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '获取数据失败');
        tableData.value = [];
        pageTotal.value = 0;
    } finally {
        loading.value = false;
    }
};

// 删除操作
const handleDelete = (index: number) => {
    const user = tableData.value[index];
    if (!user) {
        ElMessage.error('用户数据不存在');
        return;
    }

    ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
        type: 'warning'
    })
        .then(async () => {
            try {
                const res = await request.delete<null>(`/system/user/delete/${user.id}`);
                if (res.code === 200) {
                    ElMessage.success('删除成功');
                    getData();
                } else {
                    ElMessage.error(res.msg || '删除失败');
                }
            } catch (error: any) {
                console.error('删除用户失败:', error);
                ElMessage.error(error.response?.data?.msg || error.message || '删除失败');
            }
        })
        .catch(() => {
            // 用户取消删除操作
        });
};

// 更改用户状态
const handleStatusChange = async (row: UserData) => {
    try {
        const res = await request.put<null>('/system/user/status', {
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

// 编辑操作
const handleEdit = async (row: UserData) => {
    Object.assign(editForm, {
        id: row.id,
        username: row.username,
        realName: row.realName,
        phone: row.phone,
        roleId: 0
    });
    
    // 获取用户当前角色
    try {
      const res = await request.get<ApiResponse<{ roleId: number }>>(`/system/user/role/${row.id}`);
        console.log("resresres", res)
        if (res.code === 200) {
            editForm.roleId = res.data[0].roleId;
        }
    } catch (error) {
        console.error('获取用户角色失败:', error);
    }
    
    // 加载角色选项
  await getRoleOptions();
    console.log("options", roleOptions.value, editForm.roleId)
    editVisible.value = true;
};

// 保存编辑
const saveEdit = async () => {
    try {
        const res = await request.put<null>('/system/user/update', {
            id: editForm.id,
            username: editForm.username,
            realName: editForm.realName,
            phone: editForm.phone,
            roleId: editForm.roleId
        });
        
        if (res.code === 200) {
            editVisible.value = false;
            ElMessage.success('修改成功');
            getData();
        } else {
            ElMessage.error(res.msg || '修改失败');
        }
    } catch (error: any) {
        console.error('更新用户失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '修改失败');
    }
};

// 分页导航
const handlePageChange = (val: number) => {
    query.pageIndex = val;
    getData();
};

// 添加用户
const handleAdd = () => {
    editVisible.value = true;
    editForm.id = 0;
    editForm.username = '';
    editForm.realName = '';
    editForm.phone = '';
    editForm.roleId = 0;
};

// 获取角色选项
const getRoleOptions = async () => {
    try {
        const res = await request.get<ApiResponse<RoleOption[]>>('/system/role/options');
        if (res.code === 200) {
            roleOptions.value = res.data;
            console.log("roleOptions.value", roleOptions.value)
        } else {
            ElMessage.error(res.msg || '获取角色列表失败');
        }
    } catch (error: any) {
        console.error('获取角色列表失败:', error);
        ElMessage.error(error.response?.data?.msg || error.message || '获取角色列表失败');
    }
};

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

.red {
    color: #F56C6C;
}

.table {
    width: 100%;
    font-size: 14px;
}

.pagination {
    margin: 20px 0;
    text-align: right;
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
}

:deep(.el-image) {
    border-radius: 50%;
    overflow: hidden;
}

:deep(.el-avatar) {
    background-color: #409eff;
}
</style> 