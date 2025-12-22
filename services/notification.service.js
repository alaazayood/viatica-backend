const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class NotificationService {
  static async sendNotification(userId, title, message) {
    try {
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // ملاحظة: لا إرسال إشعارات push حالياً — فقط تخزين في قاعدة البيانات
      await Notification.create({
        user: userId,
        title,
        message,
        read: false,
        createdAt: new Date()
      });

      logger.info(`تم إنشاء إشعار للمستخدم ${user.email}`);

    } catch (err) {
      logger.error(`فشل إرسال الإشعار: ${err.message}`);
      throw err;
    }
  }

  static async sendBatchNotifications(userIds, title, message) {
    await Promise.all(
      userIds.map(id => this.sendNotification(id, title, message))
    );
  }
}

module.exports = NotificationService;
