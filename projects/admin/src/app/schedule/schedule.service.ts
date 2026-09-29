import { Service, inject } from '@angular/core';
import { DayHours, ScheduleDocument, ScheduleFormModel, WEEK_ORDER } from 'core';
import { FIRESTORE } from 'core/firebase';
import { collection, doc, getDocs, limit, query, setDoc, updateDoc } from 'firebase/firestore';

const COLLECTION = 'schedule';
// The ID for a schedule written into an empty collection. Production's has a generated ID.
export const NEW_SCHEDULE_ID = 'weekly';

export type ScheduleFormValue = ReturnType<ScheduleFormModel['scheduleForm']>;

function toDayHours({ open, close, isClosed }: DayHours): DayHours {
  return { open, close, isClosed };
}

// The document written for a form value. Lists every field so nothing else (like `id`)
// ever reaches Firestore; the shape must match production (core's ScheduleDocument).
export function toScheduleDocument(value: ScheduleFormValue): ScheduleDocument {
  const day = (index: number) => {
    const position = WEEK_ORDER.indexOf(index as (typeof WEEK_ORDER)[number]);
    return toDayHours(value.days[position]);
  };
  return {
    0: day(0),
    1: day(1),
    2: day(2),
    3: day(3),
    4: day(4),
    5: day(5),
    6: day(6),
    specialMessage: value.specialMessage.trim() || null,
  };
}

export function toScheduleFormValue(schedule: ScheduleDocument): ScheduleFormValue {
  const defaults = new ScheduleFormModel().scheduleForm();
  return {
    // A day missing from an older document starts from the form's defaults.
    days: WEEK_ORDER.map((day, i) => toDayHours(schedule[day] ?? defaults.days[i])),
    specialMessage: schedule.specialMessage ?? '',
  };
}

@Service()
export class ScheduleService {
  private readonly firestore = inject(FIRESTORE);

  // The collection's first document by ID: the one the legacy site reads. Null when empty.
  async get(): Promise<ScheduleDocument | null> {
    const snapshot = await getDocs(query(collection(this.firestore, COLLECTION), limit(1)));
    const first = snapshot.docs[0];
    return first ? { ...(first.data() as ScheduleDocument), id: first.id } : null;
  }

  // Updates the existing schedule, or writes the first one. Resolves to the saved ID.
  async save(id: string | null, value: ScheduleFormValue): Promise<string> {
    const data = toScheduleDocument(value);
    if (id) {
      await updateDoc(doc(this.firestore, COLLECTION, id), { ...data });
      return id;
    }
    await setDoc(doc(this.firestore, COLLECTION, NEW_SCHEDULE_ID), data);
    return NEW_SCHEDULE_ID;
  }
}
