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

const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_COLORS = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };

export default function AddTodoModal({ visible, onClose, onAdd, stores }) {
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.heading}>New Todo</Text>

          <Text style={styles.label}>What needs to be done?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Buy groceries"
            placeholderTextColor="#BBBBBB"
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
          />

          <Text style={styles.label}>Priority</Text>
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
                <Text style={[styles.priorityLabel, priority === p && styles.priorityLabelActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Store</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeScroll}>
            {(stores ?? []).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.storePill, store === s && styles.storePillActive]}
                onPress={() => setStore(s)}
              >
                <Text style={[styles.storePillText, store === s && styles.storePillTextActive]}>
                  🏪 {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Due Date (optional)</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateBtnText}>
              {dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pick a date'}
            </Text>
            {dueDate && (
              <TouchableOpacity
                onPress={() => setDueDate(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearDate}>✕</Text>
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
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!title.trim()}
            >
              <Text style={styles.addBtnText}>Add Todo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1A1A2E',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  priorityBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  priorityLabelActive: { color: '#fff' },
  dateBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    backgroundColor: '#FAFAFA',
  },
  storeScroll: { marginBottom: 20 },
  storePill: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  storePillActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  storePillText: { fontSize: 14, color: '#555', fontWeight: '500' },
  storePillTextActive: { color: '#fff', fontWeight: '700' },
  dateBtnText: { fontSize: 16, color: '#1A1A2E' },
  clearDate: { color: '#CCCCCC', fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#666' },
  addBtn: {
    flex: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: '#C5C2F0' },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
