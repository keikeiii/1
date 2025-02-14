<template>
    <div class="resource-manage">
        <el-card class="resource-card">
            <template #header>
                <div class="card-header">
                    <h3>资源管理</h3>
                    <el-button type="primary" @click="handleAdd">添加资源</el-button>
                </div>
            </template>

            <el-tabs v-model="activeTab">
                <el-tab-pane label="资源列表" name="list">
                    <el-table :data="resourceStore.resources" style="width: 100%">
                        <el-table-column prop="name" label="名称" />
                        <!-- <el-table-column prop="type" label="类型" /> -->
                        <el-table-column label="类型" width="180">
                          <template #default="scope">
                              <span >{{ placeType[scope.row.type as keyof typeof placeType] }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column prop="location" label="位置" />
                        <el-table-column prop="capacity" label="数量" />
                        <el-table-column label="操作" width="200" align="center">

                            <template #default="{ row }">
                                <el-button 
                                    type="primary" 
                                    link 
                                    @click="showSchedule(row)"
                                >
                                    查看日程
                                </el-button>
                                <el-button 
                                    type="danger" 
                                    link 
                                    @click="handleDelete(row)"
                                >
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>

                <el-tab-pane label="使用日程" name="schedule">
                    <div class="schedule-header">
                        <el-select v-model="selectedResource" placeholder="选择资源" style="width: 200px">
                            <el-option 
                                v-for="resource in resourceStore.resources"
                                :key="resource.id"
                                :label="resource.name"
                                :value="resource.id"
                            />
                        </el-select>
                    </div>
                    
                    <div v-if="selectedResource" class="schedule-calendar">
                        <el-calendar>
                            <template #date-cell="{ data }">
                                <div 
                                    class="calendar-cell"
                                    :class="{ 'has-booking': checkBooking(data.day) }"
                                    @click="handleDateClick(data.day)"
                                >
                                    {{ data.day.split('-').slice(2).join('') }}
                                </div>
                            </template>
                        </el-calendar>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 添加资源弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            title="添加资源"
            width="500px"
        >
            <el-form 
                ref="formRef"
                :model="form"
                :rules="rules"
                label-width="100px"
            >
                <el-form-item label="名称" prop="name">
                    <el-input v-model="form.name" />
                </el-form-item>
                
                <el-form-item label="类型" prop="type">
                    <el-select v-model="form.type">
                        <el-option label="球场" value="court" />
                        <el-option label="活动室" value="activity-room" />
                    </el-select>
                </el-form-item>

                <el-form-item label="位置" prop="location">
                    <el-input v-model="form.location" />
                </el-form-item>

                <el-form-item label="数量" prop="capacity">
                    <el-input-number 
                        v-model="form.capacity" 
                        :min="1" 
                        placeholder="请输入资源数量"
                    />
                </el-form-item>

                <el-form-item label="描述" prop="description">
                    <el-input 
                        type="textarea" 
                        v-model="form.description"
                        :rows="3"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitForm">确定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 添加预订详情弹窗 -->
        <el-dialog
            v-model="bookingDialogVisible"
            :title="selectedDate + ' 预订详情'"
            width="600px"
        >
            <el-table :data="selectedDateBookings" style="width: 100%">
                <el-table-column prop="userName" label="申请人" />
                <el-table-column label="使用时间">
                    <template #default="{ row }">
                        {{ formatTimeRange(row) }}
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useResourceStore } from '@/stores/resource';
import { useServiceStore } from '@/stores/service';
import type { FormInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';

const resourceStore = useResourceStore();

const activeTab = ref('list');
const selectedResource = ref('');
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const bookingDialogVisible = ref(false);
const currentDate = ref(new Date());
const selectedDate = ref('');
const selectedDateBookings = ref<any[]>([]);

const placeType = {
    'court': '球场',
    'activity-room': '活动室'
};

const form = reactive({
    name: '',
    type: '',
    location: '',
    capacity: 1,
    description: ''

});

const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
    location: [{ required: true, message: '请输入位置', trigger: 'blur' }],
    capacity: [{ required: true, message: '请输入容量', trigger: 'change' }]
};

const handleAdd = () => {
    dialogVisible.value = true;
    // 重置表单数据
    form.name = '';
    form.type = '';
    form.location = '';
    form.capacity = 1;
    form.description = '';
    // 如果有表单引用,同时重置校验结果
    formRef.value?.resetFields();
};

