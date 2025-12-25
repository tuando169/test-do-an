import { useEffect, useState } from 'react';
import { notification, Skeleton } from 'antd';
import { LicenseApi } from '@/api/licenseApi';
import { PaymentApi } from '@/api/paymentApi';
import { AuthApi } from '@/api/authApi'; // Import AuthApi

export default function Pricing() {
  const [displayPlans, setDisplayPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // State lưu user hiện tại
  const [api, contextHolder] = notification.useNotification();

  // 1. Cấu hình Gói Tĩnh
  const FREE_PLAN = {
    id: 'free_static',
    title: 'KHỞI ĐỘNG',
    price: 'MIỄN PHÍ',
    sub: 'DÙNG THỬ',
    features: ['Tính năng giới hạn', 'Không có triển lãm 3D công khai'],
    button: 'ĐĂNG KÝ',
    isPaid: false,
    action: () => (window.location.href = '/register'),
  };

  const ENTERPRISE_PLAN = {
    id: 'enterprise_static',
    title: 'GÓI RIÊNG',
    price: '',
    sub: '',
    features: ['Tuỳ chỉnh theo nhu cầu', 'Dịch vụ & giải pháp doanh nghiệp'],
    button: 'LIÊN HỆ',
    isPaid: false,
    action: () => (window.location.href = 'mailto:support@vexpo.vn'),
  };

  // 2. Fetch dữ liệu (User + Licenses)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi song song 2 API: Lấy User info & Lấy danh sách gói
        const [dbLicenses, userProfile] = await Promise.all([
          LicenseApi.getAll(),
          AuthApi.getProfile().catch(() => null), // Nếu lỗi (chưa login) thì trả về null
        ]);

        setCurrentUser(userProfile); // Lưu user để so sánh

        // Sắp xếp và map dữ liệu như cũ
        const sortedLicenses = dbLicenses.sort((a, b) => a.price - b.price);
        const mappedPaidPlans = sortedLicenses.map((license) => ({
          id: license.id,
          title: license.title.toUpperCase(),
          price: new Intl.NumberFormat('vi-VN').format(license.price),
          sub: 'VND / TRỌN ĐỜI',
          features: [
            `Lưu trữ ${license.media_limit} tác phẩm nghệ thuật`,
            `${license.space_limit} triển lãm 3D công khai`,
          ],
          button: 'NÂNG CẤP',
          isPaid: true,
        }));

        setDisplayPlans([FREE_PLAN, ...mappedPaidPlans, ENTERPRISE_PLAN]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. Hàm kiểm tra xem User có đang dùng gói này không?
  const isCurrentPlan = (plan) => {
    if (!currentUser) return false; // Chưa đăng nhập thì không có gói nào active

    // Trường hợp gói Free: Nếu user.license là null hoặc undefined -> Đang dùng Free
    if (plan.id === 'free_static') {
      return !currentUser.license;
    }

    // Trường hợp gói Trả phí: So sánh ID
    return currentUser.license === plan.id;
  };

  // 4. Xử lý bấm nút
  const handleButtonClick = async (item) => {
    // Nếu đang dùng gói này rồi thì không làm gì cả
    if (isCurrentPlan(item)) return;

    if (!item.isPaid) {
      item.action && item.action();
      return;
    }

    if (processingId) return;
    setProcessingId(item.id);

    try {
      const returnUrl = window.location.href;
      const cancelUrl = window.location.href;

      const data = await PaymentApi.createLicensePaymentLink(
        item.id,
        returnUrl,
        cancelUrl
      );

      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        api.error({ title: 'Không lấy được link thanh toán' });
        setProcessingId(null);
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      api.error({
        title: 'Lỗi tạo giao dịch',
        description: 'Vui lòng thử lại sau.',
      });
      setProcessingId(null);
    }
  };

  return (
    <div className='container-main flex justify-center py-16 bg-white w-full'>
      {contextHolder}

      {loading ? (
        <PricingSkeleton />
      ) : (
        <div className='w-full flex flex-wrap gap-4 justify-center'>
          {displayPlans.map((item, i) => {
            const isActive = isCurrentPlan(item); // Kiểm tra trạng thái gói

            return (
              <div
                key={i}
                className={`
                  flex flex-col justify-between 
                  p-6 border-2 min-h-[420px] bg-white text-[#2E2E2E]
                  transition-all duration-300
                  ${
                    isActive
                      ? 'border-green-500 ring-1 ring-green-500 bg-green-50/30' // Style Active: Viền xanh, nền hơi xanh nhẹ
                      : 'border-[#e5e5e5] hover:border-[#2e2e2e]' // Style thường
                  }
                `}
              >
                <div>
                  {/* TITLE */}
                  <div className='flex justify-between items-start'>
                    <div className='text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis'>
                      {item.title}
                    </div>
                    {/* Badge hiển thị nếu đang active */}
                    {isActive && (
                      <span className='bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider'>
                        Đang dùng
                      </span>
                    )}
                  </div>

                  {/* PRICE */}
                  <div className='mt-4'>
                    {item.price ? (
                      <div className='flex flex-col xl:flex-row xl:items-end gap-1'>
                        <div className='text-3xl lg:text-4xl font-bold text-[#2E2E2E]'>
                          {item.price}
                        </div>
                        {item.sub && (
                          <div className='text-[10px] lg:text-xs font-medium uppercase opacity-80 mb-1 whitespace-nowrap'>
                            {item.sub}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='h-[40px]'></div>
                    )}
                  </div>

                  {/* FEATURES */}
                  <div className='mt-6 space-y-2 text-xs lg:text-sm opacity-80'>
                    {item.features.map((f, idx) => (
                      <div key={idx} className='leading-snug'>
                        • {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  onClick={() => handleButtonClick(item)}
                  disabled={
                    (!!processingId && processingId === item.id) || isActive
                  }
                  className={`
                    mt-8 w-full py-2 border font-semibold text-xs lg:text-sm transition-all duration-150 uppercase whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-green-600 border-green-600 text-white cursor-default hover:bg-green-600' // Button khi Active
                        : processingId === item.id
                        ? 'opacity-50 cursor-wait border-[#2e2e2e]'
                        : 'border-[#2e2e2e] text-[#2e2e2e] hover:bg-[#2e2e2e] hover:text-white' // Button thường
                    }
                  `}
                >
                  {isActive
                    ? '✓ ĐANG SỬ DỤNG'
                    : processingId === item.id
                    ? 'ĐANG XỬ LÝ...'
                    : item.button}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function PricingSkeleton() {
  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-center'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className='
            flex flex-col justify-between
            p-6 border-2 min-h-[420px]
            bg-white border-[#e5e5e5]
          '
        >
          <div>
            {/* TITLE */}
            <Skeleton active title={{ width: '60%' }} paragraph={false} />

            {/* PRICE */}
            <div className='mt-4'>
              <Skeleton
                active
                title={{ width: '70%', height: 32 }}
                paragraph={false}
              />
            </div>

            {/* FEATURES */}
            <div className='mt-6 space-y-2'>
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </div>
          </div>

          {/* BUTTON */}
          <Skeleton.Button active block size='large' className='mt-8' />
        </div>
      ))}
    </div>
  );
}
