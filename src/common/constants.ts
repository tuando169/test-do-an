const BASE_URL = "http://localhost:8000";
// const BASE_URL = "https://3d-gallery-be.vercel.app";

export enum RoleEnum {
  Admin = "admin",
  Designer = "designer",
  Client = "client",
  Guest = "guest",
}
export enum NewsItemTypeEnum {
  Image = "image",
  Object3D = "object3d",
  Text = "text",
}
export const apiEndpoints = {
  template: {
    getAll: `${BASE_URL}/template`,
    create: `${BASE_URL}/template`,
  },
  auth: {
    login: `${BASE_URL}/auth/login`,
    signup: `${BASE_URL}/auth/signup`,
    logout: `${BASE_URL}/auth/logout`,
    refreshToken: `${BASE_URL}}/auth/refresh-token`,
  },
  room: {
    getAll: `${BASE_URL}/room`,
    getPublic: `${BASE_URL}/room/public`,
    create: `${BASE_URL}/room`,
    getById: (id: string) => `${BASE_URL}/room/${id}`,
    updateById: (id: string) => `${BASE_URL}/room/${id}`,
    deleteById: (id: string) => `${BASE_URL}/room/${id}`,
    template: {
      getPublic: `${BASE_URL}/room/template`,
      buy: `${BASE_URL}/room/buy-template`,
      removeTemplate: (id: string) => `${BASE_URL}/room/remove-template/${id}`,
    },
  },
  user: {
    getAll: `${BASE_URL}/user`,
    create: `${BASE_URL}/user`,
    getById: (id: string) => `${BASE_URL}/user/${id}`,
    update: `${BASE_URL}/user`,
    deleteById: (id: string) => `${BASE_URL}/user/${id}`,
  },
  image: {
    create: `${BASE_URL}/image`,
    getAll: `${BASE_URL}/image`,
    getOne: (id: string) => `${BASE_URL}/image/${id}`,
    updateById: (id: string) => `${BASE_URL}/image/${id}`,
    deleteById: (id: string) => `${BASE_URL}/image/${id}`,
  },
  audio: {
    create: `${BASE_URL}/audio`,
    getAll: `${BASE_URL}/audio`,
    getOne: (id: string) => `${BASE_URL}/audio/${id}`,
    updateById: (id: string) => `${BASE_URL}/audio/${id}`,
    deleteById: (id: string) => `${BASE_URL}/audio/${id}`,
  },
  object3d: {
    create: `${BASE_URL}/object3d`,
    getAll: `${BASE_URL}/object3d`,
    getOne: (id: string) => `${BASE_URL}/object3d/${id}`,
    updateById: (id: string) => `${BASE_URL}/object3d/${id}`,
    deleteById: (id: string) => `${BASE_URL}/object3d/${id}`,
  },
  texture: {
    getAll: `${BASE_URL}/texture`,
    getOne: (id: string) => `${BASE_URL}/texture/${id}`,
    getPublic: `${BASE_URL}/texture/public`,
    create: `${BASE_URL}/texture`,
    updateById: (id: string) => `${BASE_URL}/texture/${id}`,
    deleteById: (id: string) => `${BASE_URL}/texture/${id}`,
  },
  news: {
    create: `${BASE_URL}/news`,
    getAll: `${BASE_URL}/news`,
    updateById: (id: string) => `${BASE_URL}/news/${id}`,
    deleteById: (id: string) => `${BASE_URL}/news/${id}`,
  },
  newsItem: {
    create: `${BASE_URL}/news-item`,
    getAll: `${BASE_URL}/news-item`,
    updateById: (id: string) => `${BASE_URL}/news-item/${id}`,
    deleteById: (id: string) => `${BASE_URL}/news-item/${id}`,
  },
};
