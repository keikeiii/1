<template>
  <div class="container" v-if="!loading">
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="`未读消息(${unreadNotices.length})`" name="unread">
        <div class="message-list">
          <div v-for="notice in unreadNotices" :key="notice.id" class="message-item">
            <div class="message-header">
              <el-button link type="primary" @click="showMessage(notice)"
                class="message-title">{{ notice.title }}</el-button>
              <div class="message-right">
                <span class="message-date">{{ formatTime(notice.create_time) }}</span>
                <el-button size="small" @click="noticeStore.markAsRead(notice.id)" class="read-button">标为已读</el-button>
              </div>
            </div>
          </div>
          <div class="handle-row" v-if="unreadNotices.length > 0">
            <el-button type="primary" @click="noticeStore.markAllAsRead">全部标为已读</el-button>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="`已读消息(${readNotices.length})`" name="read">
        <div class="message-list">
          <div v-for="notice in readNotices" :key="notice.id" class="message-item">
            <div class="message-header">
              <el-button link type="info" @click="showMessage(notice)"
                class="message-title">{{ notice.title }}</el-button>
              <span class="message-date">{{ formatTime(notice.create_time) }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="currentMessage.title" width="30%">
      <span>{{ currentMessage.content }}</span>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">

import { ref, computed, onBeforeMount } from 'vue';
import { ElMessage } from 'element-plus';
import { useNoticeStore } from '@/stores/notice';
import type { Notice } from '@/stores/notice';
import { storeToRefs } from 'pinia';
const noticeStore = useNoticeStore();
const { notices, unreadNotices, readNotices } = storeToRefs(noticeStore);
const activeTab = ref('unread');
const dialogVisible = ref(false);
const currentMessage = ref<Notice>({} as Notice);
const loading = ref(false);
// 从localStorage获取已读消息ID列表
const getReadNoticeIds = () => {
    return JSON.parse(localStorage.getItem('readNoticeIds') || '[]');
};

const formatTime = computed(() => (time: string) => {
  // 处理后端返回的 MySQL datetime 格式
  // time + 8 hours
  let date;
  if (!time) {
    time = new Date().toISOString();
    date = new Date(time);
  } else {
    date = new Date(time);
    date.setHours(date.getHours() + 8);
  }
 
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

const showMessage = (notice: Notice) => {
    currentMessage.value = notice;
    dialogVisible.value = true;
};

onBeforeMount(async () => {
  try {
      loading.value = true;
      await noticeStore.getNotices();
      loading.value = false;
        
    } catch (error: any) {
        ElMessage.error(error.message || '获取通知列表失败');
    }
});
</script>

<style scoped>
.message-list {
    padding: 0 20px;
}

.message-item {
    padding: 15px 0;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 10px;
}

.message-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.message-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.message-title {
    font-size: 16px;
    margin-right: 10px;
}

.message-date {
    color: #909399;
    font-size: 14px;
}

.handle-row {
    margin-top: 20px;
    text-align: center;
}

.read-button {
    margin-left: 10px;
}
</style> 