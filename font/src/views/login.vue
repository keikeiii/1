const submitForm = async () => {
    if (!loginForm.value) return;
    
    await loginForm.value.validate(async (valid: boolean) => {
        if (valid) {
            loading.value = true;
            try {
                const res = await login({
                    username: param.username,
                    password: param.password
                });
                
                if (res.code === 200) {
                    try {
                        // 先清除所有旧数据
                        localStorage.clear();
                        
                        // 存储 token
                        localStorage.setItem('vuems_token', res.data.token);
                        
                        // 获取用户信息
                        const userInfoRes = await getUserInfo();
                        
                        if (userInfoRes.code === 200) {
                            // 存储用户信息
                            localStorage.setItem('vuems_name', userInfoRes.data.userInfo.username);
                            localStorage.setItem('user_id', String(userInfoRes.data.userInfo.id));
                            
                            // 存储权限信息
                            const permissions = res.data.userInfo.permissions || [];
                            // 确保存储的是字符串类型的ID
                            permiss.handleSet(permissions.map(id => id.toString()));
                            
                            // 验证存储
                            const storedUsername = localStorage.getItem('vuems_name');
                            const storedUserId = localStorage.getItem('user_id');
                            
                            if (!storedUsername || !storedUserId) {
                                throw new Error('用户信息存储失败');
                            }
                            
                            // 等待一小段时间确保数据已存储
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // 刷新页面以确保状态重置
                            ElMessage.success('登录成功，即将跳转...');
                            setTimeout(() => {
                                window.location.href = '/';
                            }, 1000);
                        } else {
                            throw new Error('获取用户信息失败');
                        }
                    } catch (storageError) {
                        console.error('存储用户信息失败:', storageError);
                        ElMessage.error('用户信息存储失败');
                        localStorage.clear();
                    }
                } else {
                    ElMessage.error(res.msg);
                }
            } catch (error: any) {
                console.error('登录错误:', error);
                ElMessage.error(error.message || '登录失败');
            } finally {
                loading.value = false;
            }
        }
    });
}; 