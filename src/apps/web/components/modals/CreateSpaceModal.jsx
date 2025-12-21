import { FaSearch } from 'react-icons/fa';
import { MdArrowOutward } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';
import { notification } from 'antd';
import Modal from '@/apps/web/components/modal';
import CreateSpaceInfoModal from './CreateSpaceInfoModal';
import { formatMoney } from '@/common/utils';
import { PaymentApi } from '@/api/paymentApi';

export default function CreateSpaceModal({ isVisible, onClose, onSuccess }) {
  const [api, contextHolder] = notification.useNotification();

  const [myTemplateRooms, setMyTemplateRooms] = useState([]);
  const [publicTemplateRooms, setPublicTemplateRooms] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '3d',
    visibility: 'public',
    thumbnail: '',
    room_json: {},
  });

  function onCreateSuccess() {
    api.success({ title: 'Thành công', description: 'Đã tạo không gian.' });
    if (onSuccess) onSuccess();
    handleClose();
  }

  const fetchTemplates = async () => {
    const publicTemplates = await RoomApi.getPublicTemplateList();
    const myTemplates = await RoomApi.getTemplateRoomList();
    const merge = [...myTemplates];
    publicTemplates.forEach((pt) => {
      if (!merge.find((mt) => mt.id === pt.id)) {
        merge.push(pt);
      }
    });
    setMyTemplateRooms(merge);
    setPublicTemplateRooms(
      publicTemplates.sort((a, b) => {
        const aIn = myTemplates.find((t) => t.id === a.id);
        const bIn = myTemplates.find((t) => t.id === b.id);

        // a không có, b có → b lên trước
        if (!aIn && bIn) return 1;

        // a có, b không → a lên trước
        if (aIn && !bIn) return -1;

        return 0;
      })
    );
  };
  useEffect(() => {
    if (!isVisible) return;
    fetchTemplates();
  }, [isVisible]);

  const filteredSpaces = publicTemplateRooms.filter((item) =>
    item.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  function handleClose() {
    setShowCreatePopup(false);
    setFormData({
      title: '',
      type: '3d',
      visibility: 'public',
      thumbnail: '',
      room_json: {},
    });
    onClose();
  }

  async function openPayment(template) {
    if (!template.price) {
      RoomApi.buyTemplates(template.id).then(() => {
        api.success({ message: 'Đã lấy mẫu miễn phí thành công' });
        fetchTemplates();
      });
      return;
    }
    try {
      const returnUrl = window.location.href;
      const cancelUrl = window.location.href;

      const data = await PaymentApi.createTemplatePaymentLink(
        template.id,
        returnUrl,
        cancelUrl
      );

      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        api.error({ message: 'Không lấy được link thanh toán' });
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      api.error({
        message: 'Lỗi tạo giao dịch',
        description: 'Vui lòng thử lại sau.',
      });
    }
  }

  return (
    <>
      {contextHolder}

      <Modal isVisible={isVisible} onClose={handleClose}>
        <div className='w-[1000px] max-w-full'>
          <div className='flex items-center w-full my-6'>
            <div className='text-4xl font-bold text-[#2e2e2e]'>
              TẠO KHÔNG GIAN
            </div>

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

            <button
              onClick={() => {
                setFormData({
                  title: '',
                  type: 'gallery',
                  visibility: 'public',
                  thumbnail: '',
                  room_json: {},
                });
                setShowCreatePopup(true);
              }}
              className='primary-button ml-4'
            >
              TẠO PHÒNG TRỐNG
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {filteredSpaces.map((room) => (
              <div key={room.id} className='cursor-pointer'>
                <div className='shadow-lg p-6 border-[20px] border-transparent hover:border-[#2e2e2e] transition'>
                  <div className='text-lg font-bold uppercase text-[#2e2e2e] truncate'>
                    {room.title}
                  </div>

                  <div className='flex mt-2 text-gray-700'>
                    <div>
                      <div>Nghệ sĩ</div>
                      <div>Thể loại</div>
                      <div>Giá</div>
                    </div>

                    <div className='ml-6 font-semibold'>
                      <div>{room.author}</div>
                      <div>{room.type}</div>
                      {myTemplateRooms.find((t) => t.id === room.id) ? (
                        <div className='flex items-center gap-2'>
                          <span>Đã mua</span>
                          <span className='font-normal'>
                            (
                            {room.price
                              ? formatMoney(room.price) + ' VND'
                              : 'Miễn phí'}
                            )
                          </span>
                        </div>
                      ) : (
                        <div>
                          {room.price
                            ? formatMoney(room.price) + ' VND'
                            : 'Miễn phí'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className='w-full h-40 bg-cover bg-center mt-4'
                    style={{ backgroundImage: `url(${room.thumbnail})` }}
                  />

                  <div className='grid grid-cols-2 gap-3 w-full mt-4'>
                    <div
                      className='secondary-button flex items-center justify-center'
                      onClick={() =>
                        window.open(`/space/${room.slug}`, '_blank')
                      }
                    >
                      XEM TRƯỚC
                      <MdArrowOutward className='ml-1' />
                    </div>
                    {myTemplateRooms.find((t) => t.id === room.id) ? (
                      <div
                        className='primary-button flex items-center justify-center'
                        onClick={() => {
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
                        TẠO TỪ MẪU
                        <MdArrowOutward className='ml-1' />
                      </div>
                    ) : (
                      <div
                        className='primary-button flex items-center justify-center uppercase'
                        onClick={(e) => {
                          e.stopPropagation();
                          openPayment(room);
                        }}
                      >
                        {room.price ? 'Mua mẫu' : 'Lấy miễn phí'}
                        <MdArrowOutward className='ml-1' />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <CreateSpaceInfoModal
        isVisible={showCreatePopup}
        onClose={() => setShowCreatePopup(false)}
        onSuccess={onCreateSuccess}
        template={formData}
      />
    </>
  );
}
