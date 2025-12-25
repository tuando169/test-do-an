import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowOutward } from 'react-icons/md';
import { Skeleton } from 'antd';
import './Home.scss';
import WebLine from '../../components/web-line';
import RecommendSpaces from '../../components/recommend-spaces';
import AboutInfo from '../../components/about-info/AboutInfo';
import Pricing from '../../components/pricing/Pricing';
import { RoomApi } from '@/api/roomApi';

function Home() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      setLoading(true);
      try {
        const data = await RoomApi.getPublicRoomList();
        setSpaces(data.slice(0, 3));
      } catch (error) {
        console.error('Lỗi API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const SpaceSkeleton = () => (
    <div className='row mb-4'>
      <div className='w-1/2'>
        <Skeleton.Image active style={{ width: '40vw', height: '40vh' }} />
      </div>

      <div className='w-1/2 flex flex-col justify-center pl-md-5 mt-4 mt-md-0'>
        <Skeleton.Input
          active
          size='small'
          style={{ width: 150, marginBottom: 10 }}
        />
        <Skeleton.Input
          active
          size='large'
          block
          style={{ height: 40, marginBottom: 20 }}
        />
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
        <div className='flex gap-10 mt-4 mb-4'>
          <Skeleton.Input active size='small' style={{ width: 100 }} />
          <Skeleton.Input active size='small' style={{ width: 100 }} />
        </div>
        <Skeleton.Button
          active
          size='large'
          style={{ width: 250, marginTop: 'auto' }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className='Web__home'>
        <div className='Web__home__sectionMain'>
          <video
            src='/videos/test.mp4'
            className='Web__home__sectionMain__video'
            autoPlay
            loop
            muted
          />
          <div className='Space__overlay'></div>
          <div className='container-main'>
            <div className='Web__home__sectionMain__inner'>
              <div className='Web__home__sectionMain__inner__title'>
                KHÁM PHÁ NGHỆ THUẬT KHÔNG GIỚI HẠN
              </div>
              <div className='Web__home__sectionMain__inner__button'>
                <Link
                  to={'/listspace'}
                  style={{ borderRadius: 0, padding: '8px 25px' }}
                >
                  <div className='Web__home__sectionMain__inner__button__text'>
                    KHÁM PHÁ
                  </div>
                  <div className='Web__home__sectionMain__inner__button__icon'>
                    <MdArrowOutward />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className='Web__home__section1'>
          <div className='container-main'>
            <div className='Web__home__section1__inner'>
              <div className='text-center px-5 pt-20 pb-10'>
                <h1 className='text-[48px] md:text-[52px] font-semibold mb-6'>
                  VEXPO – NỀN TẢNG TRIỂN LÃM ẢO HÀNG ĐẦU VIỆT NAM
                </h1>
                <WebLine />
                <p className='text-[18px] max-w-[1000px] mx-auto font-normal'>
                  VEXPO là nền tảng triển lãm ảo giúp người dùng tự thiết kế –
                  tùy biến – xuất bản các không gian trưng bày 3D ngay trên
                  trình duyệt. Với giao diện trực quan và bộ công cụ mạnh mẽ,
                  bạn có thể dễ dàng tạo phòng triển lãm, bố trí tác phẩm, thiết
                  lập ánh sáng và xây dựng hành trình tham quan như một gallery
                  thực thụ.
                  <br />
                  <br />
                  Chỉ với vài thao tác, triển lãm của bạn đã sẵn sàng chia sẻ
                  tới mọi người — ở bất cứ đâu.
                </p>
              </div>
            </div>
          </div>
        </div>

        <WebLine />

        <div className='Web__home__section1'>
          <div className='container-main'>
            <div className='Web__home__section1__inner'>
              <div className='Web__home__section1__inner__title font-semibold'>
                KHÁM PHÁ KHÔNG GIAN
              </div>
              <WebLine />

              <div className='Web__home__section1__inner__content'>
                {loading ? (
                  <>
                    <SpaceSkeleton />
                    <div className='my-8'>
                      <WebLine />
                    </div>
                    <SpaceSkeleton />
                    <div className='my-8'>
                      <WebLine />
                    </div>
                    <SpaceSkeleton />
                  </>
                ) : spaces.length > 0 ? (
                  spaces.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <div className={`row ${index % 2 === 0 ? 'r1' : 'r2'}`}>
                        <div className='col-md-6 col-12'>
                          <div
                            className='Web__home__section1__inner__content__left__imageDynamic'
                            style={{
                              minHeight: '30vh',
                              backgroundImage: `url(${item.thumbnail})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          ></div>
                        </div>

                        <div className='flex flex-col flex-1'>
                          <div className='Web__home__section1__inner__content__right__disc'>
                            KHÔNG GIAN TRƯNG BÀY
                          </div>

                          <div className='text-4xl font-bold'>{item.title}</div>

                          <div
                            className='mb-3 max-h-[9vh] overflow-hidden'
                            dangerouslySetInnerHTML={{
                              __html: item.description,
                            }}
                          ></div>
                          <div className='flex gap-3 mb-4'>
                            <div className='w-20'>
                              <p>Tác giả</p>
                              <p>Thể loại</p>
                            </div>
                            <div className='font-bold'>
                              <p> {item.author || 'Đang cập nhật'}</p>
                              <p> {item.type || 'Chưa phân loại'}</p>
                            </div>
                          </div>

                          <div className='Web__home__section1__inner__content__right__button mt-auto'>
                            <Link
                              to={`/space/${item.slug}`}
                              style={{ borderRadius: 0 }}
                            >
                              <div className='Web__home__section1__inner__content__right__button__text'>
                                KHÁM PHÁ KHÔNG GIAN
                              </div>
                              <div className='Web__home__section1__inner__content__right__button__icon'>
                                <MdArrowOutward />
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <WebLine />
                    </React.Fragment>
                  ))
                ) : (
                  <div className='text-center py-10 text-gray-500'>
                    Hiện chưa có không gian nào được hiển thị.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AboutInfo />
        <RecommendSpaces />
        <WebLine />
        <Pricing />
      </div>
    </>
  );
}

export default Home;
