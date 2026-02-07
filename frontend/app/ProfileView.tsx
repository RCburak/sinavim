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
import { updateProfile } from 'firebase/auth';

const { width } = Dimensions.get('window');
const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const ProfileView = ({ username, onBack, theme, isDarkMode, toggleDarkMode }: any) => {
  const [stats, setStats] = useState({ total_hours: 0, total_tasks: 0 });
  const [loading, setLoading] = useState(true);
  
  // Hesap Ayarları ve Modal State'leri
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [newName, setNewName] = useState(username);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserStats();
  }, []);

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

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (!user || !newName.trim()) {
      Alert.alert("Hata", "Lütfen geçerli bir isim girin.");
      return;
    }

    setUpdating(true);
    try {
      // 1. Firebase Auth Güncelleme
      await updateProfile(user, { displayName: newName });

      // 2. Kendi Backend (SQLite) Güncelleme
      const response = await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, name: newName })
      });

      if (response.ok) {
        Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
        setSettingsVisible(false);
        // ÖNEMLİ: Dashboard'a yeni ismi göndererek geri dönüyoruz
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
            onPress={() => setSettingsVisible(true)}
          >
            <View style={styles.row}>
              <Ionicons name="settings-outline" size={22} color={theme.text} />
              <Text style={[styles.bigSettingsText, { color: theme.text }]}>Ayarlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* AD SOYAD DEĞİŞTİRME MODALI */}
      <Modal
        visible={isSettingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Hesap Ayarları</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Ad Soyad Değiştir</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.modalInput, { color: theme.text }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Yeni isminizi yazın"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Güncelle</Text>}
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
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ProfileView;