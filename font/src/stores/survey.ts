import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '@/utils/request';

export interface SurveyQuestion {
  surveyId: string;
  title: string;
  type: string;
  options?: string[];
  required?: boolean;
  sortOrder?: number;
  maxChoices?: number;
}

export interface Survey {
  id: string;
  title: string;
  type: string;
  endDate: string;
  description: string;
  questions: SurveyQuestion[];
  createTime: string;
  creatorId: string;
  creatorName: string;
  status: number;  // 0: 进行中, 1: 已结束
}

export interface SurveyAnswer {
  surveyId: string;
  userId: number;
  userName: string;
  answers: Array<{
    questionIndex: number;
    value: string | string[];
  }>;
  submitTime: string;
}

export const useSurveyStore = defineStore('survey', () => {
  const surveys = ref<Survey[]>([]);
  const answers = ref<SurveyAnswer[]>([]);
  const questions = ref<SurveyQuestion[]>([]);
  const options = ref<any[]>([]);
  // 加载问卷列表
  const loadSurveys = async () => {
    try {
      const response = await request.get('/survey/list');
      console.log("response, ", response);
      if (response.code === 200) {
        surveys.value = response.data.map((survey: any) => {
          return {
            ...survey,
            // status为 0 表示问卷进行中，1 表示已结束
            status: new Date(survey.end_time) < new Date() ? 1 : 0,
            questions: questions.value.filter(item => {
              return item.surveyId === survey.id;
            })
          }
        });
      }
    } catch (error) {
      console.error('加载问卷列表失败:', error);
      throw error;
    }
  };

  // 添加新问卷
  const addSurvey = async (survey: Omit<Survey, 'id' | 'createTime' | 'status'>) => {
    try {
      console.log("survey", survey);
      const _survey = {
        ...survey,
        endTime: survey.endDate
      }
      const response = await request.post('/survey', _survey);
      if (response.code === 200) {
        await loadingData();
        return response.data;
      }
    } catch (error) {
      console.error('创建问卷失败:', error);
      throw error;
    }
  };

  // 获取问卷详情
  const getSurvey = async (id: string) => {
    try {
      const response = await request.get(`/survey/${id}`);
      if (response.code === 200) {
        return response.data;
      }
    } catch (error) {
      console.error('获取问卷详情失败:', error);
      throw error;
    }
  };

  // 获取问卷列表
  const getSurveyList = (type?: string) => {
    let list = surveys.value;
    if (type) {
      list = list.filter(s => s.type === type);
    }
    // 按创建时间倒序排序
    return list.sort((a, b) =>
      new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    );
  };

  // Add new method to load answers for a survey
  const loadSurveyAnswers = async (surveyId: string) => {
    try {
      const response = await request.get(`/survey/${surveyId}/answers`);
      if (response.code === 200) {
        // 解析答案字符串为数组
        const parsedAnswers = response.data.map((answer: any) => {
          const answerArray = answer.answer_content
            .split('],[')
            .map((item: string) => item.replace(/[\[\]]/g, ''));
          
          return {
            userId: answer.user_id,
            userName: answer.user_name,
            submitTime: answer.create_time,
            answers: answerArray.map((value: string) => ({
              value: value.includes(',') ? value.split(',') : value
            }))
          };
        });
        
        answers.value = parsedAnswers;
        return parsedAnswers;
      }
    } catch (error) {
      console.error('获取问卷答案失败:', error);
      throw error;
    }
  };

  // Modify submitAnswer to update local answers after submission
  // const answer = {
  //   surveyId: currentSurvey?.value?.id,
  //   userId: userStore.userId,
  //   userName: userStore.userName,
  //   answers: fillForm.value.answers
  // };
  const submitAnswer = async (answer: Omit<SurveyAnswer, 'submitTime'>) => {
    try {
      let _answerContent = '';
      console.log("answer.answers", answer.answers);
      answer.answers.forEach((item, index) => {
        if (Array.isArray(item.value)) {
          _answerContent += `[${item.value.join(',')}]`;
        } else {
          _answerContent += item.value;
        }
        if(index != answer.answers.length - 1) _answerContent += ',';
      })
      const _answer = {
        userName: answer.userName,
        userId: Number(answer.userId),
        surveyId: answer.surveyId,
        answerContent: _answerContent
          // 将答案数组转为字符串, 遇到数组元素，用逗号分隔【】，【12，【123，131】】 =》 12,【123, 131】
      }
      console.log("_answer", _answer);
      const response = await request.post(`/survey/${answer.surveyId}/submit`, {
        answer: _answer
      });
      console.log("submitAnswer response", response);
      if (response.code === 200) {
        await loadingData();
        return response.data;
      }
    } catch (error) {
      console.error('提交问卷失败:', error);
      throw error;
    }
  };

  // 获取用户的答卷记录
  const getUserAnswers = (userId: number) => {
    userId = Number(userId);
    return answers.value.filter(a => a.userId === userId);
  };

  // 获取问卷的所有答案
  const getSurveyAnswers = (surveyId: string) => {
    return answers.value.filter(a => a.surveyId === surveyId);
  };

  // 更新问卷状态
  const updateSurveyStatus = (id: string, status: number) => {
    const survey = surveys.value.find(s => s.id === id);
    if (survey) {
      survey.status = status;
    }
  };

  // 检查问卷状态
  const checkSurveyStatus = () => {
    const now = new Date();
    surveys.value.forEach(survey => {
      if (survey.status === 0 && new Date(survey.endDate) < now) {
        survey.status = 1;
      }
    });
  };

  // 获取问卷统计数据
  const getSurveyStats = async (surveyId: string) => {
    try {
      const response = await request.get(`/survey/${surveyId}/stats`);
      if (response.code === 200) {
        return response.data;
      }
    } catch (error) {
      console.error('获取问卷统计失败:', error);
      throw error;
    }
  };

  // 获取用户答案
  const getUserAnswer = (surveyId: string, userId: number) => {
    return answers.value.find(a => a.surveyId === surveyId && a.userId === userId) || [];
  };

  // 删除问卷：
  const deleteSurvey = async (id: string) => {
    try {
      const response = await request.delete(`/survey/${id}`);
      if (response.code === 200) {
        await loadingData();
        return response.data;
      }
    } catch (error) {
      console.error('删除问卷失败:', error);
      throw error;
    }
  }
  const loadQuestions = async () => {
    try {
      const response = await request.get('/survey/questions');
      console.log("response.data;", response.data);
      if (response.code === 200) {
        questions.value = response.data?.map(item => ({
          ...item,
          surveyId: item.survey_id,
          questionType: item.question_type,
          sortOrder: item.sort_order,
          maxChoices: item.max_choices,
          options: options.value.filter(item2 => item2.questionId === item.id)
        })) || [];
      }
    } catch (error) {
      console.error('加载问题列表失败:', error);
      throw error;
    }
  }
  // 加载答案列表
  const loadAnswers = async () => {
    try {
      const response = await request.get('/survey/answers');
      if (response.code === 200) {
        answers.value = response.data.map((item: any) => ({
          ...item,
          surveyId: item.survey_id,
          userId: item.user_id,
          userName: item.user_name,
              // Start of Selection
          answers: item.answer_content.split(/,(?![^\[]*\])/).map((item2: string, index: number) => {
                // 查找是否存在左中括号 '['，用以判断答案是否为多选
                const _index = item2.indexOf('[');
                if (_index !== -1) {
                  return {
                    questionIndex: index,
                    value: item2.slice(_index + 1, -1).split(',')
                  }
                } else {
                  return {
                    questionIndex: index,
                    value: item2
                  }
                }
              }),
          submitTime: item.create_time,
        }));
      }
    } catch (error) {
        console.error('加载答案列表失败:', error);
        throw error;
    }
  }
  const loadOptions = async () => { 
    try {
      const response = await request.get('/survey/options');
      if (response.code === 200) {
        options.value = response.data.map((item: any) => ({
            ...item,
            id: item.id,
            questionId: item.question_id,
            optionContent: item.option_content,
            sortOrder: item.sort_order,
        }));
      }
    } catch (error) {
      console.error('加载选项列表失败:', error);
      throw error;
    }
  }
  // 加载数据
  const loadingData = async () => {
    await loadOptions();
    await loadQuestions();
    await loadAnswers();
    await loadSurveys();
  } 

  return {
    loadingData,
    surveys,
    answers,
    loadSurveys,
    loadQuestions,
    loadAnswers,
    loadOptions,
    addSurvey,
    getSurvey,
    getSurveyList,
    submitAnswer,
    getSurveyStats,
    getUserAnswer,
    getUserAnswers,
    getSurveyAnswers,
    updateSurveyStatus,
    checkSurveyStatus,
    deleteSurvey,
    loadSurveyAnswers,
  };
}); 