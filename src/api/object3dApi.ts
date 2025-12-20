import axiosClient from '../common/axiosClient.js';
import { apiEndpoints } from '../common/constants.js';
import { MediaData, MediaUploadData } from '../common/types.js';

export const Object3dApi = {
  async create(data: MediaUploadData): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      if (data.room_id)
        data.room_id.forEach((id, index) =>
          formData.append(`room_id${index}`, id)
        );

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
      if (data.room_id)
        data.room_id.forEach((id, index) =>
          formData.append(`room_id${index}`, id)
        );

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
      const data: MediaData[] = res.data;
      return (
        data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || []
      );
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
  async generate(sample: File): Promise<File> {
    try {
      const formData = new FormData();
      formData.append('image', sample);
      const res = await axiosClient.post(
        apiEndpoints.object3d.generate,
        formData,
        {
          responseType: 'blob',
        }
      );
      console.log('res.data', res.data);

      return Promise.resolve(
        new File([res.data], 'generated_object.glb', {
          type: 'model/gltf-binary',
        })
      );
    } catch {
      return Promise.reject();
    }
  },
};
