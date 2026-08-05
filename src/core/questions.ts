import { TAGS, type Tag } from './taste/tags';

export type QOption = {
  id: string;
  label: string;
  /** how picking this nudges the taste profile */
  deltas: Partial<Record<Tag, number>>;
};

export type Question = {
  id: string;
  /** the dimension this question probes (used by the next-question heuristic) */
  axis: string;
  kicker: string;
  prompt: string;
  sub?: string;
  options: QOption[];
};

const T = TAGS;

/**
 * The discovery question bank. Each option maps to tag deltas that teach the
 * profile. The rules engine picks whichever unanswered question probes what we
 * know least about; Claude will later generate these dynamically.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'mood',
    axis: 'mood',
    kicker: 'Hoppr wants to know one thing',
    prompt: "It's 4pm on a Tuesday. What's the mood?",
    sub: 'A few questions. Then your places.',
    options: [
      { id: 'focus', label: 'Need to focus', deltas: { [T.study]: 1, [T.quiet]: 0.8, [T.solo]: 0.6 } },
      { id: 'unwind', label: 'Need to not think', deltas: { [T.moody]: 0.8, [T.comfy]: 0.7, [T.lingering]: 0.5 } },
      { id: 'people', label: 'Want to be around people', deltas: { [T.lively]: 1, [T.group]: 0.7, [T.hangout]: 0.7 } },
      { id: 'disappear', label: 'Want to disappear', deltas: { [T.quiet]: 1, [T.solo]: 0.8, [T.moody]: 0.4 } },
    ],
  },
  {
    id: 'purpose',
    axis: 'activity',
    kicker: 'What are you actually there for?',
    prompt: 'Pick the reason you leave the house.',
    options: [
      { id: 'work', label: 'To get work done', deltas: { [T.study]: 1, [T.outlets]: 0.8, [T.quiet]: 0.6 } },
      { id: 'coffee', label: 'A really good coffee', deltas: { [T.coffee]: 1, [T.bright]: 0.4 } },
      { id: 'drink', label: 'A drink', deltas: { [T.drinks]: 1, [T.moody]: 0.5 } },
      { id: 'meal', label: 'A proper meal', deltas: { [T.food]: 1, [T.group]: 0.3 } },
    ],
  },
  {
    id: 'light',
    axis: 'light',
    kicker: 'Same coffee, two rooms',
    prompt: 'Which one do you walk into?',
    options: [
      { id: 'bright', label: 'Big windows, daylight', deltas: { [T.bright]: 1 } },
      { id: 'moody', label: 'Low and warm', deltas: { [T.moody]: 1 } },
      { id: 'either', label: "Honestly, either", deltas: {} },
    ],
  },
  {
    id: 'company',
    axis: 'company',
    kicker: 'Who is with you?',
    prompt: 'Solo, or a table?',
    options: [
      { id: 'solo', label: 'Just me', deltas: { [T.solo]: 1, [T.lingering]: 0.4 } },
      { id: 'pair', label: 'One other person', deltas: { [T.comfy]: 0.6, [T.quiet]: 0.5 } },
      { id: 'group', label: 'A small group', deltas: { [T.group]: 1, [T.hangout]: 0.6, [T.lively]: 0.4 } },
    ],
  },
  {
    id: 'pace',
    axis: 'pace',
    kicker: 'Be honest',
    prompt: 'How long are you staying?',
    options: [
      { id: 'hours', label: 'A couple of hours', deltas: { [T.lingering]: 1, [T.comfy]: 0.5, [T.outlets]: 0.4 } },
      { id: 'quick', label: 'An hour, tops', deltas: { [T.quick]: 1 } },
      { id: 'kicked', label: 'Until they kick me out', deltas: { [T.lingering]: 1, [T.study]: 0.4 } },
    ],
  },
  {
    id: 'budget',
    axis: 'budget',
    kicker: 'Money mood',
    prompt: 'Tonight, what feels right?',
    options: [
      { id: 'cheap', label: 'Keeping it cheap', deltas: { [T.cheap]: 1 } },
      { id: 'mid', label: 'Somewhere in the middle', deltas: {} },
      { id: 'treat', label: 'Treat myself', deltas: { [T.splurge]: 1 } },
    ],
  },
  {
    id: 'view',
    axis: 'photo',
    kicker: 'Last one for now',
    prompt: 'Does the place need to look good?',
    options: [
      { id: 'yes', label: 'I want a view', deltas: { [T.photo]: 1, [T.bright]: 0.4 } },
      { id: 'meh', label: "Function over form", deltas: { [T.study]: 0.3, [T.outlets]: 0.3 } },
    ],
  },
];

export const findQuestion = (id?: string) => QUESTIONS.find((q) => q.id === id);
