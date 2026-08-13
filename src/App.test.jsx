// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

const play = vi.fn(() => Promise.resolve())
const pause = vi.fn()

beforeEach(() => {
  location.hash = '#/'
  play.mockClear()
  pause.mockClear()
  Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play })
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: pause })
  Object.defineProperty(HTMLMediaElement.prototype, 'load', { configurable: true, value: vi.fn() })
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get: () => true })
  window.scrollTo = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(cleanup)

describe('continuous player behavior', () => {
  it('starts the selected recent course immediately', async () => {
    render(<App />)
    const recentCourse = screen.getByText('临床试验为什么能接近因果答案？')
    await userEvent.click(recentCourse.closest('button'))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
  })

  it('starts a selected history course immediately without leaving history', async () => {
    location.hash = '#/history'
    render(<App />)
    expect(screen.getByRole('heading', { name: '历史课程' })).toBeTruthy()
    const historyCourse = screen.getByText('商业银行为什么能创造货币？')
    await userEvent.click(historyCourse.closest('button'))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('heading', { name: '历史课程' })).toBeTruthy()
  })

  it('opens the transcript as an in-site rendered article and keeps the player mounted', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('# 示例标题\n\n这是正文。\n\n## 核心结论\n\n结论内容。') }))
    render(<App />)
    const audio = document.querySelector('audio')
    await userEvent.click(screen.getByRole('button', { name: '阅读完整文章' }))
    expect(await screen.findByRole('heading', { name: '示例标题' })).toBeTruthy()
    expect(screen.getByText('这是正文。')).toBeTruthy()
    expect(document.querySelector('audio')).toBe(audio)
    expect(location.hash).toContain('#/article/')
  })

  it('keeps audio playing while navigating from home to history', async () => {
    render(<App />)
    const audio = document.querySelector('audio')
    fireEvent.play(audio)
    await userEvent.click(screen.getByRole('button', { name: '历史课程' }))
    expect(screen.getByRole('heading', { name: '历史课程' })).toBeTruthy()
    expect(pause).not.toHaveBeenCalled()
    expect(document.querySelector('audio')).toBe(audio)
  })
})
