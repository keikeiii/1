<template>
    <div class="notice-container">
        <el-card class="notice-card">
            <template #header>
                <div class="card-header">
                    <h3>发布通知</h3>
                </div>
            </template>
            
            <el-form
                ref="noticeFormRef"
                :model="noticeForm"
                :rules="rules"
                label-width="80px"
            >
                <el-form-item label="标题" prop="title">
                    <el-input v-model="noticeForm.title" placeholder="请输入通知标题"></el-input>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input
                        v-model="noticeForm.content"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入通知内容"
                    ></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitNotice">发布通知</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="notice-list-card">
            <template #header>
                <div class="card-header">
                    <h3>已发布的通知</h3>
                </div>
            </template>
            
            <el-table :data="noticeStore.notices" style="width: 100%">
                <el-table-column prop="createTime" label="发布时间" width="180">
                    <template #default="{ row }">
                        {{ formatTime(row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="content" label="内容" show-overflow-tooltip />
            </el-table>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useNoticeStore } from '@/stores/notice';

const noticeStore = useNoticeStore();
const noticeFormRef = ref<FormInstance>();
const noticeForm = reactive({
    title: '',
    content: ''
});

const rules = {
    title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入内容', trigger: 'blur' },
        { min: 5, max: 500, message: '内容长度在5-500个字符之间', trigger: 'blur' }
    ]
};

const submitNotice = async () => {
    if (!noticeFormRef.value) return;
    
    try {
        await noticeFormRef.value.validate();
        await noticeStore.publishNotice({
            title: noticeForm.title,
            content: noticeForm.content
        });
        
        ElMessage.success('通知发布成功');
        noticeFormRef.value.resetFields();
    } catch (error: any) {
        ElMessage.error(error.message || '发布失败');
    }
};


const formatTime = computed(() => (time: string) => {
  if (!time) return '';
  // 处理后端返回的 MySQL datetime 格式
  // time + 8 hours
  let date = new Date(time);
  date.setHours(date.getHours() + 8);
  // toISOString() 会将日期转换为 UTC 时间，这会抵消掉 setHours 的效果
  // 所以我们应该直接使用本地时间格式化
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
});

onMounted(async () => {
    try {
        await noticeStore.getNotices();
    } catch (error: any) {
        ElMessage.error(error.message || '获取通知列表失败');
    }
});
</script>

<style scoped>
.notice-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.notice-card {
    margin-bottom: 20px;
}

.notice-list-card {
    margin-top: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h3 {
    margin: 0;
    color: #303133;
}
</style> 