<template>
    <div>
        <el-card class="mgb20" shadow="hover">
            <template #header>
                <div class="content-title">系统主题</div>
            </template>
            <div class="theme-list mgb20">
                <div class="theme-item" @click="setSystemTheme(item)" v-for="item in system"
                    :style="{ backgroundColor: item.color, color: '#fff' }">{{ item.name }}
                </div>
            </div>
            <div class="flex-center">
                <el-button @click="resetSystemTheme">重置主题</el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { useSidebarStore } from '@/store/sidebar';
import { useThemeStore } from '@/store/theme'
import { reactive } from 'vue';
const themeStore = useThemeStore();
const sidebar = useSidebarStore();

const system = [
    {
        name: '默认',
        color: '#242f42'
    },
    {
        name: '健康',
        color: '#1ABC9C'
    },
    {
        name: '优雅',
        color: '#722ed1'
    },
    {
        name: '热情',
        color: '#f44336'
    },
    {
        name: '宁静',
        color: '#00bcd4'
    }
]

const setSystemTheme = (data: any) => {
    if (data.name === '默认') {
        resetSystemTheme()
    } else {
        themeStore.setHeaderBgColor(data.color)
        themeStore.setHeaderTextColor('#fff')
        sidebar.setBgColor('#fff')
        sidebar.setTextColor('#5b6e88')
        themeStore.setPropertyColor(data.color, 'primary')
    }
}

const resetSystemTheme = () => {
    themeStore.resetTheme();
    localStorage.removeItem('header-bg-color')
    localStorage.removeItem('header-text-color')
    localStorage.removeItem('sidebar-bg-color')
    localStorage.removeItem('sidebar-text-color')
    location.reload()
}
</script>

<style scoped>
/* 添加标题样式 */
:deep(.el-card__header) {
    padding: 30px 20px;  /* 增加标题区域的上下内边距 */
}

.content-title {
    font-size: 18px;
    font-weight: bold;
    line-height: 40px;  /* 增加行高 */
}

.theme-list {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;  /* 适当减小内容区域高度，以平衡标题增高的部分 */
}

.theme-item {
    margin-right: 20px;
    padding: 30px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.3s;
}

.theme-item:hover {
    transform: translateY(-5px);
}

.theme-color {
    color: #787878;
    margin: 20px 0;
}

.flex-center {
    margin-top: 20px;
    margin-bottom: 20px;
}
</style>
