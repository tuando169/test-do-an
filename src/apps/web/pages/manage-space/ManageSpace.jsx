import { RoomApi } from '@/api/roomApi';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';
import { notification } from 'antd';
import { useEffect, useState } from 'react';
import {
  MdEdit,
  MdAdd,
  MdClose,
  MdCheck,
  MdVisibility,
  MdSearch,
} from 'react-icons/md';
import Modal from '../../components/Modal';

export default function ManageSpace() {
  const [api, contextHolder] = notification.useNotification();
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const [spaces, setSpaces] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [publicTemplateList, setPublicTemplateList] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [userRole, setUserRole] = useState(RoleEnum.Guest);

  const [tab, setTab] = useState('Exhibition');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    owner_id: '',
    visibility: 'public',
    thumbnail: '',
    description: '',
  });

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
        thumbnail: tpl.thumbnail,
        description: tpl.description || '',
        room_json: tpl.room_json,
      });

    setShowCreate(true);
  };

  const handleCreate = async () => {
    try {
      const payload = {
        title: createForm.title,
        owner_id: createForm.owner_id,
        visibility: createForm.visibility,
        thumbnail: createForm.thumbnail,
        description: createForm.description,
        type: 'gallery',
        room_json: createForm.room_json,
      };

      await RoomApi.create(payload);

      api.success({
        message: 'Thành công',
        description: 'Đã tạo không gian mới từ template',
      });

      setShowCreate(false);
      loadSpaces();
    } catch (err) {
      console.error(err);
      api.error({
        message: 'Thất bại',
        description: 'Không thể tạo không gian',
      });
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

  async function fetchPublicTemplates() {
    const templates = await RoomApi.getPublicTemplateList();
    setPublicTemplateList(
      templates.filter((tpl) => !spaces.find((s) => s.id === tpl.id))
    );
  }

  async function fetchCurrentUser() {
    const userId = localStorage.getItem('user');
    const data = await UserApi.getById(userId);

    setUserRole(data.role);
  }

  useEffect(() => {
    loadSpaces();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (tab === 'template') {
      fetchPublicTemplates();
    }
  }, [tab]);

  const openEdit = (space) => {
    setEditForm({
      id: space.id,
      title: space.title,
      owner_id: space.owner_id,
      visibility: space.visibility,
      thumbnail: space.thumbnail,
      description: space.description,
    });

    setShowEditModal(true);
  };

  const handleUpdateSpace = async () => {
    try {
      await RoomApi.update(editForm);

      api.success({
        message: 'Cập nhật thành công',
        description: 'Thông tin không gian đã được cập nhật.',
      });

      setShowEditModal(false);
      loadSpaces();
    } catch (err) {
      console.error(err);
      api.error({
        message: 'Lỗi cập nhật',
        description: 'Không thể cập nhật không gian.',
      });
    }
  };

  const handleBuyTemplate = async () => {
    try {
      await RoomApi.buyTemplates(selectedTemplates);

      setModalOpen(false);
      loadSpaces();
      fetchPublicTemplates();
      api.success({
        message: 'Thành công',
        description: 'Đã lấy không gian mẫu thành công.',
      });
    } catch (err) {
      console.error('Lỗi xử lý:', err);
    }
  };

  // ⭐ Lọc theo tab
  const filteredSpaces = spaces.filter((s) =>
    tab == 'template' ? s.type === 'template' : s.type !== 'template'
  );

  return (
    <>
      {/* EDIT SPACE MODAL */}
      <Modal isVisible={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className='modalRegister__title'>CHỈNH SỬA KHÔNG GIAN</div>

        <form
          className='modalRegister__form'
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateSpace();
          }}
        >
          {/* Tên không gian */}
          <label className='modalRegister__form__label'>Tên</label>
          <input
            type='text'
            className='modalRegister__form__input'
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
          />
          {/* Tên không gian */}
          <label className='modalRegister__form__label'>Mô tả</label>
          <textarea
            className='modalRegister__form__input'
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
          />

          {/* Trạng thái */}
          <label className='modalRegister__form__label'>
            Trạng thái hiển thị
          </label>
          <select
            className='modalRegister__form__input'
            value={editForm.visibility}
            onChange={(e) =>
              setEditForm({ ...editForm, visibility: e.target.value })
            }
          >
            <option value='public'>Công khai</option>
            <option value='private'>Riêng tư</option>
          </select>

          {/* Thumbnail */}
          <label className='modalRegister__form__label'>Thumbnail</label>
          <img
            src={thumbnailPreview || editForm.thumbnail}
            alt=''
            className='w-full h-40 object-cover border mb-3'
          />
          <input
            type='file'
            className='modalRegister__form__input'
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              setEditForm({ ...editForm, thumbnail: file });

              // Create preview URL
              const previewUrl = URL.createObjectURL(file);
              setThumbnailPreview(previewUrl);
            }}
          />

          {/* BUTTON SUBMIT */}
          <button className='modalRegister__form__button mt-4'>CẬP NHẬT</button>
        </form>
      </Modal>

      {/* CREATE FROM TEMPLATE MODAL */}
      <Modal isVisible={showCreate} onClose={() => setShowCreate(false)}>
        <div className='modalRegister__title'>
          {createForm.templateId
            ? 'TẠO KHÔNG GIAN TỪ TEMPLATE'
            : 'TẠO KHÔNG GIAN MỚI'}
        </div>

        <form
          className='modalRegister__form'
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          {/* Title */}
          <label className='modalRegister__form__label'>Tên</label>
          <input
            type='text'
            className='modalRegister__form__input'
            value={createForm.title}
            onChange={(e) =>
              setCreateForm({ ...createForm, title: e.target.value })
            }
          />
          {/* description */}
          <label className='modalRegister__form__label'>Mô tả</label>
          <textarea
            className='modalRegister__form__input'
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
          />

          {/* Visibility */}
          <label className='modalRegister__form__label'>Hiển thị</label>
          <select
            className='modalRegister__form__input'
            value={createForm.visibility}
            onChange={(e) =>
              setCreateForm({ ...createForm, visibility: e.target.value })
            }
          >
            <option value='public'>Công khai</option>
            <option value='private'>Riêng tư</option>
          </select>

          {/* Thumbnail */}
          <label className='modalRegister__form__label'>Thumbnail</label>
          <img
            src={thumbnailPreview || createForm.thumbnail}
            alt=''
            className='w-full h-40 object-cover border mb-3'
          />
          <input
            type='file'
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              setCreateForm({ ...createForm, thumbnail: file });

              // Create preview URL
              const previewUrl = URL.createObjectURL(file);
              setThumbnailPreview(previewUrl);
            }}
          />

          {/* BTN SUBMIT */}
          <button
            className='modalRegister__form__button mt-4'
            onClick={openCreate}
          >
            TẠO KHÔNG GIAN
          </button>
        </form>
      </Modal>

      <div className='container-main flex-col py-10'>
        {contextHolder}
        {/* TITLE */}
        <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-6'>
          Quản Lý Không Gian
        </h1>

        {/* ⭐ TAB UI */}
        <div className='flex border-b mb-6 items-center'>
          {/* TAB 1 */}
          <button
            onClick={() => setTab('Exhibition')}
            className={`
            px-6 py-2 font-semibold tracking-wide
            ${
              tab === 'Exhibition'
                ? 'bg-[#2e2e2e] text-white'
                : 'text-[#2e2e2e]'
            }
          `}
          >
            KHÔNG GIAN TRƯNG BÀY
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setTab('template')}
            className={`
            px-6 py-2 font-semibold tracking-wide
            ${tab === 'template' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}
          `}
          >
            KHÔNG GIAN MẪU
          </button>
          {tab === 'template' && (
            <div className='flex ml-auto'>
              <button
                onClick={openCreate}
                className='flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 hover:opacity-80'
              >
                <MdAdd size={20} /> Lấy thêm không gian mẫu
              </button>
            </div>
          )}
          {tab === 'template' ? (
            userRole === RoleEnum.Admin ||
            (userRole === RoleEnum.Designer && (
              <div className='flex ml-auto'>
                <button
                  onClick={openCreate}
                  className='flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 hover:opacity-80'
                >
                  <MdAdd size={20} /> Tạo không gian mẫu mới
                </button>
              </div>
            ))
          ) : (
            <div className='flex ml-auto gap-3'>
              <button
                onClick={() => setTab('template')}
                className='flex items-center gap-2 bg-white border-2 border-[#2e2e2e] text-[#2e2e2e] px-4 py-2 hover:!bg-[#2e2e2e] hover:text-white transition-all'
              >
                Tạo không gian từ mẫu
              </button>
              <button
                onClick={openCreate}
                className='flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 border-2 border-[#2e2e2e] hover:!bg-white hover:!text-[#2e2e2e] transition-all'
              >
                <MdAdd size={20} /> Tạo không gian
              </button>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className='border border-gray-300 overflow-hidden'>
          <table className='w-full text-left'>
            <thead className='bg-gray-100 text-[#2e2e2e]'>
              <tr>
                <th className='p-3'>Thumbnail</th>
                <th className='p-3'>Tên không gian</th>
                <th className='p-3'>Mô tả</th>
                <th className='p-3'>Nghệ sĩ</th>
                <th className='p-3'>Trạng thái</th>
                <th className='p-3'>Loại</th>
                <th className='p-3 text-right'>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {filteredSpaces.map((space) => (
                <tr key={space.id} className='border-b'>
                  <td className='p-3'>
                    <img
                      src={space.thumbnail}
                      alt=''
                      className='w-20 h-14 object-cover border'
                    />
                  </td>
                  <td className='p-3 font-semibold text-[#2e2e2e]'>
                    {space.title}
                  </td>
                  <td className='p-3'>{space.description}</td>
                  <td className='p-3'>{space.author}</td>
                  <td className='p-3'>{space.visibility}</td>
                  <td className='p-3'>{space.type}</td>
                  <td className='p-3 text-right min-w-40'>
                    <button
                      className='text-orange-600 mr-3 hover:text-orange-800'
                      onClick={() =>
                        window.open(`/exhibition/${space.slug}`, '_blank')
                      }
                    >
                      <MdVisibility size={22} />
                    </button>
                    {tab === 'template' ? (
                      <button
                        className='text-green-600 mr-3 hover:text-green-800'
                        onClick={() => openCreate(space)}
                      >
                        <MdAdd size={22} />
                      </button>
                    ) : (
                      <button
                        className='text-blue-600 mr-3 hover:text-blue-800'
                        onClick={() => openEdit(space)}
                      >
                        <MdEdit size={22} />
                      </button>
                    )}
                    {tab == 'template' &&
                      (userRole == RoleEnum.Admin ||
                        userRole == RoleEnum.Designer) && (
                        <div>
                          <button
                            className='text-gray-600 mr-3 hover:text-gray-800'
                            onClick={() =>
                              window.open(
                                `/exhibition-edit/${space.slug}`,
                                '_blank'
                              )
                            }
                          >
                            <MdSearch size={22} />
                          </button>
                          <button
                            className='text-blue-600 mr-3 hover:text-blue-800'
                            onClick={() => openEdit(space)}
                          >
                            <MdEdit size={22} />
                          </button>
                        </div>
                      )}
                  </td>
                </tr>
              ))}

              {filteredSpaces.length === 0 && (
                <tr>
                  <td colSpan={5} className='p-5 text-center text-gray-500'>
                    Đang tải...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
            <div className='bg-white  w-[650px] p-6 relative'>
              {/* CLOSE BUTTON */}
              <button
                className='absolute right-3 top-3 text-[#2e2e2e]'
                onClick={() => setModalOpen(false)}
              >
                <MdClose size={24} />
              </button>

              <h2 className='text-2xl font-bold mb-4 text-[#2e2e2e]'>
                Chọn Không Gian Mẫu
              </h2>

              {/* TEMPLATE LIST GRID */}
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-auto pr-2'>
                {publicTemplateList.map((tpl) => {
                  const selected = selectedTemplates.includes(tpl.id);

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        if (selected) {
                          setSelectedTemplates(
                            selectedTemplates.filter((id) => id !== tpl.id)
                          );
                        } else {
                          setSelectedTemplates([...selectedTemplates, tpl.id]);
                        }
                      }}
                      className={`relative border  overflow-hidden cursor-pointer transition 
                
              `}
                    >
                      <img
                        src={tpl.thumbnail}
                        className='w-full h-32 object-cover'
                        alt=''
                      />
                      <div className='p-2 text-sm text-[#2e2e2e]'>
                        <p className='font-semibold '>{tpl.title}</p>
                        <p className=''>{tpl.author}</p>
                      </div>

                      {/* CHECK ICON */}
                      {selected && (
                        <div className='absolute top-2 right-2 bg-[#2e2e2e] text-white  p-1'>
                          <MdCheck size={18} />
                        </div>
                      )}
                      <a href={`/exhibition/${tpl?.slug}`} target='_blank'>
                        <p className='bg-[#2e2e2e] text-white w-full py-2 text-center hover:opacity-90'>
                          Khám phá
                        </p>
                      </a>
                    </div>
                  );
                })}

                {publicTemplateList.length === 0 && (
                  <div className='col-span-3 text-center text-gray-500 py-4'>
                    Không có template nào phù hợp.
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                className='bg-[#2e2e2e] text-white w-full py-2  hover:opacity-90 mt-5'
                onClick={handleBuyTemplate}
              >
                LẤY TẤT CẢ KHÔNG GIAN ĐÃ CHỌN
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
