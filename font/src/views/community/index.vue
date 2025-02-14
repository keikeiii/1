<template>
    <div class="community-container">
        <!-- 发帖按钮和社区公约按钮 -->
        <div class="action-buttons">
            <el-button type="primary" @click="handleCreatePost">
                <el-icon><Plus /></el-icon>发帖
            </el-button>
            <el-button type="warning" @click="showRules">
                <el-icon><InfoFilled /></el-icon>社区公约
            </el-button>
        </div>

        <!-- 帖子列表 -->
        <div class="post-list">
            <el-card v-for="post in posts" :key="post.id" class="post-card">
                <div class="post-header">
                    <div class="user-info">
                        <el-avatar :size="40" :src="post.userAvatar">{{ post.userName?.charAt(0) || '匿名' }}</el-avatar>
                        <span class="username">{{ post.userName }}</span>
                    </div>
                    <div class="post-actions">
                        <span class="post-time">{{ formatTime(post.createTime) }}</span>
                        <!-- 添加删除按钮，只有admin可见 -->
                        <el-button 
                            v-if="isAdmin"
                            type="danger" 
                            link
                            @click="handleDeletePost(post)"
                        >
                            <el-icon><Delete /></el-icon>
                        </el-button>
                    </div>
                </div>
                <div class="post-content">
                    <h3 class="post-title" @click="viewPost(post)">{{ post.title }}</h3>
                    <p class="post-text">{{ post.content }}</p>
                    <!-- 添加图片展示 -->
                    <div class="post-images" v-if="post.images && post.images.length">
                        <el-image 
                            v-for="(img, index) in post.images" 
                            :key="index"
                            :src="img"
                            :preview-src-list="post.images"
                            class="post-image"
                        />
                    </div>
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                        <span 
                            class="stat-item clickable"
                            :class="{ 'is-liked': isLiked(post) }"
                            @click="handleLike(post)"
                        >
                            <el-icon><Star /></el-icon>
                            {{ post.likeCount }}
                        </span>
                        <span 
                            class="stat-item clickable"
                            @click="showComments(post)"
                        >
                            <el-icon><ChatDotRound /></el-icon>
                            {{ post.commentCount }}
                        </span>
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 发帖弹窗 -->
        <el-dialog
            title="发布帖子"
            v-model="dialogVisible"
            width="600px"
        >
            <el-form
                ref="postFormRef"
                :model="postForm"
                :rules="rules"
                label-width="80px"
            >
                <el-form-item label="标题" prop="title">
                    <el-input v-model="postForm.title" placeholder="请输入标题"></el-input>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <el-input
                        v-model="postForm.content"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入内容"
                    ></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitPost">发布</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 评论弹窗 -->
        <el-dialog
            :title="currentPost?.title"
            v-model="commentVisible"
            width="600px"
        >
            <div class="comment-container">
                <div class="comment-list" v-if="currentPost">
                    <div v-for="comment in currentPost.commentList" :key="comment.id" class="comment-item">
                        <!-- 主评论 -->
                        <div class="comment-header">
                            <span class="comment-user">{{ comment.userName }}</span>
                            <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                        </div>
                        <div class="comment-content">{{ comment.content }}</div>
                        <div class="comment-actions">
                            <el-button type="text" @click="replyTo(comment)">回复</el-button>
                        </div>

                        <!-- 回复列表 -->
                        <div class="reply-list" v-if="comment.replies?.length">
                            <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                                <div class="comment-header">
                                    <span class="comment-user">{{ reply.userName }}</span>
                                    <span class="comment-time">{{ formatTime(reply.createTime) }}</span>
                                </div>
                                <div class="comment-content">{{ reply.content }}</div>
                                <div class="comment-actions">
                                    <el-button type="text" @click="replyTo(comment)">回复</el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="no-comment" v-if="!currentPost.commentList?.length">
                        暂无评论
                    </div>
                </div>

                <!-- 评论输入框 -->
                <div class="comment-form">
                    <div class="reply-tip" v-if="replyComment">
                        回复 {{ replyComment.userName }}：
                        <el-button type="text" @click="cancelReply">取消回复</el-button>
                    </div>
                    <el-input
                        v-model="commentContent"
                        type="textarea"
                        :rows="3"
                        :placeholder="replyComment ? '写下你的回复...' : '写下你的评论...'"
                    />
                    <div class="comment-form-footer">
                        <el-button 
                            type="primary" 
                            @click="submitComment"
                            :disabled="!commentContent.trim()"
                        >
                            {{ replyComment ? '回复' : '发表评论' }}
                        </el-button>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 社区公约弹窗 -->
        <el-dialog
            title="社区公约"
            v-model="rulesVisible"
            width="65%"
            class="rules-dialog"
        >
            <div class="rules-content">
                <div class="rules-intro">
                    亲爱的居民们，欢迎来到社区广场！为打造真实、向上、多元的社区氛围，希望大家可以遵守规范，共同维护我们的社区环境。
                </div>

                <h3>一、价值观</h3>
                <p>本社区倡导用户发布符合当代社会主流价值观的内容。</p>
                <ol>
                    <li>遵守宪法和法律法规</li>
                    <li>践行社会主义核心价值观</li>
                    <li>弘扬爱国主义、集体主义和社会主义</li>
                    <li>传播正确的历史观、民族观、国家观和文化观</li>
                    <li>弘扬中华民族优秀传统文化</li>
                    <li>弘扬社会公德、职业道德、家庭和个人美德，尊重公序良俗</li>
                    <li>弘扬科学精神、普及科学知识</li>
                    <li>提倡积极健康向上的时代风尚和生活方式</li>
                </ol>

                <h3>二、法律法规</h3>
                <p>对于社区内违反法律法规、危害国家及社会安全的行为，将采用最严格的管理办法，予以杜绝。</p>
                <p>平台禁止发布和传播包含下列信息的内容：</p>
                <ol>
                    <li>违反宪法所确定的基本原则的</li>
                    <li>危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的</li>
                    <li>损害国家荣誉和利益的</li>
                    <li>煽动民族仇恨、民族歧视，破坏民族团结的</li>
                    <li>破坏国家宗教政策，宣扬邪教和封建迷信的</li>
                    <li>散布谣言，扰乱社会秩序，破坏社会稳定的</li>
                    <li>散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的</li>
                    <li>侮辱或者诽谤他人，侵害他人合法权益的</li>
                    <li>宣扬恐怖主义、极端主义或者煽动实施恐怖活动、极端主义活动的</li>
                    <li>侮辱滥用英烈形象，否定歪曲英烈事迹，美化或粉饰侵略者和侵略战争行为的</li>
                    <li>攻击诋毁党和国家领导人，捏造领导人负面信息，滥用领导人形象的</li>
                    <li>违背公序良俗的内容，如低俗婚闹等</li>
                    <li>含有法律、行政法规禁止的其他内容的</li>
                </ol>

                <h3>三、违规处理</h3>
                <h4>3.1 认定标准</h4>
                <p>符合下述任一的，可认定用户违规：</p>
                <ol>
                    <li>人工排查发现违反本规范情形的</li>
                    <li>系统对一定周期内的数据进行排查后，抓取到异常数据的</li>
                </ol>

                <h4>3.2 违规处理措施</h4>
                <p>平台会基于其独立认定的事实（违规性质、严重程度等），独立确定采取如下一项或几项处理措施的组合：</p>
                <ol>
                    <li>内容处理：删除内容、限制展示范围等</li>
                    <li>账号处理：限制账号功能、账号禁言、账号封禁等</li>
                </ol>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="rulesVisible = false">我已阅读并同意遵守</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, View, ChatDotRound, Star, Delete, InfoFilled } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { useCommunityStore, type PostComment, type Post } from '@/stores/community';

