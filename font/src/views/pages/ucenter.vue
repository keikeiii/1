<template>
    <div>
        <div class="user-container">
            <el-card class="user-profile" shadow="hover" :body-style="{ padding: '0px' }">
                <div class="user-profile-bg"></div>
                <div class="user-avatar-wrap">
                    <el-avatar class="user-avatar" :size="120" :src="avatarImg" />
                </div>
                <div class="user-info">
                    <div class="info-name">{{ profileForm.nickname || '未设置昵称' }}</div>
                    <div class="info-desc">
                        <span>{{ profileForm.realName || '未设置姓名' }}</span>
                        <el-divider direction="vertical" />
                        <span>{{ profileForm.phone || '未设置电话' }}</span>
                    </div>
                    <div class="info-desc">
                        {{ profileForm.building || '未设置楼栋' }} - {{ profileForm.room || '未设置房间' }}
                    </div>
                </div>
            </el-card>
            <el-card
                class="user-content"
                shadow="hover"
                :body-style="{ padding: '20px 50px', height: '100%', boxSizing: 'border-box' }"
            >
                <el-tabs tab-position="left" v-model="activeName">
                    <el-tab-pane name="label1" label="消息通知" class="user-tabpane">
                        <MessageList />
                    </el-tab-pane>
                    <el-tab-pane name="label2" label="修改资料" class="user-tabpane">
                        <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px">
                            <el-form-item label="昵称" prop="nickname">
                                <el-input v-model="profileForm.nickname" placeholder="请输入昵称"></el-input>
                            </el-form-item>
                            <el-form-item label="真实姓名" prop="realName">
                                <el-input v-model="profileForm.realName" placeholder="请输入真实姓名"></el-input>
                            </el-form-item>
                            <el-form-item label="电话" prop="phone">
                                <el-input v-model="profileForm.phone" placeholder="请输入电话"></el-input>
                            </el-form-item>
                            <el-form-item label="楼栋号" prop="building">
                                <el-input v-model="profileForm.building" placeholder="请输入楼栋号"></el-input>
                            </el-form-item>
                            <el-form-item label="房间号" prop="room">
                                <el-input v-model="profileForm.room" placeholder="请输入房间号"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="updateProfile">保存修改</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                    <el-tab-pane name="label3" label="我的头像" class="user-tabpane">
                        <div class="crop-wrap" v-if="activeName === 'label3'">
                            <vueCropper
                                ref="cropper"
                                :img="imgSrc"
                                :autoCrop="true"
                                :centerBox="true"
                                :full="true"
                                mode="contain"
                            >
                            </vueCropper>
                        </div>
                        <el-button class="crop-demo-btn" type="primary"
                            >选择图片
                            <input class="crop-input" type="file" name="image" accept="image/*" @change="setImage" />
                        </el-button>
                        <el-button type="success" @click="saveAvatar">上传并保存</el-button>
                    </el-tab-pane>
                    <el-tab-pane name="label4" label="修改密码" class="user-tabpane">
                        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                            <el-form-item label="旧密码" prop="old">
                                <el-input type="password" v-model="form.old" placeholder="请输入旧密码"></el-input>
                            </el-form-item>
                            <el-form-item label="新密码" prop="new">
                                <el-input type="password" v-model="form.new" placeholder="请输入新密码"></el-input>
                            </el-form-item>
                            <el-form-item label="确认密码" prop="new1">
                                <el-input type="password" v-model="form.new1" placeholder="请确认新密码"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="onSubmit">保存修改</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="ucenter">
import { reactive, ref, onMounted } from 'vue';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import avatar from '@/assets/img/img.jpg';
import TabsComp from '../element/tabs.vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import MessageList from '@/components/MessageList.vue';
import { storeToRefs } from 'pinia';
const userStore = useUserStore();
const { userId } = storeToRefs(userStore);

const name = localStorage.getItem('vuems_name');
const form = reactive({
    old: '',
    new: '',
    new1: ''
});