const submitForm = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate((valid) => {
        if (valid) {
            resourceStore.addResource({
                ...form,
                id: Date.now().toString()
            });
            ElMessage.success('添加成功');
            dialogVisible.value = false;
        }
    });
};

const handleDelete = (row: any) => {
    ElMessageBox.confirm(
        '确定要删除该资源吗？',
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        resourceStore.deleteResource(row.id);
        ElMessage.success('删除成功');
    });
};

// 监听资源选择变化
watch(selectedResource, async (newResourceId) => {
    if (newResourceId && activeTab.value === 'schedule') {
        try {
            await resourceStore.getResourceSchedule(newResourceId);
        } catch (error: any) {
            ElMessage.error(error.message || '获取资源日程失败');
        }
    }
});

const checkBooking = (day: string) => {
    if (!selectedResource.value) return false;
    
    return resourceStore.bookings.some(booking => {
        try {
            const startDate = new Date(booking.startTime);
            const endDate = new Date(booking.endTime);
            const currentDate = new Date(day);

            // 调整为当地时间比较
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            currentDate.setHours(12, 0, 0, 0);

            return currentDate >= startDate && currentDate <= endDate;
        } catch (error) {
            console.error('Invalid date:', booking);
            return false;
        }
    });
};

const handleDateClick = (day: string) => {
    if (!selectedResource.value) return;

    selectedDate.value = day;
    selectedDateBookings.value = resourceStore.bookings.filter(booking => {
        if (booking.status !== 1) return false;

        try {
            const startDateTime = new Date(booking.startTime);
            const endDateTime = new Date(booking.endTime);
            const currentDate = new Date(day);
            
            const startDate = startDateTime.toLocaleDateString('zh-CN');
            const endDate = endDateTime.toLocaleDateString('zh-CN');
            const checkDate = currentDate.toLocaleDateString('zh-CN');

            if (checkDate >= startDate && checkDate <= endDate) {
                (booking as any).displayTime = {
                    start: startDateTime,
                    end: endDateTime,
                    current: currentDate
                };
                return true;
            }
            return false;
        } catch (error) {
            console.error('Invalid date:', booking);
            return false;
        }
    });

    bookingDialogVisible.value = true;
};

const formatTimeRange = (booking: any) => {
    if (!booking?.startTime || !booking?.endTime || !booking?.displayTime?.current) return '';
    
    try {
        const currentDate = new Date(booking.displayTime.current);
        const startDateTime = new Date(booking.startTime);
        const endDateTime = new Date(booking.endTime);
        
        // 将日期调整为同一天以便比较
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const startDay = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
        const endDay = new Date(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate());
        
        // 判断当前日期是否是开始日期、结束日期或中间日期
        if (currentDay.getTime() === startDay.getTime()) {
            // 开始日期：显示 startTime 到 24:00
            return `${formatTime(startDateTime)} ~ 24:00`;
        } else if (currentDay.getTime() === endDay.getTime()) {
            // 结束日期：显示 00:00 到 endTime
            return `00:00 ~ ${formatTime(endDateTime)}`;
        } else if (currentDay > startDay && currentDay < endDay) {
            // 中间日期：显示 00:00 到 24:00
            return '00:00 ~ 24:00';
        }
        
        return ''; // 如果不在预订时间范围内
    } catch (error) {
        console.error('Invalid date:', booking);
        return '';
    }
};

// 格式化时间为 HH:mm
const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const showSchedule = (row: any) => {
    selectedResource.value = row.id;
    activeTab.value = 'schedule';
};

// 添加初始化加载方法
const initData = async () => {
    try {
        await resourceStore.loadResources();
    } catch (error: any) {
        ElMessage.error(error.message || '加载资源列表失败');
    }
};

// 组件挂载时加载数据
onMounted(() => {
    initData();
});
</script>

<style scoped>
.resource-manage {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.schedule-header {
    margin-bottom: 20px;
}

.calendar-cell {
    height: 80%;
    padding: 8px;
    text-align: center;
    cursor: pointer;
}

.has-booking {
    background-color: rgba(255, 239, 213, 0.5) !important;
}

::deep(.el-calendar-table .el-calendar-day) {
    padding: 0 !important;
}
</style> 