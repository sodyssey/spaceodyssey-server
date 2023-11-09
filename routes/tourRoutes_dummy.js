const express = require("express");
const tourController = require("./../controllers/tourController"); //this format, instead of using path, helps intellisense
const authController = require("./../controllers/authController");
const router = express.Router();


//for route '/api/v1/tours/tour-stats'
router.route('/tour-stats').get(tourController.getStats);
//for route '/api/v1/tours/monthly-plan/:year'
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
//for route '/api/v1/tours/'
router.route('/').get(authController.protect, tourController.getAllTours).post(tourController.createTour);
//for route '/api/v1/tours/id'
router.route('/:id').get(tourController.getTour).patch(tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin','lead-guide') ,tourController.deleteTour);

module.exports = router;