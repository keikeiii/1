export interface Menus {
    id: number;
    pid?: number;
    icon?: string;
    index: string;
    title: string;
    permiss?: string;
    children?: Menus[];
}