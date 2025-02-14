export interface User {
  id: number;
  username: string;
  realName: string;
  roles: string[];
  buildingNo?: string;  // 楼栋号
  roomNo?: string;      // 房间号
  // ... 其他字段
}

export interface RegisterParams {
  username: string;
  password: string;
  realName: string;
  buildingNo: string;   // 楼栋号
  roomNo: string;       // 房间号
}