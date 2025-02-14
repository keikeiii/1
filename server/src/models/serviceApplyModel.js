const db = require('../config/database');

class ServiceApply {
    static async create(applyData) {
        // 确保 useTime 是 JSON 字符串
        const useTimeJson = applyData.useTime ? JSON.stringify(applyData.useTime) : null;

        const [result] = await db.query(
            `INSERT INTO service_apply 
            (user_id, user_name, service_type, service_detail, description, 
             building, room, phone, resource_id, use_time, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                applyData.user_id,
                applyData.user_name,
                applyData.type,
                applyData.detail,
                applyData.remark,
                applyData.building,
                applyData.room,
                applyData.phone,
                applyData.resourceId,
                useTimeJson,  // 使用转换后的 JSON 字符串
                0
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await db.query(
            'SELECT * FROM service_apply ORDER BY create_time DESC'
        );
        return rows.map(this.formatApply);
    }

    static async findByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM service_apply WHERE user_id = ? ORDER BY create_time DESC',
            [userId]
        );
        return rows.map(this.formatApply);
    }

    // static async updateStatus(id, status) {
    //     const [result] = await db.query(
    //         'UPDATE service_apply SET status = ? WHERE id = ?',
    //         [status, id]
    //     );

    //     // 如果是资源申请且状态改为已通过，则添加资源预订记录
    //     if (status === 1) {
    //         const [applyData] = await db.query(
    //             'SELECT * FROM service_apply WHERE id = ?',
    //             [id]
    //         );
            
    //         if (applyData[0] && applyData[0].resource_id) {
    //             const useTime = JSON.parse(applyData[0].use_time);
    //             await db.query(
    //                 `INSERT INTO resource_booking
    //                 (resource_id, application_id, user_id, user_name,
    //                  start_time, end_time, status)
    //                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
    //                 [
    //                     applyData[0].resource_id,
    //                     id,
    //                     applyData[0].user_id,
    //                     applyData[0].user_name,
    //                     useTime[0],
    //                     useTime[1],
    //                     1
    //                 ]
    //             );
    //         }
    //     }

    //     return result.affectedRows > 0;
  // }
  // static async updateStatus(id, status) {
  //   const [result] = await db.query(
  //     'UPDATE service_apply SET status = ? WHERE id = ?',
  //     [status, id]
  //   );

  //   // 如果是资源申请且状态改为已通过，则添加资源预订记录
  //   if (status === 1) {
  //     const [applyData] = await db.query(
  //       'SELECT * FROM service_apply WHERE id = ?',
  //       [id]
  //     );

  //     if (applyData[0] && applyData[0].resource_id) {
  //       let useTime = [];
  //       try {
  //         // 如果 use_time 是字符串，则解析它
  //         if (typeof applyData[0].use_time === 'string') {
  //           useTime = JSON.parse(applyData[0].use_time);
  //         } else if (Array.isArray(applyData[0].use_time)) {
  //           // 如果已经是数组，直接使用
  //           useTime = applyData[0].use_time;
  //         }

  //         if (useTime.length >= 2) {
  //           await db.query(
  //             `INSERT INTO resource_booking
  //                       (resource_id, application_id, user_id, user_name,
  //                        start_time, end_time, status)
  //                       VALUES (?, ?, ?, ?, ?, ?, ?)`,
  //             [
  //               applyData[0].resource_id,
  //               id,
  //               applyData[0].user_id,
  //               applyData[0].user_name,
  //               useTime[0],
  //               useTime[1],
  //               1
  //             ]
  //           );
  //         }
  //       } catch (error) {
  //         console.error('解析 use_time 失败:', error);
  //         console.log('原始 use_time 值:', applyData[0].use_time);
  //       }
  //     }
  //   }

  //   return result.affectedRows > 0;
  // }
  // static async updateStatus(id, status) {
  //   // 首先更新申请状态
  //   const [result] = await db.query(
  //     'UPDATE service_apply SET status = ? WHERE id = ?',
  //     [status, id]
  //   );

  //   // 如果是审核通过，且是资源申请，则添加资源预订记录
  //   if (status === 1) {
  //     // 先获取申请详情
  //     const [applyData] = await db.query(
  //       'SELECT * FROM service_apply WHERE id = ? AND service_type = ?',
  //       [id, '资源申请']
  //     );

  //     console.log('申请数据:', applyData[0]); // 添加调试日志

  //     if (applyData[0] && applyData[0].resource_id) {
  //       const useTime = JSON.parse(applyData[0].use_time || '[]');
  //       console.log('解析后的使用时间:', useTime); // 添加调试日志

  //       // 插入预订记录
  //       const [bookingResult] = await db.query(
  //         `INSERT INTO resource_booking
  //               (resource_id, application_id, user_id, user_name, start_time, end_time, status)
  //               VALUES (?, ?, ?, ?, ?, ?, ?)`,
  //         [
  //           applyData[0].resource_id,
  //           id,
  //           applyData[0].user_id,
  //           applyData[0].user_name,
  //           useTime[0],
  //           useTime[1],
  //           1
  //         ]
  //       );
  //       console.log('预订记录插入结果:', bookingResult); // 添加调试日志
  //     }
  //   }

  //   return result.affectedRows > 0;
  // }
  static async updateStatus(id, status) {
    // 首先更新申请状态
    const [result] = await db.query(
      'UPDATE service_apply SET status = ? WHERE id = ?',
      [status, id]
    );

    // 如果是审核通过，且是资源申请，则添加资源预订记录
    if (status === 1) {
      // 先获取申请详情
      const [applyData] = await db.query(
        'SELECT * FROM service_apply WHERE id = ? AND service_type = ?',
        [id, '资源申请']
      );

      if (applyData[0] && applyData[0].resource_id) {
        let useTime = [];
        try {
          if (typeof applyData[0].use_time === 'string') {
            useTime = JSON.parse(applyData[0].use_time);
          } else if (Array.isArray(applyData[0].use_time)) {
            useTime = applyData[0].use_time;
          }
          console.log("userTimeuserTimeuserTimeuserTime", useTime)
          if (useTime && useTime.length >= 2) {
            await db.query(
              `INSERT INTO resource_booking 
                        (resource_id, application_id,  user_name, start_time, end_time, status) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
              [
                applyData[0].resource_id,
                id,
                applyData[0].user_name,
                useTime[0],
                useTime[1],
                1
              ]
            );
          }
        } catch (error) {
          console.error('处理 use_time 失败:', error);
          console.log('原始 use_time 值:', applyData[0].use_time);
        }
      }
    }

    return result.affectedRows > 0;
  }

    static formatApply(apply) {
      let useTime = [];
      console.log("apply.use_time", apply.use_time)
        try {
            // 如果 use_time 是字符串，则解析它
            if (typeof apply.use_time === 'string') {
                useTime = JSON.parse(apply.use_time);
            } else if (Array.isArray(apply.use_time)) {
                // 如果已经是数组，直接使用
                useTime = apply.use_time;
            }
        } catch (error) {
            console.error('解析 use_time 失败:', error);
            console.log('原始 use_time 值:', apply.use_time);
        }

        return {
            id: apply.id.toString(),
            userId: apply.user_id.toString(),
            userName: apply.user_name,
            type: apply.service_type,
            detail: apply.service_detail,
            description: apply.description,
            building: apply.building,
            room: apply.room,
            phone: apply.phone,
            resourceId: apply.resource_id,
            useTime: useTime,
            status: apply.status,
            createTime: apply.create_time,
            updateTime: apply.update_time
        };
    }
}

module.exports = ServiceApply; 