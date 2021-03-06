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
    var re = new RegExp('(bootstrap.*\.css|style.*\.css|main.*\.css).*$');
    var re_version = new RegExp('Bootstrap v([0-9]+)[0-9a-zA-Z\.\-]+');
    return new Promise(function(resolve, reject) {
        var style_elem = document.querySelectorAll('link[rel="stylesheet"]');
        var promises = [];
        for(var i  = 0; i < style_elem.length; i++) {
            var link = style_elem.item(i);
            if(re.test(link.href)) {
                (function(link){
                    promises.push(
                        new Promise(function(resolve, reject) {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", link.href, true);
                            xhr.onreadystatechange = function () {
                                if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                                    var css_file = xhr.responseText.split('\n');

                                    for(var j = 0; j < css_file.length; j++)
                                    {
                                        var matches = css_file[j].match(re_version);
                                        if(matches && matches.length == 2)
                                        {
                                            console && console.log(css_file[j]);
                                            return resolve({
                                                version_string: matches[0],
                                                version_string_short: 'Bootstrap v'+parseInt(matches[1]),
                                                version_string_shortest: 'B'+parseInt(matches[1]),
                                                version_number: parseInt(matches[1])
                                            });
                                        }
                                    }
                                    resolve(undefined);
                                }
                                if(xhr.readyState == XMLHttpRequest.DONE) {
                                    reject('request error', xhr.status);
                                }

                            };
                            xhr.send();
                        })
                    );
                })(link);
            }
        }
        if(promises.length === 0) {
            reject(chrome.i18n.getMessage("errorNoBootstrap"));
        }
        else {
            Promise.all(promises).then(function (res) {
                res.some(function(v){
                    if(typeof v != "undefined")
                    {
                        resolve(v);
                        return true;
                    }
                });
                reject(chrome.i18n.getMessage('errorVersionStringNotFound'));
            }, function(err){
                reject(err);
            });
        }
    });
}
function get_sizes(bootstrap_version) {
    var sizes = {
        '3': [
            {title: 'xs', width: 305},
            {title: 'sm', width: 768},
            {title: 'md', width: 992},
            {title: 'lg', width: 1200}
        ],
        '4': [
            {title: 'xs', width: 305},
            {title: 'sm', width: 544},
            {title: 'md', width: 768},
            {title: 'lg', width: 992},
            {title: 'xl', width: 1200}
        ]
    };
    return sizes[bootstrap_version.toString()] || [];
}
function set_active_class_to_breakpoint(){
    document.querySelectorAll('.bt-breakpoint').forEach(function(breakpoint){
        var width = parseInt(breakpoint.getAttribute('data-width'));
        var max_width = nextElementSibling(breakpoint) && nextElementSibling(breakpoint).getAttribute('data-width')?parseInt(nextElementSibling(breakpoint).getAttribute('data-width')):Number.POSITIVE_INFINITY;
        if(window.outerWidth === width || (window.outerWidth > width && window.outerWidth < max_width))
        {
            if(breakpoint.classList.contains('active') === false)
            {
                breakpoint.classList.add('active');
            }
        }
        else
        {
            breakpoint.classList.remove('active');
        }
    });
}
function on_window_resize() {
    clearTimeout(resize_timout);
    resize_timout = setTimeout(function () {
        document.getElementById('bToolsWindowWith').value = window.outerWidth;
        set_active_class_to_breakpoint();
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
    set_window_size(parseInt(this.value));
}

function nextElementSibling( elem ) {
    do {
        elem = elem.nextSibling;

    } while( elem && elem.nodeType !== 1 );

    return elem;
}

var resize_timout = null;
var bootstrap_version = null;
var initial_window_width = window.outerWidth;
var body = document.querySelector('body');

var detected_bootstrap_version = {
    version_string: '',
    version_string_short: '',
    version_string_shortest: '',
    version_number: 0,
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.event == "show_toolbar") {
        console && console.log(request.event);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", chrome.runtime.getURL('toolbar.tpl.html'), true);
        function add_toolbar_event_handlers () {
            document.querySelectorAll('.bt-breakpoint').forEach(function(breakpoint){
               breakpoint.addEventListener('click', function(){
                   set_window_size(parseInt(this.getAttribute('data-width')));
               });
            });
            document.getElementById('bToolsWindowWith').addEventListener('change', on_change_tools_window_width);
            document.getElementById('grid') && document.getElementById('grid').addEventListener('change', function(){
                document.querySelector('body').classList.toggle('grid__active');
            });
            document.getElementById('containers') && document.getElementById('containers').addEventListener('change', function(){
                document.querySelector('body').classList.toggle('containers__active');
            });
            document.getElementById('cols') && document.getElementById('cols').addEventListener('change', function(){
                document.querySelector('body').classList.toggle('cols__active');
            });
            document.getElementById('rows') && document.getElementById('rows').addEventListener('change', function(){
                document.querySelector('body').classList.toggle('rows__active');
            });
            document.querySelectorAll('.bt-version-select').forEach(function(version_select){
                console.log(version_select);
                version_select.addEventListener('click', function(){
                    console.log('click');
                    if(this.getAttribute('data-version') != bootstrap_version) {
                        bootstrap_version = parseInt(this.getAttribute('data-version'));
                        document.querySelectorAll('#bToolsWindow').forEach(function(el){
                            el.parentNode.removeChild(el);
                        });
                        document.querySelectorAll('.cb-grid-lines').forEach(function (el) {
                            el.parentNode.removeChild(el);
                        });
                        document.querySelector('body').classList.remove('grid__active');
                        document.querySelector('body').classList.remove('containers__active');
                        document.querySelector('body').classList.remove('cols__active');
                        document.querySelector('body').classList.remove('rows__active');
                        body.innerHTML += tmpl('bt_toolbar', {
                            detected_bootstrap_version: detected_bootstrap_version,
                            bootstrap_version_string: this.innerText,
                            bootstrap_version_number: bootstrap_version,
                            sizes: get_sizes(bootstrap_version),
                            window_width: window.outerWidth,
                            col_class: bootstrap_version < 4?'col-xs-1':'col',
                            initial_window_width: initial_window_width
                        });
                        add_toolbar_event_handlers();
                    }
                });
            });
            set_active_class_to_breakpoint();
        }
        xhr.onreadystatechange = function () {
            if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                body.innerHTML += xhr.responseText;
                get_bootstrap_version().then(function(result){
                    detected_bootstrap_version = result;
                    bootstrap_version = result.version_number;
                    body.innerHTML += tmpl('bt_toolbar', {
                        detected_bootstrap_version: detected_bootstrap_version,
                        bootstrap_version_string: result.version_string,
                        bootstrap_version_number: result.version_number,
                        sizes: get_sizes(result.version_number),
                        window_width: window.outerWidth,
                        col_class: result.version_number < 4?'col-xs-1':'col',
                        initial_window_width: initial_window_width
                    });
                    window.addEventListener('resize', on_window_resize);
                    add_toolbar_event_handlers();
                    body.classList.add('bootstrap-tools_active');
                    body.innerHTML = '<div class="bootstrap-tools-placeholder"></div>'+body.innerHTML;
                }, function(error){
                    console && console.error(error);
                    detected_bootstrap_version = {
                        version_string: error,
                        version_string_short: error,
                        version_string_shortest: error,
                        version_number: 0,
                    }
                    body.innerHTML += tmpl('bt_toolbar', {
                        detected_bootstrap_version: detected_bootstrap_version,
                        bootstrap_version_string: error,
                        bootstrap_version_number: 0,
                        sizes: [],
                        window_width: window.outerWidth,
                        col_class: 'col',
                        initial_window_width: initial_window_width
                    })
                    window.addEventListener('resize', on_window_resize);
                    // document.getElementById('bToolsWindowWith').addEventListener('change', on_change_tools_window_width);
                    add_toolbar_event_handlers();
                    body.classList.add('bootstrap-tools_active');
                    body.innerHTML = '<div class="bootstrap-tools-placeholder"></div>'+body.innerHTML;
                });
            }
        }
        xhr.send();
    }  else if(request.event == "hide_toolbar") {
        console && console.log(request.event);
        document.querySelectorAll('#bt_toolbar').forEach(function(el){
            el.parentNode.removeChild(el);
        });
        document.querySelectorAll('#bToolsWindow').forEach(function(el){
            el.parentNode.removeChild(el);
        });
        document.querySelectorAll('.cb-grid-lines').forEach(function (el) {
            el.parentNode.removeChild(el);
        });
        document.querySelector('body').classList.remove('grid__active');
        document.querySelector('body').classList.remove('containers__active');
        document.querySelector('body').classList.remove('cols__active');
        document.querySelector('body').classList.remove('rows__active');
        document.querySelector('.bootstrap-tools-placeholder').remove();
        body.classList.remove('boostrap-tools_active');
        window.removeEventListener('resize', on_window_resize);

    }
});