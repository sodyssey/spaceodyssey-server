const express = require("express");
const lessonsController = require("./../controllers/lessonsController");
const router = express.Router();

//retrieve data about lessons
router.route('/').get(lessonsController.getCategories);
router.route('/:category').get(lessonsController.getCategoryContent);
router.route('/celestialobjects/:coC').get(lessonsController.getCoContent);
router.route('/celestialobjects/:coC/:body').get(lessonsController.getBody);
router.route('/events/:event').get(lessonsController.getBodyData);
router.route('/missions/:mission').get(lessonsController.getBodyData);
router.route('/missions/ISS/peopleInSpace').get(lessonsController.getPeopleInISS);
router.route('/missions/Mars_rover/:date').get(lessonsController.getMarsImages);



module.exports = router;