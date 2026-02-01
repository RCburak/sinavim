import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants/theme';

export const AnalizTablosu = ({ veriler }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Deneme Adı</Text>
        <Text style={styles.headerText}>Net</Text>
        <Text style={styles.headerText}>Tarih</Text>
      </View>
      <ScrollView>
        {veriler.map((item: any, index: number) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cellName}>{item.ad}</Text>
            <Text style={styles.cellNet}>{item.net}</Text>
            <Text style={styles.cellDate}>{item.tarih}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 20, padding: 15, elevation: 3 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, paddingBottom: 10, marginBottom: 10 },
  headerText: { flex: 1, fontWeight: 'bold', color: COLORS.gray, textAlign: 'center' },
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  cellName: { flex: 1, color: COLORS.text, fontWeight: '500' },
  cellNet: { flex: 1, color: COLORS.primary, fontWeight: 'bold', textAlign: 'center' },
  cellDate: { flex: 1, color: COLORS.gray, fontSize: 12, textAlign: 'center' }
});