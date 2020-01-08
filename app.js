var express = require("express"),
    app = express(),
    request = require("request"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser")
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user.js"),
    FavRoute = require("./models/route.js")
  
var mainRoutes = require("./routes/main.js"),
    authRoutes = require("./routes/auth.js")

mongoose.connect("mongodb://localhost:27017/weathermap", {useNewUrlParser: true, useUnifiedTopology: true})
app.use(express.static(__dirname + "/public"))

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended:true}))

// PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "this is my secret",
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// PASS IN THE CURRENT USER TO EVERY ROUTE
app.use(function(req, res, next) {
  res.locals.currentUser = req.user
  next()
})


// ROUTES =========================================================================

app.use(mainRoutes)
app.use(authRoutes)

// AUTH ROUTES ==================================================================


app.listen(3000, function() {
  console.log("weathermap server started")
})