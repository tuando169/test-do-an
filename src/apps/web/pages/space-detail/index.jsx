import './Space.scss';
import { useParams } from 'react-router-dom';
import sections from '../../constants/data';
import { MdArrowOutward } from 'react-icons/md';
import Home_Section2 from '../../components/recommend-spaces';
import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { RoomApi } from '@/api/roomApi';

function Space() {
  const { prop } = useParams(); // Lấy prop từ URL
  const { slide } = sections;
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(slide.length / itemsPerPage);

  // Tìm thông tin không gian theo prop
  const [khongGian, setKhongGian] = useState(null);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePageClick = () => {
    if (!isPlaying) {
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
      });
      setIsPlaying(true);
    }
  };

  const handlePageScroll = () => {
    if (!isPlaying) {
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    // Lắng nghe sự kiện click trên trang để phát video
    document.addEventListener('click', handlePageClick);

    return () => {
      document.removeEventListener('click', handlePageClick);
    };
  }, [isPlaying]);

  useEffect(() => {
    // Lắng nghe sự kiện cuộn chuột trên trang để phát video
    window.addEventListener('scroll', handlePageScroll);

    return () => {
      window.removeEventListener('scroll', handlePageScroll);
    };
  }, [isPlaying]);

  useEffect(() => {
    const fetchData = async () => {
      setKhongGian(null);
      try {
        const data = await RoomApi.getOnePublicBySlug(prop);
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

  // Tách description bằng dấu `/`
  const descriptionParts = (khongGian?.description || '').split('/');

  // Lọc danh sách slide theo trang
  const currentSlides = slide.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              <div className='relative w-[520px]'>
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
                  <Link to={`/exhibition-edit/${khongGian?.slug}`} className=''>
                    <div className='Space__inner__button__inner'>
                      <div className='Space__inner__button__inner__text uppercase'>
                        Chỉnh sửa KHÔNG GIAN
                      </div>
                      <div className='Space__inner__button__inner__icon'>
                        <MdArrowOutward />
                      </div>
                    </div>
                  </Link>
                  <Link
                    to={`/exhibition/${khongGian?.slug}`}
                    className='ml-auto'
                  >
                    <div className='flex gap-2 py-3 px-6 items-center bg-[#2e2e2e] hover:bg-red-500'>
                      <p className=' uppercase text-white '>
                        KHÁM PHÁ KHÔNG GIAN
                      </p>
                      <div className='text-white '>
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
      <Home_Section2 />
    </>
  );
}

export default Space;
