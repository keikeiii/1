<template>
    <div class="dashboard-container">
        <!-- 轮播图部分 -->
        <el-carousel :interval="4000" type="card" height="400px" class="carousel">
            <el-carousel-item v-for="item in carouselImages" :key="item.id">
                <el-image :src="item.url" fit="cover" class="carousel-image">
                    <template #error>
                        <div class="image-placeholder">
                            <el-icon><Picture /></el-icon>
                        </div>
                    </template>
                </el-image>
            </el-carousel-item>
        </el-carousel>

        <!-- 使用指南部分 -->
        <div class="guide-section">
            <h2 class="section-title">社区服务指南</h2>
            <div class="guide-cards">
                <el-card 
                    v-for="guide in guides" 
                    :key="guide.id" 
                    class="guide-card" 
                    :body-style="{ padding: '0px' }"
                    shadow="hover"
                    @click="handleGuideClick(guide.path)"
                >
                    <div class="guide-content">
                        <el-icon class="guide-icon" :size="40">
                            <component :is="guide.icon" />
                        </el-icon>
                        <h3>{{ guide.title }}</h3>
                        <p>{{ guide.description }}</p>
                        <el-button type="primary" text>
                            {{ guide.buttonText }}
                            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                        </el-button>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Calendar, ChatDotRound, Bell, Picture, ArrowRight } from '@element-plus/icons-vue';

const router = useRouter();

// 轮播图数据
const carouselImages = ref([
    { id: 1, url: new URL('@/assets/img/community1.png', import.meta.url).href },
    { id: 2, url: new URL('@/assets/img/community2.jpg', import.meta.url).href },
    { id: 3, url: new URL('@/assets/img/community3.png', import.meta.url).href }
]);

// 指南卡片数据
const guides = ref([
    {
        id: 1,
        icon: Calendar,
        title: '参与社区活动',
        description: '浏览最新社区活动，在线报名参加各类精彩活动',
        buttonText: '查看活动',
        path: '/activity'
    },
    {
        id: 2,
        icon: ChatDotRound,
        title: '社区交流',
        description: '加入社区讨论，分享您的想法和建议',
        buttonText: '去交流',
        path: '/community'
    },
    {
        id: 3,
        icon: Bell,
        title: '服务申请',
        description: '在线申请各类社区服务，方便快捷',
        buttonText: '去申请',
        path: '/service-apply-form'
    }
]);

const handleGuideClick = (path: string) => {
    router.push(path);
};
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
}

.carousel {
    margin-bottom: 40px;
}

.carousel-image {
    width: 100%;
    height: 100%;
}

.image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
    color: #909399;
}

.section-title {
    text-align: center;
    margin-bottom: 30px;
    font-size: 24px;
    color: #303133;
}

.guide-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 0 20px;
}

.guide-card {
    cursor: pointer;
    transition: transform 0.3s;
}

.guide-card:hover {
    transform: translateY(-5px);
}

.guide-content {
    padding: 30px;
    text-align: center;
}

.guide-icon {
    color: var(--el-color-primary);
    margin-bottom: 15px;
}

.guide-content h3 {
    margin: 0 0 10px;
    font-size: 18px;
    color: #303133;
}

.guide-content p {
    margin: 0 0 20px;
    color: #606266;
    line-height: 1.6;
}
</style>
