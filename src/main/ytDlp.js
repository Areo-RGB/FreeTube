import { spawn } from 'node:child_process'
import { isFreeTubeUrl } from './utils'

const DOWNLOAD_DIR = 'G:\\Videos\\freetube'
const ID_REGEX = /^[\w-]{11}$/

/**
 * @param {import('electron').IpcMainInvokeEvent} event
 * @param {string} videoId
 * @param {boolean} audioOnly
 * @returns {Promise<boolean>}
 */
export function handleYtDlpDownload(event, videoId, audioOnly) {
  if (!isFreeTubeUrl(event.senderFrame.url) || typeof videoId !== 'string' || !ID_REGEX.test(videoId)) {
    return Promise.resolve(false)
  }

  const args = audioOnly
    ? ['-f', 'ba/b', '-x']
    : ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4', '--remux-video', 'mp4']

  args.push('-P', DOWNLOAD_DIR, '--', `https://www.youtube.com/watch?v=${videoId}`)

  return new Promise((resolve) => {
    const child = spawn('yt-dlp', args, { stdio: 'ignore', windowsHide: true })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}
