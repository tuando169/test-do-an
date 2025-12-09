import { apiEndpoints } from '@/common/constants.js';
import axiosClient from '../common/axiosClient.js';

export const Object3dApi = {
  async create(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axiosClient.post(
        apiEndpoints.object3d.create,
        formData
      );
      const data = res.data;
      return data;
    } catch (err) {
      console.error('ObjectApi.upload error:', err);
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

      const data = res.data;
      return data;
    } catch (err) {
      throw err;
    }
  },
};
