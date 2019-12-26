var express = require("express"),
    app = express(),
    request = require("request"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser")
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user.js"),
    FavRoute = require("./models/route.js")

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

// FavRoute.create({
//   startLocation: "New York City",
//   startLat: 40.7124773,
//   startLng: -74.0062007,
//   endLocation: "Cornell",
//   endLat: 42.4427379,
//   endLng: -76.46980649999999
// }, function(err, newFavRoute) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(newFavRoute)
//   }
// })


app.get("/", function(req, res) {
  console.log(req.user)
  if(req.user) {
    User.findById(req.user.id).populate("favRoutes").exec(function(err, user) {
      if(err) {
        console.log(err)
      } else {
        console.log(user)
        res.render("index", {routes:user.favRoutes})
      }
    })
  } else {
    res.render("index", {routes:null})
  }
  // FavRoute.find({}, function(err, foundRoutes) {
  //   if(err) {
  //     console.log(err)
  //   } else {
  //     res.render("index", {routes:foundRoutes})
  //   }
  // })
})

app.get("/results", function(req, res) {
  console.log(req.query)
  if (req.query.routeId != "") {
    FavRoute.findById(req.query.routeId, function(err, foundRoute) {
      if (err) {
        console.log(err)
      } else {
        var startWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + foundRoute.startLat + "," + foundRoute.startLng
        var endWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + foundRoute.endLat + "," + foundRoute.endLng
        request(startWeatherURL, function(error, response, body) {
          var startWeatherData = JSON.parse(body)
          request(endWeatherURL, function(error, response, body) {
            var endWeatherData = JSON.parse(body)
            res.render("results", {
              startLocation:foundRoute.startLocation, 
              endLocation:foundRoute.endLocation, 
              startWeather: startWeatherData,
              endWeather: endWeatherData
            })
          })
        })
      }
    })
  } else {
    var startLocation = req.query.start.split(' ').join('+')
    var endLocation = req.query.end.split(' ').join('+')
    var mapsURL = "https://maps.googleapis.com/maps/api/directions/json?origin=" + startLocation + "&destination=" + endLocation + "&key=AIzaSyBJNeer3QfoD1Jex9H1lOoxtfXKRkKYzik"
    request(mapsURL, function(error, response, body) {
      var distanceData = JSON.parse(body)
      var startCoordinate = distanceData.routes[0].legs[0].start_location
      var endCoordinate = distanceData.routes[0].legs[0].end_location
      console.log("Start Location: " + startCoordinate.lat + ", " + startCoordinate.lng)
      console.log("End Location: " + endCoordinate.lat + ", " + endCoordinate.lng)
      var startWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + startCoordinate.lat + "," + startCoordinate.lng
      var endWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + endCoordinate.lat + "," + endCoordinate.lng
      request(startWeatherURL, function(error, response, body) {
        var startWeatherData = JSON.parse(body)
        request(endWeatherURL, function(error, response, body) {
          var endWeatherData = JSON.parse(body)
          if (req.query.isFavRoute != null) {
            FavRoute.create({
              startLocation:req.query.start,
              startLat: startCoordinate.lat,
              startLng: startCoordinate.lng,
              endLocation:req.query.end,
              endLat: endCoordinate.lat,
              endLng: endCoordinate.lng,
            }, function(err, newRoute) {
              if (err) {
                console.log(err)
              } else {
                console.log(newRoute)
                req.user.favRoutes.push(newRoute)
                req.user.save()
              }
            })
          }
          res.render("results", {
            startLocation:req.query.start, 
            endLocation:req.query.end, 
            startWeather: startWeatherData,
            endWeather: endWeatherData
          })
        })
      })
      
    })
  }
})

// AUTH ROUTES =============================================

app.get("/register", function(req, res) {
  res.render("register")
})

app.post("/register", function(req, res) {
  User.register(new User({username:req.body.username}), req.body.password, function(err, newUser) {
    if (err) {
      console.log(err)
    } else {
      console.log(newUser)
      passport.authenticate("local")(req, res, function(){ 
        res.redirect("/")
      })
    }
  })
})

app.get("/login", function(req, res) {
  res.render("login")
})

app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login"
}), function(req, res) {
})

app.get("/logout", function(req, res){
  console.log(req.user.username + " has logged out")
  req.logout()
  res.redirect("/")
})


app.listen(3000, function() {
  console.log("weathermap server started")
})