import { RoomApi } from "@/api/roomApi";
import Modal from "@/apps/web/components/modal";
import { notification } from "antd";
import { useEffect, useState } from "react";
import { MdCheck } from "react-icons/md";

export default function PickTemplateModal({
  isVisible,
  ownedSpaces,
  onClose,
  onSubmit,
}) {
  const [api, contextHolder] = notification.useNotification();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  async function fetchPublicTemplates() {
    const templates = await RoomApi.getPublicTemplateList();
    setTemplates(
      templates.filter((tpl) => !ownedSpaces.find((s) => s.id === tpl.id))
    );
  }

  const toggle = (id) => {
    if (selectedTemplates.includes(id)) {
      setSelectedTemplates(selectedTemplates.filter((x) => x !== id));
    } else {
      setSelectedTemplates([...selectedTemplates, id]);
    }
  };

  function handleClose() {
    setSelectedTemplates([]);
    onClose();
  }

  const handlePickTemplate = async () => {
    try {
      await RoomApi.buyTemplates(selectedTemplates);
      onSubmit();
      handleClose();
      api.success({
        message: "Thành công",
        description: "Đã lấy không gian mẫu thành công.",
      });
    } catch (err) {
      console.error("Lỗi xử lý:", err);
    }
  };

  useEffect(() => {
    fetchPublicTemplates();
  }, []);

  return (
    <Modal isVisible={isVisible} onClose={handleClose}>
      {contextHolder}
      <div className="modalRegister__title">CHỌN KHÔNG GIAN MẪU</div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-auto pr-2 mt-4">
        {templates.map((tpl) => {
          const isSelected = selectedTemplates.includes(tpl.id);

          return (
            <div
              key={tpl.id}
              onClick={() => toggle(tpl.id)}
              className="relative border overflow-hidden cursor-pointer bg-white transition hover:shadow"
            >
              <img
                src={tpl.thumbnail}
                className="w-full h-32 object-cover"
                alt=""
              />

              <div className="p-2 text-sm text-[#2e2e2e]">
                <p className="font-semibold truncate">{tpl.title}</p>
                <p className="truncate">{tpl.author}</p>
              </div>

              {/* CHECK ICON */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-[#2e2e2e] text-white p-1">
                  <MdCheck size={18} />
                </div>
              )}

              <a
                href={`/exhibition/${tpl.slug}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="primary-button">Khám phá</p>
              </a>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="col-span-3 text-center text-gray-500 py-4">
            Không có template nào phù hợp.
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        className="secondary-button w-full mt-4"
        onClick={handlePickTemplate}
      >
        LẤY TẤT CẢ KHÔNG GIAN ĐÃ CHỌN
      </button>
    </Modal>
  );
}
