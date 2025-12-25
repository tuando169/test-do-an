import './Space.scss';
import { useParams } from 'react-router-dom';
import { MdArrowOutward } from 'react-icons/md';
import RecommendSpaces from '../../components/recommend-spaces';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RoomApi } from '@/api/roomApi';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';
import { Skeleton } from 'antd'; // Import Skeleton

function Space() {
  const { prop } = useParams(); // Lấy prop từ URL

  const [khongGian, setKhongGian] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm state loading

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
      setLoading(true); // Bắt đầu load
      setKhongGian(null);
      try {
        const data = await RoomApi.getOneBySlug(prop);
        setKhongGian(data);
      } catch (err) {
        console.error('Lỗi khi tải thông tin không gian:', err);
      } finally {
        setLoading(false); // Kết thúc load
      }
    };
    fetchData();
  }, [prop]);

  // Component Skeleton mô phỏng trang chi tiết
  const SpaceSkeleton = () => (
    <>
      <div className='Space'>
        {/* Giả lập Background mờ */}
        <div className='Space__overlay bg-gray-200'></div>

        {/* Giả lập Box thông tin chính */}
        <div
          className='p-10 shadow-3xl relative bg-white min-w-[50vw] max-w-[90vw]'
          style={{ boxShadow: '0 0 28px rgba(0,0,0,0.1)' }}
        >
          {/* Title lớn (mô phỏng 80px) */}
          <Skeleton.Input
            active
            block
            style={{ height: 80, marginBottom: 30, width: '70%' }}
          />

          <div className='Space__inner__info text-xl gap-10 flex'>
            {/* Cột Label */}
            <div className='flex flex-col gap-4 font-semibold'>
              <Skeleton.Input active size='small' style={{ width: 80 }} />
              <Skeleton.Input active size='small' style={{ width: 80 }} />
              <Skeleton.Input active size='small' style={{ width: 80 }} />
            </div>

            {/* Cột Value */}
            <div className='flex flex-col gap-4 w-full'>
              <Skeleton.Input active size='small' style={{ width: 200 }} />
              <Skeleton.Input active size='small' style={{ width: 150 }} />
              {/* Mô tả ngắn */}
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </div>
          </div>

          {/* Buttons */}
          <div className='flex gap-3 mt-8 justify-end'>
            <Skeleton.Button
              active
              size='large'
              style={{ width: 180, height: 45 }}
            />
            <Skeleton.Button
              active
              size='large'
              style={{ width: 220, height: 45 }}
            />
          </div>
        </div>
      </div>

      {/* Giả lập phần mô tả chi tiết dưới cùng */}
      <div className='Space__disc'>
        <div className='container-main'>
          <div className='Space__disc__inner'>
            <Skeleton.Input
              active
              size='large'
              style={{ width: 100, marginBottom: 20 }}
            />
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          </div>
        </div>
      </div>
    </>
  );

  // LOGIC RENDER
  if (loading || !khongGian) {
    return <SpaceSkeleton />;
  }

  const descriptionParts = (khongGian?.description || '').split('/');

  return (
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
                <div className='Space__inner__info__item__item min-w-max'>
                  Nghệ sĩ
                </div>
                <div className='Space__inner__info__item__item min-w-max'>
                  Thể loại
                </div>
                <div className='Space__inner__info__item__item min-w-max'>
                  Mô tả
                </div>
              </div>
              <div className='flex flex-col gap-2 font-medium'>
                <div className='Space__inner__info__item2__item'>
                  {khongGian?.author}
                </div>
                <div className='Space__inner__info__item2__item'>
                  {khongGian?.type}
                </div>
                <div
                  className='max-h-[30vh] overflow-y-auto overflow-x-hidden'
                  dangerouslySetInnerHTML={{
                    __html: khongGian.description,
                  }}
                ></div>
              </div>
            </div>
            <div className='flex gap-3 mt-4 justify-end'>
              {(khongGian?.owner_id == localStorage.getItem('user') ||
                userRole == RoleEnum.Admin) && (
                <Link
                  to={
                    khongGian.type == 'template'
                      ? `/template-edit/${khongGian?.slug}`
                      : `/exhibition-edit/${khongGian?.slug}`
                  }
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
                to={
                  khongGian.type == 'template'
                    ? `/template/${khongGian?.slug}`
                    : `/exhibition/${khongGian?.slug}`
                }
                className=''
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
      <RecommendSpaces />
    </>
  );
}

export default Space;
