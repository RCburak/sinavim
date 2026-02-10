import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { authService } from '../../src/services/authService';

// Tip tanımlamaları
interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NOT: Gerçek uygulamada giriş yapan öğretmenin ID'si bir state veya context'ten gelmeli.
  // Şimdilik test için "1" (Burak Hoca Akademi) ID'sini kullanıyoruz.
  const TEACHER_INSTITUTION_ID = 1; 

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/teacher/students/${TEACHER_INSTITUTION_ID}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        Alert.alert("Hata", "Öğrenci listesi alınamadı.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity style={styles.detailBtn}>
        <Text style={styles.detailBtnText}>İncele</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.light.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sidebar (Sol Menü) */}
      <View style={styles.sidebar}>
        <View style={styles.brandContainer}>
          <Ionicons name="school" size={40} color="#fff" />
          <Text style={styles.logo}>RC PANEL</Text>
        </View>
        
        <TouchableOpacity style={styles.menuItemActive}>
          <Ionicons name="people" size={20} color="#fff" style={styles.menuIcon} />
          <Text style={styles.menuTextActive}>Öğrenciler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}
        onPress={() => router.push('/teacher/assignments')}>
          <Ionicons name="create" size={20} color="#bdc3c7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ödev Atama</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings" size={20} color="#bdc3c7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ayarlar</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/teacher/login')}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" style={styles.menuIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content (Ana İçerik) */}
      <View style={styles.main}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Öğrenci Listesi</Text>
            <Text style={styles.headerSubtitle}>Sınıfındaki tüm öğrencileri yönet</Text>
          </View>
          <View style={styles.teacherBadge}>
            <Text style={styles.welcomeText}>Burak Hoca</Text>
            <View style={styles.teacherAvatar}>
              <Text style={{color:'#fff', fontWeight:'bold'}}>BH</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStudentItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="person-add-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyText}>Henüz hiç öğrencin yok.</Text>
                  <Text style={styles.emptySubText}>Öğrencilerine kurum kodunu vererek davet et.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', height: '100%', backgroundColor: '#f5f6fa' },
  
  // Sidebar Stilleri
  sidebar: { 
    width: 260, 
    backgroundColor: '#2c3e50', 
    padding: 20, 
    justifyContent: 'flex-start',
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    display: Platform.OS === 'web' ? 'flex' : 'none' // Mobilde gizle (responsive tasarım için)
  },
  brandContainer: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logo: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 5, borderRadius: 8 },
  menuItemActive: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 5, borderRadius: 8, backgroundColor: COLORS.light.primary },
  menuIcon: { marginRight: 12 },
  menuText: { color: '#bdc3c7', fontSize: 15, fontWeight: '500' },
  menuTextActive: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#34495e', marginTop: 10 },
  logoutText: { color: '#e74c3c', fontSize: 15, fontWeight: 'bold' },
  
  // Main Content Stilleri
  main: { flex: 1, flexDirection: 'column' },
  header: { 
    paddingHorizontal: 30, 
    paddingVertical: 20, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  headerSubtitle: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  teacherBadge: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { color: '#2c3e50', fontWeight: '600', marginRight: 10 },
  teacherAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.light.primary, justifyContent: 'center', alignItems: 'center' },
  
  content: { flex: 1, padding: 30 },
  
  // Öğrenci Kartı Stilleri
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#757575' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  studentEmail: { fontSize: 13, color: '#888' },
  detailBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f0f0', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20 
  },
  detailBtnText: { color: COLORS.light.primary, fontWeight: '600', fontSize: 12, marginRight: 5 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15 },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 5 }
});