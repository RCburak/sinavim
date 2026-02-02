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
  Platform,
  ScrollView // Kaydırma sorunu için eklendi
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AnalizTablosu } from './AnalizTablosu';
import { COLORS } from '../constants/theme';

export const AnalizView = ({ 
  analizler, aiYorum, loadingYorum, onAdd, onSil, onBack 
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');
  const [showAI, setShowAI] = useState(false); // AI yorumu açılır-kapanır kontrolü

  const handleAdd = () => {
    if (!denemeAd || !denemeNet) return;
    onAdd(denemeAd, denemeNet);
    setDenemeAd('');
    setDenemeNet('');
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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

            {/* Kaydırılabilir İçerik Alanı */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              
              {/* AI Yorum Butonu (Aç/Kapat) */}
              <TouchableOpacity 
                style={styles.aiToggleButton} 
                onPress={() => setShowAI(!showAI)}
              >
                <Text style={styles.aiToggleText}>
                  {showAI ? "🤖 Yorumu Kapat" : "🤖 RC AI Koç Yorumunu Gör"}
                </Text>
              </TouchableOpacity>

              {/* AI Yorum Kartı (Koşullu Gösterim) */}
              {showAI && (
                <View style={styles.aiCard}>
                  <Text style={styles.aiTitle}>Robot Koçun Tavsiyesi ✨</Text>
                  {loadingYorum ? (
                    <ActivityIndicator color={COLORS.warning} />
                  ) : (
                    <Text style={styles.aiContent}>{aiYorum}</Text>
                  )}
                </View>
              )}

              {/* Veri Giriş Formu */}
              <View style={styles.formCard}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Deneme Adı" 
                  value={denemeAd} 
                  onChangeText={setDenemeAd} 
                  placeholderTextColor={COLORS.textSecondary}
                  returnKeyType="next"
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Netiniz" 
                  keyboardType="numeric" 
                  value={denemeNet} 
                  onChangeText={setDenemeNet} 
                  placeholderTextColor={COLORS.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: COLORS.warning }]} 
                  onPress={handleAdd}
                >
                  <Text style={styles.btnText}>Veriyi Kaydet</Text>
                </TouchableOpacity>
              </View>

              {/* Tablo Alanı */}
              <View style={{ paddingHorizontal: 20 }}>
                <AnalizTablosu veriler={analizler} onSil={onSil} />
              </View>

            </ScrollView>

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
  aiToggleButton: {
    backgroundColor: COLORS.warning,
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center'
  },
  aiToggleText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 14
  },
  aiCard: { 
    backgroundColor: '#FFF4E5', 
    marginHorizontal: 20, 
    marginBottom: 20,
    padding: 15, 
    borderRadius: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: COLORS.warning 
  },
  aiTitle: { fontWeight: 'bold', color: COLORS.warning, marginBottom: 5 },
  aiContent: { color: COLORS.text, fontStyle: 'italic', lineHeight: 20 },
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