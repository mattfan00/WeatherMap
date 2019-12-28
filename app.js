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
  if(req.user) {
    User.findById(req.user.id).populate("favRoutes").exec(function(err, user) {
      if(err) {
        console.log(err)
      } else {
        res.render("index", {routes:user.favRoutes})
      }
    })
  } else {
    res.render("index", {routes:null})
  }
})


app.get("/results", function(req, res) {
  var startLocation = req.query.start.split(' ').join('+')
  var endLocation = req.query.end.split(' ').join('+')
  var mapsURL = "https://maps.googleapis.com/maps/api/directions/json?origin=" + startLocation + "&destination=" + endLocation + "&key=AIzaSyBJNeer3QfoD1Jex9H1lOoxtfXKRkKYzik"
  var directionsPromise = getDirectionsData(mapsURL)
  directionsPromise.then(function(result) {
    loadAllLocationNames(result).then(function(allLocationNames) {
      loadWeatherData(allLocationNames).then(function(completeData) {
        console.log(completeData)
        res.render("results", {
          startLocation:req.query.start,
          endLocation:req.query.end,
          data:completeData
        })
      })
    })
  })
  // if (req.query.routeId != "") {
  //   FavRoute.findById(req.query.routeId, function(err, foundRoute) {
  //     if (err) {
  //       console.log(err)
  //     } else {
  //       var startWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + foundRoute.startLat + "," + foundRoute.startLng
  //       var endWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + foundRoute.endLat + "," + foundRoute.endLng
  //       request(startWeatherURL, function(error, response, body) {
  //         var startWeatherData = JSON.parse(body)
  //         request(endWeatherURL, function(error, response, body) {
  //           var endWeatherData = JSON.parse(body)
  //           res.render("results", {
  //             startLocation:foundRoute.startLocation, 
  //             endLocation:foundRoute.endLocation, 
  //             startWeather: startWeatherData,
  //             endWeather: endWeatherData
  //           })
  //         })
  //       })
  //     }
  //   })
  // } else {
  //   var startLocation = req.query.start.split(' ').join('+')
  //   var endLocation = req.query.end.split(' ').join('+')
  //   var mapsURL = "https://maps.googleapis.com/maps/api/directions/json?origin=" + startLocation + "&destination=" + endLocation + "&key=AIzaSyBJNeer3QfoD1Jex9H1lOoxtfXKRkKYzik"
  //   request(mapsURL, function(error, response, body) {
  //     var distanceData = JSON.parse(body)
  //     var startCoordinate = distanceData.routes[0].legs[0].start_location
  //     var endCoordinate = distanceData.routes[0].legs[0].end_location
  //     var startWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + startCoordinate.lat + "," + startCoordinate.lng
  //     var endWeatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + endCoordinate.lat + "," + endCoordinate.lng
  //     request(startWeatherURL, function(error, response, body) {
  //       var startWeatherData = JSON.parse(body)
  //       request(endWeatherURL, function(error, response, body) {
  //         var endWeatherData = JSON.parse(body)
  //         if (req.query.isFavRoute != null) {
  //           FavRoute.create({
  //             startLocation:req.query.start,
  //             startLat: startCoordinate.lat,
  //             startLng: startCoordinate.lng,
  //             endLocation:req.query.end,
  //             endLat: endCoordinate.lat,
  //             endLng: endCoordinate.lng,
  //           }, function(err, newRoute) {
  //             if (err) {
  //               console.log(err)
  //             } else {
  //               req.user.favRoutes.push(newRoute)
  //               req.user.save()
  //             }
  //           })
  //         }
  //         res.render("results", {
  //           startLocation:req.query.start, 
  //           endLocation:req.query.end, 
  //           startWeather: startWeatherData,
  //           endWeather: endWeatherData
  //         })
  //       })
  //     })
      
  //   })
  // }
})

function getDirectionsData(mapsURL) {
  return new Promise(function(resolve, reject) {
    request(mapsURL, function(err, response, body) {
      var distanceData = JSON.parse(body)
      var steps = distanceData.routes[0].legs[0].steps
      var wholeRoute = []
      for (var i = 0; i < steps.length; i += 7) {
        wholeRoute.push(steps[i].start_location)
      }
      wholeRoute.push(steps[steps.length-1].end_location)
      resolve(wholeRoute)
    })
  })
}

function getGeocode(geocodeURL) {
  return new Promise(function(resolve, reject) {
    request(geocodeURL, function(err, response, body) {
      var parsedData = JSON.parse(body) 
      resolve(parsedData.plus_code.compound_code.slice(8))
    })
  })
}

function getWeather(weatherURL) {
  return new Promise(function(resolve, reject) {
    request(weatherURL, function(err, response, body) {
      var parsedData = JSON.parse(body)
      var weatherStats = {}
      weatherStats.summary = parsedData.daily.data[0].summary
      weatherStats.temperatureMax = Math.round(parsedData.daily.data[0].temperatureMax)
      weatherStats.temperatureMin = Math.round(parsedData.daily.data[0].temperatureMin)
      weatherStats.precipType = parsedData.daily.data[0].precipType.charAt(0).toUpperCase() + parsedData.daily.data[0].precipType.slice(1)
      weatherStats.precipProb = Math.round(parsedData.daily.data[0].precipProbability * 100)
      resolve(weatherStats)
    })
  })
}

async function loadAllLocationNames(locations) {
  var geocodeRequest = null
  var allLocations = locations
  for (var i = 0; i < locations.length; i++) {
    var geocodeURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + locations[i].lat + "," + locations[i].lng + "&key=AIzaSyBJNeer3QfoD1Jex9H1lOoxtfXKRkKYzik"
    geocodeRequest = getGeocode(geocodeURL)
    await geocodeRequest.then(function(result) {
      allLocations[i].name = result
    })
  }
  return allLocations
}

async function loadWeatherData(locations) {
  var weatherRequest = null
  var allLocations = locations
  for (var i = 0; i < locations.length; i++) {
    var weatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + locations[i].lat + "," + locations[i].lng
    weatherRequest = getWeather(weatherURL)
    await weatherRequest.then(function(result) {
      allLocations[i].weatherStats = result
    })
  }
  return allLocations
}

// AUTH ROUTES ==================================================================

app.get("/register", function(req, res) {
  res.render("register")
})

app.post("/register", function(req, res) {
  User.register(new User({username:req.body.username}), req.body.password, function(err, newUser) {
    if (err) {
      console.log(err)
    } else {
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