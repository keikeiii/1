<template>
    <div class="survey-publish" v-if="!loading">
        <el-card class="publish-card">
            <template #header>
                <div class="card-header">
                    <h3>发布问卷</h3>
                </div>
            </template>

            <el-form 
                ref="formRef"
                :model="formData"
                :rules="rules"
                label-width="100px"
                class="publish-form"
            >
                <el-form-item label="标题" prop="title">
                    <el-input v-model="formData.title" placeholder="请输入标题" style="width: 400px;"></el-input>
                </el-form-item>

                <el-form-item label="类型" prop="type">
                    <el-select v-model="formData.type" placeholder="请选择类型" style="width: 400px;">
                        <el-option label="意见调查" value="survey"></el-option>
                        <el-option label="民意征集" value="collection"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="截止日期" prop="endDate">
                    <el-date-picker
                        v-model="formData.endDate"
                        type="datetime"
                        placeholder="选择日期和时间"
                        format="YYYY-MM-DD HH:mm"
                        value-format="YYYY-MM-DD HH:mm"
                        :disabled-date="disabledDate"
                        :picker-options="{
                            format: 'HH:mm',
                            selectableRange: '00:00:00 - 23:59:59'
                        }"
                    />
                </el-form-item>

                <el-form-item label="问卷说明" prop="description">
                    <el-input
                        v-model="formData.description"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入问卷说明"
                        style="width: 600px;"
                    />
                </el-form-item>

                <el-form-item label="问卷内容" prop="questions">
                    <div class="questions-container" style="width: 600px;">
                        <div v-for="(question, index) in formData.questions" :key="index" class="question-item">
                            <div class="question-header">
                                <span>问题 {{ index + 1 }}</span>
                                <el-button type="danger" link @click="removeQuestion(index)">删除</el-button>
                            </div>
                            
                            <el-input
                                v-model="question.title"
                                placeholder="请输入问题"
                                style="margin-bottom: 10px;"
                            />

                            <el-select
                                v-model="question.type"
                                placeholder="选择答题类型"
                                style="width: 100%; margin-bottom: 10px;"
                            >
                                <el-option label="单行文本" value="text"></el-option>
                                <el-option label="多行文本" value="textarea"></el-option>
                                <el-option label="单选题" value="radio"></el-option>
                                <el-option label="多选题" value="checkbox"></el-option>
                            </el-select>

                            <template v-if="['radio', 'checkbox'].includes(question.type)">
                                <!-- 添加最大选择数限制输入框 -->
                                <div v-if="question.type === 'checkbox'" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <span style="margin-right: 10px;">最多可选数量为：</span>
                                    <el-input-number
                                        v-model="question.maxChoices"
                                        :min="1"
                                        :max="question.options.length || 1"
                                        placeholder="最多可选数量"
                                        style="width: 150px;"
                                    />
                                </div>
                                
                                <div 
                                    v-for="(option, optIndex) in question.options" 
                                    :key="optIndex"
                                    class="option-item"
                                >
                                    <el-input
                                        v-model="question.options[optIndex]"
                                        placeholder="请输入选项"
                                        style="width: 200px;"
                                    />
                                    <el-button 
                                        type="danger" 
                                        link 
                                        @click="removeOption(index, optIndex)"
                                    >
                                        删除
                                    </el-button>
                                </div>
                                <el-button 
                                    type="primary" 
                                    link 
                                    @click="addOption(index)"
                                    style="margin-top: 10px;"
                                >
                                    添加选项
                                </el-button>
                            </template>
                        </div>

                        <el-button 
                            type="primary" 
                            @click="addQuestion"
                            style="margin-top: 20px;"
                        >
                            添加问题
                        </el-button>
                    </div>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="submitForm">发布</el-button>
                    <el-button @click="resetForm">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 发布记录 -->
        <el-card class="record-card" style="margin-top: 20px;">
            <template #header>
                <div class="card-header">
                    <h3>发布记录</h3>
                </div>
            </template>

            <el-table :data="publishedSurveys" style="width: 100%">
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
                <el-table-column label="操作" align="center" width="280">
                    <template #default="{ row }">
                        <el-button 
                            type="primary" 
                            link
                            @click="handleView(row)"
                        >
                            查看问卷
                        </el-button>
                        <el-button 
                            type="success" 
                            link
                            @click="handleViewAnswers(row)"
                        >
                            查看填写记录
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
        </el-card>

        <!-- 查看问卷弹窗 -->
        <el-dialog
            v-model="viewDialogVisible"
            title="问卷详情"
            width="600px"
        >
            <div v-if="currentSurvey" class="survey-detail">
                <h3>标题：{{ currentSurvey.title }}</h3>
                <p class="description">描述：{{ currentSurvey.description }}</p>
                <div class="questions">
                    <div v-for="(q, index) in currentSurvey.questions" :key="index" class="question-item">
                        <div class="question-title">{{ index + 1 }}. {{ q.title }}({{ q.questionType === 'text' ? '单行输入' : q.questionType === 'textarea' ? '文本输入' : q.questionType === 'radio' ? '单选题' : q.questionType === 'checkbox' ? '多选题' : '' }})</div>
                        <div v-if="q.options && q.options.length > 0" class="options">
                            <div v-for="(opt, i) in q.options" :key="i" class="option-item">
                                ({{ opt.sortOrder + 1 }}). {{ opt.optionContent }}
                            </div>
                        </div>
                        <div v-else class="question-type">
                            [{{ q.questionType === 'textarea' ? '文本输入' : '单行输入' }}]
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 添加查看填写记录的弹窗 -->
        <el-dialog
            v-model="answersDialogVisible"
            title="填写记录"
            width="800px"
        >
            <div v-if="currentAnswers.length > 0">
                <div v-for="(question, qIndex) in currentSurvey?.questions" :key="qIndex" class="question-analysis">
                    <h4 class="question-title">{{ qIndex + 1 }}. {{ question.title }} ({{ QUESITION_TYPE[question.questionType as keyof typeof QUESITION_TYPE] }})</h4>
                    
                    <!-- 选择题显示饼图 -->
                    <div v-if="['radio', 'checkbox'].includes(question.questionType)" class="chart-container">
                        <div :id="`chart-${qIndex}`" class="chart"></div>
                    </div>
                    <!-- 文本题显示列表 -->
                    <div v-else class="text-answers">
                        <div v-for="(answer, index) in currentAnswers" :key="index" class="text-answer-item">
                            <span class="user-name">{{ answer.userName }}：</span>
                            <span class="answer-content">{{ answer.answers[qIndex].value }}</span>
                            <span class="submit-time">{{ formatTime(answer.submitTime) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="no-answers">
                暂无填写记录
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useSurveyStore } from '../../stores/survey';
import { useUserStore } from '../../stores/user';
import * as echarts from 'echarts';

const surveyStore = useSurveyStore();
const userStore = useUserStore();
const loading = ref(false);
interface Question {
    title: string;
    type: string;
    options: string[];
    maxChoices: number;
}

interface FormData {
    title: string;
    type: string;
    endDate: string;
    description: string;
    questions: Question[];
}

const QUESITION_TYPE = {
  text: '单行文本',
  textarea: '多行文本',
  radio: '单选题',
  checkbox: '多选题'
}

const formRef = ref<FormInstance>();
const formData = reactive<FormData>({
    title: '',
    type: '',
    endDate: '',
    description: '',
    questions: []
});

const rules = {
    title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 2, max: 50, message: '标题长度在2-50个字符之间', trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请选择类型', trigger: 'change' }
    ],
    endDate: [
        { required: true, message: '请选择截止日期', trigger: 'change' }
    ],
    description: [
        { required: true, message: '请输入调查说明', trigger: 'blur' }
    ],
    questions: [
        { required: true, message: '请至少添加一个问题', trigger: 'change' }
    ]
};

