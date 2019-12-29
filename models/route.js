var mongoose = require("mongoose")

var favRouteSchema = new mongoose.Schema({
  startLocation: String,
  endLocation: String,
  route: [{
    _id: false,
    lat: Number,
    lng: Number,
    name: String
  }]
  
})

module.exports = mongoose.model("FavRoute", favRouteSchema)