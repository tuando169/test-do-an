import { MediaUploadData } from '../../common/types';

// api/helpers/buildMediaFormData.ts
export function buildMediaFormData(data: MediaUploadData) {
  const formData = new FormData();

  if (data.file) {
    formData.append('file', data.file);
  }

  if (data.title) {
    formData.append('title', data.title);
  }

  if (data.metadata) {
    formData.append('metadata', JSON.stringify(data.metadata));
  }

  // legacy
  if (data.room_id?.length) {
    data.room_id.forEach((id, index) =>
      formData.append(`room_id${index}`, id)
    );
  }

  return formData;
}
