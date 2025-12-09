import './ListSpace.scss';
import { FaSearch } from 'react-icons/fa';
import { MdAdd, MdArrowOutward } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';

function ListSpace() {
  const [publicRooms, setPublicRooms] = useState([]);
  const [templateRooms, setTemplateRooms] = useState([]);

  // Trạng thái từ khóa tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tab, setTab] = useState('');
  const [isShowTab, setIsShowTab] = useState(false);

  // Danh sách được lọc
  const filteredSpaces = publicRooms.filter((khongGian) => {
    // Lọc theo tên
    const matchTitle = khongGian.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());

    // Lọc theo tab
    const matchTab =
      tab === 'template'
        ? khongGian.type === 'template'
        : khongGian.type !== 'template';

    return matchTitle && matchTab;
  });

  async function checkUser() {
    const userId = localStorage.getItem('user');
    if (userId) setIsShowTab(true);
    else setIsShowTab(false);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await RoomApi.getPublicRoomList();
        setPublicRooms(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách exhibition:', err);
      }
    };
    fetchData();
    checkUser();
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
              <div className='ListSpace__inner__header__button'>
                <p className=''>TẠO KHÔNG GIAN</p>
              </div>
            </div>
            <input
              type='radio'
              name='khonggian'
              id='khonggiantrungbay'
              defaultChecked
            />
            <input type='radio' name='khonggian' id='khonggiansangtao' />

            <div
              className='ListSpace__inner__tab '
              style={{ alignItems: 'end' }}
            >
              <label
                htmlFor='khonggiantrungbay'
                className='ListSpace__inner__tab__item1'
                onClick={() => setTab('trungbay')}
              >
                KHÔNG GIAN TRƯNG BÀY
              </label>
              <label
                htmlFor='khonggiansangtao'
                className='ListSpace__inner__tab__item2'
                onClick={() => setTab('template')}
              >
                KHÔNG GIAN MẪU
              </label>
              <div className='flex ml-auto'>
                <button className='flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 hover:opacity-80'>
                  <MdAdd size={20} /> TẠO KHÔNG GIAN TỪ MẪU
                </button>
              </div>
            </div>
            <div className='ListSpace__inner__content'>
              <div className='row'>
                {filteredSpaces.map((khongGian) => (
                  <Link
                    to={
                      tab == 'template'
                        ? `/exhibition-edit/${khongGian?.slug}`
                        : `/space/${khongGian.slug}`
                    }
                    className='col-md-6'
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
                      <div
                        className='ListSpace__inner__content__box__image'
                        style={{
                          background: `url(${khongGian.thumbnail})`,
                        }}
                      ></div>
                      <div className='ListSpace__inner__content__box__button'>
                        <Link>
                          <div className='ListSpace__inner__content__box__button__text'>
                            {tab === 'template' ? ' TẠO TỪ MẪU' : ' CHI TIẾT'}
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
          </div>
        </div>
      </div>
    </>
  );
}

export default ListSpace;
