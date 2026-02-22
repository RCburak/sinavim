import React, { useState, useMemo, useEffect } from 'react';
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

const EXAM_TYPES = ["TYT", "AYT", "YDT", "LGS"];

export const AnalizView = ({
  analizler = [],
  onAdd,
  onSil,
  onBack,
  theme = COLORS.light
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');
  const [selectedType, setSelectedType] = useState('TYT'); // For adding new
  const [filterType, setFilterType] = useState('TYT'); // For filtering view
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [tooltip, setTooltip] = useState({ visible: false, value: 0, label: '' });

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  const handleAdd = () => {
    if (!denemeAd || !denemeNet) {
      Alert.alert("Eksik Bilgi", "Lütfen deneme adı ve net değerini giriniz.");
      return;
    }
    // onAdd signature: (ad, net, type, date)
    onAdd(denemeAd, denemeNet, selectedType, examDate);
    setDenemeAd('');
    setDenemeNet('');
    Keyboard.dismiss();
    // Switch view to the type we just added so user sees their new data
    setFilterType(selectedType);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => onSil(id) }
    ]);
  };

  const allProcessedData = useMemo(() => {
    if (!analizler) return [];
    return analizler.map((item: any) => ({
      ...item,
      ad: item.ad || item.lesson_name || "-",
      tarih: item.tarih || item.date || new Date().toISOString(),
      type: item.type || "Diğer"
    }));
  }, [analizler]);

  // 2. Filtered Data based on filterType
  const filteredData = useMemo(() => {
    return allProcessedData.filter((item: any) => item.type === filterType);
  }, [allProcessedData, filterType]);

  const prepareChartData = () => {
    if (filteredData.length < 2) return null;
    const lastData = [...filteredData].slice(0, 6).reverse();
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TYT': return '#3B82F6'; // Blue
      case 'AYT': return '#EF4444'; // Red
      case 'LGS': return '#10B981'; // Green
      case 'YDT': return '#F59E0B'; // Yellow
      default: return '#6B7280'; // Gray
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

              {/* Filter Tabs */}
              {/* Filter Tabs - Fixed Row for better organization */}
              <View style={styles.filterContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                  {EXAM_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFilterType(type)}
                      style={[
                        styles.filterTab,
                        filterType === type && { backgroundColor: getTypeColor(type), borderColor: getTypeColor(type) },
                        filterType !== type && { borderColor: theme.border, backgroundColor: theme.surface, flex: 1 }
                      ]}
                    >
                      <Text style={[
                        styles.filterTabText,
                        filterType === type ? { color: '#FFF' } : { color: theme.textSecondary }
                      ]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Grafik */}
              <View style={styles.chartWrapper}>
                {chartData ? (
                  <>
                    <View style={styles.chartHeader}>
                      <Text style={[styles.chartTitle, { color: theme.text }]}>{filterType} Net Gelişimi</Text>
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
                        color: (opacity = 1) => getTypeColor(filterType),
                        labelColor: (opacity = 1) => theme.textSecondary,
                        style: { borderRadius: 16 },
                        propsForDots: { r: "6", strokeWidth: "2", stroke: getTypeColor(filterType) }
                      }}
                      bezier
                      style={{
                        borderRadius: 16,
                        ...theme.cardShadow
                      }}
                    />
                  </>
                ) : (
                  <View style={[styles.emptyChart, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="stats-chart" size={40} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      {filterType} için yeterli veri yok.
                    </Text>
                  </View>
                )}
              </View>

              {/* Form */}
              <View style={[styles.formCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Yeni Sonuç Ekle</Text>

                {/* Type Selector */}
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8, marginLeft: 4 }}>Sınav Türü Seçin:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {EXAM_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setSelectedType(type)}
                        style={[
                          styles.typeChip,
                          selectedType === type && { backgroundColor: getTypeColor(type), borderColor: getTypeColor(type) },
                          selectedType !== type && { borderColor: theme.border }
                        ]}
                      >
                        <Text style={[
                          styles.typeChipText,
                          selectedType === type ? { color: '#FFF' } : { color: theme.textSecondary }
                        ]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, flex: 2 }]}
                    placeholder="Örn: Özdebir T-1"
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
                  />
                </View>

                {/* Simple Date Input (For now acting as text, ideally a picker) */}
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 5, marginLeft: 4 }}>Tarih (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    placeholder="YYYY-MM-DD"
                    value={examDate}
                    onChangeText={setExamDate}
                    placeholderTextColor={theme.textSecondary}
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
                  <Text style={[styles.sectionHeader, { color: theme.text, marginBottom: 0 }]}>{filterType} Geçmişi</Text>
                  <View style={[styles.countBadge, { backgroundColor: getTypeColor(filterType) + '15' }]}>
                    <Text style={{ fontSize: 12, color: getTypeColor(filterType), fontWeight: '700' }}>{filteredData.length}</Text>
                  </View>
                </View>

                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item: any, index: number) => (
                    <View key={index} style={[styles.listItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
                      <View style={styles.listLeft}>
                        {/* Type Badge */}
                        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                          <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                        </View>

                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.listName, { color: theme.text }]} numberOfLines={1}>{item.ad}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                            <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '500' }}>{formatTarih(item.tarih)}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[styles.netBadge, { backgroundColor: COLORS.warning + '15' }]}>
                          <Text style={[styles.netValue, { color: COLORS.warning }]}>{item.net}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20, fontWeight: '500' }}>
                    {filterType} için henüz kayıt yok.
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

  filterContainer: { marginTop: 20, marginBottom: 10 },
  filterTab: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Distribute evenly
  },
  filterTabText: {
    fontWeight: '700',
    fontSize: 14,
  },

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
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
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
    padding: 12,
    borderRadius: 16,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  netBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  netValue: { fontWeight: '800', fontSize: 14 },
  listName: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
});

export default AnalizView;