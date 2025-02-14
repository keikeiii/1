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
                    <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'info'">
                        {{ row.status === 1 ? '已通过' : row.status === 0 ? '待审核' : '已拒绝' }}
                    </el-tag>
                </template>
                <template #type="{ row }">
                    {{ row?.type && row?.detail ? getServiceTypeLabel(row.type, row.detail) : '' }}
                </template>
                <template #rating="{ row }">
                    <el-button
                        v-if="row.status === 1"
                        type="primary"
                        size="small"
                        @click="handleRate(row)"
                    >
                        {{ ratingButtonText(row) }}
                    </el-button>
                    <el-button v-else type="warning" size="small">
                        无法评价
                    </el-button>
                </template>

            </TableCustom>

        </div>
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
                        {{ ratingForm.rating?.rateTime || '无' }}
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

<script setup lang="ts" name="my-apply">
import { ref, reactive, computed, onMounted } from 'vue';
import TableCustom from '@/components/table-custom.vue';
import type TableSearch from '@/components/table-search.vue';
import { useServiceStore } from '@/stores/service';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElDialog } from 'element-plus';
import type { FormInstance } from 'element-plus';

const serviceStore = useServiceStore();
const userStore = useUserStore();
const currentUser = userStore.userId;

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

const getServiceTypeLabel = (type: string, detail: string) => {
    if (!type || !detail) return '';  // 添加更严格的空值检查
    const serviceType = serviceTypes.find(item => item.value === type);
    if (!serviceType) return type;
    const detailType = serviceType.details.find(item => item.value === detail);
    if (!detailType) return serviceType.label;
    return `${serviceType.label} - ${detailType.label}`;
};

// 查询条件
const query = ref({
    type: '',
    status: ''
});

const searchOpt = ref([
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
    { prop: 'userName', label: '申请人' },
    { prop: 'type', label: '服务类型', slot: true },
    { prop: 'createTime', label: '申请时间' },
    { prop: 'status', label: '申请状态', slot: true },
    { prop: 'rating', label: '评价', slot: true }
]);

// 分页
const page = ref({
    index: 1,
    size: 10,
    total: 0
});

const formateTime = (time: string) => {
  if(!time) return '';
  const date = new Date(time);
  return date.toLocaleString();
}



// 计算表格数据
const tableData = computed(() => {
    const filteredData = serviceStore.applications.filter(item => {
        const userMatch = item.userId === userStore.userId;
        const typeMatch = !query.value.type || item.type.includes(query.value.type);
        console.log("item.type.includes(query.value.type);", item.type, query.value.type)
        const statusMatch = query.value.status === '' || item.status === Number(query.value.status);
        
        return userMatch && typeMatch && statusMatch;
    }).map(item => {
      return {
        ...item,
        createTime: formateTime(item.createTime)
      }
    })
    // console.log("tableDatatableDatatableDatatableData", tableData.value)
    page.value.total = filteredData.length;
    const start = (page.value.index - 1) * page.value.size;
    const end = start + page.value.size;
    return filteredData.slice(start, end);
});
console.log("tableData", tableData.value)
const handleSearch = async () => {
    page.value.index = 1;
    await initData();
};

const changePage = (index: number) => {
    page.value.index = index;
};

const viewVisible = ref(false);
const viewData = ref({
    row: {},
    list: [
        { prop: 'userName', label: '申请人', span: 1 },
        { prop: 'building', label: '楼号', span: 1 },
        { prop: 'room', label: '房间号', span: 1 },
        { prop: 'phone', label: '联系电话', span: 1 },
        { prop: 'type', label: '服务类型', span: 1 },
        { prop: 'remark', label: '备注说明', span: 2 },
        { prop: 'createTime', label: '申请时间', span: 1 },
        { prop: 'status', label: '状态', span: 1 }
    ]
});

const handleView = (row: any) => {
    viewData.value.row = { ...row };
    viewVisible.value = true;
};

const getData = async () => {
    await initData();
    return serviceStore.applications;
};


const initData = async () => {
    try {
        await serviceStore.loadUserApplications(userStore.userId);
        // 获取所有已通过申请的评价信息
        const passedApplications = serviceStore.applications.filter(app => app.status === 1);
        for (const app of passedApplications) {
            try {
                await serviceStore.getRating(app.id);
            } catch (error) {
                console.error(`获取申请 ${app.id} 的评价失败:`, error);
            }
        }
    } catch (error: any) {
        ElMessage.error(error.message || '加载申请列表失败');
    }
};

onMounted(() => {
    initData();
});

const ratingVisible = ref(false);
const ratingFormRef = ref<FormInstance>();
const currentApplication = ref<any>(null);

const ratingForm = reactive({
    score: 0,
    comment: '',
    rating: null as any
});

const ratingRules = {
    score: [
        { required: true, message: '请对服务进行评分', trigger: 'change' }
    ]
};

const dialogTitle = computed(() => 
    ratingForm.rating ? '评价详情' : '服务评价'
);

const handleRate = (row: any) => {
    currentApplication.value = row;
    if (row.rating) {
        // 如果已有评价，显示评价详情
        ratingForm.score = row.rating.score;
        ratingForm.comment = row.rating.comment;
        ratingForm.rating = row.rating;
    } else {
        // 如果没有评价，重置表单以添加评价
        ratingForm.score = 0;
        ratingForm.comment = '';
        ratingForm.rating = null;
    }
    ratingVisible.value = true;
};

const submitRating = async () => {
    if (!ratingFormRef.value) return;
    
    await ratingFormRef.value.validate((valid: boolean) => {
        if (valid && currentApplication.value) {
            serviceStore.addRating(currentApplication.value.id, {
                score: ratingForm.score,
                comment: ratingForm.comment
            });
            ElMessage.success('评价提交成功');
            ratingVisible.value = false;
        }
    });
};

// 添加评价按钮的文本计算属性
const ratingButtonText = computed(() => (row: any) => {
    return row.rating ? '查看评价' : '评价';
});
</script> 

