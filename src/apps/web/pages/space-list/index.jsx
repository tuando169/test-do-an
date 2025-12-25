import './ListSpace.scss';
import { FaSearch } from 'react-icons/fa';
import { MdArrowOutward } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';
import AuthModal from '../../components/modals/AuthModal';
import CreateSpaceModal from '../../components/modals/CreateSpaceModal';
import { Skeleton } from 'antd';

function ListSpace() {
  const [publicRooms, setPublicRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      const data = await RoomApi.getPublicRoomList();
      setPublicRooms(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách exhibition:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const SpaceItemSkeleton = () => (
    <div className='col-md-6 mb-8'>
      <div className='ListSpace__inner__content__box'>
        <Skeleton.Input
          active
          block
          size='large'
          style={{ marginBottom: 8, height: 28 }}
        />

        <div className='flex items-center gap-2 mb-4'>
          <Skeleton.Input active size='small' style={{ width: 60 }} />
          <Skeleton.Input active size='small' style={{ width: 100 }} />
        </div>

        <Skeleton.Button
          active
          block
          shape='square'
          style={{ height: 250, marginBottom: 16 }}
        />

        <Skeleton.Button
          active
          size='default'
          style={{ width: 120, height: 40 }}
        />
      </div>
    </div>
  );

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
            <input
              type='radio'
              name='khonggian'
              id='khonggiantrungbay'
              defaultChecked
            />
            <input type='radio' name='khonggian' id='khonggiansangtao' />

            <div className='ListSpace__inner__content'>
              {loading ? (
                <div className='row'>
                  <SpaceItemSkeleton />
                  <SpaceItemSkeleton />
                  <SpaceItemSkeleton />
                  <SpaceItemSkeleton />
                </div>
              ) : filteredSpaces.length > 0 ? (
                <div className='row'>
                  {filteredSpaces.map((khongGian) => (
                    <Link
                      to={`/space/${khongGian.slug}`}
                      className='col-md-6'
                      key={khongGian.id}
                    >
                      <div className='ListSpace__inner__content__box'>
                        <div className='ListSpace__inner__content__box__title'>
                          {khongGian.title}
                        </div>
                        <div className='ListSpace__inner__content__box__info'>
                          {khongGian.author && (
                            <>
                              <div className='ListSpace__inner__content__box__info__item'>
                                <div className='ListSpace__inner__content__box__info__item__item'>
                                  Nghệ sĩ
                                </div>
                              </div>
                              <div className='ListSpace__inner__content__box__info__item2'>
                                <div className='ListSpace__inner__content__box__info__item2__item'>
                                  {khongGian.author}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div
                          className='ListSpace__inner__content__box__image'
                          style={{
                            background: `url(${khongGian.thumbnail})`,
                          }}
                        ></div>
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
              ) : (
                <div className='text-center py-10 text-gray-500'>
                  Không tìm thấy không gian phù hợp.
                </div>
              )}
            </div>
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
