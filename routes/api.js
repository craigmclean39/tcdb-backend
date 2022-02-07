var express = require('express');
var router = express.Router();

//Controllers
const podcast_controller = require('../controllers/podcastController');

// GET request for list of all podcasts.
router.get('/podcasts', podcast_controller.podcast_list);

// GET request for single podcast
router.get('/podcast/:id', podcast_controller.podcast_detail);

// POST Delete for single podcast
router.post('/podcast/:id/delete', podcast_controller.podcast_delete);

// GET request for all podcast episodes
router.get('/podcast/:id/episodes', podcast_controller.podcast_episodes);

// GET request for a single podcast episode
router.get('/episode/:id', podcast_controller.podcast_episode_detail);

// POST request for creating Podcast.
router.post('/podcast/create', podcast_controller.podcast_create_post);

// GET request to do a search
router.post('/search', podcast_controller.search);

router.post('/populate', podcast_controller.populate);

module.exports = router;
