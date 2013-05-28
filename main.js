
"use strict";

require(['console_utilities'], function (cu) {
    cu.setupConsole();
});

console.log('req %o', requirejs.config);
requirejs.config({
    paths: {
        'jquery': '//code.jquery.com/jquery-2.0.0.min'
    }
});

require(['app'], function (app) {
    app();
});

