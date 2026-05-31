import type { Vote } from '../types/vote'

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const

export type StoryPoint = (typeof STORY_POINTS)[number]

export function averageStoryPoint(votes: Vote[]) {
  if (votes.length === 0) return null
  const total = votes.reduce((sum, vote) => sum + vote.storyPoint, 0)
  return Number((total / votes.length).toFixed(1))
}

export function mostCommonStoryPoint(votes: Vote[]) {
  if (votes.length === 0) return null

  const counts = votes.reduce<Record<number, number>>((acc, vote) => {
    acc[vote.storyPoint] = (acc[vote.storyPoint] ?? 0) + 1
    return acc
  }, {})

  const maxCount = Math.max(...Object.values(counts))

  return Object.entries(counts)
    .filter(([, count]) => count === maxCount)
    .map(([point]) => Number(point))
    .sort((a, b) => a - b)
}

export function voteSpread(votes: Vote[]) {
  if (votes.length === 0) return null
  const points = votes.map((vote) => vote.storyPoint)
  return { low: Math.min(...points), high: Math.max(...points) }
}
