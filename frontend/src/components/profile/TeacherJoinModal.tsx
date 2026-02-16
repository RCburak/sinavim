import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { auth } from '../../services/firebaseConfig';

interface TeacherJoinModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
  userEmail: string | null;
  onSuccess?: (institutionName: string) => void;
}

export const TeacherJoinModal = ({ visible, onClose, theme, userEmail, onSuccess }: TeacherJoinModalProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kurum kodu giriniz.");
      return;
    }

    if (!userEmail) {
      Alert.alert("Hata", "E-posta adresi bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setLoading(true);
    // AuthService üzerinden backend'e istek atıyoruz
    const result = await authService.joinClassroom(uid, userEmail, code.trim());
    setLoading(false);

    if (result.status === 'success') {
      Alert.alert("Başvurun Alındı!", "Kuruma katılma talebiniz iletildi. Öğretmeniniz onayladıktan sonra kuruma dahil olacaksınız.");
      setCode('');
      if (onSuccess) onSuccess(result.institution?.name);
      onClose();
    } else {
      Alert.alert("Hata", result.message || "Kod geçersiz veya bir hata oluştu.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Kuruma Bağlan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
              <Ionicons name="school" size={40} color={theme.primary} />
            </View>

            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Kurumunun sana verdiği davet kodunu girerek sınıfına katılabilirsin.
            </Text>

            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="key-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Kurum Kodu (Örn: RC-2024)"
                placeholderTextColor={theme.textSecondary}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: theme.primary }]}
              onPress={handleJoin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Kuruma Katıl</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  container: { borderRadius: 24, padding: 20, width: '100%', maxHeight: 500 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  description: { textAlign: 'center', fontSize: 14, marginBottom: 25, lineHeight: 20, paddingHorizontal: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, height: 55, width: '100%', marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  joinButton: { width: '100%', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});