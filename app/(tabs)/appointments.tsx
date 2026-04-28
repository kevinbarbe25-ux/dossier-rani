import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, FlatList, Modal, Keyboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppointments } from '../../src/hooks/useAppointments';
import { PROCEDURES } from '../../src/data/procedures';
import { COLORS, RADIUS } from '../../src/theme';

function daysUntil(date: string, time: string): number {
  const diff = new Date(`${date}T${time}`).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { appointments, addAppointment, removeAppointment, loaded } = useAppointments();

  const [showForm, setShowForm]             = useState(false);
  const [showPicker, setShowPicker]         = useState(false);
  const [selectedProcedure, setSelected]    = useState(PROCEDURES[0].id);
  const [date, setDate]                     = useState('');
  const [time, setTime]                     = useState('09:00');
  const [location, setLocation]             = useState('');
  const [saving, setSaving]                 = useState(false);

  const validateDate = (d: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(d);
  const validateTime = (t: string) => /^\d{2}:\d{2}$/.test(t);

  const toIsoDate = (d: string) => {
    const [dd, mm, yyyy] = d.split('/');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSave = async () => {
    if (!validateDate(date)) { Alert.alert('Date invalide', 'Format attendu : JJ/MM/AAAA'); return; }
    if (!validateTime(time)) { Alert.alert('Heure invalide', 'Format attendu : HH:MM'); return; }
    if (!location.trim())    { Alert.alert('Lieu manquant', 'Indique l\'adresse ou le nom de l\'administration.'); return; }
    const isoDate = toIsoDate(date);
    if (new Date(`${isoDate}T${time}`) <= new Date()) {
      Alert.alert('Date passée', 'Choisis une date future.'); return;
    }
    Keyboard.dismiss();
    setSaving(true);
    const granted = await addAppointment(selectedProcedure, isoDate, time, location.trim());
    setSaving(false);
    setShowForm(false);
    setDate(''); setTime('09:00'); setLocation('');
    if (granted) {
      Alert.alert('Rendez-vous ajouté ✅', 'Tu recevras une notification la veille à 8h avec ta checklist.');
    } else {
      Alert.alert('Rendez-vous ajouté', 'Active les notifications pour recevoir le rappel la veille.');
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Supprimer ce rendez-vous ?', title, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeAppointment(id) },
    ]);
  };

  const procedure = PROCEDURES.find(p => p.id === selectedProcedure)!;

  return (
    <>
      <Stack.Screen options={{ title: 'Mes rendez-vous' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Mes rendez-vous</Text>
          <Text style={styles.pageSub}>
            Planifie tes RDV administratifs — tu recevras ta checklist la veille.
          </Text>
        </View>

        {/* Liste */}
        {loaded && appointments.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>Aucun rendez-vous planifié.</Text>
            <Text style={styles.emptySubText}>Ajoutes-en un pour recevoir un rappel la veille avec ta checklist.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {appointments.map(appt => {
              const proc    = PROCEDURES.find(p => p.id === appt.procedureId);
              const days    = daysUntil(appt.date, appt.time);
              const isToday = days === 0 || days === 1;
              return (
                <TouchableOpacity
                  key={appt.id}
                  style={[styles.apptCard, isToday && styles.apptCardToday]}
                  onPress={() => router.push(`/procedure/${appt.procedureId}`)}
                  activeOpacity={0.75}
                >
                  <View style={styles.apptTop}>
                    <Text style={styles.apptEmoji}>{proc?.emoji ?? '📋'}</Text>
                    <View style={styles.apptInfo}>
                      <Text style={styles.apptTitle} numberOfLines={1}>{proc?.title ?? 'Démarche'}</Text>
                      <Text style={styles.apptMeta}>
                        📅 {formatDisplayDate(appt.date)} à {appt.time}
                      </Text>
                      <Text style={styles.apptMeta} numberOfLines={1}>📍 {appt.location}</Text>
                    </View>
                    <View style={styles.apptRight}>
                      <View style={[styles.daysBadge, isToday && styles.daysBadgeToday]}>
                        <Text style={[styles.daysNum, isToday && styles.daysNumToday]}>
                          {days <= 0 ? '!' : days}
                        </Text>
                        <Text style={[styles.daysLabel, isToday && styles.daysNumToday]}>
                          {days <= 0 ? 'Aujourd\'hui' : days === 1 ? 'demain' : 'jours'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(appt.id, proc?.title ?? 'Démarche')}
                        hitSlop={8}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {isToday && (
                    <Text style={styles.todayHint}>
                      Rappel : pense à apporter tous les documents requis !
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Formulaire d'ajout */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Nouveau rendez-vous</Text>

            {/* Sélection procédure */}
            <Text style={styles.fieldLabel}>Démarche</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
              <Text style={styles.pickerBtnEmoji}>{procedure.emoji}</Text>
              <Text style={styles.pickerBtnText} numberOfLines={1}>{procedure.title}</Text>
              <Text style={styles.pickerArrow}>›</Text>
            </TouchableOpacity>

            {/* Date */}
            <Text style={styles.fieldLabel}>Date du rendez-vous</Text>
            <TextInput
              style={styles.fieldInput}
              value={date}
              onChangeText={setDate}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Heure */}
            <Text style={styles.fieldLabel}>Heure</Text>
            <TextInput
              style={styles.fieldInput}
              value={time}
              onChangeText={setTime}
              placeholder="09:00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={5}
            />

            {/* Lieu */}
            <Text style={styles.fieldLabel}>Lieu / Administration</Text>
            <TextInput
              style={styles.fieldInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex : Commissariat Maarif, Casablanca"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Enregistrement…' : 'Planifier'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bouton ajouter */}
        {!showForm && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Ajouter un rendez-vous</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal sélection procédure */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choisir une démarche</Text>
          <TouchableOpacity onPress={() => setShowPicker(false)}>
            <Text style={styles.modalClose}>Fermer</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={PROCEDURES}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.procItem, selectedProcedure === item.id && styles.procItemSelected]}
              onPress={() => { setSelected(item.id); setShowPicker(false); }}
              activeOpacity={0.75}
            >
              <Text style={styles.procEmoji}>{item.emoji}</Text>
              <View style={styles.procBody}>
                <Text style={styles.procTitle}>{item.title}</Text>
                <Text style={styles.procMeta}>⏱ {item.duration}</Text>
              </View>
              {selectedProcedure === item.id && <Text style={styles.procCheck}>✓</Text>}
            </TouchableOpacity>
          )}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  pageHeader: { padding: 20, paddingTop: 8, backgroundColor: COLORS.background },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  pageSub: { fontSize: 14, color: COLORS.textSub, marginTop: 4, lineHeight: 20 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', lineHeight: 20 },

  list: { padding: 16, gap: 10 },
  apptCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  apptCardToday: { borderColor: COLORS.accent, borderWidth: 2 },
  apptTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  apptEmoji: { fontSize: 26, marginTop: 2 },
  apptInfo: { flex: 1, gap: 3 },
  apptTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  apptMeta: { fontSize: 12, color: COLORS.textSub },
  apptRight: { alignItems: 'center', gap: 8 },
  daysBadge: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 8,
    alignItems: 'center', minWidth: 48,
    borderWidth: 1, borderColor: COLORS.border,
  },
  daysBadgeToday: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  daysNum: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  daysNumToday: { color: '#fff' },
  daysLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '700' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14, color: COLORS.textMuted },
  todayHint: {
    marginTop: 10, fontSize: 12, color: '#8B7500',
    backgroundColor: '#FFF8EC', borderRadius: 8, padding: 8,
  },

  form: {
    margin: 16, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 12, marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  pickerBtnEmoji: { fontSize: 20 },
  pickerBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  pickerArrow: { fontSize: 20, color: COLORS.textMuted },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSub },
  saveBtn: {
    flex: 2, paddingVertical: 13, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  addBtn: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalClose: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  procItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  procItemSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  procEmoji: { fontSize: 22 },
  procBody: { flex: 1 },
  procTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  procMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  procCheck: { fontSize: 18, color: COLORS.primary, fontWeight: '800' },
});
