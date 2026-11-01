import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import TodoItem from './src/components/TodoItem';
import AddTodoModal from './src/components/AddTodoModal';
import FilterBar from './src/components/FilterBar';
import MoveStoreModal from './src/components/MoveStoreModal';

const STORAGE_KEY = '@todos_v1';
const STORES_KEY = '@stores_v1';
const DEFAULT_STORES = ['Aldi', 'Coles', 'Woolworths', 'IGA'];

export default function App() {
  const [todos, setTodos] = useState([]);
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [modalVisible, setModalVisible] = useState(false);
  const [movingTodoId, setMovingTodoId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, STORES_KEY]).then(([[, todosData], [, storesData]]) => {
      if (todosData) setTodos(JSON.parse(todosData));
      if (storesData) setStores(JSON.parse(storesData));
    });
  }, []);

  const persistTodos = useCallback((updated) => {
    setTodos(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const persistStores = useCallback((updated) => {
    setStores(updated);
    AsyncStorage.setItem(STORES_KEY, JSON.stringify(updated));
  }, []);

  const addTodo = useCallback(
    ({ title, priority, dueDate, store }) => {
      const todo = {
        id: Date.now().toString(),
        title,
        priority,
        dueDate,
        store: store ?? stores[0],
        completed: false,
        createdAt: new Date().toISOString(),
      };
      persistTodos([todo, ...todos]);
    },
    [todos, stores, persistTodos]
  );

  const toggleTodo = useCallback(
    (id) => persistTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))),
    [todos, persistTodos]
  );

  const deleteTodo = useCallback(
    (id) => {
      Alert.alert('Delete Item', 'Remove this item?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => persistTodos(todos.filter((t) => t.id !== id)) },
      ]);
    },
    [todos, persistTodos]
  );

  const moveTodo = useCallback(
    (id, newStore) => {
      persistTodos(todos.map((t) => (t.id === id ? { ...t, store: newStore } : t)));
      setMovingTodoId(null);
    },
    [todos, persistTodos]
  );

  const addStore = useCallback(
    (name) => {
      if (!stores.includes(name)) persistStores([...stores, name]);
    },
    [stores, persistStores]
  );

  const filteredTodos = todos.filter((t) => {
    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !t.completed) ||
      (statusFilter === 'completed' && t.completed);
    const priorityOk = priorityFilter === 'all' || t.priority === priorityFilter;
    return statusOk && priorityOk;
  });

  // Build grouped list: [{type:'header', store}, {type:'item', ...todo}, ...]
  const grouped = stores.reduce((acc, store) => {
    const items = filteredTodos.filter((t) => (t.store ?? 'Other') === store);
    if (items.length > 0) {
      acc.push({ type: 'header', id: `header-${store}`, store, count: items.length });
      items.forEach((t) => acc.push({ type: 'item', ...t }));
    }
    return acc;
  }, []);

  // Items with no matching store (e.g. old data)
  const unassigned = filteredTodos.filter((t) => !stores.includes(t.store ?? ''));
  if (unassigned.length > 0) {
    grouped.push({ type: 'header', id: 'header-other', store: 'Other', count: unassigned.length });
    unassigned.forEach((t) => grouped.push({ type: 'item', ...t }));
  }

  const counts = { total: todos.length, done: todos.filter((t) => t.completed).length };
  const movingTodo = movingTodoId ? todos.find((t) => t.id === movingTodoId) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar backgroundColor="#6C63FF" barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping List</Text>
          <Text style={styles.headerSub}>{counts.done}/{counts.total} collected</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <FilterBar
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
        />

        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{todos.length === 0 ? '🛒' : '🔍'}</Text>
            <Text style={styles.emptyTitle}>{todos.length === 0 ? 'List is empty' : 'No matches'}</Text>
            <Text style={styles.emptySubtitle}>
              {todos.length === 0 ? 'Tap + to add your first item' : 'Try adjusting the filters'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={grouped}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              item.type === 'header' ? (
                <View style={styles.storeHeader}>
                  <Text style={styles.storeHeaderText}>🏪 {item.store}</Text>
                  <Text style={styles.storeHeaderCount}>{item.count}</Text>
                </View>
              ) : (
                <TodoItem
                  todo={item}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onMove={(id) => setMovingTodoId(id)}
                />
              )
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      <AddTodoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTodo}
        stores={stores}
      />

      {movingTodo && (
        <MoveStoreModal
          visible={!!movingTodoId}
          currentStore={movingTodo.store ?? 'Other'}
          stores={stores}
          onConfirm={(newStore) => moveTodo(movingTodoId, newStore)}
          onCancel={() => setMovingTodoId(null)}
          onAddStore={addStore}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#6C63FF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#6C63FF',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 32 },
  body: {
    flex: 1,
    backgroundColor: '#F5F5FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  list: { paddingBottom: 24 },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  storeHeaderText: { fontSize: 15, fontWeight: '700', color: '#6C63FF' },
  storeHeaderCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#444', marginBottom: 6 },
  emptySubtitle: { fontSize: 15, color: '#999', textAlign: 'center' },
});
