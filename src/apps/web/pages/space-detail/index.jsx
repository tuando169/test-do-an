import './Space.scss';
import { useParams } from 'react-router-dom';
import { MdArrowOutward } from 'react-icons/md';
import RecommendSpaces from '../../components/recommend-spaces';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RoomApi } from '@/api/roomApi';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';

function Space() {
  const { prop } = useParams(); // Lấy prop từ URL

  // Tìm thông tin không gian theo prop
  const [khongGian, setKhongGian] = useState(null);
  const [userRole, setUserRole] = useState(null);

  async function fetchUserRole() {
    const userId = localStorage.getItem('user');
    const data = await UserApi.getById(userId);

    setUserRole(data.role);
  }

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setKhongGian(null);
      try {
        const data = await RoomApi.getOneBySlug(prop);
        setKhongGian(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách exhibition:', err);
      }
    };
    fetchData();
  }, [prop]);

  if (!khongGian) {
    return <div className='text-center mt-5'>Đang tải không gian!</div>;
  }

  const descriptionParts = (khongGian?.description || '').split('/');

  return (
    <>
      {khongGian ? (
        <>
          <div className='Space'>
            <div
              className='Space__overlay bg-cover bg-no-repeat bg-center'
              style={{ backgroundImage: `url(${khongGian?.thumbnail})` }}
            ></div>
            <div className='Space__overlay'></div>
            <div
              className=' p-5 shadow-3xl relative'
              style={{ boxShadow: '0 0 28px black' }}
            >
              <div className='absolute top-0 left-0 w-full h-full bg-white opacity-80'></div>
              <div className='relative min-w-[540px]'>
                <div className='font-bold text-[80px]'>{khongGian?.title}</div>
                <div className='Space__inner__info text-xl gap-5'>
                  <div className='flex flex-col gap-2 font-semibold'>
                    <div className='Space__inner__info__item__item'>
                      Nghệ sĩ
                    </div>
                    <div className='Space__inner__info__item__item'>
                      Thể loại
                    </div>
                    <div className='Space__inner__info__item__item'>Mô tả</div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='Space__inner__info__item2__item'>
                      {khongGian?.author}
                    </div>
                    <div className='Space__inner__info__item2__item'>
                      {khongGian?.type}
                    </div>
                    <div className='Space__inner__info__item2__item'>
                      {descriptionParts.map((part, index) => (
                        <div key={index} className='Space__inner__des'>
                          {part.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='flex gap-3 mt-4'>
                  {(khongGian?.owner_id == localStorage.getItem('user') ||
                    userRole == RoleEnum.Admin) && (
                    <Link
                      to={`/exhibition-edit/${khongGian?.slug}`}
                      className=''
                    >
                      <div className='flex gap-1 secondary-button items-center'>
                        <div className=' uppercase'>Chỉnh sửa KHÔNG GIAN</div>
                        <div className='Space__inner__button__inner__icon'>
                          <MdArrowOutward />
                        </div>
                      </div>
                    </Link>
                  )}
                  <Link
                    to={`/exhibition/${khongGian?.slug}`}
                    className='ml-auto'
                  >
                    <div className='flex gap-1 primary-button items-center'>
                      <p className=' uppercase  '>KHÁM PHÁ KHÔNG GIAN</p>
                      <div className=' '>
                        <MdArrowOutward />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className='Space__disc'>
            <div className='container-main'>
              <div className='Space__disc__inner'>
                <div className='Space__disc__inner__title'>Mô tả</div>
                {descriptionParts.map((part, index) => (
                  <div key={index} className='Space__disc__inner__des'>
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
      <RecommendSpaces />
    </>
  );
}

export default Space;
