import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADIUS } from '../../src/theme';

const VILLES_MAROC = [
  'Agadir', 'Al Hoceïma', 'Asilah', 'Azrou', 'Béni Mellal',
  'Berkane', 'Berrechid', 'Casablanca', 'Chefchaouen', 'Dakhla',
  'El Jadida', 'Errachidia', 'Essaouira', 'Fès', 'Guelmim',
  'Ifrane', 'Kénitra', 'Khémisset', 'Khouribga', 'Laâyoune',
  'Larache', 'Marrakech', 'Meknès', 'Midelt', 'Mohammedia',
  'Nador', 'Ouarzazate', 'Oujda', 'Rabat', 'Safi',
  'Salé', 'Settat', 'Sidi Ifni', 'Tanger', 'Taroudant',
  'Taza', 'Tétouan', 'Tiznit', 'Zagora', 'Zouagha',
];

export default function ProfileSetupScreen() {
  const router  = useRouter();
  const { user, migrateLocalDataToSupabase } = useAuth();

  const [prenom,      setPrenom]      = useState('');
  const [ville,       setVille]       = useState('');
  const [villeSearch, setVilleSearch] = useState('');
  const [showPicker,  setShowPicker]  = useState(false);
  const [loading,     setLoading]     = useState(false);

  const filteredVilles = VILLES_MAROC.filter(v =>
    v.toLowerCase().includes(villeSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!prenom.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        user_id: user?.id,
        prenom:  prenom.trim(),
        ville:   ville || null,
      });
      if (error) throw error;

      await migrateLocalDataToSupabase();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Profile save error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.wave}>👋</Text>
            <Text style={styles.title}>Bienvenue !</Text>
            <Text style={styles.subtitle}>
              Dis-nous juste l'essentiel — on personnalisera l'app pour toi.
            </Text>
          </View>

          {/* Prénom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ton prénom</Text>
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Mohamed, Fatima, Youssef…"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Ville */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ta ville (optionnel)</Text>
            <TouchableOpacity style={styles.villePicker} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
              <Text style={[styles.villeText, !ville && styles.villePlaceholder]}>
                {ville || 'Choisir une ville…'}
              </Text>
              <Text style={styles.villeArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          {/* CTA */}
          <TouchableOpacity
            style={[styles.saveBtn, !prenom.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!prenom.trim() || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.saveBtnText}>C'est parti ! 🚀</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>Passer cette étape</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal sélection ville */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ta ville</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.modalClose}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.villeSearch}
            value={villeSearch}
            onChangeText={setVilleSearch}
            placeholder="Rechercher…"
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />
          <FlatList
            data={filteredVilles}
            keyExtractor={v => v}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.villeItem, ville === item && styles.villeItemSelected]}
                onPress={() => { setVille(item); setShowPicker(false); setVilleSearch(''); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.villeItemText, ville === item && styles.villeItemTextSelected]}>
                  {item}
                </Text>
                {ville === item && <Text style={styles.villeCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  kav:    { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'space-between', minHeight: 550 },

  header:   { alignItems: 'center', marginBottom: 40 },
  wave:     { fontSize: 56, marginBottom: 12 },
  title:    { fontSize: 30, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textSub, textAlign: 'center', lineHeight: 22 },

  fieldGroup: { marginBottom: 24 },
  label:      { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  villePicker: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  villeText:        { fontSize: 16, fontWeight: '600', color: COLORS.text },
  villePlaceholder: { color: COLORS.textMuted, fontWeight: '400' },
  villeArrow:       { fontSize: 20, color: COLORS.textMuted },

  spacer: { flex: 1 },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText:     { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  skipBtn:         { alignItems: 'center', paddingVertical: 10 },
  skipText:        { fontSize: 13, color: COLORS.textMuted },

  // Modal
  modalSafe:   { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalClose:  { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  villeSearch: { margin: 16, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  villeItem:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  villeItemSelected:     { borderColor: COLORS.primary, borderWidth: 2 },
  villeItemText:         { fontSize: 15, color: COLORS.text },
  villeItemTextSelected: { fontWeight: '700', color: COLORS.primary },
  villeCheck:            { fontSize: 18, color: COLORS.primary, fontWeight: '800' },
});
