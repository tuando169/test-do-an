import { NewsApi } from "@/api/newsApi";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function NewsDetail() {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await NewsApi.getBySlug(slug);
      setNews(data);

      // Lấy danh sách tin, loại bỏ tin hiện tại, lấy 5 tin mới nhất
      const all = await NewsApi.getList();
      const latestNews = all
        .filter((n) => n.slug !== slug)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 5);

      setLatest(latestNews);
    }
    load();
  }, [slug]);

  if (!news) return <div className="p-10">Đang tải...</div>;

  return (
    <div className="container-main py-10 flex gap-12 mx-auto max-w-[1300px]">
      {/* ------------------------- MAIN CONTENT ------------------------- */}
      <div className="flex-1 ">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          {news.title}
        </h1>

        <div className="text-gray-500 text-sm mb-6">
          Cập nhật: {new Date(news.updated_at).toLocaleDateString("vi-VN")}
        </div>

        {/* Thumbnail */}
        {news.thumbnail && (
          <img src={news.thumbnail} className="w-full shadow mb-10" />
        )}

        {/* Blocks */}
        {news.layout_json?.map((block, idx) => {
          if (block.type === "text")
            return (
              <p
                key={idx}
                className="text-lg text-gray-800 leading-relaxed mb-6 whitespace-pre-line"
              >
                {block.content}
              </p>
            );

          if (block.type === "image")
            return (
              <div key={idx} className="my-8">
                {block.content && (
                  <img src={block.content} className="w-full shadow" />
                )}
                {block.caption && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    {block.caption}
                  </p>
                )}
              </div>
            );

          if (block.type === "object3d")
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

          return null;
        })}
      </div>

      {/* ------------------------- SIDEBAR ------------------------- */}
      <div className="w-80 shrink-0 sticky top-24 h-fit">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tin mới nhất</h2>

        <div className="space-y-6">
          {latest.map((item) => (
            <Link
              to={`/news/${item.slug}`}
              key={item.id}
              className="block group"
            >
              <img src={item.thumbnail} className="w-full h-32 object-cover " />

              <h3 className="mt-2 font-semibold text-gray-800 group-hover:text-blue-600 transition">
                {item.title}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.updated_at).toLocaleDateString("vi-VN")}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
