import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PRIORITY_COLORS = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };
const PRIORITY_BG = { low: '#E8F5E9', medium: '#FFF3E0', high: '#FFEBEE' };

export default function TodoItem({ todo, onToggle, onDelete, onMove }) {
  const isOverdue =
    todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString());

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onToggle(todo.id)} style={styles.checkbox}>
        <View style={[styles.checkboxInner, todo.completed && styles.checkboxChecked]}>
          {todo.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, todo.completed && styles.titleDone]}>{todo.title}</Text>
        <View style={styles.meta}>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_BG[todo.priority] }]}>
            <Text style={[styles.priorityText, { color: PRIORITY_COLORS[todo.priority] }]}>
              {todo.priority.toUpperCase()}
            </Text>
          </View>
          {todo.dueDate && (
            <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
              {isOverdue ? '⚠ ' : '📅 '}
              {new Date(todo.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onMove(todo.id)} style={styles.moveBtn}>
          <Text style={styles.moveBtnText}>↔</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(todo.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: { marginRight: 12 },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  content: { flex: 1 },
  title: { fontSize: 16, color: '#1A1A2E', fontWeight: '500' },
  titleDone: { textDecorationLine: 'line-through', color: '#AAAAAA' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  dueDate: { fontSize: 12, color: '#888' },
  overdue: { color: '#F44336', fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moveBtn: { padding: 6 },
  moveBtnText: { color: '#6C63FF', fontSize: 18, fontWeight: 'bold' },
  deleteBtn: { padding: 6 },
  deleteText: { color: '#CCCCCC', fontSize: 18, fontWeight: 'bold' },
});
