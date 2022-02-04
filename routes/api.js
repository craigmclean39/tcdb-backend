var express = require('express');
var router = express.Router();

//Controllers
const podcast_controller = require('../controllers/podcastController');

// GET request for list of all podcasts.
router.get('/podcasts', podcast_controller.podcast_list);

// GET request for single podcast
router.get('/podcast/:id', podcast_controller.podcast_detail);

// GET request for all podcast episodes
router.get('/podcast/:id/episodes', podcast_controller.podcast_episodes);

// GET request for a single podcast episode
router.get(
  '/podcast/:id/episode/:episodeid',
  podcast_controller.podcast_episode_detail
);

// POST request for creating Podcast.
router.post('/podcast/create', podcast_controller.podcast_create_post);

module.exports = router;
