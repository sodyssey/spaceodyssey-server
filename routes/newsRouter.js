const express = require("express");
const newsController = require("./../controllers/newsController");
const router = express.Router();

//give a list of news-agencies
space_agencies = ["NASA", "ESA", "Roscosmos", "CNSA", "ISRO", "JAXA", "CSA", "UK Space Agency", "ASAL", "CONAE", "ISA", "KARI", "UAE Space Agency", "Israel Space Agency", "NSAU",]

module.exports = router;