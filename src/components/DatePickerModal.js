import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function Spinner({ value, label, onUp, onDown }) {
  return (
    <View style={styles.spinner}>
      <TouchableOpacity onPress={onUp} style={styles.arrow}>
        <Text style={styles.arrowText}>▲</Text>
      </TouchableOpacity>
      <View style={styles.valueBox}>
        <Text style={styles.valueText}>{label}</Text>
      </View>
      <TouchableOpacity onPress={onDown} style={styles.arrow}>
        <Text style={styles.arrowText}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DatePickerModal({ visible, initialDate, onConfirm, onCancel }) {
  const base = initialDate ? new Date(initialDate) : new Date();
  const [month, setMonth] = useState(base.getMonth());
  const [day, setDay] = useState(base.getDate());
  const [year, setYear] = useState(base.getFullYear());

  const clampDay = (d, m, y) => Math.min(d, daysInMonth(m, y));

  const changeMonth = (delta) => {
    const m = (month + delta + 12) % 12;
    setMonth(m);
    setDay((d) => clampDay(d, m, year));
  };
  const changeDay = (delta) => {
    const max = daysInMonth(month, year);
    setDay((d) => ((d - 1 + delta + max) % max) + 1);
  };
  const changeYear = (delta) => {
    const y = Math.max(new Date().getFullYear(), year + delta);
    setYear(y);
    setDay((d) => clampDay(d, month, y));
  };

  const handleConfirm = () => {
    onConfirm(new Date(year, month, day));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Pick a Date</Text>

          <View style={styles.row}>
            <Spinner
              label={MONTHS[month]}
              onUp={() => changeMonth(1)}
              onDown={() => changeMonth(-1)}
            />
            <Spinner
              label={String(day).padStart(2, '0')}
              onUp={() => changeDay(1)}
              onDown={() => changeDay(-1)}
            />
            <Spinner
              label={String(year)}
              onUp={() => changeYear(1)}
              onDown={() => changeYear(-1)}
            />
          </View>

          <Text style={styles.preview}>
            {MONTHS[month]} {day}, {year}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  spinner: { alignItems: 'center', flex: 1 },
  arrow: { padding: 8 },
  arrowText: { fontSize: 16, color: '#6C63FF' },
  valueBox: {
    backgroundColor: '#F0EFFE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 56,
    alignItems: 'center',
  },
  valueText: { fontSize: 18, fontWeight: '700', color: '#6C63FF' },
  preview: { fontSize: 15, color: '#555', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
