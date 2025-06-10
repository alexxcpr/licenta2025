import { Alert } from 'react-native';
import { supabase } from './supabase';

/**
 * Verifică starea de like și save pentru o postare
 * @param postId ID-ul postării
 * @param currentUserId ID-ul utilizatorului curent
 * @returns Obiect cu stările isLiked și isSaved
 */
export const checkPostStatus = async (postId: number, currentUserId: string) => {
  if (!currentUserId || !postId) {
    return { isLiked: false, isSaved: false };
  }

  try {
    // Verificăm starea like
    const { data: likeData, error: likeError } = await supabase
      .from('like')
      .select('id_like')
      .eq('id_post', postId)
      .eq('id_user', currentUserId)
      .maybeSingle();

    if (likeError) {
      console.error('Eroare la verificarea like-ului:', likeError);
    }

    // Verificăm starea save
    const { data: saveData, error: saveError } = await supabase
      .from('saved_post')
      .select('id_saved_post')
      .eq('id_post', postId)
      .eq('id_user', currentUserId)
      .maybeSingle();

    if (saveError) {
      console.error('Eroare la verificarea salvării:', saveError);
    }

    return {
      isLiked: !!likeData,
      isSaved: !!saveData
    };
  } catch (error) {
    console.error('Eroare generală la verificarea statusului postării:', error);
    return { isLiked: false, isSaved: false };
  }
};

/**
 * Funcție pentru gestionarea acțiunii de like
 * @param postId ID-ul postării
 * @param currentUserId ID-ul utilizatorului curent
 * @param isLiked Starea curentă de like
 * @returns Noua stare de like (true/false)
 */
export const toggleLike = async (postId: number, currentUserId: string, isLiked: boolean) => {
  if (!currentUserId) {
    console.warn("currentUserId nu este disponibil. Acțiunea de like nu poate fi procesată.");
    return isLiked;
  }

  try {
    if (isLiked) {
      // Unlike: Ștergem din tabelul like
      const { error } = await supabase
        .from('like')
        .delete()
        .eq('id_post', postId)
        .eq('id_user', currentUserId);
      
      if (error) {
        console.error('Eroare la eliminarea like-ului:', error);
        return isLiked; // Păstrăm starea veche în caz de eroare
      }
      return false; // Returnăm noua stare (unlike)
    } else {
      // Like: Inserăm în tabelul like
      // Verificăm mai întâi dacă există deja un like pentru a evita duplicările
      const { data: existingLike } = await supabase
        .from('like')
        .select('id_like')
        .eq('id_post', postId)
        .eq('id_user', currentUserId)
        .maybeSingle();
      
      if (existingLike) {
        console.warn('Like-ul există deja în baza de date');
        return true; // Este deja likeuit
      }
      
      const { error } = await supabase
        .from('like')
        .insert([{ 
          id_post: postId, 
          id_user: currentUserId, 
          date_created: new Date().toISOString(), 
          date_updated: new Date().toISOString() 
        }]);
      
      if (error) {
        console.error('Eroare la adăugarea like-ului:', error);
        return isLiked; // Păstrăm starea veche în caz de eroare
      }
      return true; // Returnăm noua stare (like)
    }
  } catch (error) {
    console.error('Eroare la procesarea acțiunii de like:', error);
    return isLiked; // Menținem starea curentă în caz de eroare
  }
};

/**
 * Funcție pentru gestionarea acțiunii de salvare
 * @param postId ID-ul postării
 * @param currentUserId ID-ul utilizatorului curent
 * @param isSaved Starea curentă de salvare
 * @returns Noua stare de salvare (true/false)
 */
export const toggleSave = async (postId: number, currentUserId: string, isSaved: boolean) => {
  if (!currentUserId) {
    console.warn("currentUserId nu este disponibil. Acțiunea de salvare nu poate fi procesată.");
    return isSaved;
  }

  try {
    if (isSaved) {
      // Unsave: Ștergem din tabelul saved_post
      const { error } = await supabase
        .from('saved_post')
        .delete()
        .eq('id_post', postId)
        .eq('id_user', currentUserId);

      if (error) {
        console.error('Eroare la eliminarea salvării:', error);
        return isSaved; // Menținem starea veche în caz de eroare
      }
      return false; // Returnăm noua stare (nesalvat)
    } else {
      // Save: Verificăm mai întâi dacă există deja o salvare pentru a evita duplicările
      const { data: existingSave } = await supabase
        .from('saved_post')
        .select('id_saved_post')
        .eq('id_post', postId)
        .eq('id_user', currentUserId)
        .maybeSingle();
        
      if (existingSave) {
        console.warn('Salvarea există deja în baza de date');
        return true; // Este deja salvat
      }
      
      // Inserăm în tabelul saved_post
      const { error } = await supabase
        .from('saved_post')
        .insert([{ 
          id_post: postId, 
          id_user: currentUserId, 
          saved_at: new Date().toISOString() 
        }]);
      
      if (error) {
        console.error('Eroare la salvarea postării:', error);
        return isSaved; // Menținem starea veche în caz de eroare
      }
      return true; // Returnăm noua stare (salvat)
    }
  } catch (error) {
    console.error('Eroare la procesarea acțiunii de salvare:', error);
    return isSaved; // Menținem starea curentă în caz de eroare
  }
};

/**
 * Funcție pentru gestionarea acțiunii de distribuire
 * @param postId ID-ul postării
 */
export const handleSend = (postId: number) => {
  Alert.alert('Distribuire', 'Funcționalitatea de distribuire va fi implementată în curând.');
};

/**
 * Adaugă un comentariu la o postare
 * @param postId ID-ul postării
 * @param userId ID-ul utilizatorului
 * @param content Conținutul comentariului
 * @returns Obiect cu succes și mesaj
 */
export const addComment = async (postId: number, userId: string, content: string) => {
  if (!content.trim() || !postId || !userId) {
    return { success: false, message: 'Date incomplete pentru adăugarea comentariului' };
  }

  try {
    const { data, error } = await supabase
      .from('comment')
      .insert([
        {
          content: content.trim(),
          id_post: postId,
          id_user: userId,
          date_created: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Eroare la adăugarea comentariului:', error);
      return { success: false, message: 'Nu s-a putut adăuga comentariul' };
    }

    return { success: true, message: 'Comentariu adăugat cu succes', data };
  } catch (error) {
    console.error('Eroare la adăugarea comentariului:', error);
    return { success: false, message: 'Eroare la procesarea comentariului' };
  }
}; 