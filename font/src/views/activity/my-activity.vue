<template>
    <div>
        <TableSearch :query="query" :options="searchOpt" :search="handleSearch" />
        <div class="container">
            <TableCustom
                :columns="columns"
                :tableData="tableData"
                :total="page.total"
                :refresh="getData"
                :currentPage="page.index"
                :changePage="changePage"
                :viewFunc="handleView"
                :editFunc="null"
                :delFunc="null"
            >
                <template #status="{ row }">
                    <el-tag v-if="row && typeof row.status !== 'undefined'" :type="getStatusType(row.status)">
                        {{ getStatusText(row.status) }}
                    </el-tag>
                    <el-tag v-else type="info">未知</el-tag>
                </template>
                <template #operator="{ row }">
                    <el-button 
                        type="primary" 
                        size="small" 
                        @click="handleView(row)"
                    >
                        查看
                    </el-button>
                    <el-button 
                        type="success" 
                        size="small" 
                        @click="handleRate(row)"
                        :disabled="!canRate(row)"
                    >
                        {{ row.rating ? '查看评价' : '评价' }}
                    </el-button>
                </template>
            </TableCustom>
        </div>

        <!-- 活动详情弹窗 -->
        <el-dialog 
            title="活动详情" 
            v-model="viewVisible" 
            width="900px"
            destroy-on-close
        >
            <div class="activity-detail" v-if="currentActivity">
                <div class="detail-image">
                    <el-image 
                        :src="currentActivity.image" 
                        fit="cover"
                        :preview-src-list="currentActivity.image ? [currentActivity.image] : []"
                    >
                        <template #error>
                            <div class="image-placeholder">
                                <el-icon><Picture /></el-icon>
                            </div>
                        </template>
                    </el-image>
                </div>
                <div class="detail-content">
                    <h3>{{ currentActivity.name }}</h3>
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="活动日期">
                            {{ formatDate(currentActivity.start_time) }} 至 {{ formatDate(currentActivity.end_time) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动地点">
                            {{ currentActivity.address }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动状态">
                            <el-tag :type="getStatusType(currentActivity.status)">
                                {{ getStatusText(currentActivity.status) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="报名人数">
                            {{ currentActivity.applied_count }}/{{ currentActivity.max_participants }}
                        </el-descriptions-item>
                        <el-descriptions-item label="活动描述">
                            {{ currentActivity.description }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-dialog>

        <!-- 评价弹窗 -->
        <el-dialog 
            :title="dialogTitle"
            v-model="ratingVisible"
            width="500px"
            destroy-on-close
        >
            <template v-if="!ratingForm.rating">
                <el-form
                    ref="ratingFormRef"
                    :model="ratingForm"
                    :rules="ratingRules"
                    label-width="80px"
                >
                    <el-form-item label="评分" prop="score">
                        <el-rate v-model="ratingForm.score" />
                    </el-form-item>
                    <el-form-item label="意见">
                        <el-input
                            v-model="ratingForm.comment"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入您的意见或建议"
                        />
                    </el-form-item>
                </el-form>
            </template>
            <template v-else>
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="评分">
                        <el-rate v-model="ratingForm.score" disabled />
                    </el-descriptions-item>
                    <el-descriptions-item label="评价意见">
                        {{ ratingForm.comment || '无' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="评价时间">
                        {{ ratingForm.rating?.rateTime ? new Date(ratingForm.rating.rateTime).toLocaleDateString() : '无' }}
                    </el-descriptions-item>
                </el-descriptions>
            </template>
            <template v-if="!ratingForm.rating" #footer>
                <span class="dialog-footer">
                    <el-button @click="ratingVisible = false">取 消</el-button>
                    <el-button type="primary" @click="submitRating">提 交</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import TableCustom from '@/components/table-custom.vue';
import TableSearch from '@/components/table-search.vue';
import { ElMessage } from 'element-plus';
import { useActivityStore, type Activity, type Application } from '@/stores/activity';
import { FormInstance } from 'element-plus';
const activityStore = useActivityStore();

const query = reactive({
    name: '',
    status: ''
});

const searchOpt = ref([
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
    { prop: 'name', label: '活动名称' },
    { prop: 'date', label: '活动日期' },
    { prop: 'address', label: '活动地点' },
    { prop: 'status', label: '活动状态', slot: true },
    { prop: 'operator', label: '操作', width: 200, slot: true }
]);

const page = reactive({
    index: 1,
    size: 10,
    total: 0
});

const currentUser = localStorage.getItem('user_id') || '';

const activities = ref<Activity[]>([]);

// 获取用户的活动记录
const getUserActivities = (userId: string) => {
    return activities.value.filter((item: Activity) => 
        item.applications?.some((app: Application) => app.userId === userId)
    );
};

// 过滤活动列表
const filteredActivities = computed(() => {
    return activities.value.filter((item: Activity) => {
        const nameMatch = !query.name || item.name.includes(query.name);
        const statusMatch = query.status === '' || item.status === Number(query.status);
        return nameMatch && statusMatch;
    });
});

const getStatusType = (status: number) => {
    switch (status) {
        case 1: return 'success';
        case 0: return 'info';
        case 2: return 'warning';
        default: return 'info';
    }
};

const getStatusText = (status: number) => {
    switch (status) {
        case 1: return '进行中';
        case 0: return '未开始';
        case 2: return '已结束';
        default: return '未知';
    }
};

// 查看详情相关
const viewVisible = ref(false);
const currentActivity = ref<any>(null);

const handleView = async (row: Activity) => {
  try {
    const detail = await activityStore.getActivityDetail(row.id);
    currentActivity.value = detail;
    viewVisible.value = true;
  } catch (error) {
    console.error('获取活动详情失败:', error);
    ElMessage.error('获取活动详情失败');
  }
};

// 评价相关
const ratingVisible = ref(false);
const ratingFormRef = ref<FormInstance>();

const ratingForm = reactive({
    score: 0,
    comment: '',
    rating: null as any
});

const ratingRules = {
    score: [
        { required: true, message: '请对活动进行评分', trigger: 'change' }
    ]
};

const dialogTitle = computed(() => 
    ratingForm.rating ? '评价详情' : '活动评价'
);

const handleRate = (row: any) => {
    currentActivity.value = row;
    if (row.rating) {
        ratingForm.score = row.rating.score;
        ratingForm.comment = row.rating.comment;
        ratingForm.rating = row.rating;
    } else {
        ratingForm.score = 0;
        ratingForm.comment = '';
        ratingForm.rating = null;
    }
    ratingVisible.value = true;
};

const submitRating = async () => {
    if (!ratingFormRef.value || !currentActivity.value) return;
    
    try {
        await ratingFormRef.value.validate();
        await activityStore.addActivityRating(currentActivity.value.id, {
            score: ratingForm.score,
            comment: ratingForm.comment
        });
        
        ElMessage.success('评价提交成功');
        ratingVisible.value = false;
        await getData(); // 重新加载数据
    } catch (error) {
        console.error('评价提交失败:', error);
        ElMessage.error('评价提交失败');
    }
};

const handleSearch = async () => {
    await getData();
};

const changePage = async (index: number) => {
    page.index = index;
    await getData();
};

// 表格数据
const tableData = ref<Activity[]>([]);

const getData = async () => {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            ElMessage.error('请先登录');
            return;
        }

        const params = {
            userId,
            name: query.name,
            status: query.status !== '' ? Number(query.status) : undefined,
            pageNum: page.index,
            pageSize: page.size
        };

        const result = await activityStore.getUserActivities(params);
        if (result) {
            page.total = result.total;
            tableData.value = result.list;
            tableData.value.forEach((item: Activity) => {
                item.date = `${formatDate(item.start_time)} 至 ${formatDate(item.end_time)}`;
            });
        }
    } catch (error) {
        console.error('获取活动列表失败:', error);
        ElMessage.error('获取活动列表失败');
    }
};
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  console.log("dateStr", dateStr);
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
// 判断是否可以评价
const canRate = (activity: Activity) => {
    console.log("activity", activity);
    // 如果已经评价过，允许查看评价
    if (activity.rating) {
        return true;
    }
    // 如果活动进行中或已结束，允许评价
    return activity.status === 1 || activity.status === 2;
};

// 监听查询条件变化
watch([() => query.name, () => query.status], () => {
    page.index = 1; // 重置页码
    getData();
}, { deep: true, immediate: false });

onMounted(() => {
    getData();
});
</script>

<style scoped>
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
}

.dialog-footer {
    text-align: right;
    margin-top: 20px;
}
</style> 