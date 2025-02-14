<template>
    <div class="survey-list" v-if="!loading">
        <el-card class="list-card">
            <template #header>
                <div class="card-header">
                    <h3>问卷列表</h3>
                    <el-radio-group v-model="filterType">
                        <el-radio-button label="">全部</el-radio-button>
                        <el-radio-button label="survey">意见调查</el-radio-button>
                        <el-radio-button label="collection">民意征集</el-radio-button>
                    </el-radio-group>
                </div>
            </template>

            <el-table :data="filteredList" style="width: 100%">
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="type" label="类型" align="center">
                    <template #default="{ row }">
                        {{ getTypeText(row.type) }}
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="发布时间" align="center">
                    <template #default="{ row }">
                        {{ formatTime(row.create_time) }}
                    </template>
                </el-table-column>
                <el-table-column prop="endDate" label="截止日期" align="center">
                    <template #default="{ row }">
                        {{ formatTime(row.end_time) }}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 0 ? 'success' : 'info'">
                            {{ row.status === 0 ? '进行中' : '已结束' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center">
                    <template #default="{ row }">
                        <el-button 
                            type="primary" 
                            link 
                            @click="handleFill(row)"
                            :disabled="hasUserAnswered(row.id) || row.status === 1"
                        >
                            {{ row.status === 1 ? '已结束' : hasUserAnswered(row.id) ? '已填写' : '填写问卷' }}
                        </el-button>
                        <el-button 
                            type="info" 
                            link 
                            @click="handleView(row)"
                        >
                            查看详情
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 填写问卷弹窗 -->
        <el-dialog
            v-model="fillDialogVisible"
            :title="currentSurvey?.title"
            width="60%"
            class="fill-dialog"
        >
            <div class="survey-info" v-if="currentSurvey">
                <span>类型：{{ getTypeText(currentSurvey.type) }}</span>
                <span>截止日期：{{ formatTime(currentSurvey.end_time) }}</span>
            </div>

            <div class="survey-description" v-if="currentSurvey">
                {{ currentSurvey.description }}
            </div>

            <el-form 
                ref="fillFormRef"
                :model="fillForm"
                :rules="fillRules"
                label-width="0"
                class="fill-form"
            >
                <div v-for="(question, index) in currentSurvey?.questions" :key="index" class="question-item">
                    <div class="question-title">
                        {{ index + 1 }}. {{ question.title }}
                    </div>

                    <el-form-item :prop="'answers.' + index + '.value'">
                        <!-- 单行文本 -->
                        <el-input
                            v-if="question.questionType === 'text'"
                            v-model="fillForm.answers[index].value"
                            placeholder="请输入您的答案"
                        />

                        <!-- 多行文本 -->
                          <el-input
                              v-if="question.questionType === 'textarea'"
                            v-model="fillForm.answers[index].value"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入您的答案"
                        />

                        <!-- 单选题 -->
                        <el-radio-group 
                            v-if="question.questionType === 'radio'"
                            v-model="fillForm.answers[index].value"
                            style="display: flex; flex-direction: column; gap: 10px; align-items: flex-start;"
                        >
                            <el-radio 
                                v-for="(option, optIndex) in question.options"
                                :key="optIndex"
                                :label="option.optionContent"
                                :value="option.optionContent"
                            >
                                ({{ optIndex + 1 }}). {{ option.optionContent }}
                            </el-radio>
                        </el-radio-group>

                        <!-- 多选题 -->
                        <el-checkbox-group 
                            v-if="question.questionType === 'checkbox'"
                            v-model="fillForm.answers[index].value"
                            :max="question.maxChoices"
                            style="display: flex; flex-direction: column; gap: 10px; align-items: flex-start;"
                        >
                            <el-checkbox 
                                v-for="(option, optIndex) in question.options"
                                :key="optIndex"
                                :label="option.optionContent"
                                :value="option.optionContent"
                            >
                                ({{ optIndex + 1 }}). {{ option.optionContent }}
                            </el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>
                </div>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="fillDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitFillForm">提交</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 查看详情弹窗 -->
        <el-dialog
            v-model="viewDialogVisible"
            :title="currentSurvey?.title"
            width="60%"
            class="view-dialog"
        >
            <div class="survey-info" v-if="currentSurvey">
                <span>类型：{{ getTypeText(currentSurvey.type) }}</span>
                <span>截止日期：{{ formatTime(currentSurvey.end_time) }}</span>
            </div>

            <div class="survey-description" v-if="currentSurvey">
                {{ currentSurvey.description }}
            </div>

            <div v-if="userAnswer" class="answer-content">
                <h4>您的答案：</h4>
                <div v-for="(answer, index) in userAnswer.answers" :key="index" class="answer-item">
                    <div class="question-title">
                        {{ index + 1 }}. {{ currentSurvey?.questions[index].title }}
                    </div>
                    <div class="answer-value">
                        {{ Array.isArray(answer.value) ? answer.value.join('、') : answer.value }}
                    </div>
                </div>
                <div class="submit-time">
                    提交时间：{{ formatTime(userAnswer.submitTime) }}
                </div>
            </div>
            <div v-else class="no-answer">
                您还未填写此问卷
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useSurveyStore } from '../../stores/survey';
import { useUserStore } from '../../stores/user';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
const loading = ref(false);
const surveyStore = useSurveyStore();
const userStore = useUserStore();
const filterType = ref('');
const fillDialogVisible = ref(false);
const viewDialogVisible = ref(false);
const currentSurvey = ref(null);
const fillFormRef = ref<FormInstance>();
const currentAnswers = ref<any>(null);
const answersDialogVisible = ref(false);

// 填写表单数据
const fillForm = ref({
    answers: []
});

// 用户答案
const userAnswer = ref<any>(null);

// 获取筛选后的列表
const filteredList = computed(() => {
    console.log("surveyStore.getSurveyList(filterType.value)", surveyStore.getSurveyList(filterType.value))
    return surveyStore.getSurveyList(filterType.value);
});

const getTypeText = (type: string) => {
    return type === 'survey' ? '意见调查' : '民意征集';
};

const formatTime = (time: string) => {
    if(time) {
        return new Date(time).toLocaleString();
    }
    return "";
};

// 处理填写问卷
const handleFill = (row: any) => {
    currentSurvey.value = row;
    fillForm.value = {
        answers: row.questions.map((q: any) => ({
            value: q.questionType === 'checkbox' ? [] : ''  // 多选题初始化为空数组
        }))
    };
    fillDialogVisible.value = true; 
};

// 处理查看详情
const handleView = async (row: any) => {
    currentSurvey.value = row;
  userAnswer.value = await surveyStore.getUserAnswer(row.id, Number(userStore.userId));
    console.log("userAnswer.value", userAnswer.value);
    viewDialogVisible.value = true;
};

// 提交问卷
const submitFillForm = async () => {
    if (!fillFormRef.value) return;
    await fillFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const answer = {
                    surveyId: currentSurvey?.value?.id,
                    userId: userStore.userId,
                    userName:userStore.userName,
                    answers: fillForm.value.answers
                };
                console.log("submitFillForm", answer);
                await surveyStore.submitAnswer(answer);
                ElMessage.success('提交成功，感谢您的参与！');
                fillDialogVisible.value = false;
            } catch (error: any) {
                ElMessage.error(error.message || '提交失败');
            }
        }
    });
};

