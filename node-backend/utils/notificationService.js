const Notification = require('../models/Notification');

const createNotification = async ({ user, title, message, type = 'system', metadata = {} }) => {
  if (!user) {
    return null;
  }

  return Notification.create({
    user,
    title,
    message,
    type,
    metadata,
  });
};

module.exports = {
  createNotification,
};
