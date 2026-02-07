import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants/theme';

export const AnalizTablosu = ({ veriler, onSil, theme = COLORS.light }: any) => {
  if (!veriler || veriler.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Henüz deneme kaydı yok. İlk netini girmeye ne dersin? 📈
        </Text>
      </View>
    );
  }

  const confirmDelete = (id: number) => {
    Alert.alert(
      "Kaydı Sil",
      "Bu deneme sonucunu silmek istediğine emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => onSil(id) }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, shadowColor: '#000' }]}>
      <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, { flex: 1.5, textAlign: 'left', color: theme.textSecondary }]}>Deneme</Text>
        <Text style={[styles.headerText, { color: theme.textSecondary }]}>Net</Text>
        <Text style={[styles.headerText, { color: theme.textSecondary }]}>Tarih</Text>
        <Text style={[styles.headerText, { flex: 0.5, color: theme.textSecondary }]}>İşlem</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {veriler.map((item: any) => (
          <View key={item.id} style={[styles.row, { borderBottomColor: theme.border }]}>
            {/* DÜZELTME: Veritabanı sütun isimlerine (ad veya deneme_adi) göre kontrol ekledik */}
            <Text style={[styles.cellName, { color: theme.text }]} numberOfLines={1}>
              {item.ad || item.deneme_adi}
            </Text>
            
            <View style={[styles.netBadge, { backgroundColor: COLORS.warning + '20' }]}>
               <Text style={[styles.cellNet, { color: COLORS.warning }]}>{item.net}</Text>
            </View>
            
            <Text style={[styles.cellDate, { color: theme.textSecondary }]}>{item.tarih}</Text>
            
            <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 25, padding: 15, elevation: 4, flex: 1, shadowOpacity: 0.1, shadowRadius: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', fontSize: 16, fontStyle: 'italic' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, paddingBottom: 15, marginBottom: 10 },
  headerText: { flex: 1, fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  row: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, alignItems: 'center' },
  cellName: { flex: 1.5, fontWeight: 'bold', fontSize: 14 },
  netBadge: { flex: 1, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  cellNet: { fontWeight: 'bold', fontSize: 15 },
  cellDate: { flex: 1, fontSize: 11, textAlign: 'center' },
  deleteBtn: { flex: 0.5, alignItems: 'center' },
  deleteIcon: { fontSize: 18, opacity: 0.7 }
});