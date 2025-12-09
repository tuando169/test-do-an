import { NewsApi } from "@/api/newsApi";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function News() {
  const [newsList, setNewsList] = useState([]);

  async function fetchNews() {
    const data = await NewsApi.getList();
    setNewsList(data);
  }

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="News">
      {/* TITLE */}
      <div className="container-main mx-auto py-10">
        <h1 className="text-4xl font-bold ">Tin tức</h1>
      </div>

      {/* GRID */}
      <div className="container-main mx-auto pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {newsList.map((news) => (
          <Link
            to={`/news/${news.slug}`}
            key={news.id}
            className="block overflow-hidden transition hover:shadow-xl"
            style={{ border: "2px solid" }}
          >
            {/* Thumbnail */}
            <div
              className="w-full h-56 bg-cover bg-center"
              style={{ backgroundImage: `url(${news.thumbnail})` }}
            ></div>

            {/* Content */}
            <div className="p-5 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {news.title}
              </h2>

              <p className="text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                {news.description}
              </p>

              <p className="text-sm text-gray-400 mt-4">
                {new Date(news.updated_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
