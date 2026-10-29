export const GRADES = ['S+', 'S', 'A', 'B', 'C', 'D', 'F'] as const

export type Grade = (typeof GRADES)[number]

export function gradeFor(rating: number, thresholds: readonly number[], lowerIsBetter = false): Grade {
  const index = thresholds.findIndex(limit => (lowerIsBetter ? rating <= limit : rating >= limit))
  return index === -1 ? 'F' : GRADES[index]
}

export function gradeClass(grade: Grade) {
  return `grade--${grade === 'S+' ? 'splus' : grade.toLowerCase()}`
}