const rules = {
    old: [
        { required: true, message: '请输入原密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    new: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    new1: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
        {
            validator: (rule: any, value: string, callback: Function) => {
                if (value !== form.new) {
                    callback(new Error('两次输入的密码不一致'));
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ]
};

const formRef = ref<FormInstance>();

const onSubmit = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate((valid) => {
        if (valid) {
            if (!userId.value) {
                ElMessage.error('用户未登录');
                return;
            }

            try {
              // changePassword
                userStore.changePassword({
                    id: Number(userId.value),
                    oldPassword: form.old,
                    newPassword: form.new
                });
                ElMessage.success('密码修改成功');
                formRef.value?.resetFields();
            } catch (error: any) {
                ElMessage.error(error.message || '密码修改失败');
            }
        }
    });
};

const activeName = ref('label1');

const avatarImg = ref(avatar);
const imgSrc = ref(avatar);
const cropImg = ref('');
const cropper: any = ref();

const setImage = (e: any) => {
    const file = e.target.files[0];
    if (!file.type.includes('image/')) {
        return;
    }
    const reader = new FileReader();
    reader.onload = (event: any) => {
        imgSrc.value = event.target.result;
        cropper.value && cropper.value.replace(event.target.result);
    };
    reader.readAsDataURL(file);
};

const cropImage = () => {
    cropImg.value = cropper.value?.getCroppedCanvas().toDataURL();
};

const saveAvatar = () => {
    if (!cropper.value) {
        ElMessage.warning('请先选择图片');
        return;
    }
    
    try {
        cropper.value.getCropData((data: string) => {
            cropImg.value = data;
            // 更新头像显示
            avatarImg.value = cropImg.value;
            // 保存到 localStorage
            localStorage.setItem('vuems_avatar', cropImg.value);
            // 更新全局头像
            userStore.setAvatar(cropImg.value);
            ElMessage.success('头像保存成功');
        });
    } catch (error) {
        console.error('头像保存失败:', error);
        ElMessage.error('头像保存失败');
    }
};

// 个人资料表单
const profileFormRef = ref<FormInstance>();
const profileForm = reactive({
    nickname: '',
    realName: '',
    phone: '',
    building: '',
    room: ''
});

// 表单验证规则
const profileRules = {
    nickname: [
        { required: true, message: '请输入昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: '请输入电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    building: [
        { required: true, message: '请输入楼栋号', trigger: 'blur' }
    ],
    room: [
        { required: true, message: '请输入房间号', trigger: 'blur' }
    ]
};

// 更新个人资料
const updateProfile = async () => {
    if (!profileFormRef.value) return;
    
    await profileFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                await userStore.updateUserProfile({
                    id: Number(localStorage.getItem('user_id')),
                    nickname: profileForm.nickname,
                    realName: profileForm.realName,
                    phone: profileForm.phone,
                    buildingNo: profileForm.building,
                    roomNo: profileForm.room
                });
                
                ElMessage.success('资料修改成功');
            } catch (error: any) {
                ElMessage.error(error.message || '资料修改失败');
            }
        }
    });
};

// 初始化表单数据
onMounted(() => {
    // 从 localStorage 获取用户名和手机号
    profileForm.nickname = localStorage.getItem('vuems_name') || '未设置昵称';
    profileForm.realName = localStorage.getItem('vuems_real_name') || '未设置昵称';
    profileForm.phone = localStorage.getItem('vuems_phone') || '未设置电话';
    profileForm.building = localStorage.getItem('vuems_building_no') || '未设置楼栋';
    profileForm.room = localStorage.getItem('vuems_room_no') || '未设置房间';

    const savedAvatar = localStorage.getItem('vuems_avatar');
    if (savedAvatar) {
        avatarImg.value = savedAvatar;
        imgSrc.value = savedAvatar;
    }
});
</script>

<style scoped>
.user-container {
    display: flex;
}

.user-profile {
    position: relative;
}

.user-profile-bg {
    width: 100%;
    height: 200px;
    background-image: url('../../assets/img/ucenter-bg.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.user-profile {
    width: 500px;
    margin-right: 20px;
    flex: 0 0 auto;
    align-self: flex-start;
}

.user-avatar-wrap {
    position: absolute;
    top: 135px;
    width: 100%;
    text-align: center;
}

.user-avatar {
    border: 5px solid #fff;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 7px 12px 0 rgba(62, 57, 107, 0.16);
}

.user-info {
    text-align: center;
    padding: 80px 0 30px;
}

.info-name {
    margin: 0 0 20px;
    font-size: 22px;
    font-weight: 500;
    color: #373a3c;
}

.info-desc {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
    color: #606266;
}

.info-desc span {
    font-size: 14px;
}

.user-content {
    flex: 1;
}

.user-tabpane {
    padding: 10px 20px;
}

.crop-wrap {
    width: 600px;
    height: 350px;
    margin-bottom: 20px;
}

.crop-demo-btn {
    position: relative;
}

.crop-input {
    position: absolute;
    width: 100px;
    height: 40px;
    left: 0;
    top: 0;
    opacity: 0;
    cursor: pointer;
}

.w500 {
    width: 500px;
}

.el-form {
    max-width: 500px;
}
</style>

<style>
.el-tabs.el-tabs--left {
    height: 100%;
}
</style>
