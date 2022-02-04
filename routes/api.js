var express = require('express');
var router = express.Router();

//Controllers
const podcast_controller = require('../controllers/podcastController');

// GET request for list of all Genre.
router.get('/podcasts', podcast_controller.podcast_list);

module.exports = router;
