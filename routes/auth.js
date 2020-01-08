var express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    authHelpers = require("../helpers/auth.js")

router.get("/register", function(req, res) {
  res.render("register")
})

router.post("/register", authHelpers.register)

router.get("/login", function(req, res) {
  res.render("login")
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login"
}), function(req, res) {
})

router.get("/logout", authHelpers.logout)

module.exports = router