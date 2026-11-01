import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import MoveStoreModal from '../components/MoveStoreModal';

const SHOPPING_KEY = '@shopping_v2';
const STORES_KEY = '@stores_v1';
const DEFAULT_STORES = ['Aldi', 'Coles', 'Woolworths', 'IGA'];
const STORE_COLORS = ['#4A90D9', '#E8352A', '#00843D', '#E8872A', '#8B5CF6', '#06B6D4'];

function storeColor(store, stores) {
  const idx = stores.indexOf(store);
  return STORE_COLORS[Math.max(0, idx) % STORE_COLORS.length];
}

export default function ShoppingScreen() {
  const { theme, toggleTheme } = useTheme();
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [storeFilter, setStoreFilter] = useState('all');
  const [inputText, setInputText] = useState('');
  const [quickStore, setQuickStore] = useState(DEFAULT_STORES[0]);
  const [movingItemId, setMovingItemId] = useState(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SHOPPING_KEY),
      AsyncStorage.getItem(STORES_KEY),
    ]).then(([itemsData, storesData]) => {
      if (itemsData) setItems(JSON.parse(itemsData));
      if (storesData) {
        const s = JSON.parse(storesData);
        setStores(s);
        setQuickStore(s[0]);
      }
    });
  }, []);

  const persist = useCallback((updated) => {
    setItems(updated);
    AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(updated));
  }, []);

  const addItem = () => {
    const title = inputText.trim();
    if (!title) return;
    persist([
      { id: Date.now().toString(), title, store: quickStore, completed: false, createdAt: new Date().toISOString() },
      ...items,
    ]);
    setInputText('');
  };

  const toggleItem = (id) => persist(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));

  const deleteItem = (id) => {
    Alert.alert('Remove', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => persist(items.filter(i => i.id !== id)) },
    ]);
  };

  const moveItem = (id, newStore) => {
    persist(items.map(i => i.id === id ? { ...i, store: newStore } : i));
    setMovingItemId(null);
  };

  const addStore = (name) => {
    if (!stores.includes(name)) {
      const s = [...stores, name];
      setStores(s);
      AsyncStorage.setItem(STORES_KEY, JSON.stringify(s));
    }
  };

  const filtered = storeFilter === 'all' ? items : items.filter(i => i.store === storeFilter);
  const activeItems = filtered.filter(i => !i.completed);
  const doneItems = filtered.filter(i => i.completed);
  const totalActive = items.filter(i => !i.completed).length;

  const listData = [];
  if (activeItems.length > 0) {
    listData.push({ type: 'header', id: 'h-buy', label: 'TO BUY', count: activeItems.length, isDone: false });
    activeItems.forEach(i => listData.push({ type: 'item', ...i }));
  }
  if (doneItems.length > 0) {
    listData.push({ type: 'header', id: 'h-done', label: 'COLLECTED', count: doneItems.length, isDone: true });
    doneItems.forEach(i => listData.push({ type: 'item', ...i }));
  }

  const movingItem = movingItemId ? items.find(i => i.id === movingItemId) : null;
  const headerColor = storeFilter === 'all' ? '#4A90D9' : storeColor(storeFilter, stores);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Shopping</Text>
          <Text style={[styles.sub, { color: theme.subtext }]}>{totalActive} to buy</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme}>
          <Text style={{ fontSize: 22 }}>{theme.dark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Store filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        <TouchableOpacity
          style={[styles.pill, storeFilter === 'all' && { backgroundColor: '#4A90D9', borderColor: '#4A90D9' }]}
          onPress={() => setStoreFilter('all')}
        >
          <Text style={[styles.pillText, { color: storeFilter === 'all' ? '#fff' : theme.subtext }]}>
            All{totalActive > 0 ? ` ${totalActive}` : ''}
          </Text>
        </TouchableOpacity>
        {stores.map((s, idx) => {
          const c = STORE_COLORS[idx % STORE_COLORS.length];
          const active = storeFilter === s;
          const count = items.filter(i => i.store === s && !i.completed).length;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.pill, { borderColor: active ? c : theme.borderLight }, active && { backgroundColor: c }]}
              onPress={() => setStoreFilter(s)}
            >
              {!active && <View style={[styles.dot, { backgroundColor: c }]} />}
              <Text style={[styles.pillText, { color: active ? '#fff' : theme.subtext }]}>
                {s}{count > 0 ? ` ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {listData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>List is empty</Text>
          <Text style={[styles.emptySub, { color: theme.subtext }]}>Add items below</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={i => i.id}
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: item.isDone ? theme.muted : headerColor }]} />
                <Text style={[styles.sectionLabel, { color: item.isDone ? theme.muted : headerColor }]}>{item.label}</Text>
                <Text style={[styles.sectionCount, { color: theme.subtext }]}>{item.count}</Text>
              </View>
            ) : (
              <View style={[styles.itemRow, { backgroundColor: theme.card, borderLeftColor: storeColor(item.store, stores) }]}>
                <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkBtn}>
                  <View style={[styles.checkbox, item.completed && { backgroundColor: theme.muted, borderColor: theme.muted }]}>
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.itemTitle, { color: theme.text }, item.completed && { textDecorationLine: 'line-through', color: theme.muted }]}>
                  {item.title}
                </Text>
                <View style={styles.itemRight}>
                  <TouchableOpacity onPress={() => setMovingItemId(item.id)} style={styles.iconBtn}>
                    <Text style={{ color: theme.muted, fontSize: 16 }}>↔</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.iconBtn}>
                    <Text style={{ color: theme.muted, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Quick-add bar */}
      <View style={[styles.quickAdd, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeScroll}>
          {stores.map((s, idx) => {
            const c = STORE_COLORS[idx % STORE_COLORS.length];
            return (
              <TouchableOpacity
                key={s}
                style={[styles.storeChip, { borderColor: quickStore === s ? c : theme.borderLight, marginRight: 8 }]}
                onPress={() => setQuickStore(s)}
              >
                <Text style={[styles.storeChipText, { color: quickStore === s ? c : theme.subtext }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={`Add to ${quickStore}... (e.g. 2 milk)`}
            placeholderTextColor={theme.muted}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="done"
            onSubmitEditing={addItem}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#5D8C4A', opacity: inputText.trim() ? 1 : 0.4 }]}
            onPress={addItem}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {movingItem && (
        <MoveStoreModal
          visible={!!movingItemId}
          currentStore={movingItem.store}
          stores={stores}
          onConfirm={(newStore) => moveItem(movingItemId, newStore)}
          onCancel={() => setMovingItemId(null)}
          onAddStore={addStore}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  pillScroll: { paddingHorizontal: 16, paddingBottom: 10, flexGrow: 0 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, marginRight: 8, marginBottom: 10 },
  pillText: { fontSize: 14, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, flex: 1 },
  sectionCount: { fontSize: 12, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderRadius: 8, marginBottom: 6, paddingVertical: 14, paddingRight: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  checkBtn: { paddingHorizontal: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8 },
  quickAdd: { borderTopWidth: 1, paddingTop: 10 },
  storeScroll: { paddingHorizontal: 16, paddingBottom: 10, flexGrow: 0 },
  storeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  storeChipText: { fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
