import { api } from './api';
async function sendContactMessage(data: {
    message: string;
}): Promise<void> {
    await api.post('/contact', data);
}

export {
  sendContactMessage,
}
