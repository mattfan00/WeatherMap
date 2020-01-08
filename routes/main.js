var express = require("express"),
    router = express.Router(),
    routeHelpers = require("../helpers/index.js")



router.get("/", routeHelpers.getRoutes)

router.get("/results", routeHelpers.loadResult)

module.exports = router