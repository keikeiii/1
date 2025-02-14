import { defineStore } from 'pinia';

export const usePermissStore = defineStore('permiss', {
    state: () => {
        const keys = localStorage.getItem('vuems_permissions');
        return {
            key: keys ? JSON.parse(keys) : [],
            defaultList: {
                admin: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
                user: ['1', '2', '3', '11', '13', '14', '15']
            }
        };
    },
    actions: {
        handleSet(val: string[]) {
            this.key = val;
            localStorage.setItem('vuems_permissions', JSON.stringify(val));
        },
        handleGet(key: string) {
            return this.key.includes(key);
        },
        handleRemove() {
            this.key = [];
            localStorage.removeItem('vuems_permissions');
        }
    }
});
