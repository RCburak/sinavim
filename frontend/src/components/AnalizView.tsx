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
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AnalizTablosu } from './AnalizTablosu';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit"; // Grafik kütüphanesi eklendi

const { width } = Dimensions.get('window');

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

  // Grafik verilerini hazırla (Son 6 deneme)
  const prepareChartData = () => {
    if (!analizler || analizler.length < 2) return null;
    
    // Son verileri ters çevirip grafiğe uygun hale getiriyoruz
    const lastData = [...analizler].slice(0, 6).reverse();
    
    return {
      labels: lastData.map((a: any) => a.ad.substring(0, 4)), // İsimlerin ilk 4 harfi
      datasets: [{
        data: lastData.map((a: any) => parseFloat(a.net) || 0)
      }]
    };
  };

  const chartData = prepareChartData();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: COLORS.warning }]}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Deneme Analizi</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              
              {/* GRAFİK ALANI */}
              {chartData ? (
                <View style={styles.chartContainer}>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>Net Gelişim Grafiği</Text>
                  <LineChart
                    data={chartData}
                    width={width - 40}
                    height={180}
                    chartConfig={{
                      backgroundColor: theme.surface,
                      backgroundGradientFrom: theme.surface,
                      backgroundGradientTo: theme.surface,
                      decimalPlaces: 1,
                      color: (opacity = 1) => COLORS.warning,
                      labelColor: (opacity = 1) => theme.textSecondary,
                      style: { borderRadius: 16 },
                      propsForDots: { r: "5", strokeWidth: "2", stroke: COLORS.warning }
                    }}
                    bezier
                    style={styles.chartStyle}
                  />
                </View>
              ) : (
                <View style={[styles.emptyChart, { backgroundColor: theme.surface }]}>
                  <Ionicons name="stats-chart" size={30} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Grafik için en az 2 veri gerekli</Text>
                </View>
              )}

              {/* AI Yorum Butonu */}
              <TouchableOpacity 
                style={[styles.aiToggleButton, { backgroundColor: COLORS.warning }]} 
                onPress={() => setShowAI(!showAI)}
              >
                <Text style={styles.headerTextWhite}>
                  {showAI ? "🤖 Yorumu Kapat" : "🤖 RC AI Koç Yorumunu Gör"}
                </Text>
              </TouchableOpacity>

              {/* AI Yorum Kartı */}
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

              {/* Veri Giriş Formu */}
              <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
                <TextInput 
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} 
                  placeholder="Deneme Adı" 
                  value={denemeAd} 
                  onChangeText={setDenemeAd} 
                  placeholderTextColor={theme.textSecondary}
                />
                <TextInput 
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]} 
                  placeholder="Netiniz" 
                  keyboardType="numeric" 
                  value={denemeNet} 
                  onChangeText={setDenemeNet} 
                  placeholderTextColor={theme.textSecondary}
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
  chartContainer: { alignItems: 'center', marginTop: 15 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start', marginLeft: 25 },
  chartStyle: { borderRadius: 20, elevation: 4 },
  emptyChart: { margin: 20, padding: 30, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
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
});