const disabledDate = (time: Date) => {
    return time.getTime() < Date.now() - 8.64e7;
};

const addQuestion = () => {
    formData.questions.push({
        title: '',
        type: '',
        options: [],
        maxChoices: 1
    });
};

const removeQuestion = (index: number) => {
    formData.questions.splice(index, 1);
};

const addOption = (questionIndex: number) => {
    if (!formData.questions[questionIndex].options) {
        formData.questions[questionIndex].options = [];
    }
    formData.questions[questionIndex].options.push('');
};

const removeOption = (questionIndex: number, optionIndex: number) => {
    formData.questions[questionIndex].options.splice(optionIndex, 1);
    // 更新最大可选数量
    if (formData.questions[questionIndex].type === 'checkbox') {
        formData.questions[questionIndex].maxChoices = Math.min(
            formData.questions[questionIndex].maxChoices,
            formData.questions[questionIndex].options.length || 1
        );
    }
};

const submitForm = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const survey = {
                    title: formData.title,
                    type: formData.type,
                    endDate: formData.endDate,
                    description: formData.description,
                    questions: formData.questions,
                    creatorId: userStore.userId,
                    creatorName: userStore.userName
                };
                
                await surveyStore.addSurvey(survey);
                ElMessage.success('发布成功');
                resetForm();
            } catch (error: any) {
                ElMessage.error(error.message || '发布失败');
            }
        }
    });
};

const resetForm = () => {
    if (!formRef.value) return;
    formRef.value.resetFields();
    formData.questions = [];
};

// 获取已发布的问卷列表
const publishedSurveys = computed(() => {
    return surveyStore.getSurveyList();
});

const getTypeText = (type: string) => {
    return type === 'survey' ? '意见调查' : '民意征集';
};

const formatTime = (time: string) => {
    return new Date(time).toLocaleString();
};

const handleFill = (row: any) => {
    // 暂时只打印数据，后续可以添加填写功能
    console.log('填写问卷:', row);
};

