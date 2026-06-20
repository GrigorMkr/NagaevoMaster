const MAX_AVATAR_DIMENSION = 256;
const MAX_AVATAR_BYTES = 200 * 1024;
const AVATAR_JPEG_QUALITY = 0.82;

async function resizeImageForAvatar(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
        throw new Error('Выберите изображение');
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
        bitmap.close();
        throw new Error('Не удалось обработать изображение');
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = AVATAR_JPEG_QUALITY;
    let blob = await canvasToBlob(canvas, quality);

    while (blob.size > MAX_AVATAR_BYTES && quality > 0.45) {
        quality -= 0.08;
        blob = await canvasToBlob(canvas, quality);
    }

    if (blob.size > MAX_AVATAR_BYTES) {
        throw new Error('Фото слишком большое. Выберите другое изображение');
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
            if (!result) {
                reject(new Error('Не удалось сжать изображение'));
                return;
            }
            resolve(result);
        }, 'image/jpeg', quality);
    });
}

export {
  MAX_AVATAR_DIMENSION,
  MAX_AVATAR_BYTES,
  resizeImageForAvatar,
}
