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
import { LinearGradient } from 'expo-linear-gradient';
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

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

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

  const islenmisVeriler = useMemo(() => {
    if (!analizler) return [];
    return analizler.map((item: any) => ({
      ...item,
      ad: item.ad || item.lesson_name || "-",
      tarih: item.tarih || item.date || new Date().toISOString()
    }));
  }, [analizler]);

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
            <LinearGradient
              colors={isDark ? ['#92400E', '#78350F'] : ['#F59E0B', '#D97706']}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Deneme Analizi</Text>
            </LinearGradient>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

              {/* Grafik */}
              <View style={styles.chartWrapper}>
                {chartData ? (
                  <>
                    <View style={styles.chartHeader}>
                      <Text style={[styles.chartTitle, { color: theme.text }]}>Net Gelişim Grafiği</Text>
                      {tooltip.visible && (
                        <View style={styles.tooltipContainer}>
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
                      style={[styles.chartStyle, theme.cardShadow]}
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

              {/* Form */}
              <View style={[styles.formCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Yeni Sonuç Ekle</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, flex: 2 }]}
                    placeholder="Örn: TYT-1"
                    value={denemeAd}
                    onChangeText={setDenemeAd}
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, flex: 1 }]}
                    placeholder="Net"
                    keyboardType="numeric"
                    value={denemeNet}
                    onChangeText={setDenemeNet}
                    placeholderTextColor={theme.textSecondary}
                    onSubmitEditing={handleAdd}
                  />
                </View>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={handleAdd}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.btnText}>Kaydet</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Liste */}
              <View style={styles.listContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 20 }}>
                  <Text style={[styles.sectionHeader, { color: theme.text, marginBottom: 0 }]}>Sonuç Geçmişi</Text>
                  <View style={[styles.countBadge, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '700' }}>{islenmisVeriler.length}</Text>
                  </View>
                </View>

                {islenmisVeriler && islenmisVeriler.length > 0 ? (
                  islenmisVeriler.map((item: any, index: number) => (
                    <View key={index} style={[styles.listItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
                      <View style={styles.listLeft}>
                        <View style={[styles.netBadge, { backgroundColor: COLORS.warning + '15' }]}>
                          <Text style={[styles.netValue, { color: COLORS.warning }]}>{item.net}</Text>
                        </View>
                        <View style={{ marginLeft: 14 }}>
                          <Text style={[styles.listName, { color: theme.text }]}>{item.ad}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="calendar-outline" size={11} color={theme.textSecondary} />
                            <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '500' }}>{formatTarih(item.tarih)}</Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20, fontWeight: '500' }}>
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
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginLeft: 15 },

  chartWrapper: { alignItems: 'center', marginTop: 18, marginBottom: 20 },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: width - 40,
    marginBottom: 10
  },
  chartTitle: { fontSize: 15, fontWeight: '700' },
  chartStyle: { borderRadius: 20 },

  tooltipContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.warning,
  },
  tooltipText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  infoText: { fontSize: 11, marginTop: 8, fontStyle: 'italic' },

  emptyChart: { width: width - 40, padding: 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { marginTop: 10, fontSize: 14, fontWeight: '500' },

  formCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
  },
  sectionHeader: { fontSize: 16, fontWeight: '700', marginBottom: 15 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGradient: { padding: 14, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  listContainer: { paddingBottom: 20 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  netBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  netValue: { fontWeight: '800', fontSize: 15 },
  listName: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
});

export default AnalizView;