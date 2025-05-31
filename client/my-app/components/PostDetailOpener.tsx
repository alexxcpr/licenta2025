import React, { useState } from 'react';
import PostDetailModal from '../app/ui/postari/PostDetailModal';

// Interfețe pentru tipurile de date
interface PostData {
  id_post: number;
  content: string;
  image_url: string;
  id_user: string;
  is_published: boolean;
  date_created: string;
  date_updated: string;
}

interface UserData {
  id: string;
  username: string;
  avatar_url?: string;
}

interface PostDetailOpenerProps {
  children: (openPostDetail: (post: PostData, user: UserData) => void) => React.ReactNode;
  currentUserId?: string;
}

const PostDetailOpener: React.FC<PostDetailOpenerProps> = ({ 
  children, 
  currentUserId 
}) => {
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<UserData | null>(null);

  // Funcție pentru a deschide detaliile unei postări
  const openPostDetail = (post: PostData, user: UserData) => {
    setSelectedPost(post);
    setSelectedPostUser(user);
    setPostDetailVisible(true);
  };

  // Funcție pentru a închide detaliile unei postări
  const closePostDetail = () => {
    setPostDetailVisible(false);
    setSelectedPost(null);
    setSelectedPostUser(null);
  };

  return (
    <>
      {children(openPostDetail)}
      
      {/* Modal pentru afișarea detaliilor postării */}
      {selectedPost && selectedPostUser && (
        <PostDetailModal
          visible={postDetailVisible}
          onClose={closePostDetail}
          post={selectedPost}
          postUser={selectedPostUser}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
};

export default PostDetailOpener; 