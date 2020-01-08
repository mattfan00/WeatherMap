var request = require("request")


module.exports.getRoutes = function(req, res) {
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
}

module.exports.loadResult = function(req, res) {
  if (req.query.routeId != "") {
    FavRoute.findById(req.query.routeId, function(err, foundRoute) {
        if (err) {
          console.log(err)
        } else {
          loadWeatherData(foundRoute.route, true).then(function(filteredData) {
            res.render("results", {
              startLocation:foundRoute.startLocation,
              endLocation:foundRoute.endLocation,
              data:filteredData
            })
          })
        }
    })
  } else {
    var startLocation = req.query.start.split(' ').join('+')
    var endLocation = req.query.end.split(' ').join('+')
    var mapsURL = "https://maps.googleapis.com/maps/api/directions/json?origin=" + startLocation + "&destination=" + endLocation + "&key=AIzaSyBJNeer3QfoD1Jex9H1lOoxtfXKRkKYzik"
    var directionsPromise = getDirectionsData(mapsURL)
    directionsPromise.then(function(result) {
      loadAllLocationNames(result).then(function(allLocationNames) {
        loadWeatherData(allLocationNames, false).then(function(completeData) {
          filteredData = filterData(completeData)
          if (req.query.isFavRoute != null) {
            FavRoute.create({
              startLocation:req.query.start,
              endLocation:req.query.end,
              route:filterData(allLocationNames)
            }, function(err, newRoute){
              req.user.favRoutes.push(newRoute)
              req.user.save()
            })
          }
          res.render("results", {
            startLocation:req.query.start,
            endLocation:req.query.end,
            data:filteredData
          })
        })
      })
    })
  }
}


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
  var allLocations = locations.map(a => Object.assign({}, a)) // creates a copy of locations array 
  for (var i = 0; i < locations.length; i++) {
    var geocodeURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + locations[i].lat + "," + locations[i].lng + "&key=AIzaSyBJNeer3QfoD1Jex9H1lOoxtfXKRkKYzik"
    geocodeRequest = getGeocode(geocodeURL)
    await geocodeRequest.then(function(result) {
      allLocations[i].name = result
    })
  }
  return allLocations
}

async function loadWeatherData(locations, saved) {
  var weatherRequest = null
  if (!saved) {
    var locations = locations.map(a => Object.assign({}, a)) // creates a copy of locations array
  }
  for (var i = 0; i < locations.length; i++) {
    var weatherURL = "https://api.darksky.net/forecast/bdb26ed30749fa159aa832d2d415056a/" + locations[i].lat + "," + locations[i].lng
    weatherRequest = getWeather(weatherURL)
    await weatherRequest.then(function(result) {
      locations[i].weatherStats = result
    })
  }
  return locations
}


function filterData(data) {
  var checkedCities = []
  var filteredData = []
  for (var i = 0; i < data.length; i++) {
    if (!checkedCities.includes(data[i].name)) {
      filteredData.push(data[i])
      checkedCities.push(data[i].name)
    }
  }
  return filteredData
}