<template>
  <div class="feedback-container">
    <el-card class="feedback-card">
      <template #header>
        <div class="card-header">
          <h3>意见反馈</h3>
          <div class="contact-info">
            <span class="contact-item">
              <el-icon>
                <Clock />
              </el-icon>
              工作时间：8:00~18:00
            </span>
            <span class="contact-item">
              <el-icon>
                <Phone />
              </el-icon>
              联系电话：400-888-9999
            </span>
          </div>
        </div>
      </template>

      <el-form ref="feedbackFormRef" :model="feedbackForm" :rules="rules" class="feedback-form">
        <div class="form-item-wrapper">
          <el-form-item label="标题" prop="title">
            <el-input v-model="feedbackForm.title" placeholder="请输入标题" style="width: 400px;"></el-input>
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
          <el-form-item label="类型" prop="type">
            <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型" style="width: 400px;">
              <el-option label="设施建议" value="0"></el-option>
              <el-option label="服务建议" value="1"></el-option>
              <el-option label="环境建议" value="2"></el-option>
              <el-option label="其他" value="3"></el-option>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-item-wrapper">
          <el-form-item label="内容" prop="content">
            <el-input v-model="feedbackForm.content" type="textarea" :rows="6" placeholder="请详细描述您的建议..."
              style="width: 600px;"></el-input>
          </el-form-item>
        </div>

        <div class="form-item-wrapper submit-wrapper">
          <el-form-item>
            <el-button type="primary" @click="submitFeedback">提交反馈</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <!-- 反馈记录表格 -->
    <el-card class="feedback-records-card">
      <template #header>
        <div class="card-header">
          <h3>我的反馈记录</h3>
        </div>
      </template>

      <el-table :data="userFeedbacks" style="width: 100%">
        <el-table-column prop="title" label="标题" align="center" />
        <el-table-column prop="type" label="类型" align="center">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="{ row }">
            <el-tag :type="row.reply_times === null ? 'warning' : 'success'">
              {{ row.reply_times === null ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="showDetail(row)">
              查看反馈
            </el-button>
            <el-button type="warning" link @click="showReply(row)" :disabled="row.reply_times === null">
              查看回复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 反馈详情弹窗 -->
    <el-dialog title="反馈详情" v-model="detailVisible" width="500px" align-center :modal-class="'feedback-dialog'"
      class="custom-dialog">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="标题">{{ currentFeedback?.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeText(currentFeedback?.type) }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ currentFeedback?.content }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatTime(currentFeedback?.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 回复详情弹窗 -->
    <el-dialog title="回复详情" v-model="replyVisible" width="500px" align-center :modal-class="'feedback-dialog'"
      class="custom-dialog">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="回复">{{ currentFeedback?.replies }}</el-descriptions-item>
        <el-descriptions-item label="回复时间">{{ formatTime(currentFeedback?.reply_times) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { Clock, Phone } from '@element-plus/icons-vue';
import { useFeedbackStore } from '@/stores/feedback';

const feedbackStore = useFeedbackStore();
const currentUserId = localStorage.getItem('user_id') || '';

const feedbackFormRef = ref<FormInstance>();
const feedbackForm = reactive({
  title: '',
  type: '',
  content: ''
});

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, max: 500, message: '内容长度在10-500个字符之间', trigger: 'blur' }
  ]
};

// 反馈记录相关
const userFeedbacks = computed(() => {
  return feedbackStore.feedbacks;
});

const detailVisible = ref(false);
const replyVisible = ref(false);
const currentFeedback = ref(null);

const getTypeText = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '设施建议',
    1: '服务建议',
    2: '环境建议',
    3: '其他'
  };
  return typeMap[type] || '';
};

const formatTime = (time: string | undefined) => {
  return time ? new Date(time).toLocaleString() : '';
};

// 获取用户反馈列表
onMounted(async () => {
  try {
    await feedbackStore.getUserFeedbacks(currentUserId);
  } catch (error) {
    ElMessage.error('获取反馈列表失败');
  }
});

const showDetail = async (feedback: any) => {
  try {
    console.log("feedback", feedback);
    const detail = await feedbackStore.getFeedbackById(feedback.id);
    console.log("detail", detail)
    currentFeedback.value = detail;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取反馈详情失败');
  }
};

const showReply = async (feedback: any) => {
  try {
    currentFeedback.value = feedback;
    console.log("currentFeedback", currentFeedback)
    replyVisible.value = true;
  } catch (error) {
    ElMessage.error('获取回复详情失败');
  }
};

const submitFeedback = async () => {
  if (!feedbackFormRef.value) return;

  await feedbackFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await feedbackStore.addFeedback({
          title: feedbackForm.title,
          type: Number(feedbackForm.type),
          content: feedbackForm.content,
          userId: Number(currentUserId),
          userName: localStorage.getItem('vuems_name') || '匿名用户'
        });

        ElMessage.success('反馈提交成功');
        feedbackFormRef.value?.resetFields();
        await feedbackStore.getUserFeedbacks(Number(currentUserId));
      } catch (error) {
        ElMessage.error('提交反馈失败');
      }
    }
  });
};
</script>

<style scoped>
.feedback-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.feedback-card {
  width: 100%;
  margin-bottom: 20px;
}

.feedback-records-card {
  width: 100%;
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

.contact-info {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.contact-item .el-icon {
  color: #409EFF;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-item-wrapper {
  width: 700px;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.form-item-wrapper :deep(.el-form-item) {
  margin-bottom: 0;
}

.form-item-wrapper :deep(.el-form-item__label) {
  width: 80px;
}

.submit-wrapper {
  justify-content: center;
}

.submit-wrapper :deep(.el-form-item) {
  margin-left: 0;
}

:deep(.feedback-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.custom-dialog .el-dialog) {
  margin: 15vh auto !important;
}

:deep(.custom-dialog .el-dialog__body) {
  padding: 10px;
}

:deep(.el-descriptions__body) {
  background-color: #fff;
}

:deep(.el-descriptions__cell) {
  padding: 8px !important;
}

:deep(.el-descriptions__label) {
  width: 80px;
  padding-right: 8px !important;
}
</style> 