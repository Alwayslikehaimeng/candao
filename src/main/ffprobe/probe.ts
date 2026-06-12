import { exec } from 'child_process'
import { promisify } from 'util'
import { statSync } from 'fs'
import type { VideoInfo } from '../../shared/types'

const execAsync = promisify(exec)

export async function probeVideo(filePath: string): Promise<VideoInfo> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    )
    const data = JSON.parse(stdout)

    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video')

    // 解析帧率（如 "30000/1001" → 29.97）
    let frameRate = 0
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/')
      if (parts.length === 2 && parseInt(parts[1]) > 0) {
        frameRate = Math.round((parseInt(parts[0]) / parseInt(parts[1])) * 100) / 100
      }
    }

    // 获取文件大小
    let fileSize = 0
    try {
      fileSize = statSync(filePath).size
    } catch {}

    return {
      duration: Math.round(parseFloat(data.format?.duration || '0')),
      resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
      codec: videoStream?.codec_name || 'unknown',
      bitrate: parseInt(data.format?.bit_rate || '0'),
      frame_rate: frameRate,
      file_size: fileSize
    }
  } catch {
    // ffprobe 不可用时返回默认值
    let fileSize = 0
    try {
      fileSize = statSync(filePath).size
    } catch {}
    return {
      duration: 0,
      resolution: 'unknown',
      codec: 'unknown',
      bitrate: 0,
      frame_rate: 0,
      file_size: fileSize
    }
  }
}
