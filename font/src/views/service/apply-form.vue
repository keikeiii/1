<template>
    <div class="apply-form">
        <el-card class="apply-card">
            <template #header>
                <div class="card-header">
                    <h3>服务申请</h3>
                </div>
            </template>

            <div class="form-container">
                <el-form 
                    ref="formRef"
                    :model="form"
                    :rules="rules"
                    label-width="100px"
                    class="service-form"
                >
                    <el-form-item label="服务类型" prop="type">
                        <el-select v-model="form.type" placeholder="请选择服务类型">
                            <el-option label="维修服务" value="维修服务" />
                            <el-option label="资源申请" value="资源申请" />
                        </el-select>
                    </el-form-item>

                    <template v-if="form.type === '维修服务'">
                        <el-form-item label="维修类型" prop="detail">
                            <el-select v-model="form.detail" placeholder="请选择维修类型">
                                <el-option label="水电维修" value="水电维修" />
                                <el-option label="家具维修" value="家具维修" />
                                <el-option label="设备维修" value="设备维修" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="楼号" prop="building">
                            <el-input v-model="form.building" placeholder="请输入楼号" />
                        </el-form-item>

                        <el-form-item label="房间号" prop="room">
                            <el-input v-model="form.room" placeholder="请输入房间号" />
                        </el-form-item>
                    </template>
                    
                    <template v-if="form.type === '资源申请'">
                        <el-form-item label="资源类型" prop="detail">
                            <el-select v-model="form.detail" placeholder="请选择资源类型">
                                <el-option label="球场" value="court" />
                                <el-option label="活动室" value="activity-room" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="选择资源" prop="resourceId">
                            <el-select 
                                v-model="form.resourceId" 
                                placeholder="请选择具体资源"
                                :disabled="!form.detail"
                            >
                                <el-option 
                                    v-for="resource in resourceOptions"
                                    :key="resource.value"
                                    :label="resource.label"
                                    :value="resource.value"
                                />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="使用时间" prop="useTime">
                            <el-date-picker
                                v-model="form.useTime"
                                type="datetimerange"
                                range-separator="至"
                                start-placeholder="开始时间"
                                end-placeholder="结束时间"
                                value-format="YYYY-MM-DD HH:mm"
                                format="YYYY-MM-DD HH:mm"
                                :disabled-date="disabledDate"
                            />
                        </el-form-item>
                    </template>

                    <el-form-item label="联系电话" prop="phone">
                        <el-input v-model="form.phone" placeholder="请输入联系电话" />
                    </el-form-item>

                    <el-form-item label="备注说明" prop="remark">
                        <el-input 
                            type="textarea" 
                            v-model="form.remark" 
                            placeholder="请输入具体需求说明"
                            :rows="4"
                        />
                    </el-form-item>

                    <el-form-item>
                        <div class="button-container">
                            <el-button type="primary" @click="submitForm">提交</el-button>
                            <el-button @click="resetForm">重置</el-button>
                        </div>
                    </el-form-item>
                </el-form>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useServiceStore } from '../../stores/service';
import { useResourceStore } from '../../stores/resource';
import { useUserStore } from '../../stores/user';
import { useRouter } from 'vue-router';

const serviceStore = useServiceStore();
const resourceStore = useResourceStore();
const userStore = useUserStore();
const router = useRouter();
const formRef = ref<FormInstance>();

const form = reactive({
    type: '',
    detail: '',
    resourceId: '',
    useTime: [] as string[],
    building: '',
    room: '',
    phone: '',
    remark: ''
});

const rules = {
    type: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
    detail: [{ required: true, message: '请选择具体类型', trigger: 'change' }],
    resourceId: [{ required: true, message: '请选择资源', trigger: 'change' }],
    useTime: [{ required: true, message: '请选择使用时间', trigger: 'change' }],
    building: [{ 
        required: true, 
        message: '请输入楼号', 
        trigger: 'blur',
        validator: (rule: any, value: string, callback: Function) => {
            if (form.type === '维修服务' && !value) {
                callback(new Error('请输入楼号'));
            } else {
                callback();
            }
        }
    }],
    room: [{ 
        required: true, 
        message: '请输入房间号', 
        trigger: 'blur',
        validator: (rule: any, value: string, callback: Function) => {
            if (form.type === '维修服务' && !value) {
                callback(new Error('请输入房间号'));
            } else {
                callback();
            }
        }
    }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
};

const resourceOptions = ref([]);

// 根据选择的资源类型过滤可用资源
const filteredResources = computed(() => {
    return resourceStore.resources.filter(r => r.type === form.detail);
});

const disabledDate = (time: Date) => {
    return time.getTime() < Date.now() - 8.64e7;
};

// 监听资源类型变化
watch(() => form.detail, async (newType) => {
    if (form.type === '资源申请' && newType) {
        try {
            // 根据选择的资源类型加载对应的资源列表
            const resources = await resourceStore.loadResourcesByType(newType);
            resourceOptions.value = resources.map((r: any) => ({
                label: r.name,
                value: r.id
            }));
            console.log("resourceOptions", resourceOptions.value)
        } catch (error: any) {
            ElMessage.error(error.message || '加载资源列表失败');
        }
    }
});

const submitForm = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const application = {
                    user_id: userStore.userId,
                    user_name: userStore.userName,
                    building: form.building,
                    type: form.type,
                    detail: form.detail,
                    resourceId: form.resourceId,
                    useTime: form.useTime,
                    room: form.room,
                    phone: form.phone,
                    remark: form.remark
                };
                
                await serviceStore.addApplication(application);
                ElMessage.success('提交成功');
                resetForm();
                router.push('/service-my-apply');
            } catch (error: any) {
                ElMessage.error(error.message || '提交申请失败');
            }

        }
    });
};

const resetForm = () => {
    if (!formRef.value) return;
    formRef.value.resetFields();
};
</script>

<style scoped>
.apply-form {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.apply-card {
    width: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.form-container {
    display: flex;
    justify-content: center;
    width: 100%;
}

.service-form {
    width: 600px;
}

.service-form :deep(.el-form-item__label) {
    text-align: right !important;
    width: 100px !important;
    padding-right: 12px !important;
    box-sizing: border-box !important;
}

.service-form :deep(.el-form-item__content) {
    margin-left: 0 !important;
}

.service-form :deep(.el-input),
.service-form :deep(.el-select),
.service-form :deep(.el-date-editor) {
    width: 400px;
}

.service-form :deep(.el-textarea) {
    width: 500px;
}

.button-container {
    width: 500px;
    display: flex;
    justify-content: center;
    gap: 20px;
}
</style> 