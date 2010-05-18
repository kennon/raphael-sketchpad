var transmission_errors = 0;
var last_message_time = 1;

function recvPath(data, sketchpad) {
  if( data && data.paths ) {
    for( var i = 0; i < data.paths.length; i++ ) {
      var path = data.paths[i];

      if( path.timestamp > last_message_time ) {
        last_message_time = path.timestamp;
      }

      sketchpad.pushStroke(path.path);
    }
    
    sketchpad.redraw();
  }

  $.ajax({
    cache: false,
    type: "GET",
    async: true,
    timeout: 60000,
    url: "/recv",
    dataType: "json",
    data: { since: last_message_time },
    success: function (data) {
      transmission_errors = 0;
      recvPath(data, sketchpad);
    },
    error: function(req, status, error) {
      transmission_errors += 1;
      console.log('error called!');
      if( transmission_errors < 10 ) {
        setTimeout(function() {recvPath(null, sketchpad);}, 10*1000);
      }
    }    
  });  
}

function sendPath(path) {
  $.ajax({
    cache: false,
    url: "/send",
    dataType: "json",
    data: { path: JSON.stringify(path) },
    success: function (data) {
      transmission_errors = 0;
    }
    // error: function() {
    //   transmission_errors += 1;
    //   if( transmission_errors < 10 ) {
    //     setTimeout(function() {sendPath(path); }, 5*1000);
    //   }
    // }
  });
}

$(document).ready(function() {
	var sketchpad = Raphael.sketchpad("editor", { 
		width: $('#editor').width(),
		height: $('#editor').height(),
		input: "data2"
	});
	recvPath(null, sketchpad);
  console.log('loaded.');
  
	function enable(element, enable) {
		if (enable) {
			$(element).removeClass("disabled");
		} else {
			$(element).addClass("disabled");
		}
	};

	function select(element1, element2) {
		$(element1).addClass("selected");
		$(element2).removeClass("selected");
	}

	$("#editor_undo").click(function() {
		sketchpad.undo();
	});
	$("#editor_redo").click(function() {
		sketchpad.redo();
	});
	$("#editor_clear").click(function() {
		sketchpad.clear();
	});
	$("#editor_animate").click(function() {
		sketchpad.animate();
	});
	
	$("#editor_thin").click(function() {
		select("#editor_thin", "#editor_thick");
		sketchpad.pen().width(5);
	});
	$("#editor_thick").click(function() {
		select("#editor_thick", "#editor_thin");
		sketchpad.pen().width(15);
	});
	$("#editor_solid").click(function() {
		select("#editor_solid", "#editor_fuzzy");
		sketchpad.pen().opacity(1);
	});
	$("#editor_fuzzy").click(function() {
		select("#editor_fuzzy", "#editor_solid");
		sketchpad.pen().opacity(0.3);
	});
	$("#editor_black").click(function() {
		select("#editor_black", "#editor_red");
		sketchpad.pen().color("#000");
	});
	$("#editor_red").click(function() {
		select("#editor_red", "#editor_black");
		sketchpad.pen().color("#f00");
	});

	sketchpad.change(function(path) {
		enable("#editor_undo", sketchpad.undoable());
		enable("#editor_redo", sketchpad.redoable());
		enable("#editor_clear", sketchpad.strokes().length > 0);
		
    if( path )
    {
      sendPath(path);
    }		
	});
});
