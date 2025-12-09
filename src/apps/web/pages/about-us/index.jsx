import { Link } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";

import Home_Section2 from "../../components/recommend-spaces";
import "./AboutUs.scss";
import AboutInfo from "../../components/about-info/AboutInfo";

function AboutUs() {
  return (
    <>
      <div className="AboutUs">
        <AboutInfo />
        <div className="container-main">
          <div className="AboutUs__inner">
            <div className="AboutUs__inner__section1">
              <div className="row" style={{ flexDirection: "row-reverse" }}>
                <div className="col-md-6" style={{ marginBottom: "24px" }}>
                  <div className="AboutUs__inner__section1__left">
                    <div
                      className="AboutUs__inner__section1__left__title"
                      style={{ marginTop: "0px" }}
                    >
                      TRẢI NGHIỆM GAMEPLAY
                    </div>
                    <div className="AboutUs__inner__section1__left__text">
                      Trong trải nghiệm gameplay này, bạn sẽ bước vào một không
                      gian ảo sống động, không chỉ là người quan sát mà còn là
                      người tham gia, tương tác và tạo ra những câu chuyện riêng
                      của mình.
                    </div>
                    <div className="AboutUs__inner__section1__left__text">
                      Bạn sẽ được chìm đắm trong những môi trường đa dạng, từ
                      những mảnh ghép bí ẩn đến những thử thách vượt chướng ngại
                      vật, và nhiều hơn nữa. Tất cả đều được xây dựng tỉ mỉ với
                      công nghệ VR tiên tiến, mang đến trải nghiệm chân thật,
                      sống động
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="AboutUs__inner__section1__right">
                    <img src="/Web/About3.png" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Home_Section2 />
      </div>
    </>
  );
}

export default AboutUs;
