import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  StatusBar, 
  SafeAreaView, 
  Switch,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../src/services/firebaseConfig';
import { 
  updateProfile, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';

const { width } = Dimensions.get('window');
const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const ProfileView = ({ username, onBack, theme, isDarkMode, toggleDarkMode }: any) => {
  const [stats, setStats] = useState({ total_hours: 0, total_tasks: 0 });
  const [loading, setLoading] = useState(true);
  
  // MODAL STATE'LERİ
  const [isSettingsMenuVisible, setSettingsMenuVisible] = useState(false);
  const [isEditNameVisible, setEditNameVisible] = useState(false);
  const [isChangePasswordVisible, setChangePasswordVisible] = useState(false);
  
  const [newName, setNewName] = useState(username || '');
  
  // Şifre Değiştirme State'leri
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // YENİ: Şifre Tekrar State
  
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserStats();
  }, []);

  // Modallar açıldığında inputları temizle
  useEffect(() => {
    if (isEditNameVisible) setNewName(username || '');
    if (isChangePasswordVisible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword(''); // Temizle
    }
  }, [isEditNameVisible, isChangePasswordVisible, username]);

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

  // İsim Güncelleme
  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user || !newName.trim()) {
      Alert.alert("Hata", "Lütfen geçerli bir isim girin.");
      return;
    }

    setUpdating(true);
    try {
      await updateProfile(user, { displayName: newName });
      const response = await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, name: newName })
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
        setEditNameVisible(false);
        if (onBack) onBack(newName);
      } else {
        throw new Error("Sunucu hatası.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  // Şifre Güncelleme (Re-Auth + Doğrulama ile)
  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Hata", "Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    // YENİ: Şifre Eşleşme Kontrolü
    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler birbiriyle uyuşmuyor.");
      return;
    }

    setUpdating(true);
    try {
      // 1. Mevcut şifre ile doğrulama
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Yeni şifreyi güncelle
      await updatePassword(user, newPassword);
      
      Alert.alert("Başarılı", "Şifreniz başarıyla güncellendi.");
      setChangePasswordVisible(false);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert("Hata", "Mevcut şifrenizi yanlış girdiniz.");
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert("Hata", "Çok fazla deneme yaptınız. Lütfen biraz bekleyin.");
      } else {
        Alert.alert("Hata", "Şifre güncellenemedi: " + error.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={() => onBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <TouchableOpacity onPress={fetchUserStats} style={styles.iconBtn}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFiL KARTI */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLetter}>{newName?.charAt(0).toUpperCase() || 'B'}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{newName || 'Öğrenci'}</Text>
          <Text style={[styles.userTitle, { color: theme.textSecondary }]}>RC Sınavım Üyesi</Text>
        </View>

        {/* UYGULAMA AYARLARI */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
          <View style={[styles.actionButton, { backgroundColor: theme.surface }]}>
            <View style={styles.row}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={22} 
                color={isDarkMode ? "#FFD700" : "#FFA500"} 
              />
              <Text style={[styles.actionText, { color: theme.text }]}>Gece Modu</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : (isDarkMode ? "#f5dd4b" : "#f4f3f4")}
            />
          </View>
        </View>

        {/* İSTATİSTİKLER */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Çalışma Performansım</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Ionicons name="time" size={28} color={theme.primary} />
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
              ) : (
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_hours}s</Text>
              )}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Süre</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Ionicons name="checkmark-done-circle" size={28} color="#4CAF50" />
              {loading ? (
                <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
              ) : (
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_tasks}</Text>
              )}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Biten Görev</Text>
            </View>
          </View>
        </View>

        {/* BAŞARILAR */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Başarılarım</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>{stats.total_tasks >= 10 ? "🏆" : "🔥"}</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                {stats.total_tasks >= 10 ? "Usta" : "Yeni Başlayan"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>Tam Odak</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>🛡️</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>RC Gamer</Text>
            </View>
          </View>
        </View>

        {/* EN ALTTAKİ YATAY GENİŞ AYARLAR BUTONU */}
        <View style={[styles.section, { marginTop: 10, marginBottom: 20 }]}>
          <TouchableOpacity 
            style={[styles.bigSettingsBtn, { backgroundColor: theme.surface }]}
            onPress={() => setSettingsMenuVisible(true)}
          >
            <View style={styles.row}>
              <Ionicons name="settings-outline" size={22} color={theme.text} />
              <Text style={[styles.bigSettingsText, { color: theme.text }]}>Ayarlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* 1. AYARLAR MENÜSÜ MODALI */}
      <Modal
        visible={isSettingsMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsMenuVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Ayarlar</Text>
              <TouchableOpacity onPress={() => setSettingsMenuVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View>
              {/* Ad Soyad Değiştir */}
              <TouchableOpacity 
                style={[styles.menuOptionBtn, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setSettingsMenuVisible(false);
                  setEditNameVisible(true);
                }}
              >
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                    <Ionicons name="create-outline" size={20} color={theme.text} />
                  </View>
                  <Text style={[styles.menuOptionText, { color: theme.text }]}>Ad Soyad Değiştir</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* Şifre Değiştir */}
              <TouchableOpacity 
                style={[styles.menuOptionBtn, { borderBottomColor: theme.border, borderBottomWidth: 0 }]}
                onPress={() => {
                  setSettingsMenuVisible(false);
                  setChangePasswordVisible(true);
                }}
              >
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
                  </View>
                  <Text style={[styles.menuOptionText, { color: theme.text }]}>Şifreyi Değiştir</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* 2. AD SOYAD DEĞİŞTİRME MODALI */}
      <Modal
        visible={isEditNameVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditNameVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditNameVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setEditNameVisible(false); setSettingsMenuVisible(true); }}>
                 <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>İsim Güncelle</Text>
              <TouchableOpacity onPress={() => setEditNameVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni İsim</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.modalInput, { color: theme.text }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="İsminizi yazın"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                maxLength={18}
              />
            </View>
            <Text style={{ alignSelf: 'flex-end', color: theme.textSecondary, fontSize: 12, marginBottom: 20, marginTop: -15, marginRight: 5 }}>
              {newName.length}/18
            </Text>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* 3. ŞİFRE DEĞİŞTİRME MODALI (Güçlendirilmiş) */}
      <Modal
        visible={isChangePasswordVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setChangePasswordVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setChangePasswordVisible(false); setSettingsMenuVisible(true); }}>
                 <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Mevcut Şifre */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mevcut Şifre</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.modalInput, { color: theme.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Şu anki şifreniz"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            {/* Yeni Şifre */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni Şifre</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.modalInput, { color: theme.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yeni şifreniz (En az 6 karakter)"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            {/* YENİ: Şifre Tekrar */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni Şifre (Tekrar)</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.modalInput, { color: theme.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
              onPress={handleChangePassword}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Şifreyi Güncelle</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: Platform.OS === 'ios' ? 110 : 90, 
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingBottom: 15
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  scrollContent: { paddingBottom: 40 },
  profileCard: { 
    alignItems: 'center', 
    marginHorizontal: 25, 
    borderRadius: 25, 
    padding: 25, 
    marginTop: 20, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 8 
  },
  avatarCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 4, 
    borderColor: '#fff', 
    marginBottom: 15 
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  userTitle: { fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 18, 
    justifyContent: 'space-between',
    elevation: 2 
  },
  actionText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { 
    width: (width - 70) / 2, 
    padding: 20, 
    borderRadius: 22, 
    alignItems: 'center', 
    elevation: 3 
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  loader: { marginVertical: 10 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { 
    alignItems: 'center', 
    width: (width - 80) / 3, 
    padding: 15, 
    borderRadius: 20, 
    elevation: 2 
  },
  emoji: { fontSize: 30, marginBottom: 5 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  bigSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    justifyContent: 'space-between',
    elevation: 2
  },
  bigSettingsText: { marginLeft: 15, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 320 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputLabel: { fontSize: 13, marginBottom: 8, marginLeft: 5 },
  modalInputGroup: { borderRadius: 15, borderWidth: 1, marginBottom: 20 },
  modalInput: { padding: 15, fontSize: 16 },
  saveBtn: { padding: 16, borderRadius: 15, alignItems: 'center', elevation: 2 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  menuOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuOptionText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500'
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ProfileView;