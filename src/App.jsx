import { useEffect, useRef, useState } from 'react'
import { episodes } from './episodes.js'
import './styles.css'

const base = import.meta.env.BASE_URL

function formatTime(value) {
  if (!Number.isFinite(value)) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function App() {
  const [active, setActive] = useState(episodes[0])
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    setTime(0)
    setDuration(0)
    setPlaying(false)
  }, [active])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      await audio.play()
    } else {
      audio.pause()
    }
  }

  const seek = (event) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(event.target.value)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href={base} aria-label="返回首页">
          <span className="brand-mark">原</span>
          <span>世界运行原理</span>
        </a>
        <span className="daily-badge">每日一课</span>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow">WORLD RESEARCH DAILY</div>
          <h1>听懂复杂世界的<br /><span>底层机制</span></h1>
          <p>每天聚焦一个问题。不是新闻摘要，不是知识拼盘，而是一段可以真正听懂、长期积累的深度解释。</p>
        </section>

        <section className="player-card" aria-label="当前播放">
          <div className="cover" aria-hidden="true">
            <span className="cover-ring ring-one" />
            <span className="cover-ring ring-two" />
            <span className="cover-core">原</span>
          </div>
          <div className="player-content">
            <div className="player-meta"><span>最新一课</span><span>{active.date}</span></div>
            <h2>{active.title}</h2>
            <p>{active.description}</p>
            <div className="controls">
              <button className="play" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
                {playing ? 'Ⅱ' : '▶'}
              </button>
              <div className="timeline">
                <input type="range" min="0" max={duration || 0} value={time} onChange={seek} aria-label="播放进度" />
                <div className="time"><span>{formatTime(time)}</span><span>{duration ? formatTime(duration) : active.duration}</span></div>
              </div>
            </div>
            <audio
              ref={audioRef}
              preload="metadata"
              src={`${base}${active.audio}`}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setPlaying(false)}
            />
            <a className="transcript" href={`${base}${active.transcript}`} target="_blank" rel="noreferrer">阅读纯文本全文 ↗</a>
          </div>
        </section>

        <section className="archive">
          <div className="section-heading">
            <div><span>ARCHIVE</span><h2>往期课程</h2></div>
            <strong>{episodes.length} EPISODE{episodes.length === 1 ? '' : 'S'}</strong>
          </div>
          <div className="episode-list">
            {episodes.map((episode, index) => (
              <button key={episode.slug} className={`episode ${active.slug === episode.slug ? 'active' : ''}`} onClick={() => setActive(episode)}>
                <span className="episode-index">{String(episodes.length - index).padStart(2, '0')}</span>
                <span className="episode-main"><strong>{episode.title}</strong><small>{episode.category} · {episode.date}</small></span>
                <span className="episode-duration">{episode.duration}</span>
                <span className="episode-play">▶</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer><span>世界运行原理 · 每日一课</span><span>理解，而不只是知道。</span></footer>
    </div>
  )
}

export default App
