$(document).ready(function() {
  $(".routeSelect").click(function() {
    $("#routeId").attr("value", this.id)
    $("#main-form").submit()
  })
})