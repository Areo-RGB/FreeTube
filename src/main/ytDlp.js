import { spawn } from 'node:child_process'
import { isFreeTubeUrl } from './utils'

const DOWNLOAD_DIR = 'G:\\Videos\\freetube'
const ID_REGEX = /^[\w-]{11}$/

/**
 * @param {import('electron').IpcMainInvokeEvent} event
 * @param {string} videoId
 * @param {boolean} audioOnly
 * @returns {Promise<string | null>} null on success, otherwise the error message
 */
export function handleYtDlpDownload(event, videoId, audioOnly) {
  if (!isFreeTubeUrl(event.senderFrame.url) || typeof videoId !== 'string' || !ID_REGEX.test(videoId)) {
    return Promise.resolve('Invalid request')
  }

  const args = audioOnly
    ? ['-f', 'ba/b', '-x']
    : ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4', '--remux-video', 'mp4']

  args.push('-P', DOWNLOAD_DIR, '--', `https://www.youtube.com/watch?v=${videoId}`)

  return new Promise((resolve) => {
    const child = spawn('yt-dlp', args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true })

    let stderr = ''
    child.stderr.on('data', (data) => { stderr += data })

    child.on('error', (error) => {
      resolve(error.code === 'ENOENT' ? 'yt-dlp not found in PATH' : error.message)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(null)
        return
      }

      console.error(`yt-dlp exited with code ${code}\n${stderr}`)

      const lines = stderr.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0)
      const errorLines = lines.filter(line => line.startsWith('ERROR:'))
      resolve(errorLines.at(-1) ?? lines.at(-1) ?? `yt-dlp exited with code ${code}`)
    })
  })
}
