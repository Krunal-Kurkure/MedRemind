// src/screens/HomeScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadMedicines, deleteMedicine, updateMedicine } from '../storage/medicineStorage.js';
import MedicineItem from '../components/MedicineItem.jsx';
import { cancelReminder, reconcileMissed, requestPermissions, setupNotificationHandlers } from '../utils/notifications.js';

const ITEM_HEIGHT = 96;
const LIST_WINDOW_SIZE = 5;
const INITIAL_NUM_TO_RENDER = 8;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState('');
  // NEW: default to daily per user request
  const [filter, setFilter] = useState('daily'); // daily | upcoming | all | missed
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await reconcileMissed();
      const list = await loadMedicines();
      const normalized = list
        .map((m) => ({ ...m, timeISO: m.timeISO || null }))
        .sort((a, b) => new Date(a.timeISO || 0).getTime() - new Date(b.timeISO || 0).getTime());
      setMedicines(normalized);
    } catch (e) {
      console.error('loadAll error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setupNotificationHandlers();
    requestPermissions().catch(() => {});
    const unsub = navigation.addListener('focus', () => loadAll());
    loadAll();
    return unsub;
  }, [navigation, loadAll]);

  async function refresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  function handleDelete(id) {
    Alert.alert('Delete', 'Delete this medicine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReminder(id);
            await deleteMedicine(id);
            await loadAll();
          } catch (e) {
            console.error('delete error', e);
            Alert.alert('Error', 'Could not delete medicine.');
          }
        },
      },
    ]);
  }

  async function markTakenInApp(id) {
    try {
      const meds = await loadMedicines();
      const med = meds.find((m) => m.id === id);
      if (!med) return;
      const updated = { ...med, status: 'taken', takenAt: new Date().toISOString() };
      await updateMedicine(updated);
      await cancelReminder(id);
      await loadAll();
    } catch (e) {
      console.error('markTakenInApp error', e);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = medicines.slice();

    if (filter === 'daily') {
      // show medicines scheduled to repeat daily
      list = list.filter((m) => m.repeat === 'daily');
    } else if (filter === 'upcoming') {
      const now = Date.now();
      list = list.filter((m) => new Date(m.timeISO || 0).getTime() >= now && m.status !== 'taken');
    } else if (filter === 'missed') {
      list = list.filter((m) => m.status === 'missed');
    } else if (filter === 'all') {
      list = list.filter(Boolean);
    }

    if (q) {
      list = list.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.dosage || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [medicines, query, filter]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <MedicineItem item={item} onDelete={handleDelete} index={index} onTakenPress={() => markTakenInApp(item.id)} />
    ),
    [medicines]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.title}>MedRemind</Text>
            <Text style={styles.hi} numberOfLines={2}>Welcome back 👋 add medicines and we’ll remind you daily if selected.</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput placeholder="Search by name or dosage..." placeholderTextColor="#9aa4b2" value={query} onChangeText={setQuery} style={styles.searchInput} returnKeyType="search" clearButtonMode="while-editing" />

          <View style={styles.filterRow}>
            <FilterButton label="Daily" active={filter === 'daily'} onPress={() => setFilter('daily')} />
            <FilterButton label="Upcoming" active={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
            <FilterButton label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterButton label="Missed" active={filter === 'missed'} onPress={() => setFilter('missed')} />
          </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} size="large" />
        ) : visible.length === 0 ? (
          <EmptyState onAdd={() => navigation.navigate('AddMedicine')} />
        ) : (
          <FlatList
            data={visible}
            renderItem={renderItem}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
            initialNumToRender={INITIAL_NUM_TO_RENDER}
            maxToRenderPerBatch={6}
            windowSize={LIST_WINDOW_SIZE}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
          />
        )}
      </View>

      <TouchableOpacity style={[styles.fab, { bottom: (insets.bottom || 16) + 16 }]} onPress={() => navigation.navigate('AddMedicine')} accessibilityLabel="Add medicine">
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

/* FilterButton, EmptyState and styles unchanged — please reuse your styles */
function FilterButton({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.filterBtn, active ? styles.filterBtnActive : styles.filterBtnInactive]} activeOpacity={0.8}>
      <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ onAdd }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No reminders yet</Text>
        <Text style={styles.emptySub}>Add your first medicine — we’ll gently remind you when it’s time.</Text>
        <TouchableOpacity style={styles.emptyAddBtn} onPress={onAdd}>
          <Text style={styles.emptyAddText}>Add medicine</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* reuse your existing styles — copy them from the original HomeScreen or keep as-is */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fb' },
  header: {
    paddingTop: Platform.OS === 'android' ? 60 : 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#37a2ff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hi: { color: '#d7d7d7', fontSize: 14, marginBottom: 13 },
  title: { fontSize: 25, marginBottom:3, fontWeight: '700', color: '#fff' },

  searchRow: { marginTop: 12 },
  searchInput: { backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, fontSize: 15, color: '#0f172a' },
  filterRow: { flexDirection: 'row', marginTop: 12,gap:8 },

  filterBtn: { paddingVertical: 6,  paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center' },
  filterBtnActive: { backgroundColor: '#d5e2ff' },
  filterBtnInactive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e1e1e1' },
  filterText: { fontSize: 13, color: '#e7e7e7' },
  filterTextActive: { color: '#2157a8', fontWeight: '700' },

  listContainer: { flex: 1, paddingHorizontal: 12, marginTop: 8 },
  listContent: { paddingBottom: 120 },

  fab: { position: 'absolute', right: 18, width: 64, height: 64, borderRadius: 32, backgroundColor: '#37a2ff', alignItems: 'center', justifyContent: 'center', shadowColor: '#37a2ff', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, elevation: 10 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '800' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { width: '88%', backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 6 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: '#6b7280', textAlign: 'center', marginBottom: 14 },
  emptyAddBtn: { backgroundColor: '#06b6d4', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  emptyAddText: { color: '#fff', fontWeight: '700' },
});
