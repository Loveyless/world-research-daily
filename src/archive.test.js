import { describe, expect, it } from 'vitest'
import { filterEpisodes, getEpisodePage, getHomeSections, HOME_EPISODE_LIMIT, HISTORY_PAGE_SIZE, TOP_EPISODE_LIMIT } from './archive.js'

const catalog = Array.from({ length: 45 }, (_, index) => ({
  slug: `episode-${index}`,
  title: index === 7 ? '电网调度原理' : `课程 ${index}`,
  description: index === 7 ? '供需平衡与频率' : '世界知识',
  category: index % 2 ? '金融投资' : '能源系统',
  date: `2026-${String((index % 12) + 1).padStart(2, '0')}-01`,
}))

describe('archive helpers', () => {
  it('shows the three newest courses in the top feature area and the next three below', () => {
    expect(TOP_EPISODE_LIMIT).toBe(3)
    expect(HOME_EPISODE_LIMIT).toBe(3)
    const sections = getHomeSections(catalog)
    expect(sections.featured.map((item) => item.slug)).toEqual(['episode-0', 'episode-1', 'episode-2'])
    expect(sections.recent.map((item) => item.slug)).toEqual(['episode-3', 'episode-4', 'episode-5'])
  })

  it('searches title, description, and category without case sensitivity', () => {
    expect(filterEpisodes(catalog, '电网')).toHaveLength(1)
    expect(filterEpisodes(catalog, '供需')).toHaveLength(1)
    expect(filterEpisodes(catalog, '金融')).toHaveLength(22)
  })

  it('paginates a large archive and clamps invalid pages', () => {
    expect(HISTORY_PAGE_SIZE).toBe(20)
    expect(getEpisodePage(catalog, 1).items).toHaveLength(20)
    expect(getEpisodePage(catalog, 3).items).toHaveLength(5)
    expect(getEpisodePage(catalog, 99).page).toBe(3)
  })
})
