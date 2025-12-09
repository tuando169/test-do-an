import { Link } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";

import Home_Section2 from "../../components/recommend-spaces";
import AboutInfo from "../../components/about-info/AboutInfo";

export default function AboutUs() {
  return (
    <div className="w-full flex flex-col border-t border-[#969696] pt-14">
      <AboutInfo />

      {/* Section 1 */}
      <div className="container-main">
        <div className="flex flex-col w-full mb-14">
          <div className="mb-14">
            <div className="flex flex-col lg:flex-row-reverse gap-6">
              {/* LEFT TEXT */}
              <div className="w-full lg:w-1/2 mb-6">
                <div>
                  <h2 className="mt-0 mb-6 text-[32px] font-medium text-[#2E2E2E]">
                    TRẢI NGHIỆM GAMEPLAY
                  </h2>

                  <p className="text-[#515151] leading-relaxed mb-4">
                    Trong trải nghiệm gameplay này, bạn sẽ bước vào một không
                    gian ảo sống động, không chỉ là người quan sát mà còn là
                    người tham gia, tương tác và tạo ra những câu chuyện riêng
                    của mình.
                  </p>

                  <p className="text-[#515151] leading-relaxed">
                    Bạn sẽ được chìm đắm trong những môi trường đa dạng, từ
                    những mảnh ghép bí ẩn đến những thử thách vượt chướng ngại
                    vật, và nhiều hơn nữa. Tất cả đều được xây dựng tỉ mỉ với
                    công nghệ VR tiên tiến, mang đến trải nghiệm chân thật, sống
                    động.
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <img
                  src="/Web/game-vr-beat-saber.jpg"
                  className="w-full object-cover"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Home_Section2 />
    </div>
  );
}
