const express = require("express");
const newsController = require("./../controllers/newsController");
const router = express.Router();

//give a list of news-agencies
router.route('/spaceAgencies').get(newsController.getNewsAgencies);
//returns
// offset = 0 => first 20 news
// offset = 20 => next 20 news
// offset = 40 => next 20 news... so on
router.route('/news/:offset').get(newsController.getNews);

module.exports = router;