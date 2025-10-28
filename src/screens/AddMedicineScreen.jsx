// src/screens/AddMedicineScreen.jsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addMedicine } from '../storage/medicineStorage.js';
import { scheduleReminder } from '../utils/notifications.js';

export default function AddMedicineScreen({ navigation }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [date, setDate] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const [timeOfDay, setTimeOfDay] = useState({ morning: false, afternoon: false, evening: false });
  const [mealTiming, setMealTiming] = useState(null);

  // NEW: daily toggle (if true schedule repeating daily)
  const [repeatDaily, setRepeatDaily] = useState(false);

  function formatDisplayDate(d) {
    if (!d) return 'No date/time selected';
    return d.toLocaleString();
  }

  function onAndroidDateChange(event, selectedDate) {
    setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setDate(selectedDate);
    setShowTimePicker(true);
  }

  function onAndroidTimeChange(event, selectedTime) {
    setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;
    const pickedDate = date ? new Date(date) : new Date();
    pickedDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    setDate(pickedDate);
  }

  function onIOSPickerChange(event, selected) {
    if (selected) setDate(selected);
  }

  function toggleTimeOfDay(key) {
    setTimeOfDay((p) => ({ ...p, [key]: !p[key] }));
  }

  function selectMealTiming(val) {
    setMealTiming((p) => (p === val ? null : val));
  }

  async function onSave() {
    if (!name.trim()) { Alert.alert('Missing name', 'Please enter the medicine name.'); return; }
    if (!date) { Alert.alert('Missing time', 'Please select a reminder date and time.'); return; }
    const now = Date.now();
    if (date.getTime() <= now) { Alert.alert('Invalid time', 'Please select a future date/time.'); return; }

    const anyTimeSelected = timeOfDay.morning || timeOfDay.afternoon || timeOfDay.evening;
    if (!anyTimeSelected) { Alert.alert('Select time of day', 'Please select at least one: Morning, Afternoon, or Evening.'); return; }
    if (!mealTiming) { Alert.alert('Select meal timing', 'Please choose either "After eat" or "Before eat".'); return; }

    const newMed = {
      id: Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      timeISO: date.toISOString(),
      timeOfDay: { ...timeOfDay },
      mealTiming,
      repeat: repeatDaily ? 'daily' : 'once', // NEW field
      status: 'scheduled',
    };

    try {
      await addMedicine(newMed);
      await scheduleReminder(newMed); // schedule primary (daily if repeat === 'daily')
      Alert.alert('Saved', repeatDaily ? 'Daily reminder scheduled.' : 'Reminder scheduled.');
      navigation.goBack();
    } catch (e) {
      console.error('Save failed', e);
      Alert.alert('Error', 'Something went wrong while saving the reminder.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerTitle}>ADD Medicines</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>Medicine name</Text>
        <TextInput style={styles.input} placeholder="e.g., Aspirin" value={name} onChangeText={setName} />

        <Text style={styles.label}>Dosage (optional)</Text>
        <TextInput style={styles.input} placeholder="e.g., 1 tablet" value={dosage} onChangeText={setDosage} />

        <Text style={[styles.label, { marginTop: 4 }]}>When to take</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.optionButton, timeOfDay.morning ? styles.optionButtonSelected : null]} onPress={() => toggleTimeOfDay('morning')}>
            <Text style={[styles.optionButtonText, timeOfDay.morning ? styles.optionButtonTextSelected : null]}>Morning</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, timeOfDay.afternoon ? styles.optionButtonSelected : null]} onPress={() => toggleTimeOfDay('afternoon')}>
            <Text style={[styles.optionButtonText, timeOfDay.afternoon ? styles.optionButtonTextSelected : null]}>Afternoon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, timeOfDay.evening ? styles.optionButtonSelected : null]} onPress={() => toggleTimeOfDay('evening')}>
            <Text style={[styles.optionButtonText, timeOfDay.evening ? styles.optionButtonTextSelected : null]}>Evening</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Reminder date & time</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => {
          if (Platform.OS === 'android') setShowDatePicker(true);
          else setShowIOSPicker((s) => !s);
        }}>
          <Text style={styles.dateButtonText}>{formatDisplayDate(date)}</Text>
        </TouchableOpacity>

        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker value={date || new Date()} mode="date" display="calendar" onChange={onAndroidDateChange} />
        )}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker value={date || new Date()} mode="time" is24Hour={false} display="clock" onChange={onAndroidTimeChange} />
        )}
        {showIOSPicker && Platform.OS === 'ios' && (
          <DateTimePicker value={date || new Date()} mode="datetime" display="default" onChange={(e, s) => onIOSPickerChange(e, s)} style={{ width: '100%' }} />
        )}

        <Text style={[styles.label, { marginTop: 16 }]}>Meal timing</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.optionButton, mealTiming === 'after' ? styles.optionButtonSelected : null]} onPress={() => selectMealTiming('after')}>
            <Text style={[styles.optionButtonText, mealTiming === 'after' ? styles.optionButtonTextSelected : null]}>After eat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, mealTiming === 'before' ? styles.optionButtonSelected : null]} onPress={() => selectMealTiming('before')}>
            <Text style={[styles.optionButtonText, mealTiming === 'before' ? styles.optionButtonTextSelected : null]}>Before eat</Text>
          </TouchableOpacity>
        </View>

        {/* NEW: Daily switch */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 6 }}>
          <Text style={{ fontWeight: '600', marginRight: 12 }}>Set as daily</Text>
          <Switch value={repeatDaily} onValueChange={setRepeatDaily} />
          <Text style={{ marginLeft: 8, color: '#666' }}>{repeatDaily ? 'Daily' : 'One-time'}</Text>
        </View>

        <View style={{ height: 16 }} />
        <Button title="Save medicine" onPress={onSave} />
        <View style={{ height: 20 }} />
        <Text style={styles.hint}>Tip: On Android pick date then time. If 'daily' is selected the reminder will repeat every day at the chosen time.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderColor: '#e2e2e2' },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, color: '#007AFF' },
  headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'right' },

  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, padding: 10, marginBottom: 12, borderRadius: 8, borderColor: '#ddd' },
  label: { marginBottom: 6, fontWeight: '600' },
  hint: { color: '#666', fontSize: 12 },
  dateButton: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, justifyContent: 'center' },
  dateButtonText: { fontSize: 16 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  optionButton: { borderWidth: 1, borderColor: '#ddd', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 12, backgroundColor: '#fff' },
  optionButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  optionButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  optionButtonTextSelected: { color: '#fff' },
});
