import { describe, expect, it } from 'vitest'
import { filterEpisodes, getEpisodePage, HOME_EPISODE_LIMIT, HISTORY_PAGE_SIZE } from './archive.js'

const catalog = Array.from({ length: 45 }, (_, index) => ({
  slug: `episode-${index}`,
  title: index === 7 ? '电网调度原理' : `课程 ${index}`,
  description: index === 7 ? '供需平衡与频率' : '世界知识',
  category: index % 2 ? '金融投资' : '能源系统',
  date: `2026-${String((index % 12) + 1).padStart(2, '0')}-01`,
}))

describe('archive helpers', () => {
  it('shows exactly the three newest courses on the home page', () => {
    expect(HOME_EPISODE_LIMIT).toBe(3)
    expect(catalog.slice(0, HOME_EPISODE_LIMIT)).toHaveLength(3)
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
