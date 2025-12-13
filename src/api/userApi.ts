import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { UserData } from '../common/types';

export const UserApi = {
  async getAll(): Promise<UserData[]> {
    const res = await axiosClient.get(apiEndpoints.user.getAll);
    const data: UserData[] = res.data;
    return Promise.resolve(
      data.sort((a, b) => {
        if (!a.name || !b.name) return 0;
        return a.name.localeCompare(b.name);
      })
    );
  },

  async getById(id: string): Promise<UserData> {
    const res = await axiosClient.get(apiEndpoints.user.getById(id));
    return Promise.resolve(res.data);
  },

  async update(id: string, payload: UserData): Promise<UserData> {
    const res = await axiosClient.patch(
      apiEndpoints.user.updateById(id),
      payload
    );
    return Promise.resolve(res.data);
  },
  async delete(id: string): Promise<void> {
    const res = await axiosClient.delete(apiEndpoints.user.deleteById(id));
    return Promise.resolve();
  },
};
