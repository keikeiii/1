<template>
    <div class="sidebar">
        <el-menu
            class="sidebar-el-menu"
            :default-active="onRoutes"
            :collapse="sidebar.collapse"
            :background-color="sidebar.bgColor"
            :text-color="sidebar.textColor"
            router
        >
            <template v-for="item in filteredMenuData" :key="item.index">
                <template v-if="item.children">
                    <el-sub-menu :index="item.index">
                        <template #title>
                            <i :class="item.icon" v-if="typeof item.icon === 'string' && item.icon.includes('el-icon-lx-')"></i>
                            <el-icon v-else>
                                <component :is="item.icon"></component>
                            </el-icon>
                            <span>{{ item.title }}</span>
                        </template>
                        <template v-for="subItem in item.children" :key="subItem.index">
                            <el-sub-menu
                                v-if="subItem.children"
                                :index="subItem.index"
                            >
                                <template #title>{{ subItem.title }}</template>
                                <el-menu-item
                                    v-for="threeItem in subItem.children"
                                    :key="threeItem.index"
                                    :index="threeItem.index"
                                >
                                    {{ threeItem.title }}
                                </el-menu-item>
                            </el-sub-menu>
                            <el-menu-item v-else :index="subItem.index">
                                {{ subItem.title }}
                            </el-menu-item>
                        </template>
                    </el-sub-menu>
                </template>
                <template v-else>
                    <el-menu-item :index="item.index">
                        <i :class="item.icon" v-if="typeof item.icon === 'string' && item.icon.includes('el-icon-lx-')"></i>
                        <el-icon v-else>
                            <component :is="item.icon"></component>
                        </el-icon>
                        <template #title>{{ item.title }}</template>
                    </el-menu-item>
                </template>
            </template>
        </el-menu>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSidebarStore } from '../store/sidebar';
import { usePermissStore } from '../store/permiss';
import { menuData } from '@/components/menu';

const route = useRoute();
const permiss = usePermissStore();
const sidebar = useSidebarStore();

const onRoutes = computed(() => {
    return route.path;
});

const filteredMenuData = computed(() => {
    const username = localStorage.getItem('vuems_name');
    const permissions = permiss.key;
    
    console.log('权限列表:', permissions);
    
    if (username === 'admin') {
        return menuData;
    }
    
    // 创建一个新数组来存储过滤后的菜单
    const filteredMenu = [];
    
    // 遍历原始菜单数据
    menuData.forEach(item => {
        if (item.children) {
            // 过滤有权限的子菜单
            const filteredChildren = item.children.filter(child => 
                permissions.includes(child.id.toString())
            );
            
            // 如果有可访问的子菜单，创建新的父菜单对象
            if (filteredChildren.length > 0) {
                // 只保留必要的属性
                filteredMenu.push({
                    id: item.id,
                    title: item.title,
                    index: item.index,
                    icon: item.icon,
                    children: filteredChildren.map(child => ({
                        id: child.id,
                        title: child.title,
                        index: child.index,
                        icon: child.icon,
                        pid: child.pid
                    }))
                });
            }
        } else if (permissions.includes(item.id.toString())) {
            // 如果是叶子节点且有权限，直接添加
            filteredMenu.push({
                id: item.id,
                title: item.title,
                index: item.index,
                icon: item.icon
            });
        }
    });
    
    console.log('过滤后的菜单:', filteredMenu);
    return filteredMenu;
});

console.log('菜单数据:', menuData);
console.log('当前权限:', permiss.key);
console.log('过滤后菜单:', filteredMenuData.value);
console.log('current route:', route.path);

// 添加权限变化监听，输出更详细的日志
watch(() => permiss.key, (newVal) => {
    console.log('权限列表变化:', newVal);
    const result = filteredMenuData.value;
    console.log('菜单过滤结果:', result.map(item => ({
        id: item.id,
        title: item.title,
        children: item.children?.map(child => ({
            id: child.id,
            title: child.title
        }))
    })));
}, { immediate: true });

// 添加菜单数据监听
watch(() => menuData, (newVal) => {
    console.log('原始菜单数据:', newVal);
}, { immediate: true });
</script>

<style scoped>
.sidebar {
    display: block;
    position: absolute;
    left: 0;
    top: 70px;
    bottom: 0;
    overflow-y: scroll;
}

.sidebar::-webkit-scrollbar {
    width: 0;
}

.sidebar-el-menu:not(.el-menu--collapse) {
    width: 250px;
}

.sidebar-el-menu {
    min-height: 100%;
}
</style>
