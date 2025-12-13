import axiosClient from "../common/axiosClient";

export const PaymentApi = {
  // Cập nhật hàm để nhận đủ 3 tham số từ Pricing.jsx gửi sang
  createPaymentLink: async (licenseId: string, returnUrl: string, cancelUrl: string) => {
    
    // Gửi chính xác những gì nhận được lên Backend
    const res = await axiosClient.post("/payment/create-link", {
      licenseId,
      returnUrl,
      cancelUrl
    });
    
    return res.data; // Trả về { checkoutUrl, orderCode }
  }
};