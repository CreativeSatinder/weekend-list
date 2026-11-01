import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ShoppingScreen from './src/screens/ShoppingScreen';
import TodoScreen from './src/screens/TodoScreen';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e.toString() }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 24, paddingTop: 80, backgroundColor: '#fff' }}>
          <Text style={{ color: 'red', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>App crashed — please share this with support:</Text>
          <Text style={{ color: '#333', fontSize: 11 }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('shopping');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ExpoStatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        {activeTab === 'shopping' ? <ShoppingScreen /> : <TodoScreen />}
      </View>
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('shopping')}>
          <Text style={{ fontSize: 24, color: activeTab === 'shopping' ? '#5D8C4A' : theme.muted }}>🛒</Text>
          <Text style={[styles.tabLabel, { color: activeTab === 'shopping' ? '#5D8C4A' : theme.muted }]}>Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('todo')}>
          <Text style={{ fontSize: 22, color: activeTab === 'todo' ? '#6C63FF' : theme.muted }}>☰</Text>
          <Text style={[styles.tabLabel, { color: activeTab === 'todo' ? '#6C63FF' : theme.muted }]}>To-do</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
