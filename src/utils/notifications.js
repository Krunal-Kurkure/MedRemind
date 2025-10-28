// src/utils/notifications.js
import notifee, { EventType, TriggerType, RepeatFrequency } from '@notifee/react-native';
import { loadMedicines, updateMedicine } from '../storage/medicineStorage.js';

// how long after scheduled time we treat as 'missed' (ms)
const MISS_DELAY_MS = 10 * 60 * 1000; // 10 minutes

export async function requestPermissions() {
  try {
    await notifee.requestPermission();
  } catch (e) {
    console.warn('requestPermissions', e);
  }
}

/**
 * Schedule the primary reminder and the follow-up missed reminder.
 * If med.repeat === 'daily' we set repeatFrequency: RepeatFrequency.DAILY on the primary trigger.
 *
 * Primary notification id: med.id
 * Missed notification id: `${med.id}-missed`
 */
export async function scheduleReminder(med) {
  try {
    // ensure android channel exists
    await notifee.createChannel({ id: 'default', name: 'Default' });

    const when = new Date(med.timeISO).getTime();
    if (isNaN(when)) {
      console.warn('Invalid timeISO, skip scheduling', med.timeISO);
      return;
    }

    // Build primary trigger. If med.repeat === 'daily', add repeatFrequency.
    const triggerPrimary = {
      type: TriggerType.TIMESTAMP,
      timestamp: when,
      // repeatFrequency only if med.repeat === 'daily'
      ...(med.repeat === 'daily' ? { repeatFrequency: RepeatFrequency.DAILY } : {}),
    };

    await notifee.createTriggerNotification(
      {
        id: med.id,
        title: `Time for ${med.name}`,
        body: med.dosage ? `${med.dosage} — take now` : `Take your medicine: ${med.name}`,
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
          actions: [{ title: 'I will take it', pressAction: { id: 'take' } }],
        },
        data: { medId: med.id, repeat: med.repeat || 'once' },
      },
      triggerPrimary
    );

    // Schedule missed notification for the first occurrence only (timestamp + MISS_DELAY_MS)
    // If the med repeats daily, this missed will be for the first scheduled occurrence.
    const missTimestamp = when + MISS_DELAY_MS;
    await notifee.createTriggerNotification(
      {
        id: `${med.id}-missed`,
        title: `Missed: ${med.name}`,
        body: `You missed ${med.name}. Tap to view.`,
        android: { channelId: 'default', smallIcon: 'ic_launcher' },
        data: { medId: med.id, missed: '1' },
      },
      { type: TriggerType.TIMESTAMP, timestamp: missTimestamp }
    );
  } catch (e) {
    console.error('scheduleReminder', e);
  }
}

/**
 * Cancel both primary and missed notifications for a medicine
 */
export async function cancelReminder(id) {
  try {
    await notifee.cancelNotification(id).catch(() => {});
    await notifee.cancelNotification(`${id}-missed`).catch(() => {});
  } catch (e) {
    console.warn('cancelReminder', e);
  }
}

/* When user taps the "I will take it" action (pressAction.id === 'take'):
   mark the medicine as taken and cancel missed follow-up for that ID.
*/
async function handleTakeAction(notification) {
  try {
    const medId = notification?.id || notification?.data?.medId;
    if (!medId) return;

    const meds = await loadMedicines();
    const med = meds.find((m) => m.id === medId);
    if (!med) return;

    // If med.repeat === 'daily', we mark this occurrence as taken by updating status/takenAt.
    // You might choose to keep status 'scheduled' for recurring reminders; here we mark as 'taken' for record.
    const updated = { ...med, status: 'taken', takenAt: new Date().toISOString() };
    await updateMedicine(updated);

    // cancel missed notification for this occurrence
    await notifee.cancelNotification(`${medId}-missed`).catch(() => {});
    // cancel primary (if you want to cancel repeating for recurring meds, you might not cancel primary;
    // here we cancel primary — if you want daily to continue after "Taken" don't cancel the primary).
    await notifee.cancelNotification(medId).catch(() => {});
  } catch (e) {
    console.error('handleTakeAction', e);
  }
}

/**
 * Register Notifee foreground and background handlers.
 * Call setupNotificationHandlers() once from your App root (App.jsx).
 */
export function setupNotificationHandlers() {
  notifee.onForegroundEvent(async ({ type, detail }) => {
    try {
      if (type === EventType.ACTION_PRESS) {
        const { pressAction, notification } = detail;
        if (pressAction?.id === 'take') {
          await handleTakeAction(notification);
        }
      }
    } catch (e) {
      console.error('onForegroundEvent handler error', e);
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    try {
      if (type === EventType.ACTION_PRESS) {
        const { pressAction, notification } = detail;
        if (pressAction?.id === 'take') {
          await handleTakeAction(notification);
        }
      }
    } catch (e) {
      console.error('onBackgroundEvent handler error', e);
    }
  });
}

/**
 * Reconcile missed scheduled items (unchanged)
 */
export async function reconcileMissed() {
  try {
    const meds = await loadMedicines();
    const now = Date.now();
    const updates = [];

    for (const med of meds) {
      // only consider scheduled items
      if (med.status === 'scheduled' && med.timeISO) {
        const sch = new Date(med.timeISO).getTime();
        if (!isNaN(sch) && now > sch + MISS_DELAY_MS) {
          const updated = { ...med, status: 'missed', missedAt: new Date().toISOString() };
          updates.push(updated);
        }
      }
    }

    for (const u of updates) {
      await updateMedicine(u);
    }
  } catch (e) {
    console.error('reconcileMissed', e);
  }
}
