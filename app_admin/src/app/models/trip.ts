export type TripLevel = 'Introductory' | 'Intermediate' | 'Experienced';
export interface TripInput {
  code: string;
  name: string;
  length: string;
  start: string;
  resort: string;
  perPerson: string;
  image: string;
  description: string;
  imageAlt: string;
  eyebrow: string;
  bestFor: string;
  level: TripLevel;
  water: string;
  fieldNote: string;
}
export interface Trip extends TripInput {
  _id: string;
}
export const TRIP_IMAGES = [
  'reef1.jpg',
  'reef2.jpg',
  'reef3.jpg',
  'kayak.jpg',
  'deluxe.jpg',
  'first-class.jpg',
  'suite.jpg',
];
export const TRIP_LEVELS: TripLevel[] = ['Introductory', 'Intermediate', 'Experienced'];
