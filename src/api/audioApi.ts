import { apiEndpoints } from '@/common/constants';
import axiosClient from '../common/axiosClient';
import { MediaUploadData } from '@/common/types';

export const AudioApi = {
  async create(data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('room_id', data.room_id);

      const res = await axiosClient.post(apiEndpoints.audio.create, formData);

      return res.data;
    } catch (err: any) {
      console.error('MediaApi.upload error:', err);
      throw err;
    }
  },
  async update(id: string, data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('room_id', data.room_id);

      const res = await axiosClient.patch(
        apiEndpoints.audio.updateById(id),
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
      const res = await axiosClient.get(apiEndpoints.audio.getAll);
      return res.data || [];
    } catch (err: any) {
      console.error('MediaApi.getList error:', err);
      throw err;
    }
  },

  async delete(mediaId: string) {
    try {
      const res = await axiosClient.delete(
        apiEndpoints.audio.deleteById(mediaId)
      );

      return Promise.resolve();
    } catch (err: any) {
      console.error('MediaApi.delete error:', err);
      throw err;
    }
  },
};
