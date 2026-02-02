import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { AnalizTablosu } from './AnalizTablosu';
import { COLORS } from '../constants/theme';

export const AnalizView = ({ 
  analizler, aiYorum, loadingYorum, onAdd, onSil, onBack 
}: any) => {
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');

  const handleAdd = () => {
    onAdd(denemeAd, denemeNet);
    setDenemeAd('');
    setDenemeNet('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={[styles.header, { backgroundColor: COLORS.warning }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deneme Analizi</Text>
      </View>

      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>🤖 RC Sınavım AI Yorumu</Text>
        {loadingYorum ? (
          <ActivityIndicator color={COLORS.warning} />
        ) : (
          <Text style={styles.aiContent}>{aiYorum}</Text>
        )}
      </View>

      <View style={styles.formCard}>
        <TextInput 
          style={styles.input} 
          placeholder="Deneme Adı" 
          value={denemeAd} 
          onChangeText={setDenemeAd} 
          placeholderTextColor={COLORS.textSecondary} // DÜZELTİLDİ: gray -> textSecondary
        />
        <TextInput 
          style={styles.input} 
          placeholder="Netiniz" 
          keyboardType="numeric" 
          value={denemeNet} 
          onChangeText={setDenemeNet} 
          placeholderTextColor={COLORS.textSecondary} // DÜZELTİLDİ: gray -> textSecondary
        />
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: COLORS.warning }]} 
          onPress={handleAdd}
        >
          <Text style={styles.btnText}>Veriyi Kaydet</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 20, flex: 1 }}>
        <AnalizTablosu veriler={analizler} onSil={onSil} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 25, flexDirection: 'row', alignItems: 'center', paddingTop: 50 },
  headerTitle: { color: COLORS.surface, fontSize: 20, fontWeight: 'bold', marginLeft: 20 },
  backBtnText: { color: COLORS.surface, fontWeight: 'bold' },
  aiCard: { backgroundColor: '#FFF4E5', margin: 20, padding: 15, borderRadius: 20, borderLeftWidth: 5, borderLeftColor: COLORS.warning },
  aiTitle: { fontWeight: 'bold', color: COLORS.warning, marginBottom: 5 },
  aiContent: { color: COLORS.text, fontStyle: 'italic' },
  formCard: { backgroundColor: COLORS.surface, margin: 20, padding: 20, borderRadius: 20, elevation: 2 },
  input: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 10, marginBottom: 15, color: COLORS.text }, // DÜZELTİLDİ: lightGray -> border
  btn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: COLORS.surface, fontWeight: 'bold' }
});