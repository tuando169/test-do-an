import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { ImageUpdateMetadataData, MediaData, MediaUploadData, ImageCreateData } from '../common/types';
import { buildMediaFormData } from './helpers/buildMediaFormData';

export const ImageApi = {
  // 1. CREATE IMAGE (chỉ upload file)
  async create(data: ImageCreateData): Promise<MediaData> {
    const formData = new FormData();
    formData.append('file', data.file);

    if (data.title) formData.append('title', data.title);
    if (data.room_id?.length) {
      data.room_id.forEach((id, i) =>
        formData.append(`room_id${i}`, id)
      );
    }

    const res = await axiosClient.post(
      apiEndpoints.image.create,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return res.data;
  },

  // 2. UPDATE METADATA (KHÔNG gửi file)
  async updateMetadata(
    id: string,
    data: ImageUpdateMetadataData
  ): Promise<MediaData> {
    const res = await axiosClient.patch(
      apiEndpoints.image.updateById(id),
      data, // 👈 JSON RAW
      { headers: { 'Content-Type': 'application/json' } }
    )

    return res.data
  },

  async getList() {
    try {
      const res = await axiosClient.get(apiEndpoints.image.getAll);
      const data: MediaData[] = res.data;
      return (
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || []
      );
    } catch (err: any) {
      console.error('MediaApi.getList error:', err);
      throw err;
    }
  },

  async delete(mediaId: string) {
    try {
      const res = await axiosClient.delete(
        apiEndpoints.image.deleteById(mediaId)
      );

      return Promise.resolve();
    } catch (err: any) {
      console.error('MediaApi.delete error:', err);
      throw err;
    }
  },
};