const viewDialogVisible = ref(false);
const currentSurvey = ref<any>(null);

// 查看问卷
const handleView = (row: any) => {
    currentSurvey.value = row;
    viewDialogVisible.value = true;
};

// 删除问卷
const handleDelete = (row: any) => {
    ElMessageBox.confirm(
        '确定要删除这个问卷吗？',
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        surveyStore.deleteSurvey(row.id);
        ElMessage.success('删除成功');
    }).catch(() => {});
};

const answersDialogVisible = ref(false);
const currentAnswers = ref<any[]>([]);

const handleViewAnswers = async (row: any) => {
  currentSurvey.value = row;
  await surveyStore.loadSurveyAnswers(row.id);
  console.log("surveyStore.answers", surveyStore.answers)
  currentAnswers.value = surveyStore.answers || [];
  console.log("currentAnswers.value", currentAnswers.value)
  answersDialogVisible.value = true;

  await nextTick();
  console.log("currentSurvey.value", currentSurvey.value);
  console.log("currentSurvey.value?.questions", currentSurvey.value?.questions)
  currentSurvey.value?.questions.forEach((q: any, index: number) => {
    if (['radio', 'checkbox'].includes(q.questionType)) {
      initChart(index);
    }
  });
};

// 监听弹窗关闭
watch(answersDialogVisible, (newVal) => {
    if (!newVal) {
        // 清除所有图表实例
        currentSurvey.value?.questions.forEach((q: any, index: number) => {
            const chartDom = document.getElementById(`chart-${index}`);
            if (chartDom) {
                echarts.dispose(chartDom);
            }
        });
    }
});

// 初始化图表
const initChart = (index: number) => {
    const chartDom = document.getElementById(`chart-${index}`);
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    const data = generateChartData(index);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            padding: [20, 0]
        },
        series: [
            {
                name: '选项统计',
                type: 'pie',
                radius: ['40%', '60%'],
                center: ['50%', '40%'],
                label: {
                    show: true,
                    formatter: '{b}: {c}'
                },
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 15
                },
                data: data
            }
        ]
    };
    
    chart.setOption(option);
};

// 生成图表数据
const generateChartData = (questionIndex: number) => {
    if (!currentSurvey.value || !currentAnswers.value.length) return [];
    
    const question = currentSurvey.value.questions[questionIndex];
    const counts = new Map();
    
    // 初始化所有选项的计数为0
    question.options.forEach(opt => counts.set(opt.optionContent, 0));
    
    // 统计答案
    currentAnswers.value.forEach(answer => {
        const value = answer.answers[questionIndex].value;
        if (Array.isArray(value)) {
            // 处理多选题
            value.forEach(option => {
                counts.set(option, (counts.get(option) || 0) + 1);
            });
        } else {
            // 处理单选题
            counts.set(value, (counts.get(value) || 0) + 1);
        }
    });
    
    return Array.from(counts).map(([name, value]) => ({ name, value }));
};

onMounted(async () => {
  try {
    loading.value = true;
    await surveyStore.loadingData();
    loading.value = false;
  } catch (err) {
    console.log("err", err);
  }
})
</script>

<style scoped>
.survey-publish {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.publish-card {
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

.publish-form {
    margin-top: 20px;
}

.questions-container {
    border: 1px solid #EBEEF5;
    border-radius: 4px;
    padding: 20px;
}

.question-item {
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 15px;
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.record-card {
    width: 100%;
}

.survey-detail {
    padding: 20px;
}

.description {
    color: #666;
    margin: 15px 0;
}

.question-item {
    margin-bottom: 20px;
}

.question-title {
    font-weight: bold;
    margin-bottom: 10px;
}

.options {
    padding-left: 20px;
}

.option-item {
    margin: 5px 0;
    color: #666;
}

.question-type {
    color: #999;
    font-style: italic;
}

.answer-record {
    border-bottom: 1px solid #EBEEF5;
    padding: 15px 0;
}

.answer-record:last-child {
    border-bottom: none;
}

.answer-header {
    display: flex;
    justify-content: space-between;
    color: #909399;
    font-size: 14px;
    margin-bottom: 10px;
}

.answer-content {
    padding: 0 10px;
}

.answer-item {
    margin: 10px 0;
}

.question-title {
    font-weight: bold;
    color: #303133;
    margin-bottom: 5px;
}

.answer-value {
    color: #606266;
    line-height: 1.6;
}

.no-answers {
    text-align: center;
    color: #909399;
    padding: 20px;
}

.chart-container {
    width: 100%;
    height: 300px;
    margin: 20px 0;
}

.chart {
    width: 100%;
    height: 100%;
}

.text-answer-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.user-name {
    font-weight: bold;
    margin-right: 8px;
    min-width: 100px;
}

.submit-time {
    color: #999;
    margin-left: 16px;
    font-size: 12px;
}
</style> 