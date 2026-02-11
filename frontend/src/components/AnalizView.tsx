import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Keyboard, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get('window');

export const AnalizView = ({ 
  analizler = [], 
  onAdd, 
  onSil, 
  onBack, 
  theme = COLORS.light 
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');
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

  const handleDelete = (id: number) => {
    Alert.alert("Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => onSil(id) }
    ]);
  };

  // --- VERİ HAZIRLAMA VE TARİH DÜZELTME ---
  const islenmisVeriler = useMemo(() => {
    if (!analizler) return [];
    return analizler.map((item: any) => ({
      ...item,
      ad: item.ad || item.lesson_name || "-", 
      tarih: item.tarih || item.date || new Date().toISOString() 
    }));
  }, [analizler]);

  // --- GRAFİK VERİSİ ---
  const prepareChartData = () => {
    if (islenmisVeriler.length < 2) return null;
    const lastData = [...islenmisVeriler].slice(0, 6).reverse();
    return {
      labels: lastData.map((a: any) => {
        const ad = String(a.ad);
        return ad.length > 4 ? ad.substring(0, 4) + '.' : ad;
      }),
      datasets: [{
        data: lastData.map((a: any) => {
          const net = parseFloat(a.net);
          return isNaN(net) ? 0 : net;
        })
      }]
    };
  };

  const chartData = prepareChartData();

  // --- TARİH FORMATLAYICI ---
  const formatTarih = (tarihString: string) => {
    try {
      const date = new Date(tarihString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      });
    } catch (e) {
      return "-";
    }
  };

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
              
              {/* GRAFİK ALANI */}
              <View style={styles.chartWrapper}>
                {chartData ? (
                  <>
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
                  </>
                ) : (
                  <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="stats-chart" size={40} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      Grafik için en az 2 deneme girmelisin.
                    </Text>
                  </View>
                )}
              </View>

              {/* AI YORUM BÖLÜMÜ TAMAMEN KALDIRILDI */}

              {/* Veri Giriş Formu */}
              <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Yeni Sonuç Ekle</Text>
                <View style={styles.inputRow}>
                  <TextInput 
                    style={[styles.input, { color: theme.text, borderColor: theme.border, flex: 2 }]} 
                    placeholder="Örn: TYT-1" 
                    value={denemeAd} 
                    onChangeText={setDenemeAd} 
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TextInput 
                    style={[styles.input, { color: theme.text, borderColor: theme.border, flex: 1 }]} 
                    placeholder="Net" 
                    keyboardType="numeric" 
                    value={denemeNet} 
                    onChangeText={setDenemeNet} 
                    placeholderTextColor={theme.textSecondary}
                    onSubmitEditing={handleAdd}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: COLORS.warning }]} 
                  onPress={handleAdd}
                >
                  <Text style={styles.headerTextWhite}>Kaydet</Text>
                </TouchableOpacity>
              </View>

              {/* TABLO ALANI (LİSTE) */}
              <View style={styles.listContainer}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingHorizontal:20 }}>
                   <Text style={[styles.sectionHeader, { color: theme.text, marginBottom:0 }]}>Sonuç Geçmişi</Text>
                   <Text style={{ fontSize:12, color: theme.textSecondary }}>Toplam: {islenmisVeriler.length}</Text>
                </View>
                
                {islenmisVeriler && islenmisVeriler.length > 0 ? (
                  islenmisVeriler.map((item: any, index: number) => (
                    <View key={index} style={[styles.listItem, { backgroundColor: theme.surface }]}>
                      <View style={styles.listLeft}>
                        {/* Net Rozeti */}
                        <View style={[styles.netBadge, { borderColor: COLORS.warning }]}>
                          <Text style={[styles.netValue, { color: COLORS.warning }]}>{item.net}</Text>
                        </View>
                        
                        {/* İsim ve Tarih */}
                        <View style={{ marginLeft: 12 }}>
                          <Text style={[styles.listName, { color: theme.text }]}>{item.ad}</Text>
                          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                            <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} /> {formatTarih(item.tarih)}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Silme Butonu */}
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                    Henüz kayıt bulunmuyor.
                  </Text>
                )}
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
  chartWrapper: { alignItems: 'center', marginTop: 15, marginBottom: 20 },
  chartHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: width - 40, 
    marginBottom: 10 
  },
  chartTitle: { fontSize: 14, fontWeight: 'bold' },
  chartStyle: { borderRadius: 20, elevation: 4 },
  
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

  emptyChart: { width: width - 40, padding: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { marginTop: 10, fontSize: 14 },

  formCard: { 
    marginHorizontal: 20, 
    marginBottom: 20, 
    padding: 20, 
    borderRadius: 20, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  input: { 
    borderWidth: 1, 
    borderRadius: 10,
    paddingVertical: 10, 
    paddingHorizontal: 15,
    fontSize: 15 
  },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center' },

  listContainer: { paddingBottom: 20 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 15,
    elevation: 1,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  netBadge: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  netValue: { fontWeight: 'bold', fontSize: 14 },
  listName: { fontWeight: 'bold', fontSize: 15, marginBottom: 4 }
});

export default AnalizView;