const BASE_URL = 'http://localhost:8000';
// const BASE_URL = "https://3d-gallery-be.vercel.app";

export enum RoleEnum {
  Admin = 'admin',
  Designer = 'designer',
  Client = 'client',
  Guest = 'guest',
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
    update: `${BASE_URL}/image`,
    deleteById: (id: string) => `${BASE_URL}/image/${id}`,
  },
  object3d: {
    create: `${BASE_URL}/object3d`,
    getAll: `${BASE_URL}/object3d`,
    update: `${BASE_URL}/object3d`,
    deleteById: (id: string) => `${BASE_URL}/object3d/${id}`,
  },
  texture: {
    getAll: `${BASE_URL}/texture`,
    getOne: (id: string) => `${BASE_URL}/texture/${id}`,
    getPublic: `${BASE_URL}/texture/public`,
    create: `${BASE_URL}/texture`,
    update: `${BASE_URL}/texture`,
    deleteById: (id: string) => `${BASE_URL}/texture/${id}`,
  },
};

export const newsFake = [
  {
    id: 1,
    title: 'Triển lãm nghệ thuật 3D mở cửa trở lại',
    description:
      'Không gian triển lãm 3D phiên bản mới mang đến trải nghiệm chân thực và sống động hơn bao giờ hết.',
    thumbnail: '/images/news1.jpg',
    date: '2025-01-21',
  },
  {
    id: 2,
    title: 'Cập nhật tính năng: xây gallery chỉ với 3 bước',
    description:
      'Người dùng giờ có thể tạo triển lãm của riêng mình nhanh hơn với công cụ smart builder.',
    thumbnail: '/images/news2.jpg',
    date: '2025-01-18',
  },
  {
    id: 3,
    title: 'Sự kiện nghệ thuật xuân 2025',
    description:
      'Hơn 50 nghệ sĩ tham gia trưng bày tác phẩm mới nhất tại sự kiện ArtSpring 2025.',
    thumbnail: '/images/news3.jpg',
    date: '2025-01-10',
  },
  {
    id: 4,
    title: 'Ra mắt tính năng xem VR',
    description:
      'Trải nghiệm không gian triển lãm qua kính VR, mang lại cảm giác chân thực như đang đứng tại phòng trưng bày.',
    thumbnail: '/images/news4.jpg',
    date: '2025-01-05',
  },
];
