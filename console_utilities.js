
"use strict";

define(['jquery'], function ($) {

    function setupConsole() {

        if (typeof console  != "undefined") 
            if (typeof console.log != 'undefined')
                console.olog = console.log;
            else
                console.olog = function() {};

        console.log = function(message) {
            console.olog(message);
            $('#debugDiv').prepend('<div>' + message + '</div>');
        };
        console.error = console.debug = console.info = console.log;
        if (console.clear) {
             console.clear();
        }
    }

    return {
        'setupConsole': setupConsole
    };
    
});

