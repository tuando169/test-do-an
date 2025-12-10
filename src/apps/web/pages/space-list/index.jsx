import './ListSpace.scss';
import { FaSearch } from 'react-icons/fa';
import { MdAdd, MdArrowOutward } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';
import AuthModal from '../../components/modals/AuthModal';
import CreateSpaceModal from '../../components/modals/CreateSpaceModal';

function ListSpace() {
  const [publicRooms, setPublicRooms] = useState([]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  const filteredSpaces = publicRooms.filter((khongGian) => {
    const matchTitle = khongGian.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());

    return matchTitle;
  });

  function handleCreateClick() {
    const userId = localStorage.getItem('user');

    if (!userId) {
      setShowLoginPopup(true);
      return;
    }

    setShowCreatePopup(true);
  }

  const fetchData = async () => {
    try {
      const data = await RoomApi.getPublicRoomList();
      setPublicRooms(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách exhibition:', err);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className='ListSpace'>
        <div className='container-main'>
          <div className='ListSpace__inner'>
            <div className='ListSpace__inner__header'>
              <div className='ListSpace__inner__header__title'>
                DANH SÁCH KHÔNG GIAN
              </div>
              <div className='ListSpace__inner__header__find'>
                <input
                  type='text'
                  placeholder='Tìm kiếm không gian'
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <div className='ListSpace__inner__header__find__icon'>
                  <FaSearch />
                </div>
              </div>
              <div className='relative ml-4' onClick={handleCreateClick}>
                <div className='primary-button'>TẠO KHÔNG GIAN</div>
              </div>
            </div>

            {filteredSpaces.length ? (
              <div className='ListSpace__inner__content'>
                <div className='grid grid-cols-2 gap-10'>
                  {filteredSpaces.map((khongGian) => (
                    <Link
                      to={`/space/${khongGian.slug}`}
                      className=''
                      key={khongGian.id}
                    >
                      <div className='ListSpace__inner__content__box'>
                        <div className='ListSpace__inner__content__box__title'>
                          {khongGian.title}
                        </div>
                        <div className='ListSpace__inner__content__box__info'>
                          <div className='ListSpace__inner__content__box__info__item'>
                            <div className='ListSpace__inner__content__box__info__item__item'>
                              Nghệ sĩ
                            </div>
                            <div className='ListSpace__inner__content__box__info__item__item'>
                              Thể loại
                            </div>
                          </div>
                          <div className='ListSpace__inner__content__box__info__item2'>
                            <div className='ListSpace__inner__content__box__info__item2__item'>
                              {khongGian.author}
                            </div>
                            <div className='ListSpace__inner__content__box__info__item2__item'>
                              {khongGian.type}
                            </div>
                          </div>
                        </div>
                        <img
                          className='h-60 w-full object-cover bg-center bg-no-repeat'
                          src={khongGian.thumbnail}
                        ></img>
                        <div className='ListSpace__inner__content__box__button'>
                          <Link to={`/space/${khongGian.slug}`}>
                            <div className='ListSpace__inner__content__box__button__text'>
                              CHI TIẾT
                            </div>
                            <div className='ListSpace__inner__content__box__button__icon'>
                              <MdArrowOutward />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-center'>Đang tải...</div>
            )}
          </div>
        </div>
      </div>
      <AuthModal
        isVisible={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        initMode='login'
        onSuccess={() => {
          setShowLoginPopup(false);
          setShowCreatePopup(true);
        }}
      />
      <CreateSpaceModal
        isVisible={showCreatePopup}
        onClose={() => setShowCreatePopup(false)}
        onSuccess={fetchData}
      />
    </>
  );
}

export default ListSpace;
