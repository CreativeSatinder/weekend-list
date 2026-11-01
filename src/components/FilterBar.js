import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

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
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.tab, statusFilter === f.key && styles.tabActive]}
            onPress={() => onStatusChange(f.key)}
          >
            <Text style={[styles.tabText, statusFilter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
        {PRIORITY_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, priorityFilter === f.key && styles.pillActive]}
            onPress={() => onPriorityChange(f.key)}
          >
            <Text style={[styles.pillText, priorityFilter === f.key && styles.pillTextActive]}>
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
    backgroundColor: '#EDEDF5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#6C63FF' },
  pills: { flexDirection: 'row' },
  pill: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#666' },
  pillTextActive: { color: '#fff' },
});
