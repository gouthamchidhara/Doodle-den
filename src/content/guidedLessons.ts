// Guided Drawing lessons (A5): normalized SVG paths per step + voice line. 3 samples; 17 more are owner content.
import lessons from './guidedLessons.json';

export interface GuidedStep {
  pathSvg: string;
  voice: string;
  text: string;
}

export interface GuidedLesson {
  id: string;
  title: string;
  sticker: string;
  steps: GuidedStep[];
}

export const GUIDED_LESSONS: GuidedLesson[] = lessons;

// Lesson by id.
export function getLesson(id: string): GuidedLesson | undefined {
  return GUIDED_LESSONS.find((l) => l.id === id);
}

// Progress key for a finished lesson.
export const guidedSkill = (id: string) => `guided_${id}`;
