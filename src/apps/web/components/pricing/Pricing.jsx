function Pricing() {
  const pricing = [
    {
      title: "KHỞI ĐỘNG",
      price: "MIỄN PHÍ",
      sub: "DÙNG THỬ",
      features: ["Tính năng giới hạn", "Không có triển lãm 3D công khai"],
      button: "ĐĂNG KÝ",
    },
    {
      title: "CƠ BẢN",
      price: "12",
      sub: "USD /THÁNG*",
      features: ["Lưu trữ 50 tác phẩm nghệ thuật", "5 triển lãm 3D công khai"],
      button: "NÂNG CẤP",
    },
    {
      title: "TIÊU CHUẨN",
      price: "30",
      sub: "USD /THÁNG*",
      features: [
        "Lưu trữ 250 tác phẩm nghệ thuật",
        "10 triển lãm 3D công khai",
      ],
      button: "NÂNG CẤP",
    },
    {
      title: "CHUYÊN NGHIỆP",
      price: "60",
      sub: "USD /THÁNG*",
      features: [
        "Lưu trữ 500 tác phẩm nghệ thuật",
        "50 triển lãm 3D công khai",
      ],
      button: "NÂNG CẤP",
    },
    {
      title: "GÓI RIÊNG",
      price: "",
      sub: "",
      features: ["Tuỳ chỉnh theo nhu cầu", "Dịch vụ & giải pháp doanh nghiệp"],
      button: "LIÊN HỆ",
    },
  ];

  return (
    <div className="container-main flex justify-center">
      <div className="w-full flex flex-nowrap gap-6 justify-center">
        {pricing.map((item, i) => (
          <div
            key={i}
            style={{ flexBasis: `${100 / pricing.length}%` }}
            className={`
              flex flex-col justify-between 
              p-10 border-2 border-[#e5e5e5] min-h-[420px]
              ${
                item.dark
                  ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                  : "bg-white text-[#2E2E2E]"
              }
            `}
          >
            {/* TITLE */}
            <div className="text-sm font-semibold ">{item.title}</div>

            {/* PRICE */}
            <div className="mt-4">
              {item.price ? (
                <div className="flex items-end gap-2">
                  <div
                    className={`text-4xl font-bold ${
                      item.dark ? "text-white" : "text-[#2E2E2E]"
                    }`}
                  >
                    {item.price}
                  </div>
                  <div className="text-sm font-medium uppercase opacity-80">
                    {item.sub}
                  </div>
                </div>
              ) : null}
            </div>

            {/* FEATURES */}
            <div className="mt-6 space-y-1 text-sm opacity-80">
              {item.features.map((f, idx) => (
                <div key={idx}>{f}</div>
              ))}
            </div>

            {/* BUTTON */}
            <button className="  mt-10 w-full py-2 border font-semibold st                text-sm transition-all duration-150 border-[#2e2e2e] text-[#2e2e2e] hover:bg-[#2e2e2e] hover:text-white">
              {item.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pricing;
