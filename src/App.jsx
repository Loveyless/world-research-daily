import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { episodes } from './episodes.js'
import { filterEpisodes, getEpisodePage, getHomeSections } from './archive.js'
import './styles.css'

const base = import.meta.env.BASE_URL

function formatTime(value) {
  if (!Number.isFinite(value)) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function EpisodeRow({ episode, index, total, active, onPlay }) {
  return (
    <button className={`episode ${active ? 'active' : ''}`} onClick={() => onPlay(episode)}>
      <span className="episode-index">{String(total - index).padStart(2, '0')}</span>
      <span className="episode-main"><strong>{episode.title}</strong><small>{episode.category} · {episode.date}</small></span>
      <span className="episode-duration">{episode.duration}</span>
      <span className="episode-play">▶</span>
    </button>
  )
}

function getRoute() {
  if (location.hash.startsWith('#/article/')) return 'article'
  return location.hash === '#/history' ? 'history' : 'home'
}

function App() {
  const [active, setActive] = useState(episodes[0])
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [route, setRoute] = useState(getRoute)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [article, setArticle] = useState('')
  const [articleStatus, setArticleStatus] = useState('idle')
  const audioRef = useRef(null)
  const pendingAutoplayRef = useRef(false)

  useEffect(() => {
    const updateRoute = () => setRoute(getRoute())
    addEventListener('hashchange', updateRoute)
    return () => removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    if (route !== 'article') return
    const slug = location.hash.slice('#/article/'.length)
    const episode = episodes.find((item) => item.slug === slug) || active
    if (episode.slug !== active.slug) setActive(episode)
    setArticleStatus('loading')
    fetch(`${base}${episode.transcript}`)
      .then((response) => {
        if (!response.ok) throw new Error('文章加载失败')
        return response.text()
      })
      .then((text) => {
        setArticle(text)
        setArticleStatus('ready')
      })
      .catch(() => setArticleStatus('error'))
  }, [route])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    setTime(0)
    setDuration(0)
    setPlaying(false)
    if (pendingAutoplayRef.current) {
      pendingAutoplayRef.current = false
      audio.play().catch(() => setPlaying(false))
    }
  }, [active])

  const filtered = useMemo(() => filterEpisodes(episodes, query), [query])
  const archivePage = getEpisodePage(filtered, page)
  const homeSections = getHomeSections(episodes)

  useEffect(() => setPage(1), [query])
  useEffect(() => {
    if (page !== archivePage.page) setPage(archivePage.page)
  }, [page, archivePage.page])

  const navigate = (nextRoute) => {
    location.hash = nextRoute === 'history' ? '#/history' : '#/'
    setRoute(nextRoute)
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openArticle = () => {
    location.hash = `#/article/${active.slug}`
    setRoute('article')
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  const playEpisode = (episode) => {
    const audio = audioRef.current
    if (episode.slug === active.slug) {
      audio?.play().catch(() => setPlaying(false))
      return
    }
    pendingAutoplayRef.current = true
    setActive(episode)
  }

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) await audio.play()
    else audio.pause()
  }

  const seek = (event) => {
    if (audioRef.current) audioRef.current.currentTime = Number(event.target.value)
  }

  const player = (
    <section className={`player-card ${route === 'history' ? 'compact-player' : ''}`} aria-label="当前播放">
      <div className="cover" aria-hidden="true"><span className="cover-ring ring-one" /><span className="cover-ring ring-two" /><span className="cover-core">原</span></div>
      <div className="player-content">
        <div className="player-meta"><span>当前播放</span><span>{active.date}</span></div>
        <h2>{active.title}</h2><p>{active.description}</p>
        <div className="controls">
          <button className="play" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>{playing ? 'Ⅱ' : '▶'}</button>
          <div className="timeline"><input type="range" min="0" max={duration || 0} value={time} onChange={seek} aria-label="播放进度" /><div className="time"><span>{formatTime(time)}</span><span>{duration ? formatTime(duration) : active.duration}</span></div></div>
        </div>
        <button className="transcript" onClick={openArticle} aria-label="阅读完整文章">阅读完整文章 <span>→</span></button>
      </div>
    </section>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => navigate('home')} aria-label="返回首页">
          <span className="brand-mark">原</span><span>世界运行原理</span>
        </button>
        <nav className="topnav" aria-label="主菜单">
          <button className={route === 'home' ? 'active' : ''} onClick={() => navigate('home')}>首页</button>
          <button className={route === 'history' ? 'active' : ''} onClick={() => navigate('history')}>历史课程</button>
        </nav>
        <span className="daily-badge">每日一课</span>
      </header>

      {route === 'home' ? (
        <main>
          <section className="hero">
            <div className="eyebrow">WORLD RESEARCH DAILY</div>
            <h1>听懂复杂世界的<br /><span>底层机制</span></h1>
            <p>每天聚焦一个问题。不是新闻摘要，不是知识拼盘，而是一段可以真正听懂、长期积累的深度解释。</p>
          </section>

          <section className="latest-section" aria-label="最新三课">
            <div className="section-heading latest-heading"><div><span>NEW RELEASES</span><h2>最新三课</h2></div></div>
            <div className="latest-grid">
              {homeSections.featured.map((episode, index) => (
                <button key={episode.slug} className={`latest-card ${active.slug === episode.slug ? 'active' : ''}`} onClick={() => playEpisode(episode)}>
                  <span className="latest-number">0{index + 1}</span>
                  <span className="latest-date">{episode.date}</span>
                  <strong>{episode.title}</strong>
                  <small>{episode.category} · {episode.duration}</small>
                  <span className="latest-action">{active.slug === episode.slug ? '正在播放' : '选择播放'} <b>▶</b></span>
                </button>
              ))}
            </div>
          </section>

          {player}

          <section className="archive">
            <div className="section-heading"><div><span>RECENT</span><h2>近期课程</h2></div><button className="view-all" onClick={() => navigate('history')}>查看全部 {episodes.length} 期 →</button></div>
            <div className="episode-list">
              {homeSections.recent.map((episode, index) => <EpisodeRow key={episode.slug} episode={episode} index={index + homeSections.featured.length} total={episodes.length} active={active.slug === episode.slug} onPlay={playEpisode} />)}
            </div>
          </section>
        </main>
      ) : route === 'history' ? (
        <main className="history-page">
          {player}
          <section className="history-hero">
            <div className="eyebrow">FULL ARCHIVE</div><h1>历史课程</h1><p>按时间浏览所有课程，或搜索标题、主题与内容简介。</p>
          </section>
          <section className="history-toolbar">
            <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索课程，例如：电网、金融、生命科学" aria-label="搜索历史课程" /></label>
            <span className="result-count">{filtered.length} 期课程</span>
          </section>
          {archivePage.items.length ? (
            <div className="episode-list history-list">
              {archivePage.items.map((episode, index) => <EpisodeRow key={episode.slug} episode={episode} index={(archivePage.page - 1) * 20 + index} total={episodes.length} active={active.slug === episode.slug} onPlay={playEpisode} />)}
            </div>
          ) : <div className="empty-state"><strong>没有找到相关课程</strong><span>换一个关键词试试。</span></div>}
          {archivePage.pageCount > 1 && <nav className="pagination" aria-label="历史课程分页"><button disabled={archivePage.page === 1} onClick={() => setPage((value) => value - 1)}>上一页</button><span>{archivePage.page} / {archivePage.pageCount}</span><button disabled={archivePage.page === archivePage.pageCount} onClick={() => setPage((value) => value + 1)}>下一页</button></nav>}
        </main>
      ) : (
        <main className="article-page">
          <div className="article-toolbar">
            <button onClick={() => navigate('home')}>← 返回播放器</button>
            <span>{active.category} · {active.date} · {active.duration}</span>
          </div>
          {articleStatus === 'loading' && <div className="article-state">文章加载中…</div>}
          {articleStatus === 'error' && <div className="article-state">文章加载失败，请稍后重试。</div>}
          {articleStatus === 'ready' && <article className="markdown-article"><ReactMarkdown remarkPlugins={[remarkGfm]}>{article}</ReactMarkdown></article>}
        </main>
      )}

      <audio className="persistent-audio" ref={audioRef} preload="metadata" src={`${base}${active.audio}`} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onEnded={() => setPlaying(false)} />
      <footer><span>世界运行原理 · 每日一课</span><span>理解，而不只是知道。</span></footer>
    </div>
  )
}

export default App
