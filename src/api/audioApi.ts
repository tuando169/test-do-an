import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { MediaData, MediaUploadData } from '../common/types';

export const AudioApi = {
  async create(data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);

      if (data.room_id)
        data.room_id.forEach((id, index) =>
          formData.append(`room_id${index}`, id)
        );

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
     if (data.room_id) data.room_id.forEach((id, index) =>
        formData.append(`room_id${index}`, id)
      );

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
        apiEndpoints.audio.deleteById(mediaId)
      );

      return Promise.resolve();
    } catch (err: any) {
      console.error('MediaApi.delete error:', err);
      throw err;
    }
  },
};
