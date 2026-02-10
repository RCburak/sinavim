import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

interface Student {
  id: string;
  name: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  student_name: string;
  due_date: string;
}

export default function Assignments() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Form State
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  
  const TEACHER_INSTITUTION_ID = 1; // Sabit ID (Test için)

  useEffect(() => {
    fetchStudents();
    fetchTasks();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/teacher/students/${TEACHER_INSTITUTION_ID}`);
      const data = await response.json();
      setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/teacher/tasks/${TEACHER_INSTITUTION_ID}`);
      const data = await response.json();
      setTasks(data);
    } catch (e) { console.error(e); }
  };

  const handleAssign = async () => {
    if (!selectedStudent || !title) {
      Alert.alert("Uyarı", "Lütfen öğrenci ve başlık seçin.");
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/teacher/assign-task`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          institution_id: TEACHER_INSTITUTION_ID,
          student_id: selectedStudent,
          title,
          description,
          due_date: date || new Date().toISOString()
        })
      });
      
      const res = await response.json();
      if (res.status === 'success') {
        Alert.alert("Başarılı", "Ödev gönderildi!");
        setTitle(''); setDescription(''); setDate('');
        fetchTasks(); // Listeyi yenile
      } else {
        Alert.alert("Hata", res.message);
      }
    } catch (e) {
      Alert.alert("Hata", "Bağlantı hatası");
    }
  };

  return (
    <View style={styles.container}>
      {/* Basit Sidebar (Navigasyon için) */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>RC PANEL</Text>
        <TouchableOpacity onPress={() => router.replace('/teacher/dashboard')} style={styles.menuItem}>
          <Text style={styles.menuText}>Öğrenciler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.activeMenu]}>
          <Text style={styles.activeMenuText}>Ödev Atama</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main}>
        <Text style={styles.headerTitle}>Yeni Ödev Ata</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Öğrenci Seçin:</Text>
          <View style={styles.studentList}>
            {students.map(s => (
              <TouchableOpacity 
                key={s.id} 
                style={[styles.chip, selectedStudent === s.id && styles.chipActive]}
                onPress={() => setSelectedStudent(s.id)}
              >
                <Text style={[styles.chipText, selectedStudent === s.id && {color:'#fff'}]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Ödev Başlığı:</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Örn: Limit Türev Fasikülü" />

          <Text style={styles.label}>Açıklama / Not:</Text>
          <TextInput style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} placeholder="Sayfa 10-20 arasını çöz" multiline />

          <TouchableOpacity style={styles.btn} onPress={handleAssign}>
            <Text style={styles.btnText}>Ödevi Gönder 🚀</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerTitle, {marginTop: 40}]}>Son Verilen Ödevler</Text>
        <View style={styles.table}>
          {tasks.map((t, index) => (
            <View key={index} style={styles.row}>
              <View style={{flex:1}}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskSub}>{t.student_name} • {new Date(t.due_date).toLocaleDateString()}</Text>
              </View>
              <Ionicons name="checkmark-circle-outline" size={24} color="#ccc" />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f5f6fa' },
  sidebar: { width: 220, backgroundColor: '#2c3e50', padding: 20 },
  logo: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 30, textAlign:'center' },
  menuItem: { padding: 15, borderRadius: 8, marginBottom: 5 },
  menuText: { color: '#bdc3c7' },
  activeMenu: { backgroundColor: COLORS.light.primary },
  activeMenuText: { color: '#fff', fontWeight: 'bold' },
  
  main: { flex: 1, padding: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 12, shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 15, backgroundColor: '#fafafa' },
  studentList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  chip: { padding: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#eee', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: COLORS.light.primary },
  chipText: { fontSize: 13 },
  btn: { backgroundColor: COLORS.light.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },

  table: { marginTop: 10 },
  row: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  taskTitle: { fontWeight: 'bold', fontSize: 16 },
  taskSub: { color: '#888', fontSize: 13 }
});