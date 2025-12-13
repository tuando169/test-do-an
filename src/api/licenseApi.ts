import axiosClient from "../common/axiosClient";
import { apiEndpoints } from "../common/constants";
import { LicenseData, LicenseUploadData } from "../common/types";

export const LicenseApi = {
  async getAll(): Promise<LicenseData[]> {
    try {
      const res = await axiosClient.get(apiEndpoints.license.getAll);

      const data = res.data;

      return (data as LicenseData[]) || [];
    } catch (err: any) {
      console.error("TextureApi.getAll error:", err);
      throw err;
    }
  },

  async create(payload: LicenseUploadData): Promise<LicenseData> {
    try {

      const res = await axiosClient.post(apiEndpoints.license.create, payload);
      return res.data
    } catch (err) {
      console.error("TextureApi.upload error:", err);
      throw err;
    }
  },

  async update(
    textureId: string,
    payload: LicenseUploadData
  ): Promise<LicenseData> {
    try {
      if (!textureId) throw new Error("Thiếu texture_id");

      const res = await axiosClient.patch(
        apiEndpoints.license.updateById(textureId),
        payload
      );

      return res.data;
    } catch (err) {
      console.error("TextureApi.update error:", err);
      throw err;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await axiosClient.delete(apiEndpoints.license.deleteById(id));
      return Promise.resolve();
    } catch (err) {
      console.error("TextureApi.delete error:", err);
      throw err;
    }
  },
};