const fillRules = {
    'answers.*.value': [{ required: true, message: '此项为必填项', trigger: 'blur' }]
};

// 检查用户是否已填写问卷
const hasUserAnswered = (surveyId: string) => {
  const userAnswer = surveyStore.getUserAnswer(surveyId, Number(userStore.userId));
  return  userAnswer.length !== 0;
};

const handleViewAnswers = async (row: any) => {
  currentSurvey.value = row;
  await surveyStore.loadSurveyAnswers(row.id);
  currentAnswers.value = surveyStore.answers;
  answersDialogVisible.value = true;

  await nextTick();

  currentSurvey.value?.questions.forEach((q: any, index: number) => {
    if (['radio', 'checkbox'].includes(q.questionType)) {
      initChart(index);
    }
  });
};
const initChart = (index: number) => {
    const chartDom = document.getElementById(`chart-${index}`);
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    const question = currentSurvey.value?.questions[index];
    const stats = currentAnswers.value[index];
    
    chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: '60%',
            data: question.options.map((option: string) => ({
                name: option,
                value: stats[option] || 0
            }))
        }]
    });
};

onMounted(async () => {
  try {
    loading.value = true;
    await surveyStore.loadingData();
    loading.value = false;
    } catch (error: any) {
        ElMessage.error(error.message || '加载问卷列表失败');
    }
});
</script>

<style scoped>
.survey-list {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.list-card {
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

.survey-info {
    display: flex;
    gap: 20px;
    color: #909399;
    font-size: 14px;
    margin-bottom: 15px;
}

.survey-description {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    color: #606266;
}

.question-item {
    margin-bottom: 25px;
}

.question-title {
    font-weight: bold;
    margin-bottom: 15px;
    color: #303133;
}

.answer-content {
    margin-top: 20px;
    border-top: 1px solid #EBEEF5;
    padding-top: 20px;
}

.answer-item {
    margin-bottom: 20px;
}

.answer-value {
    color: #606266;
    line-height: 1.6;
}

.submit-time {
    margin-top: 20px;
    color: #909399;
    font-size: 14px;
    text-align: right;
}

.no-answer {
    margin-top: 20px;
    color: #909399;
    text-align: center;
    font-size: 14px;
}

:deep(.el-radio-group),
:deep(.el-checkbox-group) {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

:deep(.el-radio),
:deep(.el-checkbox) {
    margin-right: 0;  /* 移除右边距 */
    margin-left: 0;   /* 移除左边距 */
    height: 32px;     /* 统一高度 */
    line-height: 32px;/* 垂直居中 */
}

:deep(.el-radio-group) {
    display: inline-flex;  /* 修改为行内弹性布局 */
    flex-direction: row;   /* 水平排列 */
    gap: 0;               /* 移除间隔 */
}

:deep(.el-radio-button) {
    margin: 0;            /* 移除外边距 */
}
</style> 