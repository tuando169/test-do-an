import WebLine from '../web-line';
import { FaArrowRight } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { MdArrowOutward } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';

function RecommendSpaces() {
  const [spaces, setSpaces] = useState([]);
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await RoomApi.getPublicRoomList();

        setSpaces(data.filter((space) => space.type != 'template'));
      } catch (error) {
        console.error('Lỗi API:', error);
      }
    };

    fetchSpaces();
  }, []);
  return (
    <>
      <div className='Web__home__section2'>
        <div className='container-main'>
          <div className='Web__home__section2__inner'>
            <div className='Web__home__section2__inner__header'>
              <div className='Web__home__section2__inner__header__title'>
                CÁC KHÔNG GIAN KHÁC
              </div>
              <Link
                to={'/listspace'}
                className='hidden md:flex items-center justify-center px-4 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white transition-all'
              >
                <div className='Web__home__section2__inner__header__more__text'>
                  XEM DANH SÁCH KHÔNG GIAN
                </div>
                <div className='Web__home__section2__inner__header__more__icon'>
                  <FaArrowRight />
                </div>
              </Link>
            </div>
            <WebLine />
            {spaces.length ? (
              <div className='Web__home__section2__inner__content'>
                <div className='grid grid-cols-4 gap-6'>
                  {spaces.slice(0, 4).map((khongGian) => (
                    <Link
                      to={`/space/${khongGian.slug}`}
                      className=''
                      key={khongGian.id}
                    >
                      <div className='Web__home__section2__inner__content__box'>
                        <div
                          className='Web__home__section2__inner__content__box__image'
                          style={{
                            backgroundImage: `url(${khongGian.thumbnail})`,
                          }}
                        ></div>
                        <div className='Web__home__section2__inner__content__box--opacity'>
                          <div className='Web__home__section2__inner__content__box--opacity__back'></div>
                          <div className='Web__home__section2__inner__content__box--opacity__button'>
                            <div className='Web__home__section2__inner__content__box--opacity__button__inner'>
                              <div className='Web__home__section2__inner__content__box--opacity__button__inner__text'>
                                KHÁM PHÁ KHÔNG GIAN
                              </div>
                              <div className='Web__home__section2__inner__content__box--opacity__button__inner__icon'>
                                <MdArrowOutward />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='Web__home__section2__inner__content__box__title'>
                          {khongGian.title}
                        </div>
                        <div className='Web__home__section2__inner__content__box__author'>
                          {khongGian.author}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div>Đang tải ...</div>
            )}
            <Link
              to={'/listspace'}
              className='flex md:hidden items-center justify-center mt-6 px-4 py-2 border-2 border-[#2E2E2E] text-[#2E2E2E]'
            >
              <div className=''>XEM DANH SÁCH KHÔNG GIAN</div>
              <div className='Web__home__section2__inner__header__more--hide__icon'>
                <FaArrowRight />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default RecommendSpaces;
