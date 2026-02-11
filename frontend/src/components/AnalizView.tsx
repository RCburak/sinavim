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
  Dimensions,
  Alert // Alert bileşeni eklendi
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
// AnalizTablosu dosyanın src/components klasöründe olduğunu varsayıyorum
import { AnalizTablosu } from './AnalizTablosu'; 
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get('window');

export const AnalizView = ({ 
  analizler, aiYorum, loadingYorum, onAdd, onSil, onBack, theme = COLORS.light 
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');
  const [showAI, setShowAI] = useState(false); 

  // Tooltip için state'ler
  const [tooltip, setTooltip] = useState({ visible: false, value: 0, label: '' });

  const handleAdd = () => {
    if (!denemeAd || !denemeNet) {
        Alert.alert("Eksik Bilgi", "Lütfen deneme adı ve net değerini giriniz.");
        return;
    }
    onAdd(denemeAd, denemeNet);
    setDenemeAd('');
    setDenemeNet('');
    Keyboard.dismiss();
  };

  const isDark = theme.background === '#121212';

  // --- HATA DÜZELTİLEN KISIM (prepareChartData) ---
  const prepareChartData = () => {
    // Veri yoksa veya 2'den azsa grafik çizme (null döndür)
    if (!analizler || analizler.length < 2) return null;
    
    // Veriyi kopyalayıp son 6 tanesini alıyoruz ve ters çeviriyoruz (eskiden yeniye)
    const lastData = [...analizler].slice(0, 6).reverse();
    
    return {
      labels: lastData.map((a: any) => {
        // HATA ÇÖZÜMÜ: Eğer 'ad' yoksa boş string ("-") kabul et
        const ad = a.ad ? String(a.ad) : "-";
        // İsim 4 karakterden uzunsa kısalt (Örn: "Matematik" -> "Mate.")
        return ad.length > 4 ? ad.substring(0, 4) + '.' : ad;
      }),
      datasets: [{
        data: lastData.map((a: any) => {
          // Net değerini sayıya çevir, değilse 0 yap
          const net = parseFloat(a.net);
          return isNaN(net) ? 0 : net;
        })
      }]
    };
  };
  // --------------------------------------------------

  const chartData = prepareChartData();

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setTooltip({ ...tooltip, visible: false }); 
    }}>
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
              
              {/* GRAFİK VE TOOLTIP ALANI */}
              {chartData ? (
                <View style={styles.chartWrapper}>
                  <View style={styles.chartHeader}>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Net Gelişim Grafiği</Text>
                    
                    {tooltip.visible && (
                      <View style={[styles.tooltipContainer, { backgroundColor: COLORS.warning }]}>
                        <Text style={styles.tooltipText}>{tooltip.label}: {tooltip.value} Net</Text>
                      </View>
                    )}
                  </View>

                  <LineChart
                    data={chartData}
                    width={width - 40}
                    height={180}
                    onDataPointClick={(data) => {
                      setTooltip({
                        visible: true,
                        value: data.value,
                        label: chartData.labels[data.index]
                      });
                    }}
                    chartConfig={{
                      backgroundColor: theme.surface,
                      backgroundGradientFrom: theme.surface,
                      backgroundGradientTo: theme.surface,
                      decimalPlaces: 1,
                      color: (opacity = 1) => COLORS.warning,
                      labelColor: (opacity = 1) => theme.textSecondary,
                      style: { borderRadius: 16 },
                      propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.warning }
                    }}
                    bezier
                    style={styles.chartStyle}
                  />
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    Noktalara dokunarak net ayrıntılarını gör
                  </Text>
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

              {/* Tablo Alanı - Orijinal Bileşeni Kullanıyor */}
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
  chartWrapper: { alignItems: 'center', marginTop: 15 },
  chartHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: width - 50, 
    marginBottom: 10 
  },
  chartTitle: { fontSize: 14, fontWeight: 'bold' },
  chartStyle: { borderRadius: 20, elevation: 4 },
  
  // Tooltip Stilleri
  tooltipContainer: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10, 
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2
  },
  tooltipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  infoText: { fontSize: 11, marginTop: 5, fontStyle: 'italic' },

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
  },
  input: { 
    borderBottomWidth: 1.5, 
    paddingVertical: 12, 
    marginBottom: 15, 
    fontSize: 16 
  },
  btn: { padding: 16, borderRadius: 15, alignItems: 'center', elevation: 2 },
});

export default AnalizView;