import { AudioApi } from '@/api/audioApi';
import { ImageApi } from '@/api/imageApi';
import { Object3dApi } from '@/api/object3dApi';
import { useEffect, useState } from 'react';
import { MdDelete, MdEdit, MdAdd, MdDownload } from 'react-icons/md';
import CreateMediaModal from './modals/CreateMediaModal';
import { Modal as ModalAnt, notification, Skeleton } from 'antd';
import { TextureApi } from '@/api/textureApi';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';
import { LicenseApi } from '@/api/licenseApi';
import ImageCreateWithMetadataModal from './modals/ImageCreateWithMetaDataModal';
import ImageEditModal from './modals/ImageEditModal'

export default function ManageResource() {
  const [api, contextHolder] = notification.useNotification();

  const [tab, setTab] = useState('image');
  const [userRole, setUserRole] = useState(null);
  const [licenses, setLicenses] = useState(null);

  const [textures, setTextures] = useState([]);
  const [images, setImages] = useState([]);
  const [objects, setObjects] = useState([]);
  const [audios, setAudios] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  
  const [loading, setLoading] = useState(true); // Mặc định là true để vào là load ngay
  const [modalOpen, setModalOpen] = useState(false);

  const [imageMetaOpen, setImageMetaOpen] = useState(false);
  const [imageEditOpen, setImageEditOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const [form, setForm] = useState({
    title: '',
    file_url: '',
    file: null,
    room_id: '',
    alb: '',
    nor: '',
    orm: '',
    texture_for: '',
    id: '',
  });

  // Hàm load lại dữ liệu của tab hiện tại (dùng khi thêm/sửa/xóa)
  const fetchCurrentTabData = async (currentTab) => {
    setLoading(true);
    try {
       if (currentTab === 'image') {
          const data = await ImageApi.getList();
          setImages(data);
       } else if (currentTab === 'object') {
          const data = await Object3dApi.getList();
          setObjects(data);
       } else if (currentTab === 'audio') {
          const data = await AudioApi.getList();
          setAudios(data);
       } else if (currentTab === 'texture') {
          const data = await TextureApi.getAll();
          setTextures(data);
       }
    } catch(err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  // FETCH ALL DATA LÚC KHỞI TẠO
  useEffect(() => {
     const initData = async () => {
        setLoading(true); // Bắt đầu loading
        try {
            await fetchUserRole();
            const [imgs, objs, auds, texs] = await Promise.all([
                ImageApi.getList(),
                Object3dApi.getList(),
                AudioApi.getList(),
                TextureApi.getAll()
            ]);
            setImages(imgs);
            setObjects(objs);
            setAudios(auds);
            setTextures(texs);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false); // Tắt loading khi xong hết
        }
     };

     initData();
  }, []);

  const fetchUserRole = async () => {
    const userId = localStorage.getItem('user');
    const data = await UserApi.getById(userId);
    setUserRole(data.role);
    fetchLicense(data.license);
  };

  const fetchLicense = async (id) => {
    try {
      const data = await LicenseApi.getById(id);
      setLicenses(data);
    } catch (err) {
      console.error('Lỗi API:', err);
    }
  };

  // Cập nhật displayData khi tab đổi hoặc data nguồn đổi
  useEffect(() => {
    if (tab === 'image') setDisplayData(images);
    else if (tab === 'object') setDisplayData(objects);
    else if (tab === 'audio') setDisplayData(audios);
    else if (tab === 'texture') setDisplayData(textures);
  }, [tab, images, objects, audios, textures]);

  const deleteItem = async (id, type) => {
    if (type === 'texture') {
      await TextureApi.delete(id);
      setTextures(textures.filter((item) => item.id !== id));
      api.success({ title: 'Thành công', description: 'Xóa texture thành công' });
    } else if (type === 'image') {
      await ImageApi.delete(id);
      setImages(images.filter((item) => item.id !== id));
      api.success({ title: 'Thành công', description: 'Xóa tranh thành công' });
    } else if (type === 'object') {
      await Object3dApi.delete(id);
      setObjects(objects.filter((item) => item.id !== id));
      api.success({ title: 'Thành công', description: 'Xóa object 3D thành công' });
    } else if (type === 'audio') {
      await AudioApi.delete(id);
      setAudios(audios.filter((item) => item.id !== id));
      api.success({ title: 'Thành công', description: 'Xóa âm thanh thành công' });
    }
  };

  async function downloadFile(url, filename) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = tab == 'object' ? filename + '.glb' : filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }

  const handleDelete = async (id, type) => {
    ModalAnt.confirm({
      title: 'Xóa',
      content: 'Bạn có chắc muốn xoá mục này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk() { deleteItem(id, type); },
    });
  };

  const openEdit = (item) => {
    if (tab === 'image') {
      setSelectedImage(item)
      setImageEditOpen(true)
      return
    }
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
      id: '',
    });
    setModalOpen(true);
  };

  const onCreateMediaSuccess = () => {
     fetchCurrentTabData(tab);
     api.success({ title: 'Thành công', description: 'Cập nhật dữ liệu thành công.' });
  };

  const CardSkeleton = () => (
    <div className='border-2 border-transparent shadow-md p-4 flex flex-col'>
       <Skeleton.Button active block shape="square" style={{ height: '12rem', marginBottom: 16 }} />
       <Skeleton.Input active block size="small" style={{ marginBottom: 16 }} />
       <div className='grid grid-cols-2 gap-2 mt-auto'>
          <Skeleton.Button active block />
          <Skeleton.Button active block />
       </div>
       <div className='w-full pt-2'>
          <Skeleton.Button active block size="large" />
       </div>
    </div>
  );

  return (
    <>
      {contextHolder}
      <CreateMediaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={form}
        tab={tab}
        onSuccess={onCreateMediaSuccess}
      />

      <ImageCreateWithMetadataModal
        open={imageMetaOpen}
        onClose={() => setImageMetaOpen(false)}
        onSuccess={() => {
          loadImages();
          api.success({
            title: 'Thành công',
            description: 'Tạo tranh mới kèm metadata thành công.',
          });
        }}
      />

      <ImageEditModal
        open={imageEditOpen}
        image={selectedImage}
        onClose={() => setImageEditOpen(false)}
        onSuccess={() => loadImages()}
      />

      <div className='container-main mx-auto flex flex-col mt-10'>
        <div className='flex flex-col  mb-4'>
          <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-2'>
            QUẢN LÝ TÀI NGUYÊN
          </h1>
          <div className='flex gap-20 items-center'>
            <span className=' text-xl'>
              Tổng số tài nguyên:{' '}
              <span className='font-semibold text-2xl'>
                {images.length +
                  (userRole == RoleEnum.Admin ? objects.length : 0) +
                  audios.length +
                  (userRole == RoleEnum.Admin ? textures.length : 0)}{' '}
                {userRole != RoleEnum.Admin && (
                  <span>/ {licenses ? licenses.media_limit : 0}</span>
                )}
              </span>
            </span>
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
        
        <div className='flex border-b mb-6  w-full items-end'>
          {['image', 'object', 'audio', ...(userRole == RoleEnum.Admin ? ['texture'] : [])].map(type => (
              <button
                key={type}
                onClick={() => setTab(type)}
                className={`px-6 py-2 font-semibold tracking-wide capitalize
                  ${tab === type ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}`}
              >
                Thư Viện {type === 'object' ? 'Object 3D' : type}
              </button>
          ))}
          
          <button
            onClick={() => {
              if (tab === 'image') {
                setImageMetaOpen(true);   // 👉 mở popup metadata ảnh
              } else {
                openCreate();             // 👉 modal cũ cho object/audio/texture
              }
            }}
            className='ml-auto flex items-center gap-2 primary-button'
          >
            <MdAdd size={20} /> Thêm Mới
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 pb-20'>
          {loading ? (
             <>
               <CardSkeleton />
               <CardSkeleton />
               <CardSkeleton />
             </>
          ) : displayData.length > 0 ? (
             displayData.map((item) => (
                <div
                  key={item.id}
                  className='border-2 border-transparent hover:border-[#2e2e2e] shadow-md p-4 transition cursor-pointer flex flex-col'
                >
                  <div className='w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden mb-4'>
                    {tab === 'image' && (
                      <img
                        src={item.file_url}
                        className='w-full h-full object-cover'
                        onClick={() => window.open(item.file_url)}
                      />
                    )}

                    {tab === 'object' && (
                      <model-viewer
                        src={item.file_url}
                        style={{ width: '100%', height: '100%' }}
                        camera-controls
                        auto-rotate
                        shadow-intensity='1'
                        exposure='1'
                      />
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
                        <div className='w-1/3 h-full hover:brightness-75 transition-all' onClick={() => window.open(item.alb_url)}>
                          <img src={item.alb_url} className='w-full h-full object-cover' />
                        </div>
                        <div className='w-1/3 h-full hover:brightness-75 transition-all' onClick={() => window.open(item.nor_url)}>
                          <img src={item.nor_url} className='w-full h-full object-cover' />
                        </div>
                        <div className='w-1/3 h-full hover:brightness-75 transition-all' onClick={() => window.open(item.orm_url)}>
                          <img src={item.orm_url} className='w-full h-full object-cover' />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='text-lg font-bold text-[#2e2e2e] truncate'>
                    {item.title}
                  </div>

                  <div className='grid grid-cols-2 gap-2 mt-auto pt-4'>
                    <button
                      className='secondary-button flex gap-2 justify-center'
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
                  
                  {tab !== 'texture' && (
                    <div className='w-full pt-2'>
                      <button
                        className='primary-button flex gap-2 justify-center w-full'
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(item.file_url, item.title);
                        }}
                      >
                        <MdDownload size={22} /> Tải xuống
                      </button>
                    </div>
                  )}
                </div>
             ))
          ) : (
             <div className='col-span-full text-center text-gray-500 py-10'>
               Không có dữ liệu.
             </div>
          )}
        </div>
      </div>
    </>
  );
}