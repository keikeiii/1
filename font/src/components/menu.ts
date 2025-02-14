import { Menus } from '@/types/menu';

export const menuData: Menus[] = [
    {
        id: 1,
        title: '系统首页',
        index: '/dashboard',
        icon: 'Odometer',
    },
    {
        id: 2,
        title: '系统管理',
        index: '2',
        icon: 'HomeFilled',
        children: [
            {
                id: 21,
                pid: 2,
                index: '/system-user',
                title: '用户管理',
            },
            {
                id: 22,
                pid: 2,
                index: '/system-role',
                title: '角色管理',
            },
        ],
    },
    {
        id: 3,
        icon: 'Notification',
        index: '/notice-publish',
        title: '发布通知'
    },
    {
        id: 4,
        icon: 'DocumentAdd',
        index: '/resource-manage',
        title: '资源管理'
    },
    {
        id: 5, 
        title: '活动中心',
        index: '5',
        icon: 'Basketball',
        children: [
            {
                id: 51,
                pid: 5,
                index: '/activity-list',
                title: '活动管理' 
            },
            {
                id: 52,
                pid: 5,
                index: '/activity',
                title: '活动列表' 
            },
            {
                id: 53,
                pid: 5,
                index: '/activity-my-activity',
                title: '活动记录' 
            }
        ]
    },
    {
        id: 6, 
        title: '服务申请',
        index: '6',
        icon: 'Service',
        children: [
            {
                id: 61,
                pid: 6,
                index: '/service-apply',
                title: '申请列表' 
            },
            {
                id: 62,
                pid: 6,
                index: '/service-apply-form',
                title: '新增申请' 
            },
            {
                id: 63,
                pid: 6,
                index: '/service-my-apply',
                title: '申请中心' 
            },
        ]
    },
    {
        id: 7,
        icon: 'ChatDotRound',
        index: '/community',
        title: '社区广场',
    },
    {
        id: 8,
        icon: 'ChatLineSquare',
        index: '8',
        title: '意见中心',
        children: [
            {
                id: 81,
                pid: 8,
                index: '/feedback',
                title: '意见反馈',
            },
            {
                id: 82,
                pid: 8,
                index: '/feedback-manage',
                title: '反馈处理',
            }
        ]
    },
    {
        id: 9,
        icon: 'Document',
        index: '9',
        title: '民意征集',
        children: [
            {
                id: 91,
                pid: 9,
                index: '/survey-publish',
                title: '问卷发布'
            },
            {
                id: 92,
                pid: 9,
                index: '/survey-list',
                title: '问卷列表'
            }
        ]
    }
];
