import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl, RefreshControlProps } from 'react-native';
import { supabase } from '../../../utils/supabase';
import ContactDetails from './activity/ContactDetails';
import UserEducation from './activity/UserEducation';
import UserPastActivity from './activity/UserPastActivity';
import UserOtherActivities from './activity/UserOtherActivities';
import { UserProfile } from '../../../utils/types';

interface ProfileProfessionalActivityProps {
  userId: string;
  profile: UserProfile | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  ListHeaderComponent?: React.FC<any> | React.ReactElement;
  isOwnProfile: boolean;
}

const ProfileProfessionalActivity: React.FC<ProfileProfessionalActivityProps> = ({
  userId,
  profile,
  refreshControl,
  ListHeaderComponent,
  isOwnProfile
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    domeniu?: string;
    functie?: string;
    ocupatie?: string;
    educationActivities: any[];
    jobActivities: any[];
    otherActivities: any[];
  }>({
    educationActivities: [],
    jobActivities: [],
    otherActivities: []
  });

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Încărcăm domeniul, funcția și ocupația
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id_domeniu, id_functie, id_ocupatie')
        .eq('id_user', userId)
        .single();

      if (userError) {
        console.error('Eroare la încărcarea datelor utilizatorului:', userError);
      }

      let domeniu, functie, ocupatie;

      // Încărcăm numele domeniului
      if (userData?.id_domeniu) {
        const { data: domeniuData } = await supabase
          .from('domenii')
          .select('denumire')
          .eq('id_domeniu', userData.id_domeniu)
          .single();
        
        domeniu = domeniuData?.denumire;
      }

      // Încărcăm numele funcției
      if (userData?.id_functie) {
        const { data: functieData } = await supabase
          .from('functii')
          .select('denumire')
          .eq('id_functie', userData.id_functie)
          .single();
        
        functie = functieData?.denumire;
      }

      // Încărcăm numele ocupației
      if (userData?.id_ocupatie) {
        const { data: ocupatieData } = await supabase
          .from('ocupatii')
          .select('denumire')
          .eq('id_ocupatie', userData.id_ocupatie)
          .single();
        
        ocupatie = ocupatieData?.denumire;
      }

      // Încărcăm activitățile educaționale
      const { data: educationData, error: educationError } = await supabase
        .from('education_activity')
        .select('*')
        .eq('id_user', userId)
        .order('date_created', { ascending: false });

      if (educationError) {
        console.error('Eroare la încărcarea activităților educaționale:', educationError);
      }

      // Încărcăm activitățile profesionale
      const { data: jobData, error: jobError } = await supabase
        .from('job_activity')
        .select('*')
        .eq('id_user', userId)
        .order('date_created', { ascending: false });

      if (jobError) {
        console.error('Eroare la încărcarea activităților profesionale:', jobError);
      }

      // Încărcăm alte activități
      const { data: otherData, error: otherError } = await supabase
        .from('other_activity')
        .select('*')
        .eq('id_user', userId)
        .order('date_created', { ascending: false });

      if (otherError) {
        console.error('Eroare la încărcarea altor activități:', otherError);
      }

      setData({
        domeniu,
        functie,
        ocupatie,
        educationActivities: educationData || [],
        jobActivities: jobData || [],
        otherActivities: otherData || [],
      });
    } catch (error) {
      console.error('Eroare la încărcarea datelor profesionale:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă datele profesionale...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {ListHeaderComponent && (
        typeof ListHeaderComponent === 'function' 
          ? <ListHeaderComponent /> 
          : ListHeaderComponent
      )}

      <ContactDetails 
        username={profile?.username}
        domeniu={data.domeniu}
        functie={data.functie}
        ocupatie={data.ocupatie}
        email={profile?.email}
      />
      
      <UserEducation 
        educationActivities={data.educationActivities} 
        userId={userId}
        isOwnProfile={isOwnProfile}
        onRefresh={loadProfileData}
      />
      
      <UserPastActivity 
        jobActivities={data.jobActivities} 
        userId={userId}
        isOwnProfile={isOwnProfile}
        onRefresh={loadProfileData}
      />
      
      <UserOtherActivities 
        otherActivities={data.otherActivities} 
        userId={userId}
        isOwnProfile={isOwnProfile}
        onRefresh={loadProfileData}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileProfessionalActivity; 