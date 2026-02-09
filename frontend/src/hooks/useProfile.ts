import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, storage } from '../services/firebaseConfig';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from 'expo-image-picker';

const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const useProfile = (initialName: string) => {
  const [stats, setStats] = useState({ total_hours: 0, total_tasks: 0 });
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
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error("İstatistik hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf yüklemek için galeri izni vermelisiniz.');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Düzeltildi
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
        headers: { 'Content-Type': 'application/json' },
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

  return {
    stats, loading, fetchUserStats,
    modals, toggleModal,
    newName, setNewName,
    passwords, setPasswords,
    updating, handleUpdateProfile, handleChangePassword,
    avatarUrl, imageLoading, pickImage
  };
};