const communityStore = useCommunityStore();
const currentUserId = Number(localStorage.getItem('user_id')) || '';
const posts = computed(() => communityStore.posts);
console.log("posts", posts)
const dialogVisible = ref(false);
const postFormRef = ref<FormInstance>();

const postForm = reactive({
    title: '',
    content: '',
    images: [] as string[]
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

const handleCreatePost = () => {
    dialogVisible.value = true;
};

const submitPost = async () => {
  if (!postFormRef.value) return;

  await postFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await communityStore.addPost({
          title: postForm.title,
          content: postForm.content,
          images: postForm.images
        });

        ElMessage.success('发布成功');
        dialogVisible.value = false;
        postFormRef.value.resetFields();
        postForm.images = [];
        await communityStore.getPosts();
      } catch (error) {
        ElMessage.error('发布失败');
        console.error(error);
      }
    }
  });
};

const formatTime = (time: string) => {
    if(time) {
        return new Date(time).toLocaleString();
    }
    return "";
};

const viewPost = (post: Post) => {
    // TODO: 实现帖子详情查看功能
    console.log('查看帖子:', post);
};

// 评论相关
const commentVisible = ref(false);
const commentContent = ref('');
const currentPost = ref<Post | null>(null);

const showComments = async (post: Post) => {
    currentPost.value = post;
    console.log("currentPost", currentPost.value)
    try {
        const res = await communityStore.getPostComments(post.id);
        console.log("resxxxxxxx", res)
    } catch (error) {
        console.error('获取评论失败:', error);
        ElMessage.error('获取评论失败');
    }
    commentVisible.value = true;
};

const replyComment = ref<PostComment | null>(null);

const replyTo = (comment: PostComment) => {
    replyComment.value = comment;
};

