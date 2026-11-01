import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import DatePickerModal from './DatePickerModal';
import { useTheme } from '../context/ThemeContext';

const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_COLORS = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };

export default function AddTodoModal({ visible, onClose, onAdd, stores }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(null);
  const [store, setStore] = useState(stores?.[0] ?? 'Other');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), priority, dueDate: dueDate ? dueDate.toISOString() : null, store });
    setTitle('');
    setPriority('medium');
    setDueDate(null);
    setStore(stores?.[0] ?? 'Other');
    onClose();
  };

  const handleDateConfirm = (date) => {
    setDueDate(date);
    setShowDatePicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.heading, { color: theme.text }]}>New Item</Text>

          <Text style={[styles.label, { color: theme.subtext }]}>Item name</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
            placeholder="e.g. Wholemeal bread"
            placeholderTextColor={theme.muted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
          />

          <Text style={[styles.label, { color: theme.subtext }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityBtn,
                  { borderColor: PRIORITY_COLORS[p] },
                  priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityLabel, { color: theme.subtext }, priority === p && styles.priorityLabelActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.subtext }]}>Store</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeScroll}>
            {(stores ?? []).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.storePill, { backgroundColor: theme.pillBg, borderColor: theme.borderLight }, store === s && styles.storePillActive]}
                onPress={() => setStore(s)}
              >
                <Text style={[styles.storePillText, { color: theme.subtext }, store === s && styles.storePillTextActive]}>
                  🏪 {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: theme.subtext }]}>Due Date (optional)</Text>
          <TouchableOpacity style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.dateBtnText, { color: theme.text }]}>
              {dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pick a date'}
            </Text>
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.clearDate, { color: theme.muted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <DatePickerModal
            visible={showDatePicker}
            initialDate={dueDate}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.subtext }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!title.trim()}
            >
              <Text style={styles.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  priorityBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  priorityLabel: { fontSize: 14, fontWeight: '600' },
  priorityLabelActive: { color: '#fff' },
  storeScroll: { marginBottom: 20 },
  storePill: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  storePillActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  storePillText: { fontSize: 14, fontWeight: '500' },
  storePillTextActive: { color: '#fff', fontWeight: '700' },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 24 },
  dateBtnText: { fontSize: 16 },
  clearDate: { fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  addBtn: { flex: 2, backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#C5C2F0' },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
