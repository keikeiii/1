const db = require('../config/database');

class Resource {
    static async findAll() {
        const [rows] = await db.query(`
            SELECT * FROM resource 
            ORDER BY create_time DESC
        `);
        return rows.map(this.formatResource);
    }

    static async create(resourceData) {
        const [result] = await db.query(
            'INSERT INTO resource SET ?',
            this.formatForDb(resourceData)
        );
        return result.insertId;
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM resource WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async findBookings(resourceId) {
        const [rows] = await db.query(
            `SELECT rb.*, sa.user_id, sa.name 
             FROM resource_booking rb
             LEFT JOIN service_apply sa ON rb.application_id = sa.id
             WHERE rb.resource_id = ?`,
            [resourceId]
        );
        return rows.map(this.formatBooking);
    }

    static async findByType(type) {
        const [rows] = await db.query(
            'SELECT * FROM resource WHERE type = ? ORDER BY create_time DESC',
            [type]
        );
        return rows.map(this.formatResource);
    }

    static async findSchedule(resourceId) {
        const [rows] = await db.query(
            `SELECT * FROM resource_booking 
             WHERE resource_id = ?
             ORDER BY start_time ASC`,
            [resourceId]
        );
        return rows.map(this.formatSchedule);
    }

    // 格式化方法
    static formatResource(dbResource) {
        return {
            id: dbResource.id.toString(),
            name: dbResource.name,
            type: dbResource.type,
            location: dbResource.location,
            capacity: dbResource.capacity,
            description: dbResource.description
        };
    }

    static formatForDb(resource) {
        return {
            name: resource.name,
            type: resource.type,
            location: resource.location,
            capacity: resource.capacity,
            description: resource.description,
            create_time: new Date()
        };
    }

    static formatBooking(dbBooking) {
        return {
            id: dbBooking.id.toString(),
            resourceId: dbBooking.resource_id.toString(),
            applicationId: dbBooking.application_id.toString(),
            startTime: dbBooking.start_time,
            endTime: dbBooking.end_time,
            status: dbBooking.status,
            userName: dbBooking.name
        };
    }

    static formatSchedule(booking) {
        return {
            id: booking.id.toString(),
            resourceId: booking.resource_id.toString(),
            applicationId: booking.application_id.toString(),
            startTime: booking.start_time,
            endTime: booking.end_time,
            status: booking.status,
            userName: booking.user_name
        };
    }
}

module.exports = Resource; 