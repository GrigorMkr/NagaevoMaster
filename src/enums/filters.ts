export enum DistanceFilter {
  Five = 5,
  Ten = 10,
  Twenty = 20,
  Fifty = 50,
}

export enum RatingFilter {
  Any = 0,
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
}

export const DISTANCE_FILTER_OPTIONS = Object.values(DistanceFilter).filter(
  (value) => typeof value === 'number',
) as DistanceFilter[]

export const RATING_FILTER_OPTIONS = Object.values(RatingFilter).filter(
  (value) => typeof value === 'number',
) as RatingFilter[]
