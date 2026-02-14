import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Modal, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { API_URL } from '../../src/config/api';

// Tip Tanımlamaları
interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

interface Analiz {
  id: number;
  ad: string; 
  net: string;
  tarih: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detay Modalı için State'ler
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnaliz, setStudentAnaliz] = useState<Analiz[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const TEACHER_INSTITUTION_ID = 1; // Test ID'si

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/teacher/students/${TEACHER_INSTITUTION_ID}`);
      const data = await response.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Öğrenci Detaylarını Getir (Analizler)
  const openStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    setModalVisible(true);
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/analizler/${student.id}`);
      const data = await response.json();
      setStudentAnaliz(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setStudentAnaliz([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderStudentRow = ({ item, index }: { item: Student, index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
      {/* HATA BURADAYDI: View'den styles.cell kaldırıldı */}
      <View style={{ flex: 0.5, justifyContent: 'center' }}>
        <View style={styles.avatarPlaceholder}>
           <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      
      {/* Text olduğu için burada styles.cell kalabilir */}
      <Text style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>{item.name}</Text>
      <Text style={[styles.cell, { flex: 3 }]}>{item.email}</Text>
      
      {/* HATA BURADAYDI: View'den styles.cell kaldırıldı */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openStudentDetail(item)}>
          <Text style={styles.actionBtnText}>İncele</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.brandContainer}>
          <Ionicons name="school" size={32} color="#fff" />
          <Text style={styles.logo}>RC PANEL</Text>
        </View>
        
        <TouchableOpacity style={styles.menuItemActive}>
          <Ionicons name="people" size={20} color="#fff" style={styles.menuIcon} />
          <Text style={styles.menuTextActive}>Öğrenciler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/teacher/assignments')}>
          <Ionicons name="create" size={20} color="#bdc3c7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ödev Atama</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/teacher/login')}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" style={styles.menuIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Ana İçerik */}
      <View style={styles.main}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Öğrenci Yönetimi</Text>
          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{students.length} Öğrenci</Text>
            </View>
            <View style={styles.profileIcon}>
              <Text style={{color:'#fff', fontWeight:'bold'}}>BH</Text>
            </View>
          </View>
        </View>

        {/* Tablo */}
        <View style={styles.content}>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>Ad Soyad</Text>
              <Text style={[styles.headerCell, { flex: 3 }]}>E-Posta</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>İşlem</Text>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.light.primary} style={{ margin: 50 }} />
            ) : (
              <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                renderItem={renderStudentRow}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </View>

      {/* ÖĞRENCİ DETAY MODALI */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedStudent?.name} - Detaylar
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
               <ActivityIndicator color={COLORS.light.primary} style={{ padding: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {/* Öğrenci Bilgisi */}
                <View style={styles.studentSummary}>
                  <Text style={styles.summaryLabel}>E-Posta:</Text>
                  <Text style={styles.summaryValue}>{selectedStudent?.email}</Text>
                </View>

                {/* Analiz Listesi */}
                <Text style={styles.sectionTitle}>Son Deneme Sonuçları</Text>
                {studentAnaliz.length > 0 ? (
                  <View style={styles.analizTable}>
                    {studentAnaliz.map((analiz, idx) => (
                      <View key={idx} style={styles.analizRow}>
                        <View style={styles.analizBadge}>
                           <Text style={styles.analizNet}>{analiz.net}</Text>
                        </View>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.analizName}>{analiz.ad || (analiz as any).lesson_name || "-"}</Text>
                          <Text style={styles.analizDate}>
                            {new Date(analiz.tarih || (analiz as any).date).toLocaleDateString('tr-TR')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#999', fontStyle: 'italic' }}>Henüz veri girişi yapılmamış.</Text>
                )}
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f6f8' },
  
  // Sidebar
  sidebar: { width: 250, backgroundColor: '#2c3e50', paddingVertical: 30, paddingHorizontal: 20 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, gap: 10 },
  logo: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 5, borderRadius: 8 },
  menuItemActive: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 5, borderRadius: 8, backgroundColor: COLORS.light.primary },
  menuIcon: { marginRight: 10 },
  menuText: { color: '#bdc3c7', fontSize: 14 },
  menuTextActive: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#e74c3c', marginLeft: 10, fontWeight: 'bold' },

  // Main
  main: { flex: 1 },
  header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  badge: { backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  badgeText: { color: '#1976d2', fontWeight: 'bold', fontSize: 12 },
  profileIcon: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: COLORS.light.primary, justifyContent: 'center', alignItems: 'center' },
  
  // Tablo
  content: { padding: 30 },
  tableCard: { backgroundColor: '#fff', borderRadius: 8, padding: 0, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8f9fa', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerCell: { fontWeight: 'bold', color: '#555', fontSize: 13 },
  tableRow: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  
  cell: { color: '#333', fontSize: 14 }, // Sadece Text bileşenleri için
  
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#555' },
  
  actionBtn: { backgroundColor: COLORS.light.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 500, backgroundColor: '#fff', borderRadius: 12, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  studentSummary: { flexDirection: 'row', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryLabel: { fontWeight: 'bold', marginRight: 10, color: '#555' },
  summaryValue: { color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  
  analizTable: { gap: 10 },
  analizRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  analizBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  analizNet: { fontWeight: 'bold', color: '#1976d2', fontSize: 14 },
  analizName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  analizDate: { fontSize: 12, color: '#777' },
  
  modalFooter: { marginTop: 20, alignItems: 'flex-end' },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#eee', borderRadius: 6 },
  closeBtnText: { color: '#333', fontWeight: 'bold' }
});