import "./Space.scss";
import { useParams } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";
import Home_Section2 from "../../components/recommend-spaces";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { RoomApi } from "@/api/roomApi";

function Space() {
  const { prop } = useParams(); // Lấy prop từ URL

  // Tìm thông tin không gian theo prop
  const [khongGian, setKhongGian] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setKhongGian(null);
      try {
        const data = await RoomApi.getOneBySlug(prop);
        setKhongGian(data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách exhibition:", err);
      }
    };
    fetchData();
  }, [prop]);

  if (!khongGian) {
    return <div className="text-center mt-5">Đang tải không gian!</div>;
  }

  // Tách description bằng dấu `/`
  const descriptionParts = (khongGian?.description || "").split("/");

  return (
    <>
      {khongGian ? (
        <>
          <div className="Space">
            <div
              className="Space__overlay bg-cover bg-no-repeat bg-center"
              style={{ backgroundImage: `url(${khongGian?.thumbnail})` }}
            ></div>
            <div className="Space__overlay"></div>
            <div
              className=" p-5 shadow-3xl relative"
              style={{ boxShadow: "0 0 28px black" }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-white opacity-80"></div>
              <div className="relative w-[520px]">
                <div className="font-bold text-[80px]">{khongGian?.title}</div>
                <div className="Space__inner__info text-xl gap-5">
                  <div className="flex flex-col gap-2 font-semibold">
                    <div className="Space__inner__info__item__item">
                      Nghệ sĩ
                    </div>
                    <div className="Space__inner__info__item__item">
                      Thể loại
                    </div>
                    <div className="Space__inner__info__item__item">Mô tả</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="Space__inner__info__item2__item">
                      {khongGian?.author}
                    </div>
                    <div className="Space__inner__info__item2__item">
                      {khongGian?.type}
                    </div>
                    <div className="Space__inner__info__item2__item">
                      {descriptionParts.map((part, index) => (
                        <div key={index} className="Space__inner__des">
                          {part.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link to={`/exhibition-edit/${khongGian?.slug}`} className="">
                    <div className="Space__inner__button__inner">
                      <div className="Space__inner__button__inner__text uppercase">
                        Chỉnh sửa KHÔNG GIAN
                      </div>
                      <div className="Space__inner__button__inner__icon">
                        <MdArrowOutward />
                      </div>
                    </div>
                  </Link>
                  <Link
                    to={`/exhibition/${khongGian?.slug}`}
                    className="ml-auto"
                  >
                    <div className="flex gap-2 py-3 px-6 items-center bg-[#2e2e2e] hover:bg-red-500">
                      <p className=" uppercase text-white ">
                        KHÁM PHÁ KHÔNG GIAN
                      </p>
                      <div className="text-white ">
                        <MdArrowOutward />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="Space__disc">
            <div className="container-main">
              <div className="Space__disc__inner">
                <div className="Space__disc__inner__title">Mô tả</div>
                {descriptionParts.map((part, index) => (
                  <div key={index} className="Space__disc__inner__des">
                    {part.trim()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>Đang tải không gian!</div>
      )}
      <Home_Section2 />
    </>
  );
}

export default Space;
