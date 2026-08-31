import { notification } from 'antd';

// Global Ant Design Notification Configuration
notification.config({
  placement: 'topRight',
  duration: 1.5,
  top: 75,
  maxCount: 3,
});

export const notify = {
  success: (msg, desc) => {
    notification.success({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 1.5,
    });
  },
  error: (msg, desc) => {
    notification.error({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 2.0,
    });
  },
  info: (msg, desc) => {
    notification.info({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 1.5,
    });
  },
  warning: (msg, desc) => {
    notification.warning({
      message: msg,
      description: desc,
      placement: 'topRight',
      duration: 1.5,
    });
  },
};

export default notify;
