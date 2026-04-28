export type Category =
  | 'Documents personnels'
  | 'État civil'
  | 'Automobile'
  | 'Logement'
  | 'Justice'
  | 'Travail'
  | 'Éducation'
  | 'Finance';

export interface ChecklistDocument {
  id: string;
  label: string;
  labelDarija?: string;
  required: boolean;
  note?: string;
}

export interface Procedure {
  id: string;
  title: string;
  titleDarija: string;
  category: Category;
  emoji: string;
  duration: string;
  cost?: string;
  administrations: string[];
  documents: ChecklistDocument[];
  notes?: string;
  tips?: string[];
}

export interface CategoryDef {
  id: Category;
  label: string;
  emoji: string;
}
