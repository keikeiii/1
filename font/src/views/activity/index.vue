<template>
    <div>
        <TableSearch :query="query" :options="searchOpt" :search="handleSearch" />
        <div class="container">
            <div class="activity-list">
                <el-row :gutter="20">
                    <el-col :span="8" v-for="activity in activities" :key="activity.id">
                        <el-card shadow="hover">
                            <div class="activity-card">
                                <div class="activity-image">
                                    <el-image 
                                        :src="activity.image" 
                                        fit="cover"
                                        :preview-src-list="[activity.image]"
                                    >
                                        <template #error>
                                            <div class="image-slot">
                                                <el-icon><Picture /></el-icon>
                                            </div>
                                        </template>
                                    </el-image>
                                </div>
                                <div class="activity-info">
                                    <h3 class="activity-title">{{ activity.name }}</h3>
                                    <p class="activity-time">
                                        <el-icon><Calendar /></el-icon>
                                        {{ formatDate(activity.start_time) }} 至 {{ formatDate(activity.end_time) }}
                                    </p>
                                    <p class="activity-location">
                                        <el-icon><Location /></el-icon>
                                        {{ activity.address }}
                                    </p>
                                    <p class="activity-participants">
                                        <el-icon><User /></el-icon>
                                        已报名: {{ activity.appliedCount || 0 }}/{{ activity.maxParticipants }}
                                    </p>
                                    <div class="activity-status">
                                        <el-tag :type="getStatusType(activity.status)">
                                            {{ getStatusText(activity.status) }}
                                        </el-tag>
                                    </div>
                                </div>
                                <div class="activity-actions">
                                    <el-button 
                                        type="primary" 
                                        @click="handleApply(activity)"
                                        :disabled="!canApply(activity)"
                                    >
                                        {{ getActionText(activity) }}
                                    </el-button>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </div>
        </div>

        <!-- 活动详情弹窗 -->
        <el-dialog 
            title="活动详情" 
            v-model="detailDialogVisible" 
            width="600px"
            destroy-on-close
        >
            <div class="activity-detail" v-if="detailData">
                <div class="detail-image">
                    <el-image 
                        :src="detailData.image" 
                        fit="cover"
                        :preview-src-list="detailData.image ? [detailData.image] : []"
                    >
                        <template #error>
                            <div class="image-placeholder">
                                <el-icon><Picture /></el-icon>
                            </div>
                        </template>
                    </el-image>
                </div>
                <div class="detail-content">
                    <h3>{{ detailData.name }}</h3>
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="活动日期">
                            {{ detailData.date }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动地点">
                            {{ detailData.address }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动状态">
                            <el-tag :type="getStatusType(detailData.status)">
                                {{ getStatusText(detailData.status) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="报名人数">
                            {{ detailData.appliedCount }}/{{ detailData.maxCount }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动描述">
                            {{ detailData.description }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-dialog>

        <!-- 报名弹窗 -->
        <el-dialog 
            title="活动报名" 
            v-model="applyVisible" 
            width="500px"
            destroy-on-close
        >
            <el-form 
                ref="applyFormRef"
                :model="applyForm"
                :rules="applyRules"
                label-width="80px"
            >
                <el-form-item label="姓名" prop="name">
                    <el-input v-model="applyForm.name" placeholder="请输入姓名"></el-input>
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                    <el-input v-model="applyForm.phone" placeholder="请输入手机号"></el-input>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input 
                        v-model="applyForm.remark" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入备注信息（选填）"
                    ></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="applyVisible = false">取 消</el-button>
                    <el-button type="primary" @click="submitApply">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 评价弹窗 -->
        <el-dialog 
            title="活动评价" 
            v-model="rateVisible" 
            width="500px"
            destroy-on-close
        >
            <el-form 
                ref="rateFormRef"
                :model="rateForm"
                :rules="rateRules"
                label-width="80px"
            >
                <el-form-item label="评分" prop="score">
                    <el-rate 
                        v-model="rateForm.score"
                        :texts="['很差', '较差', '一般', '较好', '很好']"
                        show-text
                    ></el-rate>
                </el-form-item>
                <el-form-item label="评价" prop="comment">
                    <el-input 
                        v-model="rateForm.comment"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入评价内容"
                    ></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="rateVisible = false">取 消</el-button>
                    <el-button type="primary" @click="submitRate">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { Picture, Calendar, Location, User } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import TableSearch from '@/components/table-search.vue';
import { useActivityStore, type Activity } from '@/stores/activity';

const activityStore = useActivityStore();

// 查询相关
const query = reactive({
    name: '',
    status: ''
});

const searchOpt = ref<{
    type: string;
    label: string;
    prop: string;
    opts?: { label: string; value: string | number; }[];
}[]>([
    { type: 'input', label: '活动名称:', prop: 'name' },
    { type: 'select', label: '活动状态:', prop: 'status', opts: [
        {label: '全部', value: ''},
        { label: '未开始', value: 0 },
        { label: '进行中', value: 1 },
        { label: '已结束', value: 2 }
    ]}
]);

// 分页相关
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

const handleSearch = async () => {
    try {
        const params = {
            name: query.name,
            status: query.status !== '' ? Number(query.status) : undefined,
            pageNum: page.index,
            pageSize: page.size
        };
        
        const result = await activityStore.loadActivities(params);
        if (result) {
            page.total = result.total;
        }
    } catch (error) {
        console.error('搜索失败:', error);
        ElMessage.error('搜索失败');
    }
};

// 监听查询条件变化
watch([() => query.name, () => query.status], () => {
    handleSearch();
}, { deep: true });

// 表格数据
const activities = computed(() => {
    return activityStore.filteredActivities;
});

// 详情弹窗相关
const detailDialogVisible = ref(false);
const detailData = ref<Activity | null>(null);

// 显示详情方法
const showDetail = (row: Activity) => {
    detailData.value = row;
    detailDialogVisible.value = true;
};

// 报名相关
const applyVisible = ref(false);
const applyFormRef = ref<FormInstance>();
const currentActivity = ref<Activity | null>(null);
const applyForm = ref({
    name: '',
    phone: '',
    remark: ''
});

const applyRules = {
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ]
};

const handleApply = (activity: Activity) => {
    currentActivity.value = activity;
    applyVisible.value = true;
};

const submitApply = async () => {
    if (!applyFormRef.value || !currentActivity.value) return;
    
    try {
        await applyFormRef.value.validate();
        
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            ElMessage.error('请先登录');
            return;
        }

        const applyData = {
            activityId: currentActivity.value.id.toString(),
            userId,
            name: applyForm.value.name,
            phone: applyForm.value.phone,
            remark: applyForm.value.remark
        };

        await activityStore.addActivityApply(applyData);
        ElMessage.success('报名成功');
        applyVisible.value = false;
        
        // 重新加载活动列表
        await activityStore.loadActivities();
    } catch (error: any) {
        console.error('报名失败:', error);
        ElMessage.error(error.message || '报名失败，请检查表单');
    }
};

// 评价相关
const rateVisible = ref(false);
const rateFormRef = ref<FormInstance>();

const rateForm = ref({
    score: 0,
    comment: ''
});

const rateRules = {
    score: [
        { required: true, message: '请选择评分', trigger: 'change' }
    ],
    comment: [
        { required: true, message: '请输入评价内容', trigger: 'blur' }
    ]
};

const handleRate = (activity: Activity) => {
    currentActivity.value = activity;
    rateVisible.value = true;
};

const submitRate = async () => {
    if (!rateFormRef.value || !currentActivity.value) return;
    
    try {
        await rateFormRef.value.validate();
        
        activityStore.addActivityRating(currentActivity.value.id, {
            score: rateForm.value.score,
            comment: rateForm.value.comment
        });
        
        ElMessage.success('评价成功');
        rateVisible.value = false;
    } catch (error) {
        console.error('评价失败:', error);
        ElMessage.error('评价失败，请检查表单');
    }
};

// 按钮状态控制
const canApply = (activity: Activity) => {
    if (activity.status !== 1) return false;
    if (!activity.maxParticipants) return false;
    if ((activity.appliedCount || 0) >= activity.maxParticipants) return false;
    
    const userId = localStorage.getItem('user_id');
    if (!userId) return false;
    
    return !activity.applications?.some(app => app.userId === userId);
};

const canRate = (activity: Activity) => {
    if (activity.status !== 2) return false;
    
    const userId = localStorage.getItem('user_id');
    if (!userId) return false;
    
    const userApplication = activity.applications?.find(app => app.userId === userId);
    return Boolean(userApplication && !userApplication.rating);
};

const getActionText = (activity: Activity) => {
    if (activity.status === 2) return '已结束';
    if (activity.status === 0) return '未开始';
    if ((activity.appliedCount || 0) >= activity.maxParticipants) return '已满';
    
    const userId = localStorage.getItem('user_id');
    if (!userId) return '请登录';
    
    return activity.applications?.some(app => app.userId === userId) ? '已报名' : '立即报名';
};

// 日期格式化
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
    activityStore.loadActivities();
});

</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

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

:deep(.el-descriptions__label) {
    width: 120px;
}

.dialog-footer {
    padding-top: 20px;
    text-align: right;
}
.detail-content :deep(.el-descriptions__label) {
    width: 120px;
}

.container {
    padding: 20px;
}

.activity-list {
    margin-top: 20px;
}

.activity-card {
    position: relative;
    padding: 10px;
}

.activity-image {
    width: 100%;
    height: 200px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 15px;
}

.activity-image .el-image {
    width: 100%;
    height: 100%;
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

.activity-info {
    padding: 0 10px;
}

.activity-title {
    margin: 0 0 15px;
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.activity-time,
.activity-location,
.activity-participants {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: #606266;
    font-size: 14px;
}

.el-icon {
    margin-right: 5px;
    font-size: 16px;
}

.activity-status {
    margin: 15px 0;
}

.activity-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding: 0 10px;
}

:deep(.el-card) {
    margin-bottom: 20px;
}

:deep(.el-form-item__label) {
    font-weight: bold;
}

:deep(.el-rate) {
    margin-top: 8px;
}
</style> 
<style lang="scss">
.el-descriptions__body .el-descriptions__table.is-bordered .el-descriptions__cell[colspan='1'] {
    width: auto;
    white-space: nowrap;
    & + .el-descriptions__cell[colspan='1'] {
        width: 100%;
        white-space: normal;
    }
}
</style>
