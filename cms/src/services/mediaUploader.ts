import { mediaApi } from './api';

interface UploadOptions {
  folder?: string;
}

export const uploadMediaFile = async (file: File, options: UploadOptions = {}) => {
  const payload = {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    folder: options.folder,
  };

  const { uploadUrl, fileUrl } = await mediaApi.requestUpload(payload);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3 上传失败：${response.status}`);
  }

  return fileUrl as string;
};
