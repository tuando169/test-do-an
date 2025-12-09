import { newsFake } from '@/common/constants';
import { useParams, Link } from 'react-router-dom';

export default function NewsDetail() {
  const { id } = useParams();
  const news = newsFake.find((n) => n.id === Number(id));

  if (!news) {
    return (
      <div className='container-main mx-auto py-20'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Không tìm thấy bài viết
        </h2>
      </div>
    );
  }

  return (
    <div className='NewsDetail'>
      {/* TITLE */}
      <div className='container-main mx-auto pt-10 justify-between items-center'>
        <div>
          <h1 className='text-4xl font-bold text-gray-900'>{news.title}</h1>

          <p className='text-gray-500 mt-2'>
            {new Date(news.date).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <Link to='/news'>
          <button className='px-6 py-2 bg-[#1e1e1e] text-white uppercase h-fit font-semibold rounded-full hover:bg-[#2a2a2a] transition'>
            Quay lại
          </button>
        </Link>
      </div>

      {/* CONTENT */}
      <div className='container-main mx-auto py-10 gap-10'>
        {/* Thumbnail */}
        <div
          className='w-full h-[420px]  overflow-hidden'
          style={{ border: '2px solid' }}
        >
          <img
            src={news.thumbnail}
            alt=''
            className='w-full h-full object-cover'
          />
        </div>

        {/* Main content */}
        <div className='text-gray-700 leading-relaxed text-lg whitespace-pre-line'>
          {news.description}
          <br />
          <br />
          Đây là nội dung demo. Bạn có thể thay thế bằng nội dung thật từ API,
          hoặc mở rộng đoạn nội dung này để mô phỏng một bài báo chi tiết hơn.
        </div>
      </div>
    </div>
  );
}
