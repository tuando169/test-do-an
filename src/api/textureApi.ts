import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { TextureData, TextureUploadData } from '../common/types';

export const TextureApi = {
  async getAll(): Promise<TextureData[]> {
    try {
      const res = await axiosClient.get(apiEndpoints.texture.getAll);


      const data: TextureData[] = res.data;
      return (
        data.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
      );
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

  async create(payload: TextureUploadData): Promise<TextureData> {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('texture_for', payload.texture_for);

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
      if (payload.title) formData.append('title', payload.title);
      if (payload.texture_for)
        formData.append('texture_for', payload.texture_for);

      if (payload.alb) formData.append('alb', payload.alb);
      if (payload.nor) formData.append('nor', payload.nor);
      if (payload.orm) formData.append('orm', payload.orm);

      const res = await axiosClient.patch(
        apiEndpoints.texture.updateById(textureId),
        formData
      );

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
