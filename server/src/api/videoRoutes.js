/**
 * 视频工厂 API
 */
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { VideoTask, Content } from '../services/DatabaseService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 视频输出目录（相对于项目根目录）
const VIDEOS_DIR = path.resolve(process.cwd(), '..', 'uploads', 'videos');

const router = Router();
router.use(authenticate);

router.get('/tasks', async (req, res) => {
  const tasks = await VideoTask.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: tasks });
});

router.post('/generate', async (req, res) => {
  try {
    const { contentId, platform, topic, template } = req.body;

    let content;
    if (contentId) {
      content = await Content.findById(contentId);
    }

    const task = await VideoTask.create({
      contentId: content?._id,
      title: topic || content?.title || '视频任务',
      platforms: [platform || 'xiaohongshu'],
      template: template || 'xiaohongshu',
      status: 'pending',
      progress: 0,
    });

    res.json({ success: true, data: task, message: '视频任务已创建' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'xiaohongshu', name: '小红书风', duration: 60, ratio: '3:4' },
      { id: 'douyin', name: '抖音风', duration: 30, ratio: '9:16' },
      { id: 'bilibili', name: 'B站风', duration: 180, ratio: '16:9' },
    ],
  });
});

/**
 * GET /api/v1/video/files
 * 列出 uploads/videos/ 下所有可下载的 MP4 文件
 */
router.get('/files', async (req, res) => {
  try {
    const files = [];
    if (fs.existsSync(VIDEOS_DIR)) {
      const dirs = fs.readdirSync(VIDEOS_DIR).filter(d => fs.statSync(path.join(VIDEOS_DIR, d)).isDirectory());
      for (const dir of dirs) {
        const mp4s = fs.readdirSync(path.join(VIDEOS_DIR, dir)).filter(f => f.endsWith('.mp4'));
        for (const f of mp4s) {
          const fp = path.join(VIDEOS_DIR, dir, f);
          const stat = fs.statSync(fp);
          files.push({
            name: f,
            url: `/uploads/videos/${encodeURIComponent(dir)}/${encodeURIComponent(f)}`,
            size: Math.round(stat.size / 1024) + 'KB',
            created: stat.mtime.toISOString(),
          });
        }
      }
    }
    files.sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json({ success: true, data: files.slice(0, 20) }); // 最近20条
  } catch(e) {
    res.json({ success: true, data: [] });
  }
});

export default router;
