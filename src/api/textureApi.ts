import { apiEndpoints } from '@/common/constants';
import axiosClient from '@/common/axiosClient';
import { TextureData, TextureUploadData } from '@/common/types';

export const TextureApi = {
  async getAll(): Promise<TextureData[]> {
    try {
      const res = await axiosClient.get(apiEndpoints.texture.getAll);

      const data = res.data;

      return (data as TextureData[]) || [];
    } catch (err: any) {
      console.error('TextureApi.getAll error:', err);
      throw err;
    }
  },

  async getDetail(textureId: string): Promise<TextureData | undefined> {
    try {
      const res = await axiosClient.get(apiEndpoints.texture.getOne(textureId));

      const data = res.data;

      return data as TextureData;
    } catch (err) {
      console.error('TextureApi.getDetail error:', err);
      throw err;
    }
  },

  async upload(payload: TextureUploadData): Promise<TextureData> {
    try {
      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('object3d_id', payload.object3d_id);

      if (payload.alb) formData.append('alb', payload.alb);
      if (payload.nor) formData.append('nor', payload.nor);
      if (payload.orm) formData.append('orm', payload.orm);

      const res = await axiosClient.post(apiEndpoints.texture.create, formData);
      return res.data as TextureData;
    } catch (err) {
      console.error('TextureApi.upload error:', err);
      throw err;
    }
  },

  async update(
    textureId: string,
    payload: Partial<TextureUploadData>
  ): Promise<TextureData> {
    try {
      if (!textureId) throw new Error('Thiếu texture_id');

      const formData = new FormData();
      formData.append('id', textureId);
      if (payload.name) formData.append('name', payload.name);
      if (payload.object3d_id)
        formData.append('object3d_id', payload.object3d_id);

      if (payload.alb) formData.append('alb', payload.alb);
      if (payload.nor) formData.append('nor', payload.nor);
      if (payload.orm) formData.append('orm', payload.orm);

      const res = await axiosClient.put(apiEndpoints.texture.update, formData);

      return res.data as TextureData;
    } catch (err) {
      console.error('TextureApi.update error:', err);
      throw err;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await axiosClient.delete(apiEndpoints.texture.deleteById(id));
      return Promise.resolve();
    } catch (err) {
      console.error('TextureApi.delete error:', err);
      throw err;
    }
  },
};
