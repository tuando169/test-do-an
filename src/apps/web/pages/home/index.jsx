import './Home.scss';
import { MdArrowOutward } from 'react-icons/md';
import WebLine from '../../components/web-line';
import Home_Section2 from '../../components/recommend-spaces';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import AboutInfo from '../../components/about-info/AboutInfo';
import Pricing from '../../components/pricing/Pricing';
import { RoomApi } from '@/api/roomApi';

function Home() {
  // const videoRef = useRef(null);
  // const [isPlaying, setIsPlaying] = useState(false);

  // const handlePageClick = () => {
  //     if (!isPlaying) {
  //         videoRef.current.play().catch(error => {
  //             console.error("Error playing video:", error);
  //         });
  //         setIsPlaying(true);
  //     }
  // };

  // const handlePageScroll = () => {
  //     if (!isPlaying) {
  //         videoRef.current.play().catch(error => {
  //             console.error("Error playing video:", error);
  //         });
  //         setIsPlaying(true);
  //     }
  // };

  // useEffect(() => {
  //     // Lắng nghe sự kiện click trên trang để phát video
  //     document.addEventListener('click', handlePageClick);

  //     return () => {
  //         document.removeEventListener('click', handlePageClick);
  //     };
  // }, [isPlaying]);

  // useEffect(() => {
  //     // Lắng nghe sự kiện cuộn chuột trên trang để phát video
  //     window.addEventListener('scroll', handlePageScroll);

  //     return () => {
  //         window.removeEventListener('scroll', handlePageScroll);
  //     };
  // }, [isPlaying]);
  const [spaces, setSpaces] = useState([]);
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await RoomApi.getPublicRoomList();

        setSpaces(data.slice(0, 3));
      } catch (error) {
        console.error('Lỗi API:', error);
      }
    };

    fetchSpaces();
  }, []);
  return (
    <>
      <div className='Web__home'>
        <div className='Web__home__sectionMain'>
          {/* <video
                        ref={videoRef}
                        loop
                        muted
                        playsInline
                        className="Web__home__sectionMain__video"
                    >
                        <source src={"/Web/VR Gallery.mp4"} type="video/mp4" />
                    </video> */}
          <img
            src={'/Web/kg.jpg'}
            alt='VR Gallery'
            className='Web__home__sectionMain__video'
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
                  <div
                    div
                    className='Web__home__sectionMain__inner__button__icon'
                  >
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
              <div className=' text-center px-5 pt-20 pb-10'>
                <h1 className='      text-[48px] md:text-[52px]      font-semibold      mb-6    '>
                  VEXPO – NỀN TẢNG TRIỂN LÃM ẢO HÀNG ĐẦU VIỆT NAM
                </h1>
                <WebLine />
                <p className='      text-[18px]       max-w-[1000px]      mx-auto      font-normal    '>
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
              {spaces.length ? (
                <div className='Web__home__section1__inner__content'>
                  {spaces.map((item, index) => (
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

                          <div className='mb-3'>
                            {item.description?.slice(0, 200) ||
                              'Không gian triển lãm 3D.'}
                          </div>
                          <div className='flex gap-3'>
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

                      {/* Divider */}
                      <WebLine />
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className='text-center'>Đang tải...</div>
              )}
            </div>
          </div>
        </div>
        <AboutInfo />
        <Home_Section2 />
        <WebLine />
        <Pricing />
      </div>
    </>
  );
}

export default Home;
