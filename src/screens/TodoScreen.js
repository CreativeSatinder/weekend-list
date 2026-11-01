import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const TODO_KEY = '@todos_v2';

export default function TodoScreen() {
  const { theme, toggleTheme } = useTheme();
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(TODO_KEY).then(data => {
      if (data) setTodos(JSON.parse(data));
    });
  }, []);

  const persist = useCallback((updated) => {
    setTodos(updated);
    AsyncStorage.setItem(TODO_KEY, JSON.stringify(updated));
  }, []);

  const addTodo = () => {
    const title = inputText.trim();
    if (!title) return;
    persist([
      { id: Date.now().toString(), title, completed: false, createdAt: new Date().toISOString() },
      ...todos,
    ]);
    setInputText('');
  };

  const toggleTodo = (id) => persist(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const deleteTodo = (id) => {
    Alert.alert('Delete', 'Delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => persist(todos.filter(t => t.id !== id)) },
    ]);
  };

  const active = todos.filter(t => !t.completed);
  const done = todos.filter(t => t.completed);

  const listData = [];
  if (active.length > 0) {
    listData.push({ type: 'header', id: 'h-active', label: 'TO DO', count: active.length, isDone: false });
    active.forEach(t => listData.push({ type: 'item', ...t }));
  }
  if (done.length > 0) {
    listData.push({ type: 'header', id: 'h-done', label: 'DONE', count: done.length, isDone: true });
    done.forEach(t => listData.push({ type: 'item', ...t }));
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>To-do</Text>
          <Text style={[styles.sub, { color: theme.subtext }]}>{active.length} remaining</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme}>
          <Text style={{ fontSize: 22 }}>{theme.dark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {todos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>All done!</Text>
          <Text style={[styles.emptySub, { color: theme.subtext }]}>Add tasks below</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={i => i.id}
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: item.isDone ? theme.muted : '#6C63FF' }]} />
                <Text style={[styles.sectionLabel, { color: item.isDone ? theme.muted : '#6C63FF' }]}>{item.label}</Text>
                <Text style={[styles.sectionCount, { color: theme.subtext }]}>{item.count}</Text>
              </View>
            ) : (
              <View style={[styles.itemRow, { backgroundColor: theme.card }]}>
                <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.checkBtn}>
                  <View style={[styles.checkbox, item.completed && { backgroundColor: '#6C63FF', borderColor: '#6C63FF' }]}>
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.itemTitle, { color: theme.text }, item.completed && { textDecorationLine: 'line-through', color: theme.muted }]}>
                  {item.title}
                </Text>
                <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.iconBtn}>
                  <Text style={{ color: theme.muted, fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Quick-add bar */}
      <View style={[styles.quickAdd, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Add a task..."
            placeholderTextColor={theme.muted}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="done"
            onSubmitEditing={addTodo}
          />
          <TouchableOpacity
            style={[styles.addBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
            onPress={addTodo}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6, paddingHorizontal: 16 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, flex: 1 },
  sectionCount: { fontSize: 12, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, marginBottom: 6, marginHorizontal: 16, paddingVertical: 14, paddingRight: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  checkBtn: { paddingHorizontal: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  iconBtn: { padding: 8 },
  quickAdd: { borderTopWidth: 1, paddingTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
