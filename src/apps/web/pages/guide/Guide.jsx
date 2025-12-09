import { Link } from "react-router-dom";
import WebLine from "../../components/web-line";

export default function Guide() {
  return (
    <div className="Guide">
      {/* HEADER */}
      <div className="w-full pt-12 pb-6">
        <div className="container-main mx-auto">
          <h1 className="text-4xl font-bold uppercase tracking-wide">
            HƯỚNG DẪN SỬ DỤNG
          </h1>
        </div>
      </div>
      <div className="container-main flex-col mx-auto">
        <p className="text-center text-2xl font-bold mb-6">
          ĐỐI VỚI CÔNG CHÚNG
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              1. Tìm kiếm triển lãm hoặc tác phẩm nghệ thuật bạn quan tâm
            </h2>
            <p className="leading-relaxed flex-grow">
              Bạn có thể tìm kiếm hoặc duyệt qua các triển lãm và tác phẩm nghệ
              thuật có sẵn trên nền tảng. Bạn có thể lọc theo tên nghệ sĩ, thể
              loại hoặc chủ đề.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              2. Chọn trưng bày mỹ thuật ảo
            </h2>
            <p className="leading-relaxed flex-grow">
              Nhấp vào triển lãm hoặc tác phẩm nghệ thuật mà bạn quan tâm để xem
              chi tiết hơn.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              3. Tương tác và điều khiển góc nhìn
            </h2>
            <p className="leading-relaxed flex-grow">
              Bạn có thể điều hướng trong không gian triển lãm 3D và tương tác
              với các tác phẩm nghệ thuật bằng chuột hoặc bàn phím (phím mũi
              tên) để thay đổi góc nhìn, phóng to, xoay và tìm thông tin.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">4. Tham quan và khám phá</h2>
            <p className="leading-relaxed flex-grow">
              Khám phá không gian triển lãm 3D, di chuyển qua các phòng khác
              nhau, đọc thông tin và mô tả của các tác phẩm nghệ thuật, và
              thưởng thức các chi tiết và góc nhìn khác nhau.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">5. Tương tác và chia sẻ</h2>
            <p className="leading-relaxed flex-grow">
              Sau khi trải nghiệm các không gian triển lãm, bạn có thể cung cấp
              phản hồi và chia sẻ ý kiến của mình bằng các tính năng tương tác
              có sẵn.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              6. Thực hiện các chức năng bổ sung
            </h2>
            <p className="leading-relaxed flex-grow">
              Tuỳ thuộc vào nền tảng, bạn có thể có cơ hội cho các chức năng bổ
              sung như xem video giới thiệu hoặc liên hệ để mua tác phẩm nghệ
              thuật.
            </p>
          </div>
        </div>
      </div>
      <div className="container-main">
        <WebLine />
      </div>
      <div className="container-main flex-col mx-auto pb-12">
        <p className="text-center text-2xl font-bold mb-6">ĐỐI VỚI NGHỆ SĨ</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              1. Chọn không gian trưng bày ảo
            </h2>
            <p className="leading-relaxed flex-grow">
              Tìm kiếm và chọn một không gian trưng bày phù hợp với tác phẩm
              hoặc chủ đề mình có. Đăng nhập hoặc tạo tài khoản trên nền tảng
              này hoặc liên hệ trực tiếp với Ban tổ chức của Không gian mỹ thuật
              ảo.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              2. Chuẩn bị hình ảnh và thông tin
            </h2>
            <p className="leading-relaxed flex-grow">
              Chụp hoặc tạo hình ảnh chất lượng cao của tác phẩm nghệ thuật và
              thông tin chi tiết về triển lãm, bao gồm tên triển lãm, tác giả,
              mô tả, và thông tin liên hệ.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              3. Tạo không gian triển lãm
            </h2>
            <p className="leading-relaxed flex-grow">
              Sử dụng các công cụ và chức năng có sẵn trên nền tảng trưng bày
              ảo, tạo không gian triển lãm theo ý muốn. Bạn có thể thêm các
              phòng và bố cục khác nhau cho triển lãm của mình.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              4. Tải lên hình ảnh và tác phẩm nghệ thuật
            </h2>
            <p className="leading-relaxed flex-grow">
              Tải lên hình ảnh và tác phẩm nghệ thuật của bạn vào không gian
              triển lãm. Trong quá trình này, bạn sẽ được yêu cầu chọn vị trí và
              cách bố trí các tác phẩm nghệ thuật trong không gian ảo.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              5. Thêm thông tin chi tiết
            </h2>
            <p className="leading-relaxed flex-grow">
              Thêm thông tin chi tiết cho từng tác phẩm nghệ thuật, bao gồm tên
              tác phẩm, ngày tạo, kỹ thuật, mô tả, và giá trị nếu nó đang được
              bán.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">
              6. Tuỳ chỉnh và tương tác
            </h2>
            <p className="leading-relaxed flex-grow">
              Sử dụng các công cụ và chức năng có sẵn trên nền tảng, tuỳ chỉnh
              không gian triển lãm và cách người xem tương tác với tác phẩm. Bạn
              có thể thay đổi góc nhìn, zoom, hoặc thêm các biểu đồ và thông tin
              bổ sung.
            </p>
          </div>

          <div className=" p-6 flex flex-col" style={{ border: "2px solid" }}>
            <h2 className="text-xl font-bold mb-4">7. Kiểm tra và xuất bản</h2>
            <p className="leading-relaxed flex-grow">
              Trước khi đăng tải triển lãm, hãy kiểm tra kỹ lưỡng các tác phẩm,
              thông tin, và các tính năng tương tác để đảm bảo mọi thứ hoạt động
              một cách chính xác. Khi bạn đã hoàn tất, xuất bản triển lãm và
              chia sẻ liên kết để người khác có thể tham quan.{" "}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
