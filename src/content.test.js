import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { episodes } from './episodes.js'

const publicRoot = join(process.cwd(), 'public')

describe('published article format', () => {
  it('publishes every transcript as structured Markdown with a direct opening', () => {
    for (const episode of episodes) {
      const markdown = readFileSync(join(publicRoot, episode.transcript), 'utf8')
      expect(markdown.startsWith(`# ${episode.title}\n\n`)).toBe(true)
      const opening = markdown.split('\n\n').slice(1, 4).join('\n')
      expect(opening).not.toMatch(/世界运行原理·每日一课|今天的问题|先给结论|^标题/m)
      expect(markdown).toMatch(/^## /m)
    }
  })

  it('does not publish legacy TXT transcripts', () => {
    const files = readdirSync(join(publicRoot, 'episodes'))
    expect(files.filter((name) => name.endsWith('.txt'))).toEqual([])
  })
})
