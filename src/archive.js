export const HOME_EPISODE_LIMIT = 5
export const HISTORY_PAGE_SIZE = 20

export function filterEpisodes(items, query) {
  const keyword = query.trim().toLocaleLowerCase('zh-CN')
  if (!keyword) return items
  return items.filter((item) =>
    [item.title, item.description, item.category, item.date]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase('zh-CN').includes(keyword)),
  )
}

export function getEpisodePage(items, requestedPage, pageSize = HISTORY_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(1, Number(requestedPage) || 1), pageCount)
  const start = (page - 1) * pageSize
  return { page, pageCount, items: items.slice(start, start + pageSize) }
}
