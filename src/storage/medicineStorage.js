// src/storage/medicineStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'MEDICINES_V1';

export async function loadMedicines() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    console.warn('loadMedicines error', e);
    return [];
  }
}

export async function saveMedicines(list) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.error('saveMedicines error', e);
    throw e;
  }
}

export async function addMedicine(med) {
  try {
    const meds = await loadMedicines();
    const toSave = [{ ...med, status: med.status || 'scheduled' }, ...meds];
    await saveMedicines(toSave);
    return med;
  } catch (e) {
    console.error('addMedicine error', e);
    throw e;
  }
}

export async function updateMedicine(updated) {
  try {
    const meds = await loadMedicines();
    const idx = meds.findIndex(m => m.id === updated.id);
    if (idx === -1) {
      meds.unshift(updated);
    } else {
      meds[idx] = { ...meds[idx], ...updated };
    }
    await saveMedicines(meds);
    return updated;
  } catch (e) {
    console.error('updateMedicine error', e);
    throw e;
  }
}

/**
 * deleteMedicine(id)
 * Removes a medicine by id and returns the id.
 */
export async function deleteMedicine(id) {
  try {
    const meds = await loadMedicines();
    const filtered = meds.filter(m => m.id !== id);
    await saveMedicines(filtered);
    return id;
  } catch (e) {
    console.error('deleteMedicine error', e);
    throw e;
  }
}

/**
 * Backwards-compatible alias: removeMedicine -> deleteMedicine
 * (If other files call removeMedicine, they'll continue to work.)
 */
export const removeMedicine = deleteMedicine;

// default export intentionally omitted; use named imports.
