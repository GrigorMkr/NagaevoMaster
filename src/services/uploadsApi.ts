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

export {
  uploadImage,
}

export type {
  UploadResponse,
}
