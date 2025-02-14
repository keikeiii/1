import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { usePermissStore } from '../store/permiss';
import Home from '../views/home.vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/',
        name: 'Home',
        component: Home,
        children: [
            {
                path: '/dashboard',
                name: 'dashboard',
                meta: {
                    title: '系统首页',
                    permiss: '1'
                },
                component: () => import('../views/dashboard.vue')
            },
            {
                path: '/system-user',
                name: 'system-user',
                meta: {
                    title: '用户管理',
                    permission: '21'
                },
                component: () => import(/* webpackChunkName: "system-user" */ '../views/system/user.vue'),
            },
            {
                path: '/system-role',
                name: 'system-role',
                meta: {
                    title: '角色管理',
                    permission: '22'
                },
                component: () => import(/* webpackChunkName: "system-role" */ '../views/system/role.vue'),
            },
            {
                path: '/ucenter',
                name: 'ucenter',
                meta: {
                    title: '个人中心',
                },
                component: () => import(/* webpackChunkName: "ucenter" */ '../views/pages/ucenter.vue'),
            },
            {
                path: '/theme',
                name: 'theme',
                meta: {
                    title: '主题设置',
                    permiss: '7',
                },
                component: () => import(/* webpackChunkName: "theme" */ '../views/pages/theme.vue'),
            },
            {
                path: '/activity-list',
                name: 'activity-list',
                meta: {
                    title: '活动管理'
                    // permiss: '5'
                },
                component: () => import('../views/activity/list.vue')
            },
            {
                path: '/service-apply', 
                name: 'service-apply',
                meta: {
                    title: '申请列表'
                    // permiss: '6'
                },
                component: () => import('../views/service/apply.vue')
            },
            {
                path: '/activity',
                name: 'activity',
                meta: {
                    title: '活动列表'
                },
                component: () => import(/* webpackChunkName: "activity" */ '../views/activity/index.vue')
            },
            {
                path: '/service-apply-form',
                name: 'service-apply-form',
                meta: {
                    title: '新增申请'
                },
                component: () => import('../views/service/apply-form.vue')
            },
            {
                path: '/service-my-apply',
                name: 'my-apply',
                meta: {
                    title: '申请中心'
                },
                component: () => import('../views/service/my-apply.vue')
            },
            {
                path: '/activity-my-activity',
                name: 'my-activity',
                meta: {
                    title: '活动记录'
                },
                component: () => import('../views/activity/my-activity.vue')
            },
            {
                path: '/community',
                name: 'Community',
                component: () => import('@/views/community/index.vue'),
                meta: {
                    title: '社区广场',
                    icon: 'ChatDotRound'
                }
            },
            {
                path: '/feedback',
                name: 'feedback',
                meta: {
                    title: '意见反馈'
                },
                component: () => import('@/views/feedback/index.vue')
            },
            {
                path: '/feedback-manage',
                name: 'feedback-manage',
                meta: {
                    title: '反馈处理'
                },
                component: () => import('@/views/feedback/manage.vue')
            },
            {
                path: '/survey-publish',
                name: 'survey-publish',
                component: () => import('@/views/survey/publish.vue'),
                meta: {
                    title: '问卷发布'
                }
            },
            {
                path: '/survey-list',
                name: 'survey-list',
                component: () => import('@/views/survey/list.vue'),
                meta: {
                    title: '问卷列表'
                }
            },
            {
                path: '/resource-manage',
                name: 'resource-manage',
                component: () => import('@/views/resource/manage.vue'),
                meta: {
                    title: '资源管理'
                }
            },
            {
                path: '/notice-publish',
                name: 'notice-publish',
                meta: {
                    title: '发布通知'
                },
                component: () => import('../views/notice/publish.vue')
            }
        ],
    },
    {
        path: '/login',
        name: 'Login',
        meta: {
            title: '登录',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/pages/login.vue'),
    },
    {
        path: '/register',
        name: 'register',
        meta: {
            title: '注册'
        },
        component: () => import('../views/pages/register.vue')
    },
    {
        path: '/reset-pwd',
        meta: {
            title: '重置密码',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "reset-pwd" */ '../views/pages/reset-pwd.vue'),
    },
    {
        path: '/403',
        name: '403',
        meta: {
            title: '没有权限',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "403" */ '../views/pages/403.vue'),
    },
    {
        path: '/404',
        meta: {
            title: '找不到页面',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "404" */ '../views/pages/404.vue'),
    },
    { path: '/:path(.*)', redirect: '/404' },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    NProgress.start();
    document.title = `${to.meta.title} | 社区服务系统`;
    const permiss = usePermissStore();
    const token = localStorage.getItem('vuems_token');

    if (!token && to.path !== '/login' && to.path !== '/register') {
        next('/login');
    } else if (to.meta.permiss && !permiss.handleGet(to.meta.permiss as string)) {
        next('/403');
    } else {
        next();
    }
});

router.afterEach(() => {
    NProgress.done();
});

export default router;
