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
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AnalizTablosu } from './AnalizTablosu';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// theme prop'u eklendi
export const AnalizView = ({ 
  analizler, aiYorum, loadingYorum, onAdd, onSil, onBack, theme = COLORS.light 
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');
  const [showAI, setShowAI] = useState(false); 

  const handleAdd = () => {
    if (!denemeAd || !denemeNet) return;
    onAdd(denemeAd, denemeNet);
    setDenemeAd('');
    setDenemeNet('');
    Keyboard.dismiss();
  };

  const isDark = theme.background === '#121212';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            
            {/* Header: Rengi sabit warning (turuncu) kalsa da içindeki surface (beyaz) propları düzeldi */}
            <View style={[styles.header, { backgroundColor: COLORS.warning }]}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.headerTextWhite}>← Geri</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Deneme Analizi</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              
              {/* AI Yorum Butonu */}
              <TouchableOpacity 
                style={[styles.aiToggleButton, { backgroundColor: COLORS.warning }]} 
                onPress={() => setShowAI(!showAI)}
              >
                <Text style={styles.headerTextWhite}>
                  {showAI ? "🤖 Yorumu Kapat" : "🤖 RC AI Koç Yorumunu Gör"}
                </Text>
              </TouchableOpacity>

              {/* AI Yorum Kartı - Dark Modda renkleri yumuşatıldı */}
              {showAI && (
                <View style={[
                  styles.aiCard, 
                  { 
                    backgroundColor: isDark ? '#2A1A00' : '#FFF4E5',
                    borderLeftColor: COLORS.warning 
                  }
                ]}>
                  <Text style={[styles.aiTitle, { color: COLORS.warning }]}>Robot Koçun Tavsiyesi ✨</Text>
                  {loadingYorum ? (
                    <ActivityIndicator color={COLORS.warning} />
                  ) : (
                    <Text style={[styles.aiContent, { color: theme.text }]}>{aiYorum}</Text>
                  )}
                </View>
              )}

              {/* Veri Giriş Formu - Kart rengi theme.surface oldu */}
              <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
                <TextInput 
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} 
                  placeholder="Deneme Adı" 
                  value={denemeAd} 
                  onChangeText={setDenemeAd} 
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="next"
                />
                <TextInput 
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} 
                  placeholder="Netiniz" 
                  keyboardType="numeric" 
                  value={denemeNet} 
                  onChangeText={setDenemeNet} 
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: COLORS.warning }]} 
                  onPress={handleAdd}
                >
                  <Text style={styles.headerTextWhite}>Veriyi Kaydet</Text>
                </TouchableOpacity>
              </View>

              {/* Tablo Alanı */}
              <View style={{ paddingHorizontal: 20 }}>
                {/* AnalizTablosu içine de temayı gönderiyoruz */}
                <AnalizTablosu veriler={analizler} onSil={onSil} theme={theme} />
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
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  headerTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  aiToggleButton: {
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center'
  },
  aiCard: { 
    marginHorizontal: 20, 
    marginBottom: 20,
    padding: 15, 
    borderRadius: 20, 
    borderLeftWidth: 5, 
  },
  aiTitle: { fontWeight: 'bold', marginBottom: 5 },
  aiContent: { fontStyle: 'italic', lineHeight: 20 },
  formCard: { 
    marginHorizontal: 20, 
    marginBottom: 20, 
    padding: 20, 
    borderRadius: 25, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  input: { 
    borderBottomWidth: 1.5, 
    paddingVertical: 12, 
    marginBottom: 15, 
    fontSize: 16 
  },
  btn: { padding: 16, borderRadius: 15, alignItems: 'center', elevation: 2 },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});