const express = require("express");
const lessonsController = require("./../controllers/lessonsController");
const router = express.Router();

//retrieve data about lessons
//get list of categories available to us
router.route('/').get(lessonsController.getCategories);

//for each category return the list of available bodies
router.route('/:category').get(lessonsController.getCategoryContent);

//for each body display respective data
router.route('/:category/:body').get(lessonsController.getBodyData);

module.exports = router;