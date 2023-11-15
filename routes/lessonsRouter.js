const express = require("express");
const lessonsController = require("./../controllers/lessonsController");
const router = express.Router();

//retrieve data about lessons
router.route('/').get(lessonsController.getCategories);
router.route('/:category').get(lessonsController.getCategoryContent);
router.route('/celestialobjects/:coC').get(lessonsController.getCoContent);
router.route('/celestialobjects/:coC/:body').get(lessonsController.getBody);

module.exports = router;