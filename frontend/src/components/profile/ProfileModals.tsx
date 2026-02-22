import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ProfileModals = ({ theme, hook }: any) => {
  const { modals, toggleModal, newName, setNewName, updating, handleUpdateProfile, passwords, setPasswords, handleChangePassword } = hook;

  return (
    <>
      {/* 1. AYARLAR MENÜSÜ */}
      <Modal visible={modals.settings} animationType="slide" transparent={true} onRequestClose={() => toggleModal('settings', false)}>
        <Pressable style={styles.modalOverlay} onPress={() => toggleModal('settings', false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Ayarlar</Text>
              <TouchableOpacity onPress={() => toggleModal('settings', false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View>
              <TouchableOpacity style={[styles.menuOptionBtn, { borderBottomColor: theme.border }]} onPress={() => { toggleModal('settings', false); setTimeout(() => toggleModal('editName', true), 300); }}>
                 <View style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                      <Ionicons name="create-outline" size={20} color={theme.text} />
                    </View>
                   <Text style={[styles.menuOptionText, { color: theme.text }]}>Ad Soyad Değiştir</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuOptionBtn, { borderBottomColor: theme.border, borderBottomWidth: 0 }]} onPress={() => { toggleModal('settings', false); setTimeout(() => toggleModal('changePass', true), 300); }}>
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

      {/* 2. İSİM GÜNCELLEME */}
      <Modal visible={modals.editName} animationType="slide" transparent={true} onRequestClose={() => toggleModal('editName', false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.expandedModal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { toggleModal('editName', false); toggleModal('settings', true); }}>
                 <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>İsim Güncelle</Text>
              <TouchableOpacity onPress={() => toggleModal('editName', false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni İsim</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput style={[styles.modalInput, { color: theme.text }]} value={newName} onChangeText={setNewName} placeholder="İsim" placeholderTextColor={theme.textSecondary} maxLength={18} />
            </View>
             <Text style={{ alignSelf: 'flex-end', color: theme.textSecondary, fontSize: 12, marginBottom: 20, marginTop: -15, marginRight: 5 }}>
              {newName.length}/18
            </Text>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={() => handleUpdateProfile()} disabled={updating}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. ŞİFRE DEĞİŞTİRME */}
      <Modal visible={modals.changePass} animationType="slide" transparent={true} onRequestClose={() => toggleModal('changePass', false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.expandedModal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { toggleModal('changePass', false); toggleModal('settings', true); }}>
                 <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => toggleModal('changePass', false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mevcut Şifre</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput style={[styles.modalInput, { color: theme.text }]} value={passwords.current} onChangeText={(t) => setPasswords({...passwords, current: t})} placeholder="Mevcut Şifre" placeholderTextColor={theme.textSecondary} secureTextEntry />
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni Şifre</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput style={[styles.modalInput, { color: theme.text }]} value={passwords.new} onChangeText={(t) => setPasswords({...passwords, new: t})} placeholder="Yeni Şifre" placeholderTextColor={theme.textSecondary} secureTextEntry />
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Yeni Şifre (Tekrar)</Text>
            <View style={[styles.modalInputGroup, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput style={[styles.modalInput, { color: theme.text }]} value={passwords.confirm} onChangeText={(t) => setPasswords({...passwords, confirm: t})} placeholder="Tekrar" placeholderTextColor={theme.textSecondary} secureTextEntry />
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleChangePassword} disabled={updating}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Güncelle</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 320 },
  expandedModal: { height: '90%', minHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
  menuOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  menuOptionText: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalInputGroup: { borderRadius: 15, borderWidth: 1, marginBottom: 20 },
  modalInput: { padding: 15, fontSize: 16 },
  inputLabel: { fontSize: 13, marginBottom: 8, marginLeft: 5 },
  saveBtn: { padding: 16, borderRadius: 15, alignItems: 'center', elevation: 2 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});