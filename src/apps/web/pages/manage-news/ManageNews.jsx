import { NewsApi } from "@/api/newsApi";
import { Modal } from "antd";
import { useEffect, useState } from "react";
import { MdDelete, MdEdit, MdAdd, MdClose } from "react-icons/md";
import { Link } from "react-router-dom";

export default function ManageNews() {
  const [newsList, setNewsList] = useState([]);

  const loadNews = async () => {
    const data = await NewsApi.getList();
    setNewsList(data);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Xoá tin tức?",
      content:
        "Bạn có chắc chắn muốn xoá bài viết này? Hành động này không thể hoàn tác.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Huỷ",

      async onOk() {
        try {
          await NewsApi.delete(id);
          loadNews();
        } catch {
          Modal.error({
            title: "Lỗi",
            content: "Không thể xoá tin tức.",
          });
        }
      },
    });
  };

  return (
    <>
      <div className="container-main flex-col py-10">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold text-[#2e2e2e] uppercase mb-6">
            Quản lý Tin tức
          </h1>

          <button
            onClick={() => (window.location.href = "/news-editor")}
            className="flex items-center gap-2 primary-button"
          >
            <MdAdd size={20} /> Thêm tin tức
          </button>
        </div>
      </div>
      <div className="container-main mx-auto pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {newsList.map((news) => (
          <div
            key={news.id}
            className="overflow-hidden transition hover:shadow-xl border-2"
          >
            <Link to={`/news/${news.slug}`}>
              <div
                className="w-full h-56 bg-cover bg-center"
                style={{ backgroundImage: `url(${news.thumbnail})` }}
              ></div>

              <div className="p-5 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {news.title}
                </h2>
                <p className="text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                  {news.description}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {new Date(news.updated_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-2 px-5 pb-4">
              <button
                className="secondary-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(news.id);
                }}
              >
                Xoá
              </button>

              <button
                className="primary-button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/news-editor/${news.slug}`;
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
