/// <reference types="@vue/runtime-core" />
/// <reference types="@vue/runtime-dom" />

declare module 'vue' {
    export { ref, reactive, computed, watch, onMounted, nextTick, onBeforeUnmount } from '@vue/runtime-core';
    export * from '@vue/runtime-core';
    export * from '@vue/runtime-dom';
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $message: typeof import('element-plus')['ElMessage'];
        $messageBox: typeof import('element-plus')['ElMessageBox'];
    }
}

export {}; 