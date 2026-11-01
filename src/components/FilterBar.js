import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

const PRIORITY_FILTERS = [
  { key: 'all', label: 'Any priority' },
  { key: 'high', label: '🔴 High' },
  { key: 'medium', label: '🟠 Medium' },
  { key: 'low', label: '🟢 Low' },
];

export default function FilterBar({ statusFilter, priorityFilter, onStatusChange, onPriorityChange }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.tabs, { backgroundColor: theme.tabBg }]}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.tab, statusFilter === f.key && { backgroundColor: theme.tabActive }]}
            onPress={() => onStatusChange(f.key)}
          >
            <Text style={[styles.tabText, { color: theme.subtext }, statusFilter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
        {PRIORITY_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, { backgroundColor: theme.pillBg, borderColor: theme.borderLight }, priorityFilter === f.key && styles.pillActive]}
            onPress={() => onPriorityChange(f.key)}
          >
            <Text style={[styles.pillText, { color: theme.subtext }, priorityFilter === f.key && styles.pillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#6C63FF' },
  pills: { flexDirection: 'row' },
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  pillActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  pillText: { fontSize: 13, fontWeight: '500' },
  pillTextActive: { color: '#fff' },
});
