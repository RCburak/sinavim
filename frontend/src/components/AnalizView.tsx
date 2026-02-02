import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Keyboard, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
// Safe Area yönetimi için profesyonel kütüphane
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AnalizTablosu } from './AnalizTablosu';
import { COLORS } from '../constants/theme';

export const AnalizView = ({ 
  analizler, aiYorum, loadingYorum, onAdd, onSil, onBack 
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');

  const handleAdd = () => {
    if (!denemeAd || !denemeNet) return; // Boş veri girişini engelle
    onAdd(denemeAd, denemeNet);
    setDenemeAd('');
    setDenemeNet('');
    Keyboard.dismiss(); // Veri eklenince klavyeyi kapatır
  };

  return (
    // 1. Ekranın boş yerine basınca klavyeyi kapatmak için sarmalıyoruz
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        
        {/* 2. Klavyenin giriş alanlarını kapatmasını engelliyoruz */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: COLORS.warning }]}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Deneme Analizi</Text>
            </View>

            {/* AI Yorum Kartı */}
            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>🤖 RC Sınavım AI Yorumu</Text>
              {loadingYorum ? (
                <ActivityIndicator color={COLORS.warning} />
              ) : (
                <Text style={styles.aiContent}>{aiYorum}</Text>
              )}
            </View>

            {/* Veri Giriş Formu */}
            <View style={styles.formCard}>
              <TextInput 
                style={styles.input} 
                placeholder="Deneme Adı" 
                value={denemeAd} 
                onChangeText={setDenemeAd} 
                placeholderTextColor={COLORS.textSecondary}
                returnKeyType="next" // Klavyede "Sıradaki" butonu gösterir
              />
              <TextInput 
                style={styles.input} 
                placeholder="Netiniz" 
                keyboardType="numeric" 
                value={denemeNet} 
                onChangeText={setDenemeNet} 
                placeholderTextColor={COLORS.textSecondary}
                returnKeyType="done" // Klavyede "Bitti" butonu gösterir
                onSubmitEditing={handleAdd} // Bitti'ye basınca direkt ekler
              />
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: COLORS.warning }]} 
                onPress={handleAdd}
              >
                <Text style={styles.btnText}>Veriyi Kaydet</Text>
              </TouchableOpacity>
            </View>

            {/* Tablo Alanı */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, flex: 1 }}>
              <AnalizTablosu veriler={analizler} onSil={onSil} />
            </View>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  backBtn: { padding: 5 },
  headerTitle: { color: COLORS.surface, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  backBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  aiCard: { 
    backgroundColor: '#FFF4E5', 
    margin: 20, 
    padding: 15, 
    borderRadius: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: COLORS.warning 
  },
  aiTitle: { fontWeight: 'bold', color: COLORS.warning, marginBottom: 5 },
  aiContent: { color: COLORS.text, fontStyle: 'italic' },
  formCard: { 
    backgroundColor: COLORS.surface, 
    marginHorizontal: 20, 
    marginBottom: 20, 
    padding: 20, 
    borderRadius: 25, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  input: { 
    borderBottomWidth: 1.5, 
    borderBottomColor: COLORS.border, 
    paddingVertical: 12, 
    marginBottom: 15, 
    color: COLORS.text,
    fontSize: 16 
  },
  btn: { padding: 16, borderRadius: 15, alignItems: 'center', elevation: 2 },
  btnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 }
});