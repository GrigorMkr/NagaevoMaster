import { api } from './api';
interface UploadResponse {
    id: string;
    url: string;
}
async function uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<UploadResponse>('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

interface MessageUploadResponse extends UploadResponse {
    mimeType: string;
    name: string;
    kind: 'file' | 'voice';
}

async function uploadMessageAttachment(file: File): Promise<MessageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<MessageUploadResponse>('/uploads/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export {
  uploadImage,
  uploadMessageAttachment,
}

export type {
  UploadResponse,
}
