$(document).ready(function() {
  $(".routeSelect").click(function() {
    $("#routeId").attr("value", this.id)
    $("#main-form").submit()
  })

  $(".favButton").popup()
  
  $(".favButton").click(function() {
    $(".favButton>i").toggleClass("outline")
    if($("#favRoute").is(":checked") == false) {
      $("#favRoute").prop("checked", true)
    } else {
      $("#favRoute").prop("checked", false)
    }
  })

  $(".submitButton").click(function() {
    $(".submitButton").addClass("loading")
  })

})