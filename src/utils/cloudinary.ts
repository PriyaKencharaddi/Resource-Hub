import axios from 'axios';

export const CLOUD_NAME = 'dfqarws5j';
export const UPLOAD_PRESET = 'campus_unsigned';

export type CloudinaryUploadResult = {
  url: string;
  deleteToken?: string;
  resourceType?: string;
  originalFilename?: string;
  format?: string;
  publicId?: string;
};

export async function uploadToCloudinary(file: File, onProgress?: (progress: number) => void): Promise<CloudinaryUploadResult> {
  // Use image endpoint only for real images; otherwise use raw to preserve original files (e.g., PDFs)
  const isImage = file.type?.startsWith('image/');
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${isImage ? 'image' : 'raw'}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await axios.post(endpoint, formData, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });

  const data = response.data || {};
  // Helpful debug logging
  // eslint-disable-next-line no-console
  console.log('[Cloudinary] Upload response:', {
    secure_url: data.secure_url,
    url: data.url,
    resource_type: data.resource_type,
    format: data.format,
    original_filename: data.original_filename,
    public_id: data.public_id,
  });
  return {
    url: data.secure_url || data.url,
    deleteToken: data.delete_token,
    resourceType: data.resource_type,
    originalFilename: data.original_filename,
    format: data.format,
    publicId: data.public_id,
  };
}

export async function deleteFromCloudinaryByToken(deleteToken: string): Promise<void> {
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`;
  const formData = new FormData();
  formData.append('token', deleteToken);
  await axios.post(endpoint, formData);
}


