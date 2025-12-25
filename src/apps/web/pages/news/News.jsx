import { NewsApi } from '@/api/newsApi';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from 'antd'; // Import Skeleton

export default function News() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true); // Thêm state loading

  async function fetchNews() {
    setLoading(true);
    try {
      const data = await NewsApi.getList();
      setNewsList(data);
    } catch (error) {
      console.error('Lỗi khi tải tin tức:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  // Component Skeleton mô phỏng 1 thẻ tin tức
  const NewsSkeleton = () => (
    <div className='block overflow-hidden transition shadow-xl border-[20px] border-transparent'>
      {/* Giả lập Thumbnail (h-56 = 224px) */}
      <Skeleton.Button 
        active 
        block 
        shape="square" 
        style={{ height: '14rem', width: '100%' }} 
      />

      {/* Giả lập Content */}
      <div className='py-4'>
        {/* Title */}
        <Skeleton.Input active block size="large" style={{ height: 28, marginBottom: 10 }} />
        
        {/* Description (3 dòng) */}
        <Skeleton active paragraph={{ rows: 3 }} title={false} className="mt-2" />

        {/* Date */}
        <Skeleton.Input active size="small" style={{ width: 100, marginTop: 16 }} />
      </div>
    </div>
  );

  return (
    <div className=''>
      {/* TITLE */}
      <div className='container-main mx-auto py-10'>
        <h1 className='text-4xl font-bold '>Tin tức</h1>
      </div>

      {/* GRID */}
      <div className='container-main mx-auto pb-20 grid grid-cols-1 sm:grid-cols-2 gap-10'>
        {loading ? (
          // Render 4 khung xương khi đang tải
          <>
            <NewsSkeleton />
            <NewsSkeleton />
            <NewsSkeleton />
            <NewsSkeleton />
          </>
        ) : newsList.length > 0 ? (
          // Render dữ liệu thật khi tải xong
          newsList.map((news) => (
            <Link
              to={`/news/${news.slug}`}
              key={news.id}
              className='block overflow-hidden transition shadow-xl border-[20px] border-transparent hover:border-[#2e2e2e]'
            >
              {/* Thumbnail */}
              <div
                className='w-full h-56 bg-cover bg-center'
                style={{ backgroundImage: `url(${news.thumbnail})` }}
              ></div>

              {/* Content */}
              <div className='py-4'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  {news.title}
                </h2>

                <p className='text-gray-600 mt-2 line-clamp-3 leading-relaxed'>
                  {news.description}
                </p>

                <p className='text-sm text-gray-400 mt-4'>
                  {new Date(news.updated_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </Link>
          ))
        ) : (
          // Thông báo nếu không có dữ liệu
          <div className='col-span-1 sm:col-span-2 text-center text-gray-500 py-10'>
            Chưa có tin tức nào.
          </div>
        )}
      </div>
    </div>
  );
}