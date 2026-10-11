import { NonNullableFormBuilder, Validators } from '@angular/forms';

import { TripInput, TripLevel } from './trip';

export const FORM_FIELDS = [
  {
    key: 'code',
    label: 'Trip code',
    max: 10,
    type: 'text',
    group: 'Identity',
    hint: 'Four letters and six digits, such as KAYK270912.',
  },
  { key: 'name', label: 'Trip name', max: 80, type: 'text', group: 'Identity', hint: '' },
  {
    key: 'start',
    label: 'Departure date',
    max: 10,
    type: 'date',
    group: 'Schedule and price',
    hint: 'The calendar date is preserved in UTC.',
  },
  {
    key: 'length',
    label: 'Duration',
    max: 40,
    type: 'text',
    group: 'Schedule and price',
    hint: 'For example, 3 nights / 4 days.',
  },
  {
    key: 'perPerson',
    label: 'Price per person (USD)',
    max: 8,
    type: 'text',
    group: 'Schedule and price',
    hint: 'Up to 99999.99, with no currency symbol.',
  },
  {
    key: 'resort',
    label: 'Base camp / resort',
    max: 120,
    type: 'text',
    group: 'Schedule and price',
    hint: '',
  },
  { key: 'image', label: 'Trip image', max: 100, type: 'select', group: 'Presentation', hint: '' },
  {
    key: 'imageAlt',
    label: 'Image alternative text',
    max: 160,
    type: 'text',
    group: 'Presentation',
    hint: 'Describe the image for travelers using a screen reader.',
  },
  {
    key: 'eyebrow',
    label: 'Short headline',
    max: 60,
    type: 'text',
    group: 'Presentation',
    hint: '',
  },
  {
    key: 'description',
    label: 'Trip description',
    max: 600,
    type: 'textarea',
    group: 'Presentation',
    hint: '',
  },
  {
    key: 'level',
    label: 'Experience level',
    max: 40,
    type: 'select',
    group: 'Fieldbook',
    hint: '',
  },
  { key: 'water', label: 'Water profile', max: 60, type: 'text', group: 'Fieldbook', hint: '' },
  { key: 'bestFor', label: 'Best for', max: 120, type: 'text', group: 'Fieldbook', hint: '' },
  {
    key: 'fieldNote',
    label: 'Field note',
    max: 300,
    type: 'textarea',
    group: 'Fieldbook',
    hint: '',
  },
] as const;
export function buildTripForm(builder: NonNullableFormBuilder) {
  const text = (max: number) =>
    builder.control('', [Validators.required, Validators.maxLength(max), Validators.pattern(/\S/)]);
  return builder.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{4}\d{6}$/)]],
    name: text(80),
    length: text(40),
    start: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{4}-\d{2}-\d{2}$/),
        (control) => {
          if (!control.value) return null;
          const date = new Date(control.value + 'T12:00:00.000Z');
          return Number.isFinite(date.getTime()) &&
            date.toISOString().slice(0, 10) === control.value
            ? null
            : { date: true };
        },
      ],
    ],
    resort: text(120),
    perPerson: ['', [Validators.required, Validators.pattern(/^\d{1,5}(\.\d{1,2})?$/)]],
    image: [
      'reef1.jpg',
      [Validators.required, Validators.pattern(/^[\w-]+\.(?:jpe?g|png|webp)$/i)],
    ],
    description: text(600),
    imageAlt: text(160),
    eyebrow: text(60),
    bestFor: text(120),
    level: builder.control<TripLevel>('Introductory', Validators.required),
    water: text(60),
    fieldNote: text(300),
  });
}
export type TripForm = ReturnType<typeof buildTripForm>;
export function toTripInput(form: TripForm): TripInput {
  const value = form.getRawValue();
  // Noon UTC keeps the departure on the same calendar day in the API and UI.
  return {
    code: value.code.trim().toUpperCase(),
    name: value.name.trim(),
    length: value.length.trim(),
    start: value.start.trim() + 'T12:00:00.000Z',
    resort: value.resort.trim(),
    perPerson: Number(value.perPerson).toFixed(2),
    image: value.image.trim(),
    description: value.description.trim(),
    imageAlt: value.imageAlt.trim(),
    eyebrow: value.eyebrow.trim(),
    bestFor: value.bestFor.trim(),
    level: value.level,
    water: value.water.trim(),
    fieldNote: value.fieldNote.trim(),
  };
}
