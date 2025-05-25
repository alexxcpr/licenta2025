export interface UserProfile {
  id_user: string;
  username: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  date_created: string;
  date_updated: string;
}

export interface Post {
  id_post: number;
  date_created: string;
  date_updated: string;
  content: string;
  is_published: boolean;
  image_url: string | null;
  id_user: string;
} 