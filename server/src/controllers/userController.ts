import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Configurația Supabase - pentru producție, folosește variabile de mediu
const supabaseUrl = process.env.SUPABASE_URL || 'ERROR';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'ERROR';
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfețe pentru tipurile de date
interface UserProfile {
  id_user: string;
  username: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  date_created: string;
  date_updated: string;
  id_domeniu?: number;
  id_functie?: number;
  id_ocupatie?: number;
}

interface Post {
  id_post: number;
  id_user: string;
  content: string;
  image_url?: string;
  date_created: string;
  date_updated: string;
  is_published: boolean;
}

interface ProfileData {
  user: UserProfile;
  posts: Post[];
  postCount: number;
  connectionCount: number;
}

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('Cerere pentru profilul utilizatorului:', id);
    
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul utilizatorului este necesar'
      });
    }

    // Obținem datele utilizatorului din Supabase
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id_user', id)
      .single();

    if (userError) {
      console.error('Eroare Supabase la obținerea utilizatorului:', userError);
      return res.status(404).json({
        status: 'error',
        message: 'Utilizatorul nu a fost găsit',
        error: userError.message
      });
    }

    if (!userData) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilizatorul nu a fost găsit'
      });
    }

    console.log('Utilizator găsit:', userData.username);

    // Obținem postările utilizatorului din Supabase
    const { data: postsData, error: postsError } = await supabase
      .from('post')
      .select('*')
      .eq('id_user', id)
      .eq('is_published', true)
      .order('date_created', { ascending: false });

    if (postsError) {
      console.error('Eroare Supabase la obținerea postărilor:', postsError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la încărcarea postărilor',
        error: postsError.message
      });
    }

    const posts = postsData || [];
    console.log(`Găsite ${posts.length} postări pentru utilizatorul ${userData.username}`);

    // Pentru connections, deocamdată returnăm 0 - poți implementa logica pentru connections aici
    const connectionCount = 0;

    const profileData: ProfileData = {
      user: userData,
      posts: posts,
      postCount: posts.length,
      connectionCount
    };

    res.json({
      status: 'success',
      data: profileData
    });

  } catch (error) {
    console.error('Eroare la obținerea profilului:', error);
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    });
  }
};

// Funcție pentru a lista toți utilizatorii - pentru testare
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('user')
      .select('id_user, username, email, profile_picture')
      .limit(10);

    if (error) {
      console.error('Eroare la obținerea utilizatorilor:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la încărcarea utilizatorilor',
        error: error.message
      });
    }

    res.json({
      status: 'success',
      data: users || []
    });

  } catch (error) {
    console.error('Eroare la obținerea utilizatorilor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    });
  }
};
