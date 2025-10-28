// src/components/MedicineItem.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';

export default function MedicineItem({ item, onDelete}) {
  function confirmDelete() {
    Alert.alert('Delete', `Delete ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete && onDelete(item.id),
      },
    ]);
  }

  const timeText = item.timeISO ? new Date(item.timeISO).toLocaleString() : 'No time set';

  const badges = [];
  if (item.timeOfDay) {
    if (item.timeOfDay.morning) badges.push('Morning');
    if (item.timeOfDay.afternoon) badges.push('Afternoon');
    if (item.timeOfDay.evening) badges.push('Evening');
  }
  if (item.mealTiming) badges.push(item.mealTiming === 'after' ? 'After Eat' : 'Before Eat');
  if (item.repeat === 'daily') badges.push('Daily');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.name}>{item.name}</Text>
          {item.dosage ? <Text style={styles.dosage}>{item.dosage}</Text> : null}
          <View style={styles.badgeRow}>
            {badges.map((b) => {
              const isMealBadge = b === 'After Eat' || b === 'Before Eat' || b === 'Daily';
              return (
                <View key={b} style={[styles.badge, isMealBadge ? styles.badgePrimary : null]}>
                  <Text style={[styles.badgeText, isMealBadge ? styles.badgeTextLight : null]}>{b}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <Text style={styles.time}>{timeText}</Text>
      </View>

      <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
        <Image
  source={{ uri: 'https://cdn4.iconfinder.com/data/icons/social-messaging-ui-coloricon-1/21/52-512.png' }}
  style={{ width: 24, height: 24 }}
  resizeMode="contain"
/>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: { flexDirection: 'row',     borderRadius: 10,
    padding: 10,
    borderWidth: 0.6,
    borderColor: '#ccc',
    backgroundColor: '#fff',alignItems: 'flex-start', flex: 1 },
  left: { flex: 1 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '600' },
  dosage: { fontSize: 14, color: '#444' },

  badgeRow: { flexDirection: 'row', marginTop: 6 },
  badge: { borderRadius: 6, borderWidth: 1, borderColor: '#999', paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
  badgePrimary: { backgroundColor: '#37a2ff', borderColor: '#37a2ff' },
  badgeText: { fontSize: 12, color: '#333' },
  badgeTextLight: { color: '#fff', fontWeight: '600' },

  time: { fontSize: 12, color: '#666', marginLeft: 8, alignSelf: 'flex-start' },

  takenBtn: { marginTop: 8, backgroundColor: '#06b6d4', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  takenBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  deleteBtn: { borderWidth: 1, borderColor: 'red', borderRadius: 8, paddingHorizontal: 2, paddingVertical: 6, marginLeft: 8 },
});
