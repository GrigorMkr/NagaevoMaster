import { api } from './api';
async function sendContactMessage(data: {
    name: string;
    email: string;
    message: string;
}): Promise<void> {
    await api.post('/contact', data);
}

export {
  sendContactMessage,
}
