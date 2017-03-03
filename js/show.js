function showDetail() {
  $(window).unbind("resize");
  $('body, html').css('overflow', 'hidden');
  var width = $(window).width();
  $('body, html').css('overflow', 'auto');
  $('div#bToolsWindow').remove();
  var bs = findBootstrapEnvironment();
  if (bs == undefined) { bs = 'N/A' };
  $('body').append('<div title="hide" alt="hide" class="bt-window" id="bToolsWindow"></div>')
  $(".bt-window").append('<span class="bt-version">Bootstrap v4.0.0-alpha.5</span>');
  $(".bt-window").append('<label><input type="checkbox" id="grid" /> Grid</label>');
  $(".bt-window").append('<label><input type="checkbox" id="rows" /> Rows</label>');
  $(".bt-window").append('<label><input type="checkbox" id="cols" /> Cols</label>');
  $(".bt-window").append('<button class="bt-breakpoint" id="b4xs">xs</button>');
  $(".bt-window").append('<button class="bt-breakpoint" id="b4sm">sm</button>');
  $(".bt-window").append('<button class="bt-breakpoint" id="b4md">md</button>');
  $(".bt-window").append('<button class="bt-breakpoint" id="b4lg">lg</button>');
  $(".bt-window").append('<button class="bt-breakpoint" id="b4xl">xl</button>');
  $(".bt-window").append('<span class="bt-current-prefix">' + bs + '</span>');
  $(".bt-window").append('<input class="bt-window-with" type="text" id="bToolsWindowWith" value="' + width + '">px</span>');
  $('body').scrollTop($('body').scrollTop() - 1, function () { $('body').scrollTop() + 1 });
  $(window).resize(function () { showDetail() });
}
function findBootstrapEnvironment() {
  var envValues = ["xs", "sm", "md", "lg", "xl"];
  var $el = $('<div>');
  $el.appendTo($('body'));

  for (var i = envValues.length - 1; i >= 0; i--) {
    var envVal = envValues[i];
    $el.addClass('hidden-' + envVal);
    if ($el.is(':hidden')) {
      $el.remove();
      return envVal
    }
  };
}

showDetail();