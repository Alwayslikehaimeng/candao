import { exec } from 'child_process'
import { promisify } from 'util'
import type { VideoInfo } from '../../shared/types'

const execAsync = promisify(exec)

export async function probeVideo(filePath: string): Promise<VideoInfo> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    )
    const data = JSON.parse(stdout)

    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video')

    return {
      duration: Math.round(parseFloat(data.format?.duration || '0')),
      resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
      codec: videoStream?.codec_name || 'unknown',
      bitrate: parseInt(data.format?.bit_rate || '0')
    }
  } catch {
    // ffprobe 不可用时返回默认值
    return {
      duration: 0,
      resolution: 'unknown',
      codec: 'unknown',
      bitrate: 0
    }
  }
}
