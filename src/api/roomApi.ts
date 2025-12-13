import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { RoomData, RoomUploadData } from '../common/types';

export const RoomApi = {
  // Lấy danh sách phòng public
  async getPublicRoomList(): Promise<RoomData[]> {
    try {
      const res = await axiosClient.get(apiEndpoints.room.getPublic);
      const uniqueRoomsMap: { [key: string]: RoomData } = {};

      res.data.forEach((room: RoomData) => {
        uniqueRoomsMap[room.id] = room;
      });

      const uniqueRooms = Object.values(uniqueRoomsMap);

      return Promise.resolve(
        uniqueRooms
          .filter((r) => r.visibility === 'public' && r.type !== 'template')
          .sort((a, b) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          })
      );
    } catch (err) {
      throw err;
    }
  },

  // Lấy toàn bộ phòng
  async getAll(): Promise<RoomData[]> {
    try {
      const res = await axiosClient.get(apiEndpoints.room.getAll);
      const data: RoomData[] = res.data || [];
      return Promise.resolve(
        res.data.sort((a: RoomData, b: RoomData) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
      );
    } catch (err) {
      throw err;
    }
  },

  // Template public
  async getPublicTemplateList(): Promise<RoomData[]> {
    try {
      const res = await axiosClient.get(apiEndpoints.room.template.getPublic);
      return Promise.resolve(
        res.data.sort((a: RoomData, b: RoomData) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
      );
    } catch (err) {
      throw err;
    }
  },

  // Lấy list template (không public)
  async getTemplateRoomList(): Promise<RoomData[]> {
    try {
      const all = await RoomApi.getAll();
      return all.filter((r) => r.type === 'template');
    } catch (err) {
      throw err;
    }
  },

  // Lấy list phòng của user
  async getNormalRoomList(): Promise<RoomData[]> {
    try {
      const userId = localStorage.getItem('user');
      const all = await RoomApi.getAll();
      return all.filter((r) => r.type !== 'template');
    } catch (err) {
      throw err;
    }
  },

  // Tạo phòng
  async create(payload: RoomUploadData): Promise<RoomData> {
    try {
      const rooms = await RoomApi.getAll();
      const same = rooms.filter((r) => r.title?.startsWith(payload.title!));

      if (same.length > 0) {
        payload.title = `${payload.title} ${same.length + 1}`;
      }

      // Slug
      const slugBase = payload.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const finalSlug = `${localStorage.getItem('user')}-${slugBase}`;
      const formData = new FormData();

      formData.append('title', payload.title!);
      formData.append('slug', finalSlug);
      formData.append('description', payload.description || '');
      formData.append('visibility', payload.visibility || 'public');
      formData.append('tags', JSON.stringify(payload.tags || []));

      if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail);
      if (payload.type) formData.append('type', payload.type);
      console.log(payload, formData);

      const res = await axiosClient.post(apiEndpoints.room.create, formData);
      const updateData: RoomData = res.data;

      const res2 = await axiosClient.patch(
        apiEndpoints.room.updateById(updateData.id),
        {
          room_json: payload.room_json,
        }
      );

      return Promise.resolve(res2.data);
    } catch (err) {
      console.error('RoomApi.create error:', err);
      throw err;
    }
  },

  // Lấy phòng theo slug
  async getOneBySlug(slug: string) {
    const publicList = await RoomApi.getPublicRoomList();
    const room = publicList.find((r) => r.slug === slug);
    if (room) return room;
    const myList = await RoomApi.getAll();
    return myList.find((r) => r.slug === slug);
  },

  // Lấy chi tiết phòng
  async getDetail(id: string) {
    const res = await axiosClient.get(apiEndpoints.room.getById(id));
    return res.data;
  },

  // Cập nhật phòng
  async update(updateData: RoomData) {
    try {
      let finalTitle = updateData.title?.trim();
      let finalSlug = updateData.slug;

      if (finalTitle) {
        const rooms = await RoomApi.getAll();
        const same = rooms.filter(
          (r) =>
            r.title?.toLowerCase() === finalTitle!.toLowerCase() &&
            r.id !== updateData.id
        );

        if (same.length > 0) {
          finalTitle = `${finalTitle} ${same.length + 1}`;
        }

        const slugBase = finalTitle
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        finalSlug = `${updateData.owner_id}-${slugBase}`;

        updateData.title = finalTitle;
        updateData.slug = finalSlug;
      }

      const formData = new FormData();
      if (updateData.title) formData.append('title', updateData.title);
      if (updateData.slug) formData.append('slug', updateData.slug);
      if (updateData.description)
        formData.append('description', updateData.description);
      if (updateData.visibility)
        formData.append('visibility', updateData.visibility);
      if (updateData.status) formData.append('status', updateData.status);
      if (updateData.thumbnail)
        formData.append('thumbnail', updateData.thumbnail);
      if (updateData.room_json)
        formData.append('room_json', JSON.stringify(updateData.room_json));
      if (updateData.tag) formData.append('tag', updateData.tag);
      if (updateData.tags)
        formData.append('tags', JSON.stringify(updateData.tags));
      if (updateData.type) formData.append('type', updateData.type);
      if (updateData.owner_id) formData.append('owner_id', updateData.owner_id);
      if (updateData.author) formData.append('author', updateData.author);

      const res = await axiosClient.patch(
        apiEndpoints.room.updateById(updateData.id),
        formData
      );
      return res.data;
    } catch (err) {
      console.error('RoomApi.update error:', err);
      throw err;
    }
  },

  async buyTemplates(ids: string[]) {
    try {
      const res = await axiosClient.post(apiEndpoints.room.template.buy, {
        template_ids: ids,
      });
      return res.data;
    } catch (err) {
      console.error('RoomApi.buyTemplate error:', err);
      throw err;
    }
  },

  async delete(id: string) {
    const res = await axiosClient.delete(apiEndpoints.room.deleteById(id));
    return res.data;
  },
};
