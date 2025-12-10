import './Navbar.css';
import './LayoutDefault.scss';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FaPhoneAlt } from 'react-icons/fa';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { MdOutlineEmail } from 'react-icons/md';
import { FaFacebook } from 'react-icons/fa';
import { FaYoutube } from 'react-icons/fa';
import { FaInstagram } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import WebLine from '../components/web-line';
import { useNavigate } from 'react-router-dom';
import { RoomApi } from '@/api/roomApi';
import { AuthApi } from '@/api/authApi';
import { UserApi } from '@/api/userApi';
import { checkRoutePermission } from '@/common/utils';
import { RoleEnum } from '@/common/constants';
import { Modal as ModalAnt, notification } from 'antd';
import AuthModal from '../components/modals/AuthModal';

function LayoutDefault() {
  const menuConfig = [
    {
      label: 'Trang chủ',
      path: '/',
      isShow: true,
    },
    {
      label: 'Danh sách không gian',
      path: '/listspace',
      isShow: true,
    },
    { label: 'Tin tức', path: '/news', isShow: true },
    {
      label: 'Thông tin',
      isShow: true,
      children: [
        { label: 'Về chúng tôi', path: '/about', isShow: true },
        { label: 'Liên hệ', path: '/contact', isShow: true },
        { label: 'Hướng dẫn sử dụng', path: '/guide', isShow: true },
      ],
    },
    {
      label: 'Quản lý',
      isShow: false,
      path: '/manage',
      children: [
        {
          label: 'Quản lý người dùng',
          isShow: false,
          path: '/manage/user',
        },
        {
          label: 'Quản lý tài nguyên',
          isShow: false,
          path: '/manage/resource',
        },
        {
          label: 'Quản lý tin tức',
          isShow: false,
          path: '/manage/news',
        },
        {
          label: 'Quản lý không gian',
          isShow: false,
          path: '/manage/space',
        },
      ],
    },
  ];

  const [userId, setUserId] = useState(localStorage.getItem('user'));
  const [api, contextHolder] = notification.useNotification();

  const [menu, setMenu] = useState(menuConfig);
  const [force, setForce] = useState(0);

  const [spaces, setSpaces] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const { pathname } = useLocation();
  const [showModalRegister, setShowModalRegister] = useState(false);
  const [showModalLogin, setShowModalLogin] = useState(false);
  const navigate = useNavigate();

  function filterMenu() {
    const userRole = currentUser?.role || RoleEnum.Guest;

    const cloneMenu = JSON.parse(JSON.stringify(menuConfig));

    function resolvePath(route) {
      if (route.children) route.children.forEach((child) => resolvePath(child));

      route.isShow = route.path
        ? checkRoutePermission(route.path, userRole)
        : true;
    }

    cloneMenu.forEach(resolvePath);

    setMenu(cloneMenu);
  }

  const handleRegisterClick = () => {
    setShowModalRegister(true);
    setShowModalLogin(false);
    setNavToggle((prevData) => !prevData);
  };
  const handleLoginClick = () => {
    setShowModalLogin(true);
    setShowModalRegister(false);
    setNavToggle((prevData) => !prevData);
  };

  const [navToggle, setNavToggle] = useState(false);
  const navHandler = () => {
    setNavToggle((prevData) => !prevData);
  };

  function handleLogout() {
    ModalAnt.confirm({
      title: 'Đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk() {
        AuthApi.logout();
        setCurrentUser(null);
        setUserId(null);
        setForce(force + 1);
        navigate('/');
        api.success({
          title: 'Đăng xuất',
          description: 'Đăng xuất thành công',
        });
      },
      onCancel() {},
    });
  }

  const fetchSpaces = async () => {
    try {
      const data = await RoomApi.getPublicRoomList();
      setSpaces(data.slice(0, 5));
    } catch (error) {
      console.error('Lỗi API:', error);
    }
  };

  async function fetchCurrentUser() {
    if (userId) {
      const data = await UserApi.getById(userId);
      setCurrentUser(data);
      setForce(force + 1);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
    fetchSpaces();
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [userId]);

  useEffect(() => {
    filterMenu();
  }, [force]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <>
      {contextHolder}
      <div className='Web'>
        <header>
          <div className='Web__header'>
            <div className='container-main'>
              <div className='Web__header__inner'>
                <Link to={'/'} className='Web__header__inner__logo'>
                  <img src='/logo.png' alt='VEXPO' className='h-6' />
                </Link>
                <div className='Web__header__inner__menu'>
                  <ul className='nav-menu'>
                    {menu
                      .filter((item) => item.isShow)
                      .map((item, i) => (
                        <li
                          key={i}
                          className={`nav-item ${
                            item.children ? 'dropdown' : ''
                          }`}
                        >
                          {item.children ? (
                            <span className='nav-link'>{item.label}</span>
                          ) : (
                            <NavLink to={item.path} className='nav-link'>
                              {item.label}
                            </NavLink>
                          )}

                          {item.children && (
                            <div className='dropdown-menu'>
                              {item.children
                                .filter((child) => child.isShow)
                                .map((child, j) => (
                                  <Link key={j} to={child.path}>
                                    {child.label}
                                  </Link>
                                ))}
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>

                <div key={force} className='Web__header__inner__extend'>
                  {currentUser ? (
                    <div className='relative group'>
                      {/* Trigger */}
                      <div className='font-semibold py-1 cursor-pointer flex items-center gap-2'>
                        <img
                          src='/avatar.png'
                          alt=''
                          className='rounded-full h-9 w-9 object-cover'
                        />
                        <span className='text-xl'>{currentUser.name}</span>
                      </div>

                      {/* Dropdown */}
                      <div className='hidden group-hover:block absolute right-0 top-full  w-52 bg-white  shadow-lg z-50 border-2'>
                        <div
                          className='px-4 py-2   hover:font-semibold cursor-pointer'
                          onClick={() => navigate('/user')}
                        >
                          Hồ sơ
                        </div>
                        {currentUser.role !== RoleEnum.Admin && (
                          <div
                            className='px-4 py-2 hover:font-semibold cursor-pointer'
                            onClick={() => navigate('/pricing')}
                          >
                            Nâng cấp tài khoản
                          </div>
                        )}

                        <div
                          className='px-4 py-2   hover:font-semibold cursor-pointer'
                          onClick={handleLogout}
                        >
                          Đăng xuất
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className='primary-button'
                        onClick={handleLoginClick}
                      >
                        ĐĂNG NHẬP
                      </div>

                      <div
                        className='secondary-button ml-5'
                        onClick={handleRegisterClick}
                      >
                        ĐĂNG KÝ
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className='Web__header__hidden'>
                <div className='Web__header__hidden__menu'>
                  <div
                    type='button'
                    className={`hamburger-menu ${
                      navToggle ? 'hamburger-menu-change' : ''
                    }`}
                    onClick={navHandler}
                  >
                    <div className='bar-top'></div>
                    <div className='bar-middle'></div>
                    <div className='bar-bottom'></div>
                  </div>
                  <div
                    className={`navbar-collapse ${
                      navToggle ? 'show-navbar-collapse' : ''
                    }`}
                  >
                    <div className='navbar-collapse-content'>
                      <ul className='nav-menu'>
                        {menuConfig
                          .filter((item) => item.isShow)
                          .map((item, i) => (
                            <li
                              key={i}
                              className={`nav-item ${
                                item.children ? 'dropdown' : ''
                              }`}
                            >
                              {item.children ? (
                                <span className='nav-link'>{item.label}</span>
                              ) : (
                                <NavLink to={item.path} className='nav-link'>
                                  {item.label}
                                </NavLink>
                              )}

                              {item.children && (
                                <div className='dropdown-menu'>
                                  {item.children
                                    .filter((child) => child.isShow)
                                    .map((child, j) => (
                                      <Link key={j} to={child.path}>
                                        {child.label}
                                      </Link>
                                    ))}
                                </div>
                              )}
                            </li>
                          ))}
                      </ul>

                      <div className='navbar-nav gap-3'>
                        {currentUser ? (
                          <div className='relative group'>
                            {/* Trigger */}
                            <div className='px-4 pb-3 font-semibold py-1 cursor-pointer'>
                              {currentUser.email}
                            </div>

                            {/* Dropdown */}
                            <div className='hidden group-hover:block absolute left-full -top-3  w-52 bg-white  shadow-lg z-50 border-2'>
                              <div
                                className='px-4 py-2   hover:font-semibold cursor-pointer'
                                onClick={() => navigate('/user')}
                              >
                                Hồ sơ
                              </div>
                              {currentUser.role !== RoleEnum.Admin && (
                                <div
                                  className='px-4 py-2 hover:font-semibold cursor-pointer'
                                  onClick={() => navigate('/pricing')}
                                >
                                  Nâng cấp tài khoản
                                </div>
                              )}

                              <div
                                className='px-4 py-2   hover:font-semibold cursor-pointer'
                                onClick={handleLogout}
                              >
                                Đăng xuất
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className='primary-button'
                              onClick={handleLoginClick}
                            >
                              ĐĂNG NHẬP
                            </div>

                            <div
                              className='secondary-button'
                              onClick={handleRegisterClick}
                            >
                              ĐĂNG KÝ
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Link to={'/'} className='Web__header__hidddden__logo'>
                  VEXPO
                </Link>
                <div className='Web__header__inner__extend'>
                  {/* <div className='Web__header__inner__extend__icon'>
                    <IoMdSearch />
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>

        <footer>
          <div className='Web__footer'>
            <div className='container-main'>
              <div className='Web__footer__inner'>
                <div className='row'>
                  <div className='col-md-6'>
                    <div className='Web__footer__inner__logo'>VEXPO</div>
                    <div className='Web__footer__inner__contact'>
                      <div className='Web__footer__inner__contact__icon'>
                        <FaPhoneAlt />
                      </div>
                      <div className='Web__footer__inner__contact__text'>
                        0123 456 789
                      </div>
                    </div>
                    <div className='Web__footer__inner__contact'>
                      <div className='Web__footer__inner__contact__icon'>
                        <FaMapMarkerAlt />
                      </div>
                      <div className='Web__footer__inner__contact__text'>
                        Đống Đa, Hà Nội, Việt Nam
                      </div>
                    </div>
                    <div className='Web__footer__inner__contact'>
                      <div className='Web__footer__inner__contact__icon'>
                        <MdOutlineEmail />
                      </div>
                      <div className='Web__footer__inner__contact__text'>
                        email@gmail.com
                      </div>
                    </div>
                  </div>
                  <div className='col-md-3'>
                    <div className='Web__footer__inner__title'>
                      DANH SÁCH KHÔNG GIAN
                    </div>

                    {spaces.slice(0, 5).map((item) => (
                      <Link
                        key={item.id}
                        to={'/space/' + item.slug}
                        className='Web__footer__inner__text'
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>

                  <div className='col-md-3'>
                    <Link to={'/aboutus'} className='Web__footer__inner__title'>
                      TIN TỨC
                    </Link>
                    <Link to={'/aboutus'} className='Web__footer__inner__title'>
                      HƯỚNG DẪN SỬ DỤNG
                    </Link>
                    <Link to={'/aboutus'} className='Web__footer__inner__title'>
                      VỀ CHÚNG TÔI
                    </Link>
                    <Link to={'/contact'} className='Web__footer__inner__title'>
                      LIÊN HỆ
                    </Link>
                    <div className='Web__footer__inner__icon'>
                      <div className='Web__footer__inner__icon__inner'>
                        <FaFacebook />
                      </div>
                      <div className='Web__footer__inner__icon__inner'>
                        <FaYoutube />
                      </div>
                      <div className='Web__footer__inner__icon__inner'>
                        <FaInstagram />
                      </div>
                      <div className='Web__footer__inner__icon__inner'>
                        <FaTiktok />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        isVisible={showModalRegister || showModalLogin}
        onClose={() => {
          setShowModalLogin(false);
          setShowModalRegister(false);
        }}
        initMode={showModalRegister ? 'register' : 'login'}
        onSuccess={(userId) => {
          setUserId(userId);
        }}
      />
    </>
  );
}
export default LayoutDefault;
