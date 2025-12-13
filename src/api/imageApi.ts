import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { MediaData, MediaUploadData } from '../common/types';

export const ImageApi = {
  async create(data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      if (data.room_id)
        data.room_id.forEach((id, index) =>
          formData.append(`room_id${index}`, id)
        );

      const res = await axiosClient.post(apiEndpoints.image.create, formData);

      return res.data;
    } catch (err: any) {
      console.error('MediaApi.upload error:', err);
      return Promise.reject(err);
    }
  },

  async update(id: string, data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
     if (data.room_id) data.room_id.forEach((id, index) =>
        formData.append(`room_id${index}`, id)
      );

      const res = await axiosClient.patch(
        apiEndpoints.image.updateById(id),
        formData
      );

      return res.data;
    } catch (err: any) {
      console.error('MediaApi.upload error:', err);
      throw err;
    }
  },

  async getList() {
    try {
      const res = await axiosClient.get(apiEndpoints.image.getAll);
      const data: MediaData[] = res.data;
      return (
        data.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
