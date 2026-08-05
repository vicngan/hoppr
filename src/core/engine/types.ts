import type { TasteProfile } from '../taste/profile';
import type { Place } from '../places';
import type { Question } from '../questions';

export type Coords = { lat: number; lng: number };

/** Context handed to the engine on every decision. */
export type EngineContext = {
  profile: TasteProfile;
  places: Place[];
  /** where the user is (for distance); null → distance is ignored */
  userCoords: Coords | null;
  /** ids of questions already answered this journey */
  askedIds: string[];
};

/** A place with its computed fit, ready to render. */
export type RankedPlace = {
  place: Place;
  /** 0..100 "match" shown to the user */
  match: number;
  /** internal 0..1 score used for ordering */
  score: number;
  /** miles from the user, or null if unknown */
  distanceMi: number | null;
  /** one-line "why you'll like it" */
  reason: string;
};

/**
 * The recommendation engine. A rules-based implementation ships now; a
 * Claude-backed implementation will satisfy the same interface later (flipped
 * via env) so no screen code changes.
 */
export interface RecoEngine {
  /** the most useful next question, or null when the bank is exhausted */
  nextQuestion(ctx: EngineContext): Question | null;
  /** all candidate places, ranked best-fit first */
  rankPlaces(ctx: EngineContext): RankedPlace[];
}
