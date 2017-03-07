/**
 * Created by shmel on 3/6/17.
 */
(function(){
    var cache = {};

    this.tmpl = function tmpl(str, data){
        // Figure out if we're getting a template, or if we need to
        // load the template - and be sure to cache the result.
        var fn = !/\W/.test(str) ?
            cache[str] = cache[str] ||
                tmpl(document.getElementById(str).innerHTML) :

            // Generate a reusable function that will serve as a template
            // generator (and which will be cached).
            new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +

                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +

                // Convert the template into pure JavaScript
                str
                    .replace(/[\r\t\n]/g, " ")
                    .split("<%").join("\t")
                    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                    .replace(/\t=(.*?)%>/g, "',$1,'")
                    .split("\t").join("');")
                    .split("%>").join("p.push('")
                    .split("\r").join("\\'")
                + "');}return p.join('');");

        // Provide some basic currying to the user
        return data ? fn( data ) : fn;
    };
})();
function get_bootstrap_version() {
    var re = new RegExp('bootstrap.*\.css$')
    var re_version = new RegExp('Bootstrap v([0-9]+)');
    return new Promise(function(resolve, reject) {
        var style_elem = document.querySelectorAll('link[rel="stylesheet"]');
        var bootstrap_css_found = false;
        console.log('get bootstrap version');
        for(var i  = 0; i < style_elem.length; i++) {
            var link = style_elem.item(i);
            console && console.log(link.href);
            if(re.test(link.href)) {
                bootstrap_css_found = true;
                var xhr = new XMLHttpRequest();
                xhr.open("GET", link.href, true);
                xhr.onreadystatechange = function () {
                    if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                        try {
                            var version_string = xhr.responseText.split('\n')[1];
                            console && console.log(version_string);
                            var matches = version_string.match(re_version);
                            resolve({version_string: matches[0], version_number: parseInt(matches[1])});
                        }
                        catch(e) {
                            reject(chrome.i18n.getMessage("errorVersionStringNotFound"));
                        }
                    }
                };
                xhr.send();
                break;
            }
        }
        if(bootstrap_css_found === false)
        {
            reject(chrome.i18n.getMessage("errorNoBootstrap"));
        }
    });
}
function get_sizes(bootstrap_version) {
    var sizes = {
        '3': [
            {title: 'lg', width: 1200},
            {title: 'md', width: 992},
            {title: 'sm', width: 768},
            {title: 'xs', width: 305}
        ],
        '4': [
            {title: 'xl', width: 1200},
            {title: 'lg', width: 992},
            {title: 'md', width: 768},
            {title: 'sm', width: 544},
            {title: 'xs', width: 305}
        ]
    };
    console.log(bootstrap_version, sizes[bootstrap_version.toString()]);
    return sizes[bootstrap_version.toString()] || [];
}
function on_window_resize() {
    clearTimeout(resize_timout);
    resize_timout = setTimeout(function () {
        document.getElementById('bToolsWindowWith').value = window.outerWidth;
    }, 200);
}
function set_window_size(width) {
    return new Promise(function(resolve, reject) {
        if (window.outerWidth == width) {
            resolve();
        }
        else
        {
            chrome.runtime.sendMessage({action: "resize_window", options: {width: width, left: 0, top: 0}}, resolve);
        }
    });
}
function on_change_tools_window_width() {
    console.log('change input', this.value);
    set_window_size(parseInt(this.value));
}
var resize_timout = null;
var bootstrap_version = null;
var initial_window_width = window.outerWidth;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.event == "show_toolbar") {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", chrome.runtime.getURL('toolbar.tpl.html'), true);
        xhr.onreadystatechange = function () {
            if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                var body = document.querySelector('body');
                body.innerHTML += xhr.responseText;
                get_bootstrap_version().then(function(result){
                    bootstrap_version = result.version_number;
                    body.innerHTML += tmpl('bt_toolbar', {bootstrap_version: result.version_string, sizes: get_sizes(result.version_number), prefix: "", window_width: window.outerWidth, initial_window_width: initial_window_width})
                    window.addEventListener('resize', on_window_resize);
                    document.querySelectorAll('.bt-breakpoint').forEach(function(breakpoint){
                       breakpoint.addEventListener('click', function(){
                           set_window_size(parseInt(this.getAttribute('data-width')));
                       });
                    });
                    document.getElementById('bToolsWindowWith').addEventListener('change', on_change_tools_window_width);
                    document.getElementById('grid').addEventListener('change', function(){

                    });
                }, function(error){
                    console && console.error(error);
                    body.innerHTML += tmpl('bt_toolbar', {bootstrap_version: error, sizes: [], prefix: "", window_width: window.outerWidth, initial_window_width: initial_window_width})
                    window.addEventListener('resize', on_window_resize);
                    document.getElementById('bToolsWindowWith').addEventListener('change', on_change_tools_window_width);
                });
            }
        }
        xhr.send();
    }
    else if(request.event == "hide_toolbar") {
        document.querySelectorAll('#bt_toolbar').forEach(function(el){
            el.parentNode.removeChild(el);
        });
        document.querySelectorAll('#bToolsWindow').forEach(function(el){
            el.parentNode.removeChild(el);
        });
        window.removeEventListener('resize', on_window_resize);
    }
});