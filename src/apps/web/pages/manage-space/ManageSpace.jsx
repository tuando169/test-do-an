import { RoomApi } from "@/api/roomApi";
import { UserApi } from "@/api/userApi";
import { RoleEnum } from "@/common/constants";
import { notification } from "antd";
import { useEffect, useState } from "react";
import {
  MdEdit,
  MdAdd,
  MdClose,
  MdCheck,
  MdVisibility,
  MdSearch,
} from "react-icons/md";
import Modal from "../../components/modal/index";
import PickTemplateModal from "./modals/PickTemplateModal";
import EditSpaceModal from "../../components/modals/EditSpaceModal";

export default function ManageSpace() {
  const [api, contextHolder] = notification.useNotification();
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const [spaces, setSpaces] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(RoleEnum.Guest);

  const [tab, setTab] = useState("Exhibition");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    title: "",
    owner_id: "",
    visibility: "public",
    thumbnail: "",
    description: "",
  });

  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({
    templateId: "",
    title: "",
    owner_id: "",
    visibility: "public",
    thumbnail: "",
    description: "",
    room_json: {},
  });

  const openCreate = (tpl) => {
    if (tpl.id)
      setCreateForm({
        templateId: tpl.id,
        title: `Bản sao của ${tpl.title}`,
        owner_id: tpl.owner_id,
        visibility: tpl.visibility || "public",
        thumbnail: tpl.thumbnail,
        description: tpl.description || "",
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
        type: "gallery",
        room_json: createForm.room_json,
      };

      await RoomApi.create(payload);

      api.success({
        message: "Thành công",
        description: "Đã tạo không gian mới từ template",
      });

      setShowCreate(false);
      loadSpaces();
    } catch (err) {
      console.error(err);
      api.error({
        message: "Thất bại",
        description: "Không thể tạo không gian",
      });
    }
  };

  // Fetch
  const loadSpaces = async () => {
    try {
      const data = await RoomApi.getAll();
      setSpaces(data);
    } catch (err) {
      console.error("Lỗi API:", err);
    }
  };

  async function fetchCurrentUser() {
    const userId = localStorage.getItem("user");
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
        message: "Cập nhật thành công",
        description: "Thông tin không gian đã được cập nhật.",
      });

      setShowEditModal(false);
      loadSpaces();
    } catch (err) {
      console.error(err);
      api.error({
        message: "Lỗi cập nhật",
        description: "Không thể cập nhật không gian.",
      });
    }
  };

  const pickTemplateSuccess = () => {
    setModalOpen(false);
    loadSpaces();
  };

  // ⭐ Lọc theo tab
  const filteredSpaces = spaces.filter((s) =>
    tab == "template" ? s.type === "template" : s.type !== "template"
  );

  return (
    <>
      <PickTemplateModal
        isVisible={modalOpen}
        ownedSpaces={spaces}
        onClose={() => setModalOpen(false)}
        onSubmit={pickTemplateSuccess}
      />

      <EditSpaceModal isVisible={showEditModal} onClose={() => setShowCreate(false)} onSubmit={handleUpdateSpace} space={editForm} />


      {/* CREATE FROM TEMPLATE MODAL */}
      <Modal isVisible={showCreate} onClose={() => setShowCreate(false)}>
        <div className="modalRegister__title">
          {createForm.templateId
            ? "TẠO KHÔNG GIAN TỪ TEMPLATE"
            : "TẠO KHÔNG GIAN MỚI"}
        </div>

        <form
          className="modalRegister__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          {/* Title */}
          <label className="modalRegister__form__label">Tên</label>
          <input
            type="text"
            className="modalRegister__form__input"
            value={createForm.title}
            onChange={(e) =>
              setCreateForm({ ...createForm, title: e.target.value })
            }
          />
          {/* description */}
          <label className="modalRegister__form__label">Mô tả</label>
          <textarea
            className="modalRegister__form__input"
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
          />

          {/* Visibility */}
          <label className="modalRegister__form__label">Hiển thị</label>
          <select
            className="modalRegister__form__input"
            value={createForm.visibility}
            onChange={(e) =>
              setCreateForm({ ...createForm, visibility: e.target.value })
            }
          >
            <option value="public">Công khai</option>
            <option value="private">Riêng tư</option>
          </select>

          {/* Thumbnail */}
          <label className="modalRegister__form__label">Thumbnail</label>
          <img
            src={thumbnailPreview || createForm.thumbnail}
            alt=""
            className="w-full h-40 object-cover border mb-3"
          />
          <input
            type="file"
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
            className="modalRegister__form__button mt-4"
            onClick={openCreate}
          >
            TẠO KHÔNG GIAN
          </button>
        </form>
      </Modal>

      <div className="container-main flex-col py-10">
        {contextHolder}
        {/* TITLE */}
        <h1 className="text-3xl font-bold text-[#2e2e2e] uppercase mb-6">
          Quản Lý Không Gian
        </h1>

        {/* ⭐ TAB UI */}
        <div className="flex border-b mb-6 items-center">
          {/* TAB 1 */}
          <button
            onClick={() => setTab("Exhibition")}
            className={`
            px-6 py-2 font-semibold tracking-wide
            ${
              tab === "Exhibition"
                ? "bg-[#2e2e2e] text-white"
                : "text-[#2e2e2e]"
            }
          `}
          >
            KHÔNG GIAN TRƯNG BÀY
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setTab("template")}
            className={`
            px-6 py-2 font-semibold tracking-wide
            ${tab === "template" ? "bg-[#2e2e2e] text-white" : "text-[#2e2e2e]"}
          `}
          >
            KHÔNG GIAN MẪU
          </button>
          {tab === "template" && (
            <div className="flex ml-auto">
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 hover:opacity-80"
              >
                <MdAdd size={20} /> Lấy thêm không gian mẫu
              </button>
            </div>
          )}
          {tab === "template" ? (
            userRole === RoleEnum.Admin ||
            (userRole === RoleEnum.Designer && (
              <div className="flex ml-auto">
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 hover:opacity-80"
                >
                  <MdAdd size={20} /> Tạo không gian mẫu mới
                </button>
              </div>
            ))
          ) : (
            <div className="flex ml-auto gap-3">
              <button
                onClick={() => setTab("template")}
                className="flex items-center gap-2 bg-white border-2 border-[#2e2e2e] text-[#2e2e2e] px-4 py-2 hover:!bg-[#2e2e2e] hover:text-white transition-all"
              >
                Tạo không gian từ mẫu
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 border-2 border-[#2e2e2e] hover:!bg-white hover:!text-[#2e2e2e] transition-all"
              >
                <MdAdd size={20} /> Tạo không gian
              </button>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="border border-gray-300 overflow-hidden">
          {/* CARD GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filteredSpaces.map((space) => (
              <div
                key={space.id}
                className="border rounded shadow-sm hover:shadow-md transition overflow-hidden bg-white"
              >
                {/* Thumbnail */}
                <img
                  src={space.thumbnail}
                  className="w-full h-40 object-cover"
                  alt={space.title}
                />

                <div className="p-4 text-[#2e2e2e]">
                  {/* Title */}
                  <h3 className="font-bold text-lg truncate">{space.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 my-1">
                    {space.description}
                  </p>

                  {/* Meta info */}
                  <div className="text-sm mt-2">
                    <p>
                      <span className="font-semibold">Nghệ sĩ: </span>
                      {space.author}
                    </p>
                    <p>
                      <span className="font-semibold">Hiển thị: </span>
                      {space.visibility}
                    </p>
                    <p>
                      <span className="font-semibold">Loại: </span>
                      {space.type}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-4">
                    {/* VIEW */}
                    <button
                      className="text-orange-600 hover:text-orange-800"
                      onClick={() =>
                        window.open(`/exhibition/${space.slug}`, "_blank")
                      }
                    >
                      <MdVisibility size={22} />
                    </button>

                    {/* TEMPLATE ACTIONS */}
                    {tab === "template" ? (
                      <>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => openCreate(space)}
                        >
                          <MdAdd size={22} />
                        </button>
                        {(userRole === RoleEnum.Admin ||
                          userRole === RoleEnum.Designer) && (
                          <>
                            <button
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() =>
                                window.open(
                                  `/exhibition-edit/${space.slug}`,
                                  "_blank"
                                )
                              }
                            >
                              <MdSearch size={22} />
                            </button>

                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => openEdit(space)}
                            >
                              <MdEdit size={22} />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      /* EDIT (for exhibition items) */
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => openEdit(space)}
                      >
                        <MdEdit size={22} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Empty */}
            {filteredSpaces.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-10">
                Không có dữ liệu.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
