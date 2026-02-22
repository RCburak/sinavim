import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, storage } from '../services/firebaseConfig';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage'; // EKLENDİ

import { API_URL, API_HEADERS } from '../config/api';

import { authService } from '../services/authService';

export const useProfile = (initialName: string) => {
  const [stats, setStats] = useState({ total_hours: 0, total_tasks: 0, institution: null as { id: string, name: string, status?: string } | null });
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState(initialName || '');

  // Modal Visibility States
  const [modals, setModals] = useState({
    settings: false,
    editName: false,
    changePass: false
  });

  // Password States
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [updating, setUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(auth.currentUser?.photoURL || null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const toggleModal = (modalName: 'settings' | 'editName' | 'changePass', value: boolean) => {
    setModals(prev => ({ ...prev, [modalName]: value }));
  };

  const fetchUserStats = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user-stats/${user.uid}`, {
        headers: API_HEADERS as HeadersInit,
      });
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error("İstatistik hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClass = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      "Kurumdan Ayrıl",
      "Sınıfından ayrılmak istediğine emin misin? Bu işlem geri alınamaz ve tekrar katılmak için koda ihtiyacın olacak.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Ayrıl",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await authService.leaveClassroom(user.uid);
            setLoading(false);

            if (result.status === 'success') {
              Alert.alert("Başarılı", result.message);
              fetchUserStats(); // Refresh to update UI
            } else {
              Alert.alert("Hata", result.message);
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf yüklemek için galeri izni vermelisiniz.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) handleUploadImage(result.assets[0].uri);
  };

  const handleUploadImage = async (uri: string) => {
    const user = auth.currentUser;
    if (!user) return;
    setImageLoading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: downloadUrl });
      setAvatarUrl(downloadUrl);
      Alert.alert("Harika!", "Profil fotoğrafın güncellendi.");
    } catch (error: any) {
      Alert.alert("Hata", "Resim yüklenirken sorun oluştu.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleUpdateProfile = async (onSuccess?: (name: string) => void) => {
    const user = auth.currentUser;
    if (!user || !newName.trim()) return;
    setUpdating(true);
    try {
      await updateProfile(user, { displayName: newName });
      await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ user_id: user.uid, name: newName })
      });
      Alert.alert("Başarılı", "Profil güncellendi.");
      toggleModal('editName', false);
      if (onSuccess) onSuccess(newName);
    } catch (e) {
      Alert.alert("Hata", "Güncelleme başarısız.");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    if (passwords.new !== passwords.confirm) {
      Alert.alert("Hata", "Şifreler uyuşmuyor.");
      return;
    }
    setUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);
      Alert.alert("Başarılı", "Şifreniz güncellendi.");
      setPasswords({ current: '', new: '', confirm: '' });
      toggleModal('changePass', false);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert("Hata", "Mevcut şifrenizi yanlış girdiniz.");
      } else {
        Alert.alert("Hata", error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  // YENİ: ÇIKIŞ YAP FONKSİYONU
  const handleLogout = async (onLogoutCallback?: () => void) => {
    Alert.alert(
      "Çıkış Yap",
      "Uygulamadan çıkmak istediğine emin misin?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
              await AsyncStorage.removeItem('@SınavımAI_UserLoggedIn');
              await AsyncStorage.removeItem('@SınavımAI_UserId');
              await AsyncStorage.removeItem('@SınavımAI_UserName');
              if (onLogoutCallback) onLogoutCallback();
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  return {
    stats, loading, fetchUserStats,
    modals, toggleModal,
    newName, setNewName,
    passwords, setPasswords,
    updating, handleUpdateProfile, handleChangePassword,
    avatarUrl, imageLoading, pickImage,
    handleLogout,
    handleLeaveClass // Hook dışa aktarımı
  };
};