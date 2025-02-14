<template>
    <div>
        <TableSearch :query="query" :options="searchOpt" :search="handleSearch" />
        <div class="container">
            <TableCustom 
                :columns="columns" 
                :tableData="tableData" 
                :total="page.total"
                :viewFunc="handleView"
                :delFunc="handleDelete" 
                :editFunc="handleEdit"
                :currentPage="page.index"
                :changePage="changePage"
            >
                <template #toolbarBtn>
                    <el-button type="warning" :icon="CirclePlusFilled" @click="handleAdd">新增活动</el-button>
                </template>
                <template #status="{ row }">
                    <el-tag v-if="row && typeof row.status !== 'undefined'" :type="getStatusType(row.status)">
                        {{ getStatusText(row.status) }}
                    </el-tag>
                    <el-tag v-else type="info">未知</el-tag>
                </template>
                <template #date="{ row }">
                    <span>
                        {{ 
                            row && row.start_time ? 
                            `${formatDate(row.start_time)} 至 ${formatDate(row.end_time)}` : 
                            '未设置' 
                        }}
                    </span>
                </template>
                <template #operator="{ row }">
                    <div class="button-group">
                        <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
                        <el-button type="success" size="small" @click="handleEdit(row)">编辑</el-button>
                        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                        <el-button 
                            type="warning" 
                            size="small" 
                            @click="handleViewRating(row)"
                            :disabled="!row?.applications?.some((app: Application) => app?.rating)"
                        >查看评价</el-button>
                        <el-button 
                            type="info" 
                            size="small" 
                            @click="handleViewApplicants(row)"
                            :disabled="!row?.applications?.length"
                        >报名名单</el-button>
                    </div>
                </template>
            </TableCustom>
        </div>

        <!-- 编辑/新增弹窗 -->
        <el-dialog 
            :title="isEdit ? '编辑活动' : '新增活动'" 
            v-model="visible" 
            width="700px"
            destroy-on-close
            :close-on-click-modal="false"
            class="activity-dialog"
        >
            <el-form 
                ref="formRef"
                :model="formData"
                :rules="rules"
                label-width="100px"
                class="activity-form"
            >
                <el-form-item label="活动名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入活动名称"></el-input>
                </el-form-item>
                <el-form-item label="活动时间" prop="date">
                    <el-date-picker
                        v-model="formData.date"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item label="活动地点" prop="address">
                    <el-input v-model="formData.address" placeholder="请输入活动地点"></el-input>
                </el-form-item>
                <el-form-item label="活动图片" prop="image">
                    <el-input v-model="formData.image" placeholder="请输入图片URL"></el-input>
                </el-form-item>
                <el-form-item label="活动描述" prop="description">
                    <el-input
                        v-model="formData.description"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入活动描述"
                    />
                </el-form-item>
                <el-form-item label="最大人数" prop="maxCount">
                    <el-input-number 
                        v-model="formData.maxCount" 
                        :min="1" 
                        :precision="0"
                        :step="1"
                        controls-position="right"
                    />
                </el-form-item>
                <el-form-item label="活动状态" prop="status">
                    <el-select v-model="formData.status" placeholder="请选择活动状态">
                        <el-option label="未开始" :value="0" />
                        <el-option label="进行中" :value="1" />
                        <el-option label="已结束" :value="2" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="visible = false">取 消</el-button>
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 查看详情弹窗 -->
        <el-dialog 
            title="活动详情" 
            v-model="visible1" 
            width="900px"
            destroy-on-close
            class="activity-detail-dialog"
        >
            <div class="activity-detail" v-if="viewData.row">
                <div class="detail-image">
                    <el-image 
                        v-if="viewData.row"
                        :src="viewData.row.image" 
                        fit="cover"
                        :preview-src-list="viewData.row.image ? [viewData.row.image] : []"
                    >
                        <template #error>
                            <div class="image-placeholder">
                                <el-icon><Picture /></el-icon>
                            </div>
                        </template>
                    </el-image>
                </div>
                <div class="detail-content">
                    <h3>{{ viewData.row.name }}</h3>
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="活动日期">
                            {{ viewData.row.startTime && viewData.row.endTime ? 
                                `${viewData.row.startTime.split('T')[0]} 至 ${viewData.row.endTime.split('T')[0]}` : 
                                '未设置' 
                            }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动地点">
                            {{ viewData.row.address }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动状态">
                            <el-tag :type="getStatusType(viewData.row.status)">
                                {{ getStatusText(viewData.row.status) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="报名人数">
                            {{ viewData.row.applied_count }}/{{ viewData.row.max_participants }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动描述">
                            {{ viewData.row.description }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-dialog>

        <!-- 评价查看弹窗 -->
        <el-dialog 
            title="活动评价" 
            v-model="ratingVisible" 
            width="800px"
            destroy-on-close
        >
            <el-table :data="activityRatings" border>
                <el-table-column label="用户" prop="userName" width="120" />
                <el-table-column label="评分" width="200">
                    <template #default="{ row }">
                        <el-rate v-model="row.score" disabled />
                    </template>
                </el-table-column>
                <el-table-column label="评价意见" prop="comment" />
                <el-table-column label="评价时间" width="120">
                    <template #default="{ row }">
                        {{ row.rateTime ? new Date(row.rateTime).toLocaleDateString() : '无' }}
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>

        <!-- 报名名单弹窗 -->
        <el-dialog 
            title="报名名单" 
            v-model="applicantsVisible" 
            width="800px"
            destroy-on-close
        >
            <el-table :data="applicantsList" border>
                <el-table-column label="序号" type="index" width="80" align="center" />
                <el-table-column label="姓名" prop="name" width="120" />
                <el-table-column label="手机号" prop="phone" width="150" />
                <el-table-column label="报名时间" width="180">
                    <template #default="{ row }">
                        {{ new Date(row.applyTime).toLocaleString() }}
                    </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" />
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="activity-list">
import { ref, reactive, computed, onMounted, watch } from '@vue/runtime-core';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { CirclePlusFilled } from '@element-plus/icons-vue';
import TableCustom from '@/components/table-custom.vue';
import TableDetail from '@/components/table-detail.vue';
import TableSearch from '@/components/table-search.vue';
import { useActivityStore, type Activity, type Application, type ServerActivity } from '@/stores/activity';

const activityStore = useActivityStore();

// 查询关
const query = reactive({
    name: '',
    status: '',
    pageIndex: 1,
    pageSize: 10,
    total: 0
});

const searchOpt = ref<{
    type: string;
    label: string;
    prop: string;
    opts?: { label: string; value: string; }[];
}[]>([
    { 
        type: 'input', 
        label: '活动名称:', 
        prop: 'name',
        opts: []
    },
    { 
        type: 'select', 
        label: '活动状态:', 
        prop: 'status', 
        opts: [
            { label: '全部', value: '' },
            { label: '未开始', value: '0' },
            { label: '进行中', value: '1' },
            { label: '已结束', value: '2' }
        ]
    }
]);

const columns = ref([
    { type: 'index', label: '序号', width: 55, align: 'center' },
    { prop: 'name', label: '活动名称', width: '120' },
    { 
        prop: 'date', 
        label: '活动日期',
        slot: true
    },
    { prop: 'address', label: '活动地点' },
    { prop: 'status', label: '活动状态', slot: true },
    { prop: 'operator', label: '操作', width: 460, slot: true }
]);

const page = reactive({
    index: 1,
    size: 10,
    total: 0
});

// 状态处理方法
const getStatusType = (status: number) => {
    switch (status) {
        case 1:
            return 'success';
        case 0:
            return 'info';
        case 2:
            return 'danger';
        default:
            return 'info';
    }
};

const getStatusText = (status: number) => {
    switch (status) {
        case 1:
            return '进行中';
        case 0:
            return '未开始';
        case 2:
            return '已结束';
        default:
            return '未知';
    }
};

// 表格数据使用 computed 实时更新
const tableData = computed(() => {
    console.log('开始计算表格数据');
    const data = activityStore.filteredActivities;
    console.log('过滤后的活动数据:', data);
    
    if (!data || !Array.isArray(data)) {
        console.log('数据无效或不是数组，返回空数组');
        return [];
    }
    
    // 在这里进行过滤
    const filteredData = data.filter(item => {
        if (!item) return false;
        console.log('正在处理的活动项:', item);
        const nameMatch = !query.name || (item.name && item.name.includes(query.name));
        const statusMatch = !query.status || query.status === '' || 
            (typeof item.status !== 'undefined' && item.status === Number(query.status));
        return nameMatch && statusMatch;
    });
    
    console.log('过滤后的最终数据:', filteredData);
    return filteredData;
});

// 表单相关
const formRef = ref<FormInstance>();
const visible = ref(false);
const isEdit = ref(false);
const formData = ref({
    id: '',
    name: '',
    date: ['', ''] as [string, string], // 使用数组存储开始和结束时间
    address: '',
    status: 0,
    image: '',
    description: '',
    maxCount: 1,  // 改为数字类型
    appliedCount: 0
});

const rules = {
    name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
    date: [{ required: true, message: '请选择活动时间', trigger: 'change', type: 'array' }],
    address: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
    image: [{ required: true, message: '请输入图片URL', trigger: 'blur' }],
    description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
    maxCount: [{ required: true, message: '请输入最大参与人数', trigger: 'blur' }],
    status: [{ required: true, message: '请选择活动状态', trigger: 'change' }]
};

// 日期格式化
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 新增活动
const handleAdd = () => {
    isEdit.value = false;
    formData.value = {
        id: '',
        name: '',
        date: ['', ''] as [string, string],
        address: '',
        status: 0,
        image: '',
        description: '',
        maxCount: 1,  // 改为数字类型
        appliedCount: 0
    };
    visible.value = true;
};

// 编辑活动
const handleEdit = (row: ServerActivity) => {
    console.log('编辑活动数据:', row);
    if (!row || typeof row.id === 'undefined') {
        ElMessage.error('活动数据无效');
        return;
    }

    isEdit.value = true;
    formData.value = {
        id: row.id.toString(),
        name: row.name,
        date: [
            row.start_time ? formatDate(row.start_time) : '', 
            row.end_time ? formatDate(row.end_time) : ''
        ] as [string, string],
        address: row.address,
        status: row.status,
        image: row.image || '',
        description: row.description,
        maxCount: row.max_participants,
        appliedCount: row.applied_count || 0
    };
    console.log('表单数据:', formData.value);
    visible.value = true;
};

// 提交表单
const submitForm = async () => {
    if (!formRef.value) return;
    
    try {
        await formRef.value.validate();
      if (isEdit.value) {
        console.log("formData", formData);
            const updateData = {
              id: formData.value.id,
              name: formData.value.name,
              description: formData.value.description,
              address: formData.value.address,
              max_participants: Number(formData.value.maxCount) || 0,
              status: Number(formData.value.status) || 0,
              image: formData.value.image,
              startTime: formData.value.date[0],
              endTime: formData.value.date[1]
            };
            console.log('准备更新的数据:', updateData);
            await activityStore.updateActivity(updateData);
            ElMessage.success('修改成功');
            visible.value = false;
            await loadActivities();
        } else {
            const result = await activityStore.addActivity(requestData);
            console.log('创建活动返回结果:', result);
            if (result && result.id) {
                ElMessage.success('创建成功');
                visible.value = false;
                await loadActivities(); // 重新加载列表
            } else {
                throw new Error('创建活动失败：返回数据异常');
            }
        }
    } catch (error: any) {
        console.error('表单提交错误:', error);
        ElMessage.error(error.message || '操作失败');
    }
};

// 查看详情相关
const visible1 = ref(false);
const viewData = ref<{
    row: ServerActivity | null;
    list: Array<any>;
}>({
    row: null,
    list: [
        { prop: 'name', label: '活动名称', span: 2 },
        { 
            prop: 'date', 
            label: '活动日期', 
            span: 1,
            formatter: (row: any) => {
                if (row.startTime && row.endTime) {
                    return `${row.startTime.split('T')[0]} 至 ${row.endTime.split('T')[0]}`;
                }
                return '';
            }
        },
        { prop: 'address', label: '活动地点', span: 1 },
        { prop: 'status', label: '状态', span: 1 },
        { prop: 'appliedCount', label: '报名数', span: 1 },
        { 
            prop: 'maxCount', 
            label: '最大人数', 
            span: 2,
            formatter: (row: any) => row.max_participants || '0'
        },
        { prop: 'description', label: '活动描述', span: 4 }
    ]
});

const handleView = (row: ServerActivity) => {
    console.log('查看活动数据:', row);
    if (!row || typeof row.id === 'undefined') {
        ElMessage.error('活动数据无效');
        return;
    }
    
    try {
        viewData.value.row = { 
            ...row,
            startTime: row.start_time,
            endTime: row.end_time,
            max_participants: row.max_participants,
            applied_count: row.applied_count || 0
        };
        console.log('查看数据:', viewData.value.row);
        visible1.value = true;
    } catch (error) {
        console.error('处理查看数据时出错:', error);
        ElMessage.error('处理数据时出错');
    }
};

const handleDelete = async (row: Activity) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该活动吗？此操作不可恢复',
            '删除确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );
        
        await activityStore.deleteActivity(row.id);
        ElMessage.success('删除成功');
        await loadActivities(); // 重新加载列表以确保数据同步
    } catch (error: any) {
        if (error !== 'cancel') { // 用户取消删除不显示错误
            console.error('删除活动失败:', error);
            ElMessage.error(error.message || '删除失败');
        }
    }
};

const handleSearch = () => {
    console.log('搜索条件:', query);
};

const changePage = (index: number) => {
    query.pageIndex = index;
};

// 评价查看相关
const ratingVisible = ref(false);
const activityRatings = ref<{
    userName: string;
    score?: number;
    comment?: string;
    rateTime?: string;
}[]>([]);

const handleViewRating = (row: Activity) => {
    if (row?.applications?.length) {
        activityRatings.value = row.applications
            .filter((app: Application) => Boolean(app?.rating))
            .map((app: Application) => ({
                userName: app.name || '',
                ...app.rating
            })) || [];
        ratingVisible.value = true;
    }
};

// 报名名单相关
const applicantsVisible = ref(false);
const applicantsList = ref<Application[]>([]);

const handleViewApplicants = (row: Activity) => {
    if (row?.applications?.length) {
        applicantsList.value = [...row.applications];
        applicantsVisible.value = true;
    }
};

// 加载活动列表
const loading = ref(false);
const pageTotal = ref(0);

const loadActivities = async () => {
    try {
        loading.value = true;
        const response = await activityStore.loadActivities();
        if (response) {
            pageTotal.value = response.total;
            query.pageIndex = response.pageNum;
            query.pageSize = response.pageSize;
        }
    } catch (error) {
        console.error('加载活动列表失败:', error);
        ElMessage.error('加载活动列表失败');
    } finally {
        loading.value = false;
    }
};

// 监听查询条件变化
watch([() => query.name, () => query.status], () => {
    loadActivities();
}, { deep: true });

// 分页导航
const handlePageChange = (val: number) => {
    query.pageIndex = val;
    loadActivities();
};

// 在组件挂载时加载数据
onMounted(async () => {
    try {
        await loadActivities();
        console.log('活动数据加载完成');
    } catch (error) {
        console.error('加载活动列表失败:', error);
        ElMessage.error('加载活动列表失败');
    }
});
</script>

<style>
/* 全局样式 */
.activity-detail {
    padding: 20px;
}

.detail-image {
    width: 100%;
    height: 300px;
    margin-bottom: 20px;
    border-radius: 4px;
    overflow: hidden;
}

.detail-image .el-image {
    width: 100%;
    height: 100%;
}

.image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
    color: #909399;
    font-size: 30px;
}

.detail-content h3 {
    margin: 0 0 20px;
    color: #303133;
}

.detail-content .el-descriptions__label {
    width: 120px;
}

.dialog-footer {
    padding-top: 20px;
    text-align: right;
}

.el-descriptions__body .el-descriptions__table.is-bordered .el-descriptions__cell[colspan='1'] {
    width: auto;
    white-space: nowrap;
}

.el-descriptions__body .el-descriptions__table.is-bordered .el-descriptions__cell[colspan='1'] + .el-descriptions__cell[colspan='1'] {
    width: 100%;
    white-space: normal;
}

.button-group .el-button {
    margin-right: 4px;  /* 减小按钮间距 */
}
.button-group .el-button:last-child {
    margin-right: 0;
}
</style>