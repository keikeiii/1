<template>
	<div class="container">
		<el-tabs v-model="message">
			<el-tab-pane :label="`未读消息(${unread.length})`" name="first">
				<div class="message-list">
					<div v-for="(item, index) in unread" :key="index" class="message-item">
						<div class="message-header">
							<el-button 
								link 
								type="primary" 
								@click="showMessage(item)"
								class="message-title"
							>{{ item.title }}</el-button>
							<div class="message-right">
								<span class="message-date">{{ item.date }}</span>
								<el-button 
									size="small" 
									@click="handleRead(index)"
									class="read-button"
								>标为已读</el-button>
							</div>
						</div>
					</div>
				</div>
				<div class="handle-row" v-if="unread.length > 0">
					<el-button type="primary" @click="handleAll">全部标为已读</el-button>
				</div>
			</el-tab-pane>
			<el-tab-pane :label="`已读消息(${read.length})`" name="second">
				<div class="message-list">
					<div v-for="(item, index) in read" :key="index" class="message-item">
						<div class="message-header">
							<el-button 
								link 
								type="info" 
								@click="showMessage(item)"
								class="message-title"
							>{{ item.title }}</el-button>
							<span class="message-date">{{ item.date }}</span>
						</div>
					</div>
				</div>
			</el-tab-pane>
		</el-tabs>

		<!-- 消息详情弹窗 -->
		<el-dialog
			v-model="dialogVisible"
			:title="currentMessage.title"
			width="30%"
		>
			<span>{{ currentMessage.message }}</span>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="tabs">
import { ref, onMounted } from 'vue';

interface Message {
	date: string;
	title: string;
	message: string;
}

const message = ref('first');
const dialogVisible = ref(false);
const currentMessage = ref<Message>({
	date: '',
	title: '',
	message: ''
});

const unread = ref<Message[]>([]);
const read = ref<Message[]>([]);

// 初始化时从localStorage加载通知
onMounted(() => {
	const notices = JSON.parse(localStorage.getItem('notices') || '[]');
	unread.value = notices.map((notice: any) => ({
		date: notice.date,
		title: notice.title,
		message: notice.message
	}));
});

const handleRead = (index: number) => {
	const notice = unread.value[index];
	read.value.push(notice);
	unread.value.splice(index, 1);
	
	// 保存已读消息到localStorage
	const readNotices = JSON.parse(localStorage.getItem('read_notices') || '[]');
	readNotices.push(notice);
	localStorage.setItem('read_notices', JSON.stringify(readNotices));
	
	// 触发自定义事件通知消息数量更新
	window.dispatchEvent(new Event('unread-messages-updated'));
};

const handleAll = () => {
	read.value = [...read.value, ...unread.value];
	
	// 保存所有消息为已读
	const readNotices = JSON.parse(localStorage.getItem('read_notices') || '[]');
	const newReadNotices = [...readNotices, ...unread.value];
	localStorage.setItem('read_notices', JSON.stringify(newReadNotices));
	
	unread.value = [];
	
	// 触发自定义事件通知消息数量更新
	window.dispatchEvent(new Event('unread-messages-updated'));
};

const showMessage = (msg: Message) => {
	currentMessage.value = msg;
	dialogVisible.value = true;
};
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
	align-items: center;
	justify-content: space-between;
}

.message-title {
	font-size: 14px;
	flex: 1;
	text-align: left;
	padding: 0;
	justify-content: flex-start;
}

.message-right {
	display: flex;
	align-items: center;
	gap: 20px;
}

.message-date {
	color: #909399;
	font-size: 12px;
}

.handle-row {
	margin-top: 20px;
	padding: 0 20px;
}

/* 覆盖 element-plus 的默认样式 */
:deep(.el-button--link) {
	justify-content: flex-start;
	padding: 0;
}

.container {
	border: 0;
	padding-top: 0;
}
</style>
