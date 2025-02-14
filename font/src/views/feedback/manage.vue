<template>
    <div class="feedback-manage">
        <el-card class="manage-card">
            <template #header>
                <div class="card-header">
                    <h3>反馈处理</h3>
                </div>
            </template>

            <el-table :data="feedbacks" style="width: 100%">
                <el-table-column prop="title" label="标题" align="center" />
                <el-table-column prop="type" label="类型" align="center">
                    <template #default="{ row }">
                        {{ getTypeText(row.type) }}
                    </template>
                </el-table-column>
                <el-table-column prop="userName" label="反馈用户" align="center" />
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
                <el-table-column label="操作" width="120" align="center">
                    <template #default="{ row }">
                        <el-button 
                            type="primary" 
                            link 
                            @click="handleReply(row)"
                        >
                            {{ row.reply_times === null ? '回复' : '查看' }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 回复弹窗 -->
        <el-dialog
            :title="currentFeedback?.reply_times === null ? '回复反馈' : '反馈详情'"
            v-model="replyVisible"
            width="500px"
        >
            <el-descriptions :column="1" border>
                <el-descriptions-item label="标题">{{ currentFeedback?.title }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ getTypeText(currentFeedback?.type) }}</el-descriptions-item>
                <el-descriptions-item label="内容">{{ currentFeedback?.content }}</el-descriptions-item>
            </el-descriptions>

            <div class="reply-form" v-if="currentFeedback?.reply_times === null">
                <el-input
                    v-model="replyContent"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入回复内容..."
                />
                <div class="dialog-footer">
                    <el-button @click="replyVisible = false">取消</el-button>
                    <el-button 
                        type="primary" 
                        @click="submitReply"
                        :disabled="!replyContent.trim()"
                    >
                        提交回复
                    </el-button>
                </div>
            </div>

            <div class="reply-content" v-else>
                <el-descriptions :column="1" bord>
                    <el-descriptions-item label="回复内容">{{ currentFeedback?.replies }}</el-descriptions-item>
                    <el-descriptions-item label="回复时间">{{ formatTime(currentFeedback?.reply_times) }}</el-descriptions-item>
                </el-descriptions>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useFeedbackStore, type Feedback } from '@/stores/feedback';
import { storeToRefs } from 'pinia';
const feedbackStore = useFeedbackStore();
const { feedbacks } = storeToRefs(feedbackStore);
console.log("getAllFeedbacks feedbacks", feedbacks)
const replyVisible = ref(false);
const replyContent = ref('');
const currentFeedback = ref<Feedback | null>(null);

const getTypeText = (type: number | undefined) => {
    console.log("type", type);
    const typeMap: Record<number, string> = {
        0: '设施建议',
        1: '服务建议',
        2: '环境建议',
        3: '其他'
    };
    console.log("getTypeText type", type)
    return type || type === 0 ? typeMap[type] : '';
};

const formatTime = (time: string | undefined) => {
    return time ? new Date(time).toLocaleString() : '';
};

const handleReply = (feedback: Feedback) => {
    currentFeedback.value = feedback;
    replyContent.value = feedback.reply || '';
    replyVisible.value = true;
};

const submitReply = () => {
    if (!currentFeedback.value || !replyContent.value.trim()) return;
    
    feedbackStore.addReply(currentFeedback.value.id, replyContent.value);
    ElMessage.success('回复成功');
    replyVisible.value = false;
    replyContent.value = '';
    feedbackStore.getAllFeedbacks();
};

onMounted(() => {
    feedbackStore.getAllFeedbacks();
});
</script>

<style scoped>
.feedback-manage {
    padding: 20px;
}

.manage-card {
    min-height: 400px;
}

.reply-form {
    margin-top: 20px;
}

.dialog-footer {
    margin-top: 20px;
    text-align: right;
}
</style> 