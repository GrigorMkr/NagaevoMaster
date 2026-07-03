import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { UPLOAD_TIMEOUT_MS } from '@/constants/ui';
import { PROD_API_ORIGIN, resolveAbsoluteApiBase, isSiteOrigin } from '@/utils/apiBase';
import { isNativeApp } from '@/utils/nativeApp';

/** Крупные загрузки — напрямую на VPS (100 МБ), минуя PHP-прокси REG.RU. */
function resolveUploadApiBase(): string {
  if (
    typeof window !== 'undefined'
    && isSiteOrigin()
    && !isNativeApp()
    && import.meta.env.PROD
    && window.location.hostname !== 'localhost'
  ) {
    return `${PROD_API_ORIGIN}/api`;
  }
  return resolveAbsoluteApiBase();
}

type UploadProgressHandler = (percent: number) => void;

const TEXT_FILE_PATTERN = /\.(txt|md|csv)$/i;
const DOCUMENT_FILE_PATTERN = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf)$/i;

const OPEN_FILE_ERROR = 'Не удалось открыть файл. Повторите выбор или отправьте текст сообщением.';

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

function ensureFileName(name: string, type: string): string {
  if (name && name.includes('.')) {
    return name;
  }
  if (type.startsWith('text/') || TEXT_FILE_PATTERN.test(name)) {
    return name ? `${name}.txt` : 'upload.txt';
  }
  return name || 'upload';
}

function isTextLikeFile(file: File, type: string): boolean {
  return type.startsWith('text/') || TEXT_FILE_PATTERN.test(file.name);
}

function shouldMaterializeFile(file: File): boolean {
  if (file.size === 0) {
    return true;
  }

  if (!isNativeApp()) {
    return false;
  }

  // Крупные файлы отправляем как есть — иначе FileReader на Android долго читает в память.
  if (file.size > 4 * 1024 * 1024) {
    return false;
  }

  const type = file.type || guessMimeType(file.name);
  return (
    type.startsWith('text/')
    || type.startsWith('application/')
    || TEXT_FILE_PATTERN.test(file.name)
    || DOCUMENT_FILE_PATTERN.test(file.name)
  );
}

/** FileReader должен стартовать синхронно в том же тике, что и выбор файла. */
function startFileReaderRead(
  blob: Blob,
  mode: 'arrayBuffer' | 'text',
): Promise<ArrayBuffer | string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (mode === 'arrayBuffer' && reader.result instanceof ArrayBuffer) {
        if (reader.result.byteLength > 0) {
          resolve(reader.result);
          return;
        }
        reject(new Error('empty array buffer'));
        return;
      }

      if (mode === 'text' && typeof reader.result === 'string') {
        if (reader.result.length > 0) {
          resolve(reader.result);
          return;
        }
        reject(new Error('empty text'));
        return;
      }

      reject(new Error('empty read result'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));

    if (mode === 'arrayBuffer') {
      reader.readAsArrayBuffer(blob);
      return;
    }

    reader.readAsText(blob);
  });
}

function pickerSources(file: File): Blob[] {
  const sources: Blob[] = [file];
  if (file.size === 0) {
    sources.push(file.slice(0));
  }
  return sources;
}

async function readBlobBytesAsync(blob: Blob): Promise<Uint8Array | null> {
  const readers: Array<() => Promise<Uint8Array | null>> = [
    async () => {
      const buffer = await new Response(blob).arrayBuffer();
      return buffer.byteLength > 0 ? new Uint8Array(buffer) : null;
    },
    async () => {
      const buffer = await blob.arrayBuffer();
      return buffer.byteLength > 0 ? new Uint8Array(buffer) : null;
    },
    async () => {
      if (typeof blob.stream !== 'function') {
        return null;
      }
      const stream = blob.stream().getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await stream.read();
        if (done) {
          break;
        }
        if (!value) {
          continue;
        }
        chunks.push(value);
        total += value.length;
      }
      if (total === 0) {
        return null;
      }
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return merged;
    },
    async () => {
      const text = await blob.text();
      const bytes = new TextEncoder().encode(text);
      return bytes.byteLength > 0 ? bytes : null;
    },
  ];

  for (const read of readers) {
    try {
      const bytes = await read();
      if (bytes && bytes.byteLength > 0) {
        return bytes;
      }
    } catch {
      // Пробуем следующий способ чтения.
    }
  }

  return null;
}

async function readPickerFileBytes(file: File): Promise<Uint8Array> {
  const type = file.type || guessMimeType(file.name);
  const textLike = isTextLikeFile(file, type);

  for (const source of pickerSources(file)) {
    try {
      const buffer = await startFileReaderRead(source, 'arrayBuffer');
      return new Uint8Array(buffer as ArrayBuffer).slice();
    } catch {
      if (!textLike) {
        continue;
      }
    }

    if (textLike) {
      try {
        const text = await startFileReaderRead(source, 'text');
        const bytes = new TextEncoder().encode(text as string);
        if (bytes.byteLength > 0) {
          return bytes;
        }
      } catch {
        // Пробуем другой источник.
      }
    }
  }

  for (const source of pickerSources(file)) {
    const bytes = await readBlobBytesAsync(source);
    if (bytes) {
      return bytes;
    }
  }

  throw new Error(OPEN_FILE_ERROR);
}

function buildUploadFile(file: File, bytes: Uint8Array): File {
  const type = file.type || guessMimeType(file.name);
  const name = ensureFileName(file.name || 'upload', type);

  return new File([bytes.slice()], name, {
    type,
    lastModified: file.lastModified || Date.now(),
  });
}

function prepareUploadFile(file: File): Promise<File> {
  if (!(file instanceof Blob)) {
    return Promise.reject(new Error('Некорректный файл'));
  }

  if (!shouldMaterializeFile(file)) {
    return Promise.resolve(file);
  }

  // Важно: FileReader стартует синхронно до первого await.
  return readPickerFileBytes(file).then((bytes) => buildUploadFile(file, bytes));
}

async function sendMultipartUpload<T>(
  path: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  const base = resolveUploadApiBase().replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.responseType = 'text';

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }
      onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
    });

    xhr.addEventListener('load', () => {
      let payload: { message?: string } | null = null;
      try {
        payload = JSON.parse(xhr.responseText) as { message?: string };
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
        return;
      }

      reject(new Error(payload?.message ?? (
        xhr.status === 413
          ? 'Файл слишком большой для сервера (максимум 100 МБ)'
          : `HTTP ${xhr.status}`
      )));
    });

    xhr.addEventListener('error', () => reject(new Error('Ошибка сети при загрузке файла')));
    xhr.addEventListener('timeout', () => reject(new Error('Превышено время загрузки файла (проверьте интернет)')));
    xhr.send(formData);
  });
}

async function postMultipartUpload<T>(
  path: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<T> {
  const uploadFile = await prepareUploadFile(file);
  return sendMultipartUpload<T>(path, uploadFile, onProgress);
}

export {
  postMultipartUpload,
  prepareUploadFile,
  sendMultipartUpload,
};

export type {
  UploadProgressHandler,
};
