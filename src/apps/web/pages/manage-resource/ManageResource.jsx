import { AudioApi } from '@/api/audioApi';
import { ImageApi } from '@/api/imageApi';
import { Object3dApi } from '@/api/object3dApi';
import { useEffect, useState } from 'react';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';
import ModalCreateResource from './modals/CreateMediaModal';
import { Modal as ModalAnt, notification } from 'antd';
import { TextureApi } from '@/api/textureApi';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';

export default function ManageResource() {
  const [api, contextHolder] = notification.useNotification();

  const [tab, setTab] = useState('image');
  const [userRole, setUserRole] = useState(null);

  const [textures, setTextures] = useState([]);
  const [images, setImages] = useState([]);
  const [objects, setObjects] = useState([]);
  const [audios, setAudios] = useState([]);
  const [displayData, setDisplayData] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    file_url: '',
    file: null,
    room_id: '',
    alb: '',
    nor: '',
    orm: '',
    texture_for: '',
  });

  const loadImages = async () => {
    const data = await ImageApi.getList();
    setImages(
      data.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    );
  };
  const loadTextures = async () => {
    const data = await TextureApi.getAll();
    setTextures(
      data.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    );
  };

  const loadObjects = async () => {
    const data = await Object3dApi.getList();
    setObjects(
      data.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    );
  };

  const loadAudio = async () => {
    const data = await AudioApi.getList();
    setAudios(data.sort((a, b) => a.title.localeCompare(b.title)));
  };

  const deleteItem = async (id, type) => {
    if (type === 'texture') {
      await TextureApi.delete(id);
      setTextures(textures.filter((item) => item.id !== id));
      api.success({
        title: 'Thành công',
        description: 'Xóa texture thành công',
      });
      return;
    }

    if (type === 'image') {
      await ImageApi.delete(id);
      setImages(images.filter((item) => item.id !== id));
      api.success({
        title: 'Thành công',
        description: 'Xóa tranh thành công',
      });
      return;
    }
    if (type === 'object') {
      await Object3dApi.delete(id);
      setObjects(objects.filter((item) => item.id !== id));
      api.success({
        title: 'Thành công',
        description: 'Xóa object 3D thành công',
      });
      return;
    }
    if (type === 'audio') {
      await AudioApi.delete(id);
      setAudios(audios.filter((item) => item.id !== id));
      api.success({
        title: 'Thành công',
        description: 'Xóa âm thanh thành công',
      });
      return;
    }
  };

  function fetchData() {
    loadImages();
    loadObjects();
    loadAudio();
    loadTextures();
  }

  async function fetchUserRole() {
    const userId = localStorage.getItem('user');
    const data = await UserApi.getById(userId);
    setUserRole(data.role);
  }

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  useEffect(() => {
    fetchDisplayData();
  }, [tab]);

  useEffect(() => {
    fetchDisplayData();
  }, [images, objects, audios, textures]);

  function fetchDisplayData() {
    if (tab === 'image') setDisplayData(images);
    else if (tab === 'object') setDisplayData(objects);
    else if (tab === 'audio') setDisplayData(audios);
    else if (tab === 'texture') setDisplayData(textures);
  }

  // ========== POPUP ==========
  const openEdit = (item) => {
    if (tab === 'texture') {
      setForm({
        id: item.id,
        title: item.title,
        alb: item.alb_url,
        nor: item.nor_url,
        orm: item.orm_url,
        texture_for: item.texture_for,
      });
    } else
      setForm({
        id: item.id,
        title: item.title,
        file_url: item.file_url,
        file: null,
        room_id: item.room_id,
      });
    console.log('form', form);

    setModalOpen(true);
  };

  const openCreate = () => {
    setForm({
      title: '',
      url: '',
      file: null,
      room_id: '',
      alb: '',
      nor: '',
      orm: '',
      texture_for: '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, type) => {
    ModalAnt.confirm({
      title: 'Xóa',
      content: 'Bạn có chắc muốn xoá mục này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk() {
        deleteItem(id, type);
      },
      onCancel() {},
    });
  };

  return (
    <>
      {contextHolder}
      <ModalCreateResource
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={form}
        tab={tab}
        onSubmit={fetchData}
      />

      <div className='container-main mx-auto flex flex-col mt-10'>
        <p className='text-4xl font-bold mb-3'> QUẢN LÝ TÀI NGUYÊN</p>
        <div className='flex border-b mb-6  w-full items-end'>
          <button
            onClick={() => setTab('image')}
            className={`px-6 py-2 font-semibold tracking-wide 
      ${tab === 'image' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}`}
          >
            Thư Viện Tranh
          </button>

          <button
            onClick={() => setTab('object')}
            className={`px-6 py-2 font-semibold tracking-wide 
      ${tab === 'object' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}`}
          >
            Thư Viện Object 3D
          </button>

          <button
            onClick={() => setTab('audio')}
            className={`px-6 py-2 font-semibold tracking-wide 
      ${tab === 'audio' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}`}
          >
            Thư Viện Audio
          </button>
          {userRole == RoleEnum.Admin && (
            <button
              onClick={() => setTab('texture')}
              className={`px-6 py-2 font-semibold tracking-wide 
  ${tab === 'texture' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}`}
            >
              Thư Viện Texture
            </button>
          )}

          <button
            onClick={openCreate}
            className='ml-auto flex items-center gap-2 primary-button'
          >
            <MdAdd size={20} /> Thêm Mới
          </button>
        </div>
        {/* ================= CARD GRID ================= */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'>
          {displayData.map((item) => (
            <div
              key={item.id}
              className='border-2 border-transparent hover:border-[#2e2e2e] shadow-md p-4 transition cursor-pointer flex flex-col'
            >
              {/* PREVIEW */}
              <div className='w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden mb-4'>
                {tab === 'image' && (
                  <img
                    src={item.file_url}
                    className='w-full h-full object-cover'
                    onClick={() => window.open(item.file_url)}
                  />
                )}

                {tab === 'object' && (
                  <div
                    className='flex flex-col items-center justify-center text-[#2e2e2e]'
                    onClick={() => window.open(item.file_url)}
                  >
                    <div className='w-20 h-20 bg-gray-300 flex items-center justify-center text-xl font-bold'>
                      .glb
                    </div>
                    <p className='text-sm mt-2 text-gray-600'>Object 3D</p>
                  </div>
                )}

                {tab === 'audio' && (
                  <audio
                    controls
                    className='w-full'
                    onClick={() => window.open(item.file_url)}
                  >
                    <source src={item.file_url} />
                  </audio>
                )}
                {tab === 'texture' && (
                  <div className='w-full h-full flex  overflow-hidden shadow-md cursor-pointer'>
                    {/* Albedo */}
                    <div
                      className='w-1/3 h-full hover:brightness-75 transition-all'
                      onClick={() => window.open(item.alb_url)}
                    >
                      <img
                        src={item.alb_url}
                        className='w-full h-full object-cover'
                      />
                    </div>

                    {/* Normal */}
                    <div
                      className='w-1/3 h-full hover:brightness-75 transition-all'
                      onClick={() => window.open(item.nor_url)}
                    >
                      <img
                        src={item.nor_url}
                        className='w-full h-full object-cover'
                      />
                    </div>

                    {/* ORM */}
                    <div
                      className='w-1/3 h-full hover:brightness-75 transition-all'
                      onClick={() => window.open(item.orm_url)}
                    >
                      <img
                        src={item.orm_url}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TITLE */}
              <div className='text-lg font-bold text-[#2e2e2e] truncate'>
                {item.title}
              </div>

              {/* ACTIONS */}
              <div className='grid grid-cols-2 gap-2 mt-auto pt-4'>
                <button
                  className='primary-button flex gap-2 justify-center'
                  onClick={() => openEdit(item)}
                >
                  <MdEdit size={22} /> Chỉnh sửa
                </button>
                <button
                  className='secondary-button flex gap-2 justify-center'
                  onClick={() => handleDelete(item.id, tab)}
                >
                  <MdDelete size={22} /> Xóa
                </button>
              </div>
            </div>
          ))}

          {displayData.length === 0 && (
            <div className='col-span-full text-center text-gray-500 py-10'>
              Không có dữ liệu.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
