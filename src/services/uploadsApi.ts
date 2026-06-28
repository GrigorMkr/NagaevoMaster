import {
  postMultipartUpload,
  prepareUploadFile,
  sendMultipartUpload,
  type UploadProgressHandler,
} from './multipartUpload';

interface UploadResponse {
    id: string;
    url: string;
}

async function uploadImage(file: File): Promise<UploadResponse> {
    return postMultipartUpload<UploadResponse>('/uploads', file);
}

interface MessageUploadResponse extends UploadResponse {
    mimeType: string;
    name: string;
    kind: 'file' | 'voice';
}

async function uploadMessageAttachment(
    file: File,
    onProgress?: UploadProgressHandler,
    options?: { prepared?: boolean },
): Promise<MessageUploadResponse> {
    const uploadFile = options?.prepared ? file : await prepareUploadFile(file);
    return sendMultipartUpload<MessageUploadResponse>('/uploads/message', uploadFile, onProgress);
}

export {
  uploadImage,
  uploadMessageAttachment,
  prepareUploadFile,
}

export type {
  UploadResponse,
}
