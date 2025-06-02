import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Configurația Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'ERROR';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'ERROR';
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfețe pentru tipurile de date
interface ChatRoom {
  id_chat_room: number;
  denumire: string;
  descriere?: string;
  date_created: string;
  date_updated: string;
}

interface ChatParticipant {
  id_user: string;
  username: string;
  profile_picture?: string;
}

interface Message {
  id_message: number;
  id_chat_room: number;
  id_sender: string;
  denumire: string;
  descriere?: string;
  date_created: string;
  date_updated: string;
  sender?: ChatParticipant;
}

interface ConversationData {
  chatRoom: ChatRoom;
  participants: ChatParticipant[];
  messages: Message[];
  messageCount: number;
}

interface ConversationSummary {
  id_chat_room: number;
  denumire: string;
  descriere?: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  date_updated: string;
}

// Obține detaliile unei conversații specifice
export const getConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('Cerere pentru conversația:', id);
    
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul conversației este necesar'
      });
    }

    const chatRoomId = parseInt(id);
    if (isNaN(chatRoomId)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul conversației trebuie să fie un număr'
      });
    }

    // Obținem datele chat room-ului
    const { data: chatRoomData, error: chatRoomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id_chat_room', chatRoomId)
      .single();

    if (chatRoomError) {
      console.error('Eroare la obținerea chat room-ului:', chatRoomError);
      return res.status(404).json({
        status: 'error',
        message: 'Conversația nu a fost găsită',
        error: chatRoomError.message
      });
    }

    if (!chatRoomData) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversația nu a fost găsită'
      });
    }

    console.log('Chat room găsit:', chatRoomData.denumire);

    // Obținem participanții
    const { data: participantsData, error: participantsError } = await supabase
      .from('chat_room_individual')
      .select(`
        id_user,
        user:id_user (
          id_user,
          username,
          profile_picture
        )
      `)
      .eq('id_chat_room', chatRoomId);

    if (participantsError) {
      console.error('Eroare la obținerea participanților:', participantsError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la încărcarea participanților',
        error: participantsError.message
      });
    }

    const participants: ChatParticipant[] = (participantsData || []).map((p: any) => ({
      id_user: p.user.id_user,
      username: p.user.username,
      profile_picture: p.user.profile_picture
    }));

    console.log(`Găsiți ${participants.length} participanți`);

    // Obținem mesajele cu detaliile expeditorului
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:id_sender (
          id_user,
          username,
          profile_picture
        )
      `)
      .eq('id_chat_room', chatRoomId)
      .order('date_created', { ascending: true });

    if (messagesError) {
      console.error('Eroare la obținerea mesajelor:', messagesError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la încărcarea mesajelor',
        error: messagesError.message
      });
    }

    const messages: Message[] = (messagesData || []).map((m: any) => ({
      id_message: m.id_message,
      id_chat_room: m.id_chat_room,
      id_sender: m.id_sender,
      denumire: m.denumire,
      descriere: m.descriere,
      date_created: m.date_created,
      date_updated: m.date_updated,
      sender: m.sender ? {
        id_user: m.sender.id_user,
        username: m.sender.username,
        profile_picture: m.sender.profile_picture
      } : undefined
    }));

    console.log(`Găsite ${messages.length} mesaje`);

    const conversationData: ConversationData = {
      chatRoom: chatRoomData,
      participants,
      messages,
      messageCount: messages.length
    };

    res.json({
      status: 'success',
      data: conversationData
    });

  } catch (error) {
    console.error('Eroare la obținerea conversației:', error);
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    });
  }
};

// Obține lista tuturor conversațiilor pentru un utilizator
export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    console.log('Cerere pentru conversațiile utilizatorului:', userId);
    
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul utilizatorului este necesar'
      });
    }

    // Obținem toate chat room-urile în care participă utilizatorul
    const { data: userChatRoomIds, error: chatRoomIdsError } = await supabase
      .from('chat_room_individual')
      .select('id_chat_room')
      .eq('id_user', userId);

    if (chatRoomIdsError) {
      console.error('Eroare la obținerea ID-urilor chat room-urilor:', chatRoomIdsError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la încărcarea conversațiilor',
        error: chatRoomIdsError.message
      });
    }

    if (!userChatRoomIds || userChatRoomIds.length === 0) {
      console.log(`Utilizatorul ${userId} nu are conversații`);
      return res.json({
        status: 'success',
        data: []
      });
    }

    const chatRoomIds = userChatRoomIds.map(item => item.id_chat_room);
    console.log('Chat room IDs găsite:', chatRoomIds);

    // Obținem detaliile chat room-urilor
    const { data: chatRoomsData, error: chatRoomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id_chat_room', chatRoomIds);

    if (chatRoomsError) {
      console.error('Eroare la obținerea detaliilor chat room-urilor:', chatRoomsError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la încărcarea conversațiilor',
        error: chatRoomsError.message
      });
    }

    const conversations: ConversationSummary[] = [];

    for (const chatRoom of chatRoomsData || []) {
      // Obținem participanții pentru fiecare chat room
      const { data: participantsData } = await supabase
        .from('chat_room_individual')
        .select('id_user')
        .eq('id_chat_room', chatRoom.id_chat_room);

      const participantIds = (participantsData || []).map(p => p.id_user);
      
      // Obținem detaliile utilizatorilor participanți
      const { data: usersData } = await supabase
        .from('user')
        .select('id_user, username, profile_picture')
        .in('id_user', participantIds);

      const participants: ChatParticipant[] = (usersData || []).map((user: any) => ({
        id_user: user.id_user,
        username: user.username,
        profile_picture: user.profile_picture
      }));

      // Obținem ultimul mesaj
      const { data: lastMessageData } = await supabase
        .from('messages')
        .select('*')
        .eq('id_chat_room', chatRoom.id_chat_room)
        .order('date_created', { ascending: false })
        .limit(1);

      let lastMessage: Message | undefined = undefined;
      if (lastMessageData && lastMessageData.length > 0) {
        const msgData = lastMessageData[0];
        
        // Obținem detaliile expeditorului pentru ultimul mesaj
        const { data: senderData } = await supabase
          .from('user')
          .select('id_user, username, profile_picture')
          .eq('id_user', msgData.id_sender)
          .single();

        lastMessage = {
          id_message: msgData.id_message,
          id_chat_room: msgData.id_chat_room,
          id_sender: msgData.id_sender,
          denumire: msgData.denumire,
          descriere: msgData.descriere,
          date_created: msgData.date_created,
          date_updated: msgData.date_updated,
          sender: senderData ? {
            id_user: senderData.id_user,
            username: senderData.username,
            profile_picture: senderData.profile_picture
          } : undefined
        };
      }

      conversations.push({
        id_chat_room: chatRoom.id_chat_room,
        denumire: chatRoom.denumire,
        descriere: chatRoom.descriere,
        participants,
        lastMessage,
        unreadCount: 0, // TODO: Implementează logica pentru mesaje necitite
        date_updated: chatRoom.date_updated
      });
    }

    // Sortăm conversațiile după ultima actualizare
    conversations.sort((a, b) => new Date(b.date_updated).getTime() - new Date(a.date_updated).getTime());

    console.log(`Găsite ${conversations.length} conversații pentru utilizatorul ${userId}`);

    res.json({
      status: 'success',
      data: conversations
    });

  } catch (error) {
    console.error('Eroare la obținerea conversațiilor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    });
  }
};

// Șterge o conversație specifică
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('Cerere pentru ștergerea conversației:', id);
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);
    
    // Verificăm și obținem userId din body sau query
    let userId = null;
    
    if (req.body && typeof req.body === 'object' && 'userId' in req.body) {
      userId = req.body.userId;
      console.log('userId găsit în body:', userId);
    } else if (req.query && typeof req.query === 'object' && 'userId' in req.query) {
      userId = req.query.userId;
      console.log('userId găsit în query:', userId);
    }
    
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul conversației este necesar'
      });
    }

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul utilizatorului este necesar (în body sau ca query parameter)'
      });
    }

    const chatRoomId = parseInt(id);
    if (isNaN(chatRoomId)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul conversației trebuie să fie un număr'
      });
    }

    // Verificăm dacă chat room-ul există
    const { data: chatRoomData, error: chatRoomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id_chat_room', chatRoomId)
      .single();

    if (chatRoomError || !chatRoomData) {
      console.error('Eroare la verificarea existenței chat room-ului:', chatRoomError);
      return res.status(404).json({
        status: 'error',
        message: 'Conversația nu a fost găsită',
        error: chatRoomError?.message
      });
    }

    // Verificăm dacă utilizatorul este membru al conversației
    const { data: membershipData, error: membershipError } = await supabase
      .from('chat_room_individual')
      .select('id_user')
      .eq('id_chat_room', chatRoomId)
      .eq('id_user', userId);

    if (membershipError) {
      console.error('Eroare la verificarea membri:', membershipError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la verificarea accesului',
        error: membershipError.message
      });
    }

    if (!membershipData || membershipData.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Nu aveți permisiunea să ștergeți această conversație'
      });
    }

    // 1. Ștergem întâi toate înregistrările din chat_room_individual
    const { error: membersError } = await supabase
      .from('chat_room_individual')
      .delete()
      .eq('id_chat_room', chatRoomId);
    
    if (membersError) {
      console.error('Eroare la ștergerea membrilor:', membersError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la ștergerea conversației',
        error: membersError.message
      });
    }
    
    // 2. Ștergem toate mesajele
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('id_chat_room', chatRoomId);
    
    if (messagesError) {
      console.error('Eroare la ștergerea mesajelor:', messagesError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la ștergerea conversației',
        error: messagesError.message
      });
    }
    
    // 3. Ștergem camera de chat
    const { error: roomError } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id_chat_room', chatRoomId);
    
    if (roomError) {
      console.error('Eroare la ștergerea camerei de chat:', roomError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la ștergerea conversației',
        error: roomError.message
      });
    }

    console.log(`Conversația ${chatRoomId} a fost ștearsă cu succes`);

    res.json({
      status: 'success',
      message: 'Conversația a fost ștearsă cu succes'
    });

  } catch (error) {
    console.error('Eroare la ștergerea conversației:', error);
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    });
  }
};

// Trimite un mesaj nou într-o conversație
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { id_sender, denumire, descriere } = req.body;
    
    console.log('Cerere pentru trimiterea mesajului în conversația:', id);
    
    if (!id || !id_sender || !denumire) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul conversației, ID-ul expeditorului și conținutul mesajului sunt necesare'
      });
    }

    const chatRoomId = parseInt(id);
    if (isNaN(chatRoomId)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID-ul conversației trebuie să fie un număr'
      });
    }

    // Verificăm dacă utilizatorul este membru al conversației
    const { data: membershipData, error: membershipError } = await supabase
      .from('chat_room_individual')
      .select('id_user')
      .eq('id_chat_room', chatRoomId)
      .eq('id_user', id_sender);

    if (membershipError) {
      console.error('Eroare la verificarea membri:', membershipError);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la verificarea accesului',
        error: membershipError.message
      });
    }

    if (!membershipData || membershipData.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Nu aveți permisiunea să trimiteți mesaje în această conversație'
      });
    }

    // Adăugăm mesajul în baza de date
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          id_chat_room: chatRoomId,
          id_sender: id_sender,
          denumire: denumire,
          descriere: descriere || null
        },
      ])
      .select();

    if (error) {
      console.error('Eroare la trimiterea mesajului:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Eroare la trimiterea mesajului',
        error: error.message
      });
    }

    console.log(`Mesaj trimis cu succes în conversația ${chatRoomId}`);

    res.json({
      status: 'success',
      message: 'Mesajul a fost trimis cu succes',
      data: data ? data[0] : null
    });

  } catch (error) {
    console.error('Eroare la trimiterea mesajului:', error);
    res.status(500).json({
      status: 'error',
      message: 'Eroare internă a serverului',
      error: error instanceof Error ? error.message : 'Eroare necunoscută'
    });
  }
}; 