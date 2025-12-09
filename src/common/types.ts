import { NewsItemTypeEnum } from "./constants";

export interface UserData {
  id: string;
  email: string;
  password_hash?: string;
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

  type?: string;

  tags?: string[];
  tag?: string;
  thumbnail?: string;
}

export interface Object3DData {
  id: string;

  owner_id?: string;
  file_url: string;

  poly_count?: number;
  bounds?: Record<string, any>;

  source_type: string;

  created_at: string;

  room_id: string;
}
export interface NewsData {
  id: string;
  owner_id: string;

  thumbnail: string;
  title?: string;
  slug: string;
  description?: string;

  layout_json: {
    blocks: Array<{
      type: NewsItemTypeEnum;
      content: string;
    }>;
  };

  visibility: string;

  created_at: string;
  updated_at: string;
}
export interface NewsUploadData {
  id: string;

  thumbnail: File;
  title?: string;
  slug: string;
  description?: string;

  layout_json: Array<{
    type: NewsItemTypeEnum;
    content: string | File;
  }>;

  visibility: string;

  created_at: string;
  updated_at: string;
}

export interface ImageData {
  id: string;
  title?: string;
  description?: string;

  room_id?: string;
  owner_id?: string;
  file_url: string;

  width?: number;
  height?: number;

  created_at: string;
}

export interface MediaUploadData {
  title: string;
  file: File;
  description?: string;
  room_id?: string;
}

export interface TextureData {
  id: string;
  owner_id: string;
  title: string;
  alb_url?: string;
  nor_url?: string;
  orm_url?: string;
  texture_for: string;
}

export interface TextureUploadData {
  title: string;
  alb?: File;
  nor?: File;
  orm?: File;
  texture_for: string;
}
