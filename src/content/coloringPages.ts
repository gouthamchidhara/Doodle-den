// Bundled coloring pages (A5 Coloring). Images need static requires, so each file is registered here.
import type { ImageSourcePropType } from 'react-native';

import pages from './coloringPages.json';

export type ColoringCategory = 'animals' | 'vehicles' | 'fantasy' | 'nature' | 'food';

export interface ColoringPage {
  id: string;
  title: string;
  category: string;
  file: string;
  ages: 'both' | 'little' | 'big';
}

export const COLORING_CATEGORIES: { key: ColoringCategory; title: string }[] = [
  { key: 'animals', title: 'Animals' },
  { key: 'vehicles', title: 'Vehicles' },
  { key: 'fantasy', title: 'Fantasy' },
  { key: 'nature', title: 'Nature' },
  { key: 'food', title: 'Food' },
];

const FILES: Record<string, ImageSourcePropType> = {
  cat: require('../../assets/coloring/cat.png'),
  car: require('../../assets/coloring/car.png'),
  fish: require('../../assets/coloring/fish.png'),
};

export const COLORING_PAGES: ColoringPage[] = pages.filter((p): p is ColoringPage => p.ages === 'both' || p.ages === 'little' || p.ages === 'big');

// Page by id.
export function getColoringPage(id: string): ColoringPage | undefined {
  return COLORING_PAGES.find((p) => p.id === id);
}

// Image source for a page's line art.
export function coloringSource(page: ColoringPage): ImageSourcePropType | undefined {
  return FILES[page.file];
}

// Pages for a category visible in an age mode.
export function pagesFor(category: ColoringCategory, ageMode: 'little' | 'big'): ColoringPage[] {
  return COLORING_PAGES.filter((p) => p.category === category && (p.ages === 'both' || p.ages === ageMode));
}
