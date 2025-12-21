import { NewsItemTypeEnum } from './constants';

export interface UserData {
  id: string;
  email: string;
  avatar: string;
  name?: string;
  phone?: string;
  role: string;
  position?: string;
  created_at: string;
}

export interface RoomData {
  id: string;
  title?: string;
  description?: string;

  owner_id: string;
  author: string;
  slug: string;
  price?: number;
  room_json: Record<string, any>;
  visibility: string;
  status: string;

  type?: string;

  tags?: string[];
  tag?: string;
  thumbnail?: string;

  created_at: string;
  updated_at: string;
}
export interface RoomUploadData {
  title?: string;
  description?: string;

  slug: string;

  room_json: Record<string, any>;
  visibility: string;
  status: string;
  price?: number;

  type?: string;

  tags?: string[];
  tag?: string;
  thumbnail?: string;
}

export interface Object3DData {
  id: string;

  owner_id?: string;
  file_url: string;
  metadata: Record<string, any>;

  created_at: string;

  room_id: string[];
}
export interface NewsData {
  id: string;
  owner_id: string;

  title: string;
  slug: string;
  description?: string;
  thumbnail: string;
  layout_json: Array<{
    type: NewsItemTypeEnum;
    content: string;
  }>;

  visibility: string;

  created_at: string;
  updated_at: string;
}
export interface NewsUploadData {
  title: string;
  slug: string;
  description?: string;
  thumbnail: File;

  layout_json: Array<{
    type: NewsItemTypeEnum;
    content: File | string;
  }>;
}

export interface ImageData {
  id: string;
  title: string;
  description?: string;

  room_id: string[];
  owner_id: string;
  file_url: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface MediaData {
  id: string;
  title: string;
  description?: string;
  room_id: string[];
  owner_id: string;
  file_url: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MediaUploadData {
  title: string;
  file: File;
  description?: string;
  room_id: string[];
  metadata: Record<string, any>;
}

export interface TextureData {
  id: string;
  owner_id: string;
  title: string;
  alb_url?: string;
  nor_url?: string;
  orm_url?: string;
  texture_for: string;
  created_at: string;
}

export interface TextureUploadData {
  title: string;
  alb?: File;
  nor?: File;
  orm?: File;
  texture_for: string;
}
export interface LicenseData {
  id: string;
  title: string;

  price: number;
  media_limit: number;
  space_limit: number;
}

export interface LicenseUploadData {
  title: string;

  price: number;
  media_limit: number;
  space_limit: number;
}

export type PaginationMeta = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  current_page_count: number;
  has_next: boolean;
  has_prev: boolean;
};

export type PaginatedResponse<T> = {
  results: T[];
  pagination: PaginationMeta;
};