const cancelReply = () => {
    replyComment.value = null;
    commentContent.value = '';
};

const submitComment = () => {
    if (!currentPost.value || !commentContent.value.trim()) return;
    console.log("replyComment", replyComment.value)
    communityStore.addComment(currentPost.value.id, {
        postId: currentPost.value.id,
        userId: currentUserId,
        userName: localStorage.getItem('vuems_name') || '匿名用户',
        content: replyComment.value 
            ? `@${replyComment.value.userName} ${commentContent.value}`
            : commentContent.value,
        parentId: replyComment.value?.id
    });

    commentContent.value = '';
    replyComment.value = null;
    ElMessage.success(replyComment.value ? '回复成功' : '评论成功');
};

// 点赞相关
const isLiked = (post: Post) => {
  return post.likedUsers?.includes(Number(currentUserId)) || false;
};

const handleLike = async (post: Post) => {
    await communityStore.toggleLike(post.id, Number(currentUserId));
    await communityStore.getPosts();
};

// 判断是否为admin
const isAdmin = computed(() => {
    return localStorage.getItem('vuems_name') === 'admin';
});

// 删除帖子方法
const handleDeletePost = (post: Post) => {
    ElMessageBox.confirm(
        '确定要删除这个帖子吗？',
        '警告',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        communityStore.deletePost(post.id);
        ElMessage.success('删除成功');
        communityStore.getPosts();
    }).catch(() => {});
};

// 添加社区公约相关变量
const rulesVisible = ref(false);

// 显示社区公约
const showRules = () => {
    rulesVisible.value = true;
};

onMounted(() => {
    // 先清除旧数据
    communityStore.clearPosts();
    // 重新加载示例帖子
    communityStore.getPosts();
});
</script>

<style scoped>
.community-container {
    padding: 20px;
}

.post-button {
    margin-bottom: 20px;
}

.post-card {
    margin-bottom: 20px;
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.user-info {
    display: flex;
    align-items: center;
}

.username {
    margin-left: 10px;
    font-weight: bold;
}

.post-time {
    color: #999;
    font-size: 14px;
}

.post-title {
    margin: 0 0 10px;
    cursor: pointer;
    color: #303133;
}

.post-title:hover {
    color: #409EFF;
}

.post-text {
    margin: 0;
    color: #606266;
    line-height: 1.6;
}

.post-footer {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #EBEEF5;
}

.post-stats {
    display: flex;
    gap: 20px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #909399;
}

.stat-item .el-icon {
    font-size: 16px;
}

.is-liked {
    color: #e6a23c !important;
}

.comment-container {
    max-height: 60vh;
    display: flex;
    flex-direction: column;
}

.comment-list {
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;
}

.comment-item {
    padding: 10px 0;
    border-bottom: 1px solid #EBEEF5;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.comment-user {
    font-weight: bold;
}

.comment-time {
    color: #909399;
    font-size: 12px;
}

.comment-content {
    color: #606266;
    line-height: 1.6;
}

.no-comment {
    text-align: center;
    color: #909399;
    padding: 20px 0;
}

.comment-form {
    margin-top: 20px;
}

.comment-form-footer {
    margin-top: 10px;
    text-align: right;
}

.stat-item.clickable {
    cursor: pointer;
}

.stat-item.clickable:hover {
    color: #409EFF;
}

.post-images {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.post-image {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
    cursor: pointer;
}

.post-uploader {
    :deep(.el-upload--picture-card) {
        width: 100px;
        height: 100px;
        line-height: 100px;
    }
}

.reply-list {
    margin-left: 20px;
    margin-top: 8px;
    border-left: 2px solid #ebeef5;
    padding-left: 10px;
}

.reply-item {
    margin-top: 8px;
    padding: 8px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.comment-actions {
    margin-top: 4px;
}

.reply-tip {
    margin-bottom: 8px;
    color: #409EFF;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.post-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-buttons {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
}

.rules-dialog :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
}

.rules-content {
    line-height: 1.8;
    color: #606266;
}

.rules-intro {
    margin-bottom: 0;
    font-size: 15px;
    color: #303133;
}

.rules-content h3 {
    margin: 25px 0 15px;
    color: #303133;
    font-size: 18px;
    margin-top: 10px;
}

.rules-content h4 {
    margin: 20px 0 10px;
    color: #303133;
    font-size: 16px;
}

.rules-content p {
    margin: 10px 0;
}

.rules-content ol {
    margin: 10px 0;
    padding-left: 20px;
}

.rules-content li {
    margin-bottom: 8px;
}

.dialog-footer {
    text-align: center;
    width: 100%;
    display: block;
}
:deep(.el-dialog) {
    width: 40% !important;
    padding-top: 30px;
    padding-left: 30px;
}

:deep(.el-dialog__title) {
    font-size: 22px;
    font-weight: bold;
}
</style> 