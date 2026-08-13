import { describe, expect, it } from 'vitest'
import { episodes } from './episodes.js'

describe('episode catalog', () => {
  it('has unique slugs and complete playable metadata', () => {
    expect(new Set(episodes.map((item) => item.slug)).size).toBe(episodes.length)
    for (const item of episodes) {
      expect(item.title).toBeTruthy()
      expect(item.audio.endsWith('.mp3')).toBe(true)
      expect(item.transcript.endsWith('.md')).toBe(true)
      expect(item.duration).toMatch(/^\d{1,3}:\d{2}$/)
    }
  })
})
