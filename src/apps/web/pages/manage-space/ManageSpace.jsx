import { RoomApi } from '@/api/roomApi';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';
import { notification, Modal as ModalAnt } from 'antd';
import { useEffect, useState } from 'react';
import {
  MdEdit,
  MdAdd,
  MdClose,
  MdCheck,
  MdVisibility,
  MdSearch,
  MdDelete,
} from 'react-icons/md';
import EditSpaceModal from '../../components/modals/EditSpaceModal';
import { useNavigate } from 'react-router-dom';
import CreateSpaceInfoModal from '../../components/modals/CreateSpaceInfoModal';
import { PaymentApi } from '@/api/paymentApi';
import { formatMoney } from '@/common/utils';
import { LicenseApi } from '@/api/licenseApi';
import CreateSpaceModal from '../../components/modals/CreateSpaceModal';

export default function ManageSpace() {
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState([]);
  const [userRole, setUserRole] = useState(RoleEnum.Guest);
  const [licenses, setLicenses] = useState();

  const [tab, setTab] = useState('exhibition');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    type: '',
    visibility: 'public',
    thumbnail: '',
    description: '',
  });

  const [allTemplates, setAllTemplates] = useState([]);
  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({
    templateId: '',
    title: '',
    visibility: 'public',
    thumbnail: '',
    description: '',
    room_json: {},
  });

  async function fetchPublicTemplates() {
    const templates = await RoomApi.getPublicTemplateList();
    const userId = localStorage.getItem('user');
    const filteredIds = new Set(
      spaces
        .filter((s) => s.type === 'template' && s.owner_id != userId)
        .map((s) => String(s.id))
    );

    setAllTemplates(
      [...templates]
        .filter((s) => s.owner_id != userId)
        .sort((a, b) => {
          const aIn = filteredIds.has(String(a.id));
          const bIn = filteredIds.has(String(b.id));

          // a không có, b có → b lên trước
          if (!aIn && bIn) return 1;

          // a có, b không → a lên trước
          if (aIn && !bIn) return -1;

          return 0;
        })
    );
  }

  const openCreate = (tpl) => {
    if (tpl.id)
      setCreateForm({
        templateId: tpl.id,
        title: `Bản sao của ${tpl.title}`,
        visibility: tpl.visibility || 'public',
        thumbnail: tpl.thumbnail || '',
        description: tpl.description || '',
        room_json: tpl.room_json,
      });

    setShowCreateFromTemplate(true);
  };

  const fetchLicense = async (id) => {
    try {
      const data = await LicenseApi.getById(id);
      setLicenses(data);
    } catch (err) {
      console.error('Lỗi API:', err);
    }
  };

  // Fetch
  const loadSpaces = async () => {
    try {
      const data = await RoomApi.getAll();
      setSpaces(data);
    } catch (err) {
      console.error('Lỗi API:', err);
    }
  };

  async function fetchCurrentUser() {
    const userId = localStorage.getItem('user');
    const data = await UserApi.getById(userId);

    setUserRole(data.role);
    fetchLicense(data.license);
  }

  async function openPayment(template) {
    if (!template.price) {
      RoomApi.buyTemplates(template.id).then(() => {
        api.success({ message: 'Đã lấy mẫu miễn phí thành công' });
        loadSpaces();
      });
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

  useEffect(() => {
    loadSpaces();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchPublicTemplates();
  }, [spaces]);

  const openEdit = (space) => {
    setEditForm({
      id: space.id,
      title: space.title,
      type: space.type,
      slug: space.slug,
      visibility: space.visibility,
      thumbnail: space.thumbnail,
      description: space.description,
      price: space.price,
    });

    setShowEditModal(true);
  };

  const handleUpdateSpace = async () => {
    setShowEditModal(false);
    loadSpaces();
  };

  // ⭐ Lọc theo tab
  const filteredSpaces = spaces.filter((s) => {
    if (tab === 'exhibition') {
      return s.type !== 'template';
    } else if (tab === 'my-template') {
      return (
        s.type === 'template' && s.owner_id == localStorage.getItem('user')
      );
    } else if (tab === 'buyed-template') {
      return (
        s.type === 'template' && s.owner_id != localStorage.getItem('user')
      );
    } else if (tab === 'template') {
      return s.type === 'template';
    }
  });
  const handleDelete = async (spaceId) => {
    ModalAnt.confirm({
      title: 'Xóa không gian?',
      content:
        'Bạn có chắc chắn muốn xóa không gian này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await RoomApi.delete(spaceId);

          api.success({
            message: 'Đã xóa',
            description: 'Không gian đã được xóa thành công.',
          });

          loadSpaces(); // refresh list
        } catch (error) {
          console.error(error);
          api.error({
            message: 'Lỗi',
            description: 'Không thể xóa không gian.',
          });
        }
      },
    });
  };

  return (
    <>
      {contextHolder}

      <EditSpaceModal
        isVisible={showEditModal}
        onClose={() => {
          setEditForm({
            id: '',
            title: '',
            type: '',
            visibility: 'public',
            thumbnail: '',
            description: '',
          });
          setShowEditModal(false);
        }}
        onSubmit={handleUpdateSpace}
        space={editForm}
      />
      <CreateSpaceInfoModal
        isVisible={showCreateFromTemplate}
        template={createForm}
        onClose={() => {
          setCreateForm({
            templateId: '',
            title: '',
            visibility: 'public',
            thumbnail: '',
            description: '',
            room_json: {},
          });
          setShowCreateFromTemplate(false);
        }}
        onSuccess={loadSpaces}
      />

      <CreateSpaceModal
        isVisible={showCreate}
        onClose={() => {
          setCreateForm({
            templateId: '',
            title: '',
            visibility: 'public',
            thumbnail: '',
            description: '',
            room_json: {},
          });

          setShowCreate(false);
        }}
        mode={tab === 'template' ? 'template' : 'space'}
        template={createForm.templateId ? createForm : null}
        onSuccess={loadSpaces}
      />

      <div className='container-main flex-col py-10'>
        <div className='flex flex-col  mb-4'>
          <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-2'>
            Quản Lý Không Gian
          </h1>
          <div className='flex gap-10 items-center'>
            <p className=' text-xl'>
              Tổng không gian:{' '}
              <span className='font-semibold text-2xl'>
                {
                  spaces.filter(
                    (r) => r.owner_id === localStorage.getItem('user')
                  ).length
                }{' '}
                {userRole != RoleEnum.Admin && (
                  <span>/ {licenses ? licenses.space_limit : 0}</span>
                )}
              </span>
            </p>
            {userRole != RoleEnum.Admin && (
              <button
                className='secondary-button'
                onClick={() => (window.location.href = '/pricing')}
              >
                Nâng cấp tài khoản
              </button>
            )}
          </div>
        </div>

        {/* ⭐ TAB UI */}
        <div className='flex border-b mb-6 items-end'>
          {/* TAB 1 */}
          <button
            onClick={() => setTab('exhibition')}
            className={`
            px-6 py-2 font-semibold tracking-wide
            ${
              tab === 'exhibition'
                ? 'bg-[#2e2e2e] text-white'
                : 'text-[#2e2e2e]'
            }
          `}
          >
            KHÔNG GIAN TRƯNG BÀY
          </button>

          {userRole === RoleEnum.Admin && (
            <button
              onClick={() => setTab('template')}
              className={`
            px-6 py-2 font-semibold tracking-wide
            ${tab === 'template' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}
          `}
            >
              KHÔNG GIAN MẪU
            </button>
          )}

          {userRole != RoleEnum.Admin && (
            <>
              <button
                onClick={() => setTab('my-template')}
                className={`
            px-6 py-2 font-semibold tracking-wide
            ${
              tab === 'my-template'
                ? 'bg-[#2e2e2e] text-white'
                : 'text-[#2e2e2e]'
            }
          `}
              >
                KHÔNG GIAN MẪU CỦA BẠN
              </button>

              <button
                onClick={() => setTab('buyed-template')}
                className={`px-6 py-2 font-semibold tracking-wide
            ${
              tab === 'buyed-template'
                ? 'bg-[#2e2e2e] text-white'
                : 'text-[#2e2e2e]'
            }
          `}
              >
                KHÔNG GIAN MẪU ĐÃ MUA
              </button>
            </>
          )}
          <div className='ml-auto flex items-center gap-3'>
            {(tab === 'my-template' || tab == 'template') &&
              (userRole === RoleEnum.Admin ||
                userRole === RoleEnum.Designer) && (
                <div className='flex ml-auto'>
                  <button
                    onClick={() => setShowCreate(true)}
                    className='flex items-center gap-2 primary-button'
                  >
                    <MdAdd size={20} /> Tạo không gian mẫu
                  </button>
                </div>
              )}
            {tab === 'exhibition' && (
              <button
                onClick={() => setShowCreate(true)}
                className='flex items-center gap-2 primary-button'
              >
                <MdAdd size={20} /> Tạo không gian
              </button>
            )}
          </div>
        </div>

        <div className='overflow-hidden'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'>
            {tab !== 'buyed-template' &&
              filteredSpaces.map((space) => (
                <div
                  key={space.id}
                  className='border-8 border-transparent hover:border-[#2e2e2e] shadow-md p-4 transition cursor-pointer flex flex-col'
                  onClick={() => navigate('/space/' + space.slug)}
                >
                  <div className='w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden mb-4'>
                    <img
                      src={space.thumbnail}
                      className='w-full h-full object-cover'
                    />
                  </div>

                  <div className='text-lg font-bold text-[#2e2e2e] truncate'>
                    {space.title}
                  </div>
                  <div>
                    {space.price && (
                      <div className=' text-[#2e2e2e] truncate'>
                        {formatMoney(space.price)} VND
                      </div>
                    )}
                    {!space.price && (
                      <div className=' text-[#2e2e2e] truncate'>Miễn phí</div>
                    )}
                  </div>

                  <div className='flex flex-col gap-2 mt-auto pt-4'>
                    {/* HÀNH ĐỘNG CHO TEMPLATE */}
                    {(tab === 'buyed-template' ||
                      tab === 'my-template' ||
                      userRole == RoleEnum.Admin) && (
                      <button
                        className='primary-button flex gap-2 justify-center'
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreate(space);
                        }}
                      >
                        <MdAdd size={20} /> Tạo phòng
                      </button>
                    )}

                    {/* EDIT + DELETE */}
                    {(space.owner_id == localStorage.getItem('user') ||
                      userRole == RoleEnum.Admin) && (
                      <div className='grid grid-cols-2 gap-2'>
                        <button
                          className='secondary-button flex gap-2 justify-center'
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(space);
                          }}
                        >
                          <MdEdit size={20} /> Chỉnh sửa
                        </button>

                        <button
                          className='secondary-button flex gap-2 justify-center'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(space.id);
                          }}
                        >
                          <MdDelete size={20} /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {tab !== 'buyed-template' && filteredSpaces.length === 0 && (
              <div className='col-span-full text-center text-gray-500 py-10'>
                Không có dữ liệu.
              </div>
            )}

            {tab == 'buyed-template' &&
              allTemplates.map((space) => (
                <div
                  key={space.id}
                  className={`
    border-8 border-transparent shadow-md p-4 transition flex flex-col cursor-pointer hover:border-[#2e2e2e]
    
  `}
                  onClick={() => navigate('/space/' + space.slug)}
                >
                  <div className='w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden mb-4'>
                    <img
                      src={space.thumbnail}
                      className={`w-full h-full object-cover ${
                        filteredSpaces.find((s) => s.id == space.id)
                          ? ' '
                          : 'opacity-50'
                      }`}
                    />
                  </div>

                  <div className={`text-lg font-bold text-[#2e2e2e] truncate `}>
                    {space.title}
                  </div>

                  {tab == 'buyed-template' &&
                    filteredSpaces.find((s) => s.id == space.id) && (
                      <div className=' text-green-600 font-semibold truncate flex items-center gap-1'>
                        <MdCheck /> Đã mua
                      </div>
                    )}
                  <div>
                    {space.price && (
                      <div className=' text-[#2e2e2e] truncate'>
                        {formatMoney(space.price)} VND
                      </div>
                    )}
                    {!space.price && (
                      <div className=' text-[#2e2e2e] truncate'>Miễn phí</div>
                    )}
                  </div>
                  <div className='flex flex-col gap-2 mt-auto pt-4'>
                    {/* HÀNH ĐỘNG CHO TEMPLATE */}

                    {filteredSpaces.find((s) => s.id == space.id) ? (
                      <button
                        className='primary-button flex gap-2 justify-center'
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreate(space);
                        }}
                      >
                        <MdAdd size={20} /> Tạo phòng
                      </button>
                    ) : (
                      <button
                        className='primary-button flex gap-2 justify-center'
                        onClick={(e) => {
                          e.stopPropagation();
                          openPayment(space);
                        }}
                      >
                        <MdAdd size={20} />{' '}
                        {space.price ? 'Mua mẫu' : 'Lấy mẫu miễn phí'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
