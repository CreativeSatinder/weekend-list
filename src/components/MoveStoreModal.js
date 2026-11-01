import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';

export default function MoveStoreModal({ visible, currentStore, stores, onConfirm, onCancel, onAddStore }) {
  const [newStore, setNewStore] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddStore = () => {
    const name = newStore.trim();
    if (!name) return;
    onAddStore(name);
    onConfirm(name);
    setNewStore('');
    setShowInput(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Move to Store</Text>
          <Text style={styles.subtitle}>Currently in <Text style={styles.bold}>{currentStore}</Text></Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {stores.map((store) => (
              <TouchableOpacity
                key={store}
                style={[styles.storeRow, store === currentStore && styles.storeRowActive]}
                onPress={() => onConfirm(store)}
              >
                <Text style={[styles.storeIcon]}>🏪</Text>
                <Text style={[styles.storeName, store === currentStore && styles.storeNameActive]}>
                  {store}
                </Text>
                {store === currentStore && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}

            {showInput ? (
              <View style={styles.newStoreRow}>
                <TextInput
                  style={styles.newStoreInput}
                  placeholder="Store name"
                  placeholderTextColor="#BBB"
                  value={newStore}
                  onChangeText={setNewStore}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddStore}
                />
                <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAddStore}>
                  <Text style={styles.addConfirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addStoreBtn} onPress={() => setShowInput(true)}>
                <Text style={styles.addStoreBtnText}>+ Add new store</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#999', marginBottom: 16 },
  bold: { color: '#6C63FF', fontWeight: '600' },
  list: { maxHeight: 280, marginBottom: 12 },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8F8FC',
  },
  storeRowActive: { backgroundColor: '#EEF0FE' },
  storeIcon: { fontSize: 18, marginRight: 10 },
  storeName: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  storeNameActive: { color: '#6C63FF', fontWeight: '700' },
  check: { color: '#6C63FF', fontWeight: 'bold', fontSize: 16 },
  addStoreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 6,
  },
  addStoreBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 15 },
  newStoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  newStoreInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
  },
  addConfirmBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
});
