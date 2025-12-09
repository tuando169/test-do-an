import { apiEndpoints } from '@/common/constants.js';
import axiosClient from '../common/axiosClient.js';
import { MediaUploadData } from '@/common/types.js';

export const Object3dApi = {
  async create(data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('room_id', data.room_id);

      const res = await axiosClient.post(
        apiEndpoints.object3d.create,
        formData
      );

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
        apiEndpoints.object3d.updateById(id),
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
      const res = await axiosClient.get(apiEndpoints.object3d.getAll);
      return res.data || [];
    } catch (err) {
      throw err;
    }
  },

  async delete(id: string) {
    try {
      if (!id) throw new Error('Thiếu object_id để xóa');

      const res = await axiosClient.delete(
        apiEndpoints.object3d.deleteById(id)
      );

      return Promise.resolve();
    } catch (err) {
      throw err;
    }
  },
};
