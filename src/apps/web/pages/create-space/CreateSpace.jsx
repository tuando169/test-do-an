import { FaSearch } from 'react-icons/fa';
import { MdArrowOutward } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';
import AuthModal from '../../components/modals/AuthModal';
import CreateSpaceModal from '../../components/modals/CreateSpaceModal';
import { notification } from 'antd';

export default function CreateRoom() {
  const [api, contextHolder] = notification.useNotification();

  const [templateRooms, setTemplateRooms] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'gallery',
    visibility: 'public',
    thumbnail: '',
    room_json: {},
  });

  const filteredSpaces = templateRooms.filter((item) =>
    item.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  function onCreateSuccess() {
    api.success({ title: 'Thành công', description: 'Đã tạo không gian.' });
  }

  useEffect(() => {
    RoomApi.getPublicTemplateList()
      .then((data) => setTemplateRooms(data))
      .catch((e) => console.error(e));
  }, []);

  return (
    <>
      {contextHolder}
      <div className='border-t border-gray-400 w-full flex pt-14'>
        <div className='w-full px-32 flex flex-col'>
          {/* HEADER */}
          <div className='flex items-center w-full'>
            <div className='text-4xl font-bold text-[#2e2e2e]'>
              TẠO KHÔNG GIAN
            </div>

            {/* Search box */}
            <div className='flex items-center ml-auto relative'>
              <input
                type='text'
                placeholder='Tìm kiếm không gian'
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className='h-12 w-72 px-6 border border-gray-500 text-gray-700'
              />
              <div className='absolute right-4 text-gray-600'>
                <FaSearch />
              </div>
            </div>

            {/* Create Button */}
            <div className='ml-4'>
              <button
                onClick={() => setShowCreatePopup(true)}
                className='primary-button'
              >
                TẠO PHÒNG TRỐNG
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className='mt-6 flex flex-col'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {filteredSpaces.map((room) => (
                <div
                  key={room.id}
                  className='cursor-pointer'
                  onClick={() =>
                    window.open(`/exhibition/${room.slug}`, '_blank')
                  }
                >
                  <div className='shadow-lg p-6 border-[20px] border-transparent hover:border-[#2e2e2e] transition'>
                    <div className='text-lg font-bold uppercase text-[#2e2e2e] truncate'>
                      {room.title}
                    </div>

                    <div className='flex text-[15px] mt-2 text-gray-700'>
                      <div>
                        <div>Nghệ sĩ</div>
                        <div>Thể loại</div>
                      </div>

                      <div className='ml-6 font-semibold'>
                        <div>{room.author}</div>
                        <div>{room.type}</div>
                      </div>
                    </div>

                    <div
                      className='w-full h-80 bg-cover bg-center mt-4'
                      style={{ backgroundImage: `url(${room.thumbnail})` }}
                    />

                    <div className='flex items-center gap-3 justify-end'>
                      <div className='flex justify-end mt-4'>
                        <div
                          className='secondary-button flex items-center'
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              title: room.title,
                              type: room.type,
                              visibility: 'private',
                              thumbnail: room.thumbnail,
                              room_json: room.room_json,
                            });
                            setShowCreatePopup(true);
                          }}
                        >
                          TẠO PHÒNG
                          <MdArrowOutward className='ml-1' />
                        </div>
                      </div>
                      <div className='flex justify-end mt-4'>
                        <div
                          className='primary-button flex items-center'
                          onClick={() =>
                            window.open(`/exhibition/${room.slug}`, '_blank')
                          }
                        >
                          XEM TRƯỚC
                          <MdArrowOutward className='ml-1' />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CreateSpaceModal
        isVisible={showCreatePopup}
        onClose={() => setShowCreatePopup(false)}
        onSuccess={onCreateSuccess}
        template={formData}
      />
    </>
  );
}
