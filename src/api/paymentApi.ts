import axiosClient from "../common/axiosClient";
import { apiEndpoints } from "../common/constants";

export const PaymentApi = {
  createLicensePaymentLink: async (licenseId: string, returnUrl: string, cancelUrl: string) => {

    const res = await axiosClient.post(apiEndpoints.payment.registerLicense, {
      licenseId,
      returnUrl,
      cancelUrl
    });

    return res.data;
  },
  createTemplatePaymentLink: async (templateId: string, returnUrl: string, cancelUrl: string) => {

    const res = await axiosClient.post(apiEndpoints.payment.buyTemplate, {
      templateId,
      returnUrl,
      cancelUrl
    });

    return res.data;
  },
};