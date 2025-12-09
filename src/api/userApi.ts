import { apiEndpoints } from '@/common/constants';
import axiosClient from '../common/axiosClient';
import { UserData } from '@/common/types';

export const UserApi = {
  async getAll(): Promise<UserData[]> {
    const res = await axiosClient.get(apiEndpoints.user.getAll);
    return Promise.resolve(res.data);
  },

  async getById(id: string): Promise<UserData> {
    const res = await axiosClient.get(apiEndpoints.user.getById(id));
    return Promise.resolve(res.data);
  },

  async update(payload: UserData): Promise<UserData> {
    const res = await axiosClient.patch(apiEndpoints.user.update, payload);
    return Promise.resolve(res.data);
  },
  async delete(id: string): Promise<void> {
    const res = await axiosClient.delete(apiEndpoints.user.deleteById(id));
    return Promise.resolve();
  },
};
