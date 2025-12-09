import "./User.scss";

import { useParams } from "react-router-dom";
import { LuPencil } from "react-icons/lu";
import { Link, NavLink, Outlet } from "react-router-dom";
import Modal from "../../components/Modal";
import { useEffect, useState } from "react";
import WebLine from "../../components/web-line";
import * as userApi from "@/api/userApi";

function User() {
  const userId = useParams().user ?? localStorage.getItem("user");
  console.log(userId);

  const [userData, setUserData] = useState(null);

  const [showModalUser, setShowModalUser] = useState(false);
  const [showModalForget, setShowModalForget] = useState(false);

  const handleUserClick = () => {
    setShowModalUser(true);
  };

  const handleForgetClick = () => {
    setShowModalForget(true);
    setShowModalUser(false);
  };

  async function fetchUserData() {
    const user = await userApi.getUserById(userId);
    setUserData(user);
    console.log(user);
  }

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  return (
    <>
      <div className="User">
        <div className="container-main">
          <div className="User__inner">
            <div className="User__inner__header">
              <div className="User__inner__header__left">
                <div className="User__inner__header__left__title">
                  PERSONAL ART SPACE
                </div>
                <div className="User__inner__header__left__disc">
                  Hi {userData?.name}, Welcome back!
                </div>
              </div>
              <div className="User__inner__header__right">
                <div
                  className="User__inner__header__right__image"
                  style={{
                    backgroundImage: `url(/${userData?.avatar})`,
                  }}
                ></div>
                <div className="User__inner__header__right__user">
                  <div className="User__inner__header__right__user__name">
                    {userData?.name}
                  </div>
                  <div className="User__inner__header__right__user__button">
                    <div className="flex gap-1 p-1 px-4 cursor-pointer bg-red-500 text-white items-center mr-5 border-2 border-red-500 hover:bg-white ">
                      <p className="hover:text-red-500"> LỊCH SỬ THAM QUAN</p>
                    </div>
                    <div className="flex gap-1 p-1 px-4 cursor-pointer hover:bg-red-500 hover:text-white text-red-500 items-center border-2 border-red-500">
                      <div
                        className="User__inner__header__right__user__button__item__text"
                        onClick={handleUserClick}
                      >
                        SỬA THÔNG TIN
                      </div>
                      <div className="User__inner__header__right__user__button__item__icon">
                        <LuPencil />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isVisible={showModalUser} onClose={() => setShowModalUser(false)}>
        <div className="modalRegister__title">CHỈNH SỬA</div>
        <form className="modalRegister__form">
          <label className="modalRegister__form__label">Tên của bạn</label>
          <input
            type="text"
            placeholder="Ngô Thị Hồng nhung"
            className="modalRegister__form__input"
          />
          <label className="modalRegister__form__label">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            className="modalRegister__form__input"
          />
          <label className="modalRegister__form__label">Mật khẩu mới</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            className="modalRegister__form__input"
          />
          <label className="modalRegister__form__label">
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            className="modalRegister__form__input"
          />
          <div
            className="modalRegister__form__Userforget"
            onClick={handleForgetClick}
          >
            Quên mật khẩu
          </div>
          <div className="flex gap-3 justify-end">
            <button className="border-2 hover:bg-red-500 text-red-500 border-red-500 ">
              <span className="hover:text-white uppercase px-4 py-2">Huỷ</span>
            </button>
            <button className="border-2  bg-red-500 text-white border-red-500 hover:bg-white py-2">
              <p className="hover:text-red-500 px-4 uppercase h-full">
                Lưu thay đổi
              </p>
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isVisible={showModalForget}
        onClose={() => setShowModalForget(false)}
      >
        <div className="modalRegister__title">LẤY LẠI MẬT KHẨU</div>
        <form className="modalRegister__form">
          <label className="modalRegister__form__label">
            EMAIL BẠN ĐÃ ĐĂNG KÝ
          </label>
          <input
            type="text"
            name="email"
            placeholder="hongnhung.minha@gmail.com"
            className="modalRegister__form__input"
          />
          <button className="modalRegister__form__button">
            XÁC NHẬN EMAIL
          </button>
        </form>
      </Modal>
    </>
  );
}

export default User;
