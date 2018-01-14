function calculate() {
    /*var read = parseInt(document.getElementById('pagesread').value);
    if (read > 0) {
        var unread = (<?php echo $Pages; ?> - read);
    } else {
        var unread = <?php echo $Pages; ?>;
    }*/
    var wpm = parseInt($("#WPM").val().replace(/,/g, ''), 10);
    var words = parseInt($("#Wordcount").html().replace(/,/g, ''), 10);
    var mins = words / wpm;
    var esthr = Math.floor(mins / 60);
    var estmin = Math.floor(mins - esthr * 60);
    var month = Math.floor(mins / 30);

    $("#estHr").html(esthr);
    $("#estMin").html(estmin);
    $("#month").html(month);
    $("#results").removeClass("hidden");
}

function readtime() {
    var b = '';
    var t0 = '';
    if (($("#timing").html() == "Start reading") || ($("#timing").html() == "Test again")){
      $("#timing").html("Timing...");
      b = new Date();
      T0 = b.getTime();
     } 
     else if ($("#timing").html() == "Timing..."){
      $("#timing").html("Test again");
      var a = new Date();
      var T1 = a.getTime();
      var elapsed = (T1 - T0);
      var minutes = (elapsed / 60000);
      var description = $("#description").html();
      description = description.replace(/<[^>]*>/g," ");
      description = description.replace(/\s+/g," ");
      description = description.trim();
      var words = description.split(" ").length;
      console.log(words);
      var WPM = Math.round(words/minutes);
      $("#WPMResult").html(WPM);
      $("#CalcWPM").removeClass('hidden');
      $("#WPM").val(WPM);
      calculate();
     }
  }