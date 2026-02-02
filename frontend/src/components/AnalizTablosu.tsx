import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

export const AnalizTablosu = ({ veriler, onSil }: any) => {
  if (!veriler || veriler.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Henüz deneme kaydı yok. İlk netini girmeye ne dersin? 📈</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 1.5, textAlign: 'left' }]}>Deneme</Text>
        <Text style={styles.headerText}>Net</Text>
        <Text style={styles.headerText}>Tarih</Text>
        <Text style={[styles.headerText, { flex: 0.5 }]}>İşlem</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {veriler.map((item: any) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.cellName} numberOfLines={1}>{item.ad}</Text>
            <View style={styles.netBadge}>
               <Text style={styles.cellNet}>{item.net}</Text>
            </View>
            <Text style={styles.cellDate}>{item.tarih}</Text>
            <TouchableOpacity onPress={() => onSil(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 25, 
    padding: 15, 
    elevation: 4, 
    flex: 1, 
    shadowColor: COLORS.shadow, 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 16, fontStyle: 'italic' }, // DÜZELTİLDİ
  tableHeader: { 
    flexDirection: 'row', 
    borderBottomWidth: 1.5, 
    borderBottomColor: COLORS.border, 
    paddingBottom: 15, 
    marginBottom: 10 
  },
  headerText: { 
    flex: 1, 
    fontWeight: 'bold', 
    color: COLORS.textSecondary, // DÜZELTİLDİ
    fontSize: 12, 
    letterSpacing: 1 
  },
  row: { 
    flexDirection: 'row', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    alignItems: 'center' 
  },
  cellName: { flex: 1.5, color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
  netBadge: { 
    flex: 1, 
    backgroundColor: COLORS.warning + '15', 
    paddingVertical: 6, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  cellNet: { color: COLORS.warning, fontWeight: 'bold', fontSize: 15 },
  cellDate: { 
    flex: 1, 
    color: COLORS.textSecondary, // DÜZELTİLDİ
    fontSize: 11, 
    textAlign: 'center' 
  },
  deleteBtn: { flex: 0.5, alignItems: 'center' },
  deleteIcon: { fontSize: 18, opacity: 0.7 }
});