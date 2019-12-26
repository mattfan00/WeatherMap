var mongoose = require("mongoose")

var favRouteSchema = new mongoose.Schema({
  startLocation: String,
  startLat: Number,
  startLng: Number,
  endLocation: String,
  endLat: Number,
  endLng: Number
})

module.exports = mongoose.model("FavRoute", favRouteSchema)