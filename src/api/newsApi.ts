import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { NewsData, NewsUploadData } from '../common/types';

function buildNewsFormData(data: NewsUploadData) {
  const form = new FormData();
  console.log(data);

  // Metadata
  form.append('title', data.title);
  form.append('slug', data.slug);
  form.append('description', data.description);

  // Thumbnail file
  form.append('thumbnail', data.thumbnail);

  const layoutJsonToSend = [];

  data.layout_json.forEach((block, idx) => {
    // TEXT
    if (block.type === 'text') {
      layoutJsonToSend.push({
        type: 'text',
        content: block.content || '',
      });
      return;
    }

    // IMAGE / 3!
    if (typeof block.content !== 'string')
      layoutJsonToSend.push({
        type: block.type,
        content: '',
      });
    else {
      layoutJsonToSend.push({
        type: block.type,
        content: block.content,
      });
    }

    if (block.content instanceof File) {
      form.append(`items[${idx}]`, block.content);
    }
  });

  form.append('layout_json', JSON.stringify(layoutJsonToSend));

  return form;
}

export const NewsApi = {
  async create(data: NewsUploadData) {
    console.log(data);

    const form = buildNewsFormData(data);

    const res = await axiosClient.post(apiEndpoints.news.create, form);
    return res.data;
  },

  async update(id, data) {
    console.log(data);

    const form = buildNewsFormData(data);

    const res = await axiosClient.patch(apiEndpoints.news.updateById(id), form);
    return res.data;
  },
  delete(id: string) {
    return axiosClient.delete(apiEndpoints.news.deleteById(id));
  },
  async getList() {
    const res = await axiosClient.get(apiEndpoints.news.getAll);
    const data: NewsData[] = res.data;
      return (
        data.sort(
          (a, b) =>
             new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || []
      );
  },
  async getBySlug(slug) {
    const list = await NewsApi.getList();
    const res = list.find((news) => news.slug === slug);
    return res;
  },
};
