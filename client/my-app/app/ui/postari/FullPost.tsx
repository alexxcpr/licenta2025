import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import PostComments from './PostComments';
import { supabase } from '../../../utils/supabase';

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

interface CommentData {
  id_comment: number;
  content: string;
  date_created: string;
  id_post: number;
  id_user: string;
  user?: UserData;
}

interface FullPostProps {
  post: PostData;
  postUser: UserData;
  comments: CommentData[];
  currentUserId?: string;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number) => void;
  onSend: (postId: number) => void;
  onOptionsPress: (postId: number) => void;
  onPostPress: (post: PostData) => void;
  onUserPress: (userId: string) => void;
  // Nu mai folosim isLiked și isSaved ca sursă principală de adevăr aici
  // isLiked: initialIsLiked, 
  // isSaved: initialIsSaved 
}

const { width: screenWidth } = Dimensions.get('window');

const FullPost = ({
  post,
  postUser,
  comments,
  currentUserId,
  onLike,
  onSave,
  onComment,
  onSend,
  onOptionsPress,
  onPostPress,
  onUserPress,
  // Nu mai folosim isLiked și isSaved ca sursă principală de adevăr aici
  // isLiked: initialIsLiked, 
  // isSaved: initialIsSaved 
}: FullPostProps) => {
  
  const [internalIsLiked, setInternalIsLiked] = useState(false); // Inițializare cu false
  const [internalIsSaved, setInternalIsSaved] = useState(false); // Inițializare cu false

  // Eliminăm useEffect-urile care sincronizau cu props-urile isLiked/isSaved
  // useEffect(() => {
  //   setInternalIsLiked(isLiked);
  // }, [isLiked]);
  //
  // useEffect(() => {
  //   setInternalIsSaved(isSaved);
  // }, [isSaved]);

  useEffect(() => {
    const fetchLikeAndSaveStatus = async () => {
      if (!currentUserId || !post || !post.id_post) {
        setInternalIsLiked(false); // Resetăm în caz că datele nu sunt complete
        setInternalIsSaved(false);
        return;
      }

      try {
        // Verifică starea like
        const { data: likeData, error: likeError } = await supabase
          .from('like')
          .select('id_like') // Selectăm doar un câmp mic pentru a verifica existența
          .eq('id_post', post.id_post)
          .eq('id_user', currentUserId)
          .maybeSingle(); // Returnează un singur rând sau null

        if (likeError) {
          console.error('Eroare la verificarea like-ului:', likeError);
          setInternalIsLiked(false); // Presupunem că nu există like în caz de eroare
        } else {
          setInternalIsLiked(!!likeData); // !!likeData convertește null/obiect în boolean
        }

        // Verifică starea save
        const { data: saveData, error: saveError } = await supabase
          .from('saved_post')
          .select('id_saved_post') // Selectăm doar un câmp mic
          .eq('id_post', post.id_post)
          .eq('id_user', currentUserId)
          .maybeSingle();

        if (saveError) {
          console.error('Eroare la verificarea salvării:', saveError);
          setInternalIsSaved(false); // Presupunem că nu există save în caz de eroare
        } else {
          setInternalIsSaved(!!saveData);
        }
      } catch (error) {
        console.error('Eroare generală la fetchLikeAndSaveStatus:', error);
        setInternalIsLiked(false);
        setInternalIsSaved(false);
      }
    };

    fetchLikeAndSaveStatus();
  }, [post, currentUserId]); // Rulează când se schimbă postarea sau utilizatorul

  const handleLikeToggle = async () => {
    if (!currentUserId) {
      console.warn("currentUserId nu este disponibil. Acțiunea de like nu poate fi procesată.");
      return;
    }

    if (internalIsLiked) {
      // Unlike: Șterge din tabelul like
      const { error } = await supabase
        .from('like')
        .delete()
        .match({ id_post: post.id_post, id_user: currentUserId });
      
      if (error) {
        console.error('Eroare la eliminarea like-ului:', error);
      } else {
        setInternalIsLiked(false);
      }
    } else {
      // Like: Inserează în tabelul like
      const { error } = await supabase
        .from('like')
        .insert([{ id_post: post.id_post, id_user: currentUserId, date_created: new Date(), date_updated: new Date() }]);
      
      if (error) {
        console.error('Eroare la adăugarea like-ului:', error);
      } else {
        setInternalIsLiked(true);
      }
    }
    if (onLike) {
        onLike(post.id_post);
    }
  };

  const handleSaveToggle = async () => {
    if (!currentUserId) {
      console.warn("currentUserId nu este disponibil. Acțiunea de salvare nu poate fi procesată.");
      return;
    }

    if (internalIsSaved) {
      // Unsave: Șterge din tabelul saved_post
      const { error } = await supabase
        .from('saved_post')
        .delete()
        .match({ id_post: post.id_post, id_user: currentUserId });

      if (error) {
        console.error('Eroare la eliminarea salvării:', error);
      } else {
        setInternalIsSaved(false);
      }
    } else {
      // Save: Inserează în tabelul saved_post
      const { error } = await supabase
        .from('saved_post')
        .insert([{ id_post: post.id_post, id_user: currentUserId, saved_at: new Date() }]);
      
      if (error) {
        console.error('Eroare la salvarea postării:', error);
      } else {
        setInternalIsSaved(true);
      }
    }
    if (onSave) {
        onSave(post.id_post);
    }
  };

  // Aplicăm stiluri condiționat pentru web
  let webStyles: import('react-native').ViewStyle | undefined;
  if (Platform.OS === 'web') {
    webStyles = {
      maxWidth: screenWidth * 0.7, 
      width: '100%', 
      alignSelf: 'center', 
      borderWidth: 1,
      borderColor: '#dbdbdb',
      borderRadius: 8,
      marginTop: 8,
      marginBottom: 8,
    };
  }

  const postContainerStyles = [
    styles.postContainer,
    webStyles
  ];

  return (
    <View style={postContainerStyles as import('react-native').StyleProp<import('react-native').ViewStyle>}>
      <PostHeader 
        postUser={postUser}
        dateCreated={post.date_created}
        onOptionsPress={() => onOptionsPress(post.id_post)}
        onUserPress={() => onUserPress(post.id_user)}
        content={post.content}
      />
      
      <PostContent 
        imageUrl={post.image_url}
        onPress={() => onPostPress(post)}
      />
      
      <PostActions 
        postId={post.id_post}
        isLiked={internalIsLiked}
        isSaved={internalIsSaved}
        onLike={handleLikeToggle}
        onComment={() => onComment(post.id_post)}
        onSend={() => onSend(post.id_post)}
        onSave={handleSaveToggle}
      />
      
      <PostComments 
        comments={comments}
        postId={post.id_post}
        onViewAllComments={() => onPostPress(post)}
        onUserPress={onUserPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    // Restul stilurilor vor fi aplicate condițional în funcție de platformă
  },
});

export default FullPost; 