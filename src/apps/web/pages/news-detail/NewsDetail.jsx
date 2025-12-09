import { NewsApi } from "@/api/newsApi";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function NewsDetail() {
  const { slug } = useParams();
  const [news, setNews] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await NewsApi.getBySlug(slug);
      setNews(data);
    }
    load();
  }, [slug]);

  if (!news) return <div className="p-10">Đang tải...</div>;

  return (
    <div className="container-main py-10 flex flex-col max-w-7xl mx-auto">
      {/* Title */}
      <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
        {news.title}
      </h1>

      <div className="text-gray-500 text-sm mb-6">
        Cập nhật: {new Date(news.updated_at).toLocaleDateString("vi-VN")}
      </div>

      {/* Thumbnail */}
      {news.thumbnail && (
        <img src={news.thumbnail} className="w-full  shadow mb-10" />
      )}

      {/* Render từng block */}
      {news.layout_json?.map((block, idx) => {
        // TEXT BLOCK
        if (block.type === "text") {
          return (
            <p
              key={idx}
              className="text-lg text-gray-800 leading-relaxed mb-6 whitespace-pre-line"
            >
              {block.content}
            </p>
          );
        }

        // IMAGE BLOCK
        if (block.type === "image") {
          return (
            <div key={idx} className="my-8">
              {block.content && (
                <img src={block.content} className="w-full  shadow" />
              )}
              {block.caption && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  {block.caption}
                </p>
              )}
            </div>
          );
        }

        // 3D BLOCK
        if (block.type === "object3d") {
          return (
            <div key={idx} className="my-10">
              <p className="text-gray-700 font-semibold mb-2">Mô hình 3D:</p>
              <a
                href={block.content}
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline"
              >
                Nhấn để xem mô hình 3D ({block.content.split("/").pop()})
              </a>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
