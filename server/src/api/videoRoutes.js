/**
 * 视频工厂 API
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { VideoTask, Content } from '../services/DatabaseService.js';

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

export default router;
