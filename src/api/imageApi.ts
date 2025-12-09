import { apiEndpoints } from '@/common/constants';
import axiosClient from '../common/axiosClient';

export const ImageApi = {
  async create(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axiosClient.post(apiEndpoints.image.create, formData);

      const data = res.data;

      return data;
    } catch (err: any) {
      console.error('MediaApi.upload error:', err);
      throw err;
    }
  },

  async getList() {
    try {
      const res = await axiosClient.get(apiEndpoints.image.getAll);
      return res.data || [];
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

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || 'Xóa media thất bại');
      }

      return data;
    } catch (err: any) {
      console.error('MediaApi.delete error:', err);
      throw err;
    }
  },
};
