import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../src/services/firebaseConfig';

const { width } = Dimensions.get('window');
const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

const STEPS = [
  { id: 1, title: 'Hedef', icon: 'flag' },
  { id: 2, title: 'Zaman', icon: 'time' },
  { id: 3, title: 'Tempo', icon: 'flash' }
];

const TARGETS = ['TYT Focus', 'AYT Sayısal', 'AYT Sözel', 'Yabancı Dil', 'Yazılım/Proje'];
const TEMPOS = [
  { id: 'light', label: 'Hafif', sub: 'Günde 2-3 saat odaklı', color: '#4CAF50' },
  { id: 'normal', label: 'Dengeli', sub: 'Günde 4-6 saat düzenli', color: '#FF9800' },
  { id: 'hard', label: 'Sınav Modu', sub: 'Günde 8+ saat yoğun', color: '#F44336' }
];

export default function AIProgramScreen({ theme, onComplete, onBack }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState(4);
  const [tempo, setTempo] = useState('normal');

  const handleGenerate = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Hata", "Oturum açık değil.");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.uid, 
          goal: `${goal} (${tempo} tempo)`, 
          hours: hours 
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // VERİ FORMATI KONTROLÜ: Programın liste olduğundan emin oluyoruz
        let finalProgram = data.program;
        if (finalProgram && finalProgram.program && Array.isArray(finalProgram.program)) {
            finalProgram = finalProgram.program;
        }

        if (Array.isArray(finalProgram)) {
            onComplete(finalProgram);
        } else {
            throw new Error("Program formatı hatalı.");
        }
      } else {
        throw new Error("AI yanıt vermedi.");
      }
    } catch (e) {
      Alert.alert("Hata", "Program oluşturulurken bir sorun çıktı.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !goal.trim()) return Alert.alert("Hata", "Lütfen bir hedef belirle.");
    if (step < 3) setStep(step + 1);
    else handleGenerate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>RC AI Programcı</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.stepperContainer}>
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <View style={[
                styles.stepCircle, 
                { backgroundColor: step >= s.id ? theme.primary : theme.surface, borderColor: theme.border }
              ]}>
                <Ionicons name={s.icon as any} size={16} color={step >= s.id ? '#fff' : theme.textSecondary} />
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: step > s.id ? theme.primary : theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={styles.stepView}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Neye odaklanmak istersin? 🎯</Text>
              <View style={styles.chipContainer}>
                {TARGETS.map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.chip, { backgroundColor: goal === t ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => setGoal(t)}
                  >
                    <Text style={{ color: goal === t ? '#fff' : theme.text, fontWeight: goal === t ? 'bold' : 'normal' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Veya kendi hedefini yaz..."
                placeholderTextColor={theme.textSecondary}
                value={goal}
                onChangeText={setGoal}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepView}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Günde kaç saat çalışabilirsin? ⏱️</Text>
              <View style={styles.hourSelector}>
                <TouchableOpacity onPress={() => setHours(h => Math.max(1, h - 1))} style={styles.roundBtn}>
                  <Ionicons name="remove" size={30} color={theme.primary} />
                </TouchableOpacity>
                <View style={styles.hourTextWrapper}>
                  <Text style={[styles.hourText, { color: theme.text }]}>{hours}</Text>
                  <Text style={[styles.hourSub, { color: theme.textSecondary }]}>SAAT</Text>
                </View>
                <TouchableOpacity onPress={() => setHours(h => Math.min(16, h + 1))} style={styles.roundBtn}>
                  <Ionicons name="add" size={30} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepView}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Çalışma temponu belirle ⚡</Text>
              {TEMPOS.map(t => (
                <TouchableOpacity 
                  key={t.id} 
                  style={[
                    styles.tempoCard, 
                    { backgroundColor: theme.surface, borderColor: tempo === t.id ? theme.primary : theme.border }
                  ]}
                  onPress={() => setTempo(t.id)}
                >
                  <View style={[styles.tempoIndicator, { backgroundColor: t.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tempoLabel, { color: theme.text }]}>{t.label}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{t.sub}</Text>
                  </View>
                  {tempo === t.id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity 
              style={[styles.backStepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
              onPress={() => setStep(step - 1)}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold' }}>Geri</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.mainBtn, { backgroundColor: theme.primary, flex: step > 1 ? 2 : 1 }]} 
            onPress={nextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>
                {step === 3 ? 'Programı Oluştur 🚀' : 'Devam Et'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  stepLine: { width: 40, height: 2, marginHorizontal: 5 },
  content: { paddingHorizontal: 25, paddingTop: 10 },
  stepView: { width: '100%', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, margin: 6, borderWidth: 1 },
  input: { width: '100%', padding: 18, borderRadius: 15, borderWidth: 1, fontSize: 16, marginTop: 10 },
  hourSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  hourTextWrapper: { alignItems: 'center', marginHorizontal: 30 },
  hourText: { fontSize: 60, fontWeight: 'bold' },
  hourSub: { fontSize: 14, fontWeight: 'bold', marginTop: -5 },
  roundBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  tempoCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2, marginBottom: 15, width: '100%' },
  tempoIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
  tempoLabel: { fontSize: 18, fontWeight: 'bold' },
  footer: { padding: 25, flexDirection: 'row', gap: 15 },
  backStepBtn: { padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flex: 1, borderWidth: 1 },
  mainBtn: { padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});