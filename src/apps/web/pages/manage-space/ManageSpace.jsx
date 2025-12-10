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
import Modal from '../../components/modal/index';
import PickTemplateModal from './modals/PickTemplateModal';
import EditSpaceModal from '../../components/modals/EditSpaceModal';
import { useNavigate } from 'react-router-dom';
import CreateSpaceInfoModal from '../../components/modals/CreateSpaceInfoModal';
import CreateSpaceModal from '../../components/modals/CreateSpaceModal';

export default function ManageSpace() {
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(RoleEnum.Guest);

  const [tab, setTab] = useState('exhibition');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    owner_id: '',
    visibility: 'public',
    thumbnail: '',
    description: '',
  });

  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({
    templateId: '',
    title: '',
    owner_id: '',
    visibility: 'public',
    thumbnail: '',
    description: '',
    room_json: {},
  });

  const openCreate = (tpl) => {
    if (tpl.id)
      setCreateForm({
        templateId: tpl.id,
        title: `Bản sao của ${tpl.title}`,
        owner_id: tpl.owner_id,
        visibility: tpl.visibility || 'public',
        thumbnail: '',
        description: tpl.description || '',
        room_json: tpl.room_json,
      });

    setShowCreateFromTemplate(true);
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
  }

  useEffect(() => {
    loadSpaces();
    fetchCurrentUser();
  }, []);

  const openEdit = (space) => {
    setEditForm({
      id: space.id,
      title: space.title,
      owner_id: space.owner_id,
      slug: space.slug,
      visibility: space.visibility,
      thumbnail: space.thumbnail,
      description: space.description,
    });

    setShowEditModal(true);
  };

  const handleUpdateSpace = async () => {
    setShowEditModal(false);
    loadSpaces();
  };

  const pickTemplateSuccess = () => {
    setModalOpen(false);
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

      <PickTemplateModal
        isVisible={modalOpen}
        ownedSpaces={spaces}
        onClose={() => setModalOpen(false)}
        onSubmit={pickTemplateSuccess}
      />

      <EditSpaceModal
        isVisible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateSpace}
        space={editForm}
      />
      <CreateSpaceModal
        isVisible={showCreateFromTemplate}
        onClose={() => setShowCreateFromTemplate(false)}
        onSuccess={loadSpaces}
      />

      <CreateSpaceInfoModal
        isVisible={showCreate}
        onClose={() => setShowCreate(false)}
        mode={tab === 'template' ? 'template' : 'space'}
        template={createForm.templateId ? createForm : null}
        onSuccess={loadSpaces}
      />

      <div className='container-main flex-col py-10'>
        {/* TITLE */}
        <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-6'>
          Quản Lý Không Gian
        </h1>

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
            {tab === 'template' && userRole !== RoleEnum.Admin && (
              <div className='flex '>
                <button
                  onClick={() => setModalOpen(true)}
                  className='flex items-center gap-2 secondary-button'
                >
                  <MdAdd size={20} /> Lấy không gian mẫu về kho
                </button>
              </div>
            )}
            {tab === 'template' ? (
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
              )
            ) : (
              <button
                onClick={() => setShowCreateFromTemplate(true)}
                className='flex items-center gap-2 primary-button'
              >
                <MdAdd size={20} /> Tạo không gian
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className='border border-gray-300 overflow-hidden'>
          {/* CARD GRID */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'>
            {filteredSpaces.map((space) => (
              <div
                key={space.id}
                className='border-8 border-transparent hover:border-[#2e2e2e] shadow-md p-4 transition cursor-pointer flex flex-col'
                onClick={() => navigate('/space/' + space.slug)}
              >
                {/* PREVIEW */}
                <div className='w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden mb-4'>
                  <img
                    src={space.thumbnail}
                    className='w-full h-full object-cover'
                  />
                </div>

                {/* TITLE */}
                <div className='text-lg font-bold text-[#2e2e2e] truncate'>
                  {space.title}
                </div>

                {/* ACTIONS */}
                <div className='flex flex-col gap-2 mt-auto pt-4'>
                  {/* HÀNH ĐỘNG CHO TEMPLATE */}
                  {tab === 'template' && (
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

            {/* Empty */}
            {filteredSpaces.length === 0 && (
              <div className='col-span-full text-center text-gray-500 py-10'>
                Không có dữ liệu.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
