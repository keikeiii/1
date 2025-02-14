<template>
    <div class="apply-list">
        <el-card>
            <!-- 搜索表单 -->
            <el-form :inline="true" :model="query">
                <el-form-item label="申请人">
                    <el-input v-model="query.name" placeholder="请输入申请人姓名" />
                </el-form-item>
                <el-form-item label="服务类型">
                    <el-select v-model="query.type" placeholder="请选择服务类型" style="width: 200px">
                        <el-option label="全部" value="" />
                        <el-option v-for="serviceType in serviceTypes" :key="serviceType.value" :label="serviceType.label" :value="serviceType.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态">

                    <el-select v-model="query.status" placeholder="请选择状态" style="width: 200px">
                        <el-option label="全部" value="" />
                        <el-option label="待审核" :value="0" />
                        <el-option label="已通过" :value="1" />
                        <el-option label="已拒绝" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                </el-form-item>
            </el-form>


            <!-- 数据表格 -->
            <el-table :data="tableData" style="width: 100%">
                <el-table-column type="index" label="序号" width="55" align="center" />
                <el-table-column prop="userName" label="申请人" />
                <el-table-column prop="phone" label="联系电话" />
                <el-table-column label="服务类型">
                    <template #default="{ row }">
                        {{ row.type }}{{ row.detail ? ` - ${SERVICE_PLACE[row.detail] || row.detail}` : '' }}
                    </template>
                </el-table-column>
                <el-table-column label="申请时间">
                    <template #default="{ row }">
                        {{ formatTime(row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="状态">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="300">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
                        <el-button v-if="row.status === 0" type="success" size="small" @click="handleAudit(row)">审核</el-button>
                        <el-button 
                            type="warning" 
                            size="small" 
                            @click="handleViewRating(row)"
                        >
                            查看评价
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 查看弹窗 -->
        <el-dialog 
            title="申请详情" 
            v-model="viewVisible" 
            width="600px"
        >
            <el-descriptions :column="2" border>
                <el-descriptions-item label="申请人">{{ viewData.row.userName }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ viewData.row.phone }}</el-descriptions-item>
                <template v-if="viewData.row.type !== '资源申请'">

                    <el-descriptions-item label="楼号">{{ viewData.row.building }}</el-descriptions-item>
                    <el-descriptions-item label="房间号">{{ viewData.row.room }}</el-descriptions-item>
                </template>
                <el-descriptions-item label="服务类型">{{ viewData.row.type }}</el-descriptions-item>
                <template v-if="viewData.row.type === '维修服务'">
                    <el-descriptions-item label="维修类型">{{ viewData.row.detail }}</el-descriptions-item>
                </template>
                <el-descriptions-item label="申请时间">{{ formatTime(viewData.row.createTime) }}</el-descriptions-item>
                <template v-if="viewData.row.type === '资源申请'">
                    <el-descriptions-item label="资源类型">{{ viewData.row.detail }}</el-descriptions-item>

                    <el-descriptions-item label="选择资源">{{ getResourceName }}</el-descriptions-item>
                    <el-descriptions-item label="使用时间" :span="2">
                        {{ formatTimeRange(viewData.row.useTime) }}
                    </el-descriptions-item>
                </template>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(viewData.row.status)">
                        {{ getStatusText(viewData.row.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="备注说明" :span="2">{{ viewData.row.description || '无' }}</el-descriptions-item>
            </el-descriptions>
        </el-dialog>


        <!-- 审核弹窗 -->
        <el-dialog 
            title="申请审核" 
            v-model="auditVisible" 
            width="600px"
        >
            <el-descriptions :column="2" border>
                <el-descriptions-item label="申请人">{{ viewData.row.userName }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ viewData.row.phone }}</el-descriptions-item>
                <template v-if="viewData.row.type !== '资源申请'">
                    <el-descriptions-item label="楼号">{{ viewData.row.building }}</el-descriptions-item>
                    <el-descriptions-item label="房间号">{{ viewData.row.room }}</el-descriptions-item>
                </template>
                <el-descriptions-item label="服务类型">{{ viewData.row.type }}</el-descriptions-item>
                <template v-if="viewData.row.type === '维修服务'">
                    <el-descriptions-item label="维修类型">{{ viewData.row.detail }}</el-descriptions-item>
                </template>
                <el-descriptions-item label="申请时间">{{ formatTime(viewData.row.createTime) }}</el-descriptions-item>
                <template v-if="viewData.row.type === '资源申请'">
                    <el-descriptions-item label="资源类型">{{ SERVICE_PLACE[viewData.row.detail] || viewData.row.detail }}</el-descriptions-item>
                    <el-descriptions-item label="选择资源">{{ getResourceName }}</el-descriptions-item>
                    <el-descriptions-item label="使用时间" :span="2">
                        {{ formatTimeRange(viewData.row.useTime) }}
                    </el-descriptions-item>
                </template>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(viewData.row.status)">
                        {{ getStatusText(viewData.row.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="备注说明" :span="2">{{ viewData.row.remark || '无' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="success" @click="handleAuditSubmit(1)">通过</el-button>
                    <el-button type="danger" @click="handleAuditSubmit(2)">拒绝</el-button>
                    <el-button @click="auditVisible = false">取消</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            title="服务评价"
            v-model="ratingVisible"
            width="500px"
        >
            <el-descriptions :column="1" border v-if="currentRating">
                <el-descriptions-item label="评分">
                    <el-rate v-model="currentRating.score" disabled />
                </el-descriptions-item>
                <el-descriptions-item label="评价意见">
                    {{ currentRating.comment }}
                </el-descriptions-item>
                <el-descriptions-item label="评价时间">
                    {{ formatTime(currentRating.create_time) }}
                </el-descriptions-item>
            </el-descriptions>
            <div v-else class="text-center">暂无评价</div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import TableCustom from '@/components/table-custom.vue';
import TableSearch from '@/components/table-search.vue';
import { useServiceStore } from '@/stores/service';
import { useResourceStore } from '@/stores/resource';

const serviceStore = useServiceStore();
const resourceStore = useResourceStore();
const SERVICE_PLACE = {
  'court': '篮球场',
  'activity-room': '活动室',
}
// 服务类型选项
const serviceTypes = [
    { label: '清洁', value: '清洁', details: [
        { label: '日常保洁', value: '日常保洁' },
        { label: '深度清洁', value: '深度清洁' },
        { label: '消毒服务', value: '消毒服务' }
    ]},
    { label: '维修', value: '维修', details: [
        { label: '水电维修', value: '水电维修' },
        { label: '家具维修', value: '家具维修' },
        { label: '设备维修', value: '设备维修' }
    ]},
    { label: '资源申请', value: '资源申请', details: [
        { label: '会议室', value: '会议室' },
        { label: '活动场地', value: '活动场地' },
        { label: '设备借用', value: '设备借用' }
    ]}
];



// 获取服务类型完整描述
const getServiceTypeLabel = (type: string | undefined, detail: string | undefined) => {
    if (!type) return '';
    const serviceType = serviceTypes.find(item => item.value === type);
    if (!serviceType) return type;
    const detailType = serviceType.details.find(item => item.value === detail);
    if (!detailType) return serviceType.label;
    return `${serviceType.label} - ${detailType.label}`;
};

const query = reactive({
    name: '',
    type: '',
    status: ''
});


const newQuery = ref('');
const searchOpt = ref([
    { 
        type: 'input', 
        label: '申请人:', 
        prop: 'name',
        opts: []
    },
    { 
        type: 'select', 
        label: '服务类型:', 
        prop: 'type', 
        opts: [
            { label: '全部', value: '' },
            ...serviceTypes
        ]
    },
    { 
        type: 'select', 
        label: '申请状态:', 
        prop: 'status', 
        opts: [
            { label: '全部', value: '' },
            { label: '待审核', value: 0 },
            { label: '已通过', value: 1 },
            { label: '已拒绝', value: 2 }
        ]
    }
]);

const columns = ref([
    { type: 'index', label: '序号', width: 55, align: 'center' },
    { prop: 'name', label: '申请人' },
    { prop: 'phone', label: '联系电话' },
    { prop: 'type', label: '服务类型', slot: true },
    { prop: 'applyTime', label: '申请时间' },
    { prop: 'status', label: '申请状态', slot: true },
    { prop: 'operator', label: '操作', width: 250, slot: true }
]);

const page = reactive({
    index: 1,
    size: 10,
    total: 0
});

const changePage = (index: number) => {
    page.index = index;
    getData();
};

const tableData = computed(() => {
    const filteredData = serviceStore.applications.filter(item => {
        console.log("原始时间格式:", item.createTime);
        const nameMatch = !query.name || item.userName.includes(query.name);
        const typeMatch = !query.type || item.type.includes(query.type);
        const statusMatch = query.status === '' || item.status === Number(query.status);
        return nameMatch && typeMatch && statusMatch;
    });
    return filteredData;
});

const handleSearch = () => {
    console.log('搜索条件:', query);
    getData();
};

const getData = async () => {
    try {
        const data = await serviceStore.loadApplications();
        console.log('Raw data:', data); // 添加日志查看原始数据
        return data;
    } catch (error) {
        console.error('获取数据失败:', error);
        ElMessage.error('获取数据失败');
        return [];
    }
};

// 定义接口
interface ViewData {
    row: {
        name?: string;
        phone?: string;
        building?: string;
        room?: string;
        type?: string;
        detail?: string;
        resourceId?: string;
        resourceName?: string;
        useTime?: string[];
        applyTime?: string;
        status?: number;
        description?: string;
        rating?: any;
    }
}

// 初始化响应式变量
const viewVisible = ref(false);
const auditVisible = ref(false);
const ratingVisible = ref(false);
const viewData = ref<ViewData>({
    row: {}
});
const currentRow = ref<any>(null);
const currentRating = ref(null);

const formatTime = (time: string) => {
    console.log('Input time:', time);
    if (!time) return "";
    // 直接替换字符串，将 'T' 替换为空格，移除 '.000Z'
    return time.replace('T', ' ').replace('.000Z', '');
};

// 其他函数定义...
const formatTimeRange = (useTime: string[] | undefined) => {
    console.log("useTime", useTime)
    if (!useTime || useTime.length < 2) return '无';
    const startTime = new Date(useTime[0]).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    const endTime = new Date(useTime[1]).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    return `${startTime} 至 ${endTime}`;
};

const getStatusType = (status: number | undefined) => {
    if (status === undefined) return 'info';
    return status === 1 ? 'success' : status === 0 ? 'warning' : 'info';
};

const getStatusText = (status: number | undefined) => {
    if (status === undefined) return '未知';
    return status === 1 ? '已通过' : status === 0 ? '待审核' : '已拒绝';
};

// 处理函数
const handleView = (row: any) => {
    viewData.value.row = { ...row };
    viewVisible.value = true;
};

const handleAudit = (row: any) => {
    currentRow.value = row;
    viewData.value.row = { ...row };
    auditVisible.value = true;
};

const handleAuditSubmit = async (status: number) => {
    if (currentRow.value) {
        try {
            await serviceStore.updateApplicationStatus(currentRow.value.id, status);
            ElMessage.success(status === 1 ? '审核通过' : '已拒绝');
            auditVisible.value = false;
            // 重新加载数据
            await initData();
        } catch (error: any) {
            ElMessage.error(error.message || '审核失败');
        }
    }
};

const handleViewRating = async (row) => {
    try {
        const rating = await serviceStore.getRating(row.id);
        currentRating.value = rating;
        ratingVisible.value = true;
    } catch (error) {
        ElMessage.error('获取评价失败');
    }
};

// 添加获取资源名称的计算属性
const getResourceName = computed(() => {
    console.log("viewData.value.row.resourceId", viewData.value.row.resourceId)
    if (!viewData.value.row.resourceId) return '';
    const resource = resourceStore.resources.find(r => r.id === viewData.value.row.resourceId);
    console.log(":resource", resource)
    console.log("resourceStore.resources", resourceStore.resources)
    return resource ? resource.name : '';
});

const initData = async () => {
    try {
      await serviceStore.loadApplications();
      await resourceStore.loadResources();
    } catch (error: any) {
        ElMessage.error(error.message || '加载申请列表失败');
    }

};

onMounted(() => {
    initData();
});
</script>

<style scoped>
.dialog-footer {
    text-align: right;
    margin-top: 20px;
}
</style> 