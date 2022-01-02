import express from 'express';
import controller from '../controllers/index';
import staticctrl from '../controllers/staticctrl';
const router = express.Router();

//health check
router.get('/hc', staticctrl.health);

router.get('/', controller.getPosts);
router.get('/posts/:id', controller.getPost);
router.put('/posts/:id', controller.updatePost);
router.delete('/posts/:id', controller.deletePost);
router.post('/posts', controller.addPost);

export = router;