import { AudioApi } from "@/api/audioApi";
import { ImageApi } from "@/api/imageApi";
import { Object3dApi } from "@/api/object3dApi";
import { useEffect, useState } from "react";
import { MdDelete, MdEdit, MdAdd, MdClose } from "react-icons/md";
import ModalCreateResource from "./modals/CreateMediaModel";
import { Modal as ModalAnt, notification } from "antd";

export default function ManageResource() {
  const [api, contextHolder] = notification.useNotification();

  const [tab, setTab] = useState("image");

  const [images, setImages] = useState([]);
  const [objects, setObjects] = useState([]);
  const [audios, setAudios] = useState([]);
  const [displayData, setDisplayData] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    file_url: "",
    file: null,
    room_id: "",
  });

  const loadImages = async () => {
    const data = await ImageApi.getList();
    setImages(data.sort((a, b) => a.title.localeCompare(b.title)));
  };

  const loadObjects = async () => {
    const data = await Object3dApi.getList();
    setObjects(data.sort((a, b) => a.title.localeCompare(b.title)));
  };

  const loadAudio = async () => {
    const data = await AudioApi.getList();
    setAudios(data.sort((a, b) => a.title.localeCompare(b.title)));
  };

  const deleteItem = async (id, type) => {
    if (type === "image") {
      await ImageApi.delete(id);
      setImages(images.filter((item) => item.id !== id));
      api.success({
        title: "Thành công",
        description: "Xóa tranh thành công",
      });
      return;
    }
    if (type === "object") {
      await Object3dApi.delete(id);
      setObjects(objects.filter((item) => item.id !== id));
      api.success({
        title: "Thành công",
        description: "Xóa object 3D thành công",
      });
      return;
    }
    if (type === "audio") {
      await AudioApi.delete(id);
      setAudios(audios.filter((item) => item.id !== id));
      api.success({
        title: "Thành công",
        description: "Xóa âm thanh thành công",
      });
      return;
    }
  };

  function fetchData() {
    loadImages();
    loadObjects();
    loadAudio();
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchDisplayData();
  }, [tab]);

  useEffect(() => {
    fetchDisplayData();
  }, [images, objects, audios]);

  function fetchDisplayData() {
    if (tab === "image") setDisplayData(images);
    else if (tab === "object") setDisplayData(objects);
    else setDisplayData(audios);
  }

  // ========== POPUP ==========
  const openEdit = (item) => {
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
      title: "",
      url: "",
      file: null,
      room_id: "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, type) => {
    ModalAnt.confirm({
      title: "Xóa",
      content: "Bạn có chắc muốn xoá mục này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
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

      <div className="container-main mx-auto flex flex-col mt-10">
        <p className="text-4xl font-bold mb-3"> QUẢN LÝ TÀI NGUYÊN</p>
        <div className="flex border-b mb-6  w-full items-end">
          <button
            onClick={() => setTab("image")}
            className={`px-6 py-2 font-semibold tracking-wide 
      ${tab === "image" ? "bg-[#2e2e2e] text-white" : "text-[#2e2e2e]"}`}
          >
            Thư Viện Tranh
          </button>

          <button
            onClick={() => setTab("object")}
            className={`px-6 py-2 font-semibold tracking-wide 
      ${tab === "object" ? "bg-[#2e2e2e] text-white" : "text-[#2e2e2e]"}`}
          >
            Thư Viện Object 3D
          </button>

          <button
            onClick={() => setTab("audio")}
            className={`px-6 py-2 font-semibold tracking-wide 
      ${tab === "audio" ? "bg-[#2e2e2e] text-white" : "text-[#2e2e2e]"}`}
          >
            Thư Viện Audio
          </button>

          <button
            onClick={openCreate}
            className="ml-auto flex items-center gap-2 primary-button"
          >
            <MdAdd size={20} /> Thêm Mới
          </button>
        </div>
        {/* ================= CARD GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {displayData.map((item) => (
            <div
              key={item.id}
              className="border-2 border-transparent hover:border-[#2e2e2e] shadow-md p-4 transition cursor-pointer flex flex-col"
            >
              {/* PREVIEW */}
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden mb-4">
                {tab === "image" && (
                  <img
                    src={item.file_url}
                    className="w-full h-full object-cover"
                    onClick={() => window.open(item.file_url)}
                  />
                )}

                {tab === "object" && (
                  <div
                    className="flex flex-col items-center justify-center text-[#2e2e2e]"
                    onClick={() => window.open(item.file_url)}
                  >
                    <div className="w-20 h-20 bg-gray-300 flex items-center justify-center text-xl font-bold">
                      .glb
                    </div>
                    <p className="text-sm mt-2 text-gray-600">Object 3D</p>
                  </div>
                )}

                {tab === "audio" && (
                  <audio
                    controls
                    className="w-full"
                    onClick={() => window.open(item.file_url)}
                  >
                    <source src={item.file_url} />
                  </audio>
                )}
              </div>

              {/* TITLE */}
              <div className="text-lg font-bold text-[#2e2e2e] truncate">
                {item.title}
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                <button
                  className="primary-button flex gap-2 justify-center"
                  onClick={() => openEdit(item)}
                >
                  <MdEdit size={22} /> Chỉnh sửa
                </button>
                <button
                  className="secondary-button flex gap-2 justify-center"
                  onClick={() => handleDelete(item.id, tab)}
                >
                  <MdDelete size={22} /> Xóa
                </button>
              </div>
            </div>
          ))}

          {displayData.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">
              Không có dữ liệu.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
