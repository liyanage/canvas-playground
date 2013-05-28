
"use strict";

define(['jquery', 'geometry', 'canvas_shapes', 'interactive_canvas'], function ($, g, shapes, ic) {

    function canvasApp() {

        var interactiveCanvas = new ic.InteractiveCanvas('#canvasOne');
    
        var r = new shapes.Rectangle(g.Point(0, 0), g.Size(500, 300));
        r.fillStyle = "#fff0f0";
        interactiveCanvas.addShape(r);

    //     var t = new shapes.Text(g.Point(195, 80), "Hello World2!");
    //     t.fillStyle = '#000';
    //     interactiveCanvas.addShape(t);

    //     var sc = new shapes.ShapeCollection(g.Point(10, 10));
    //     interactiveCanvas.addShape(sc);
    // 
    //     var c = new shapes.Circle(g.Point(80, 30), 3);
    //     c.strokeStyle = '#000';
    //     sc.addShape(c);
    // 
    //     var l = new shapes.Line(g.Point(10, 10), g.Point(80, 30));
    //     l.strokeStyle = '#000';
    //     sc.addShape(l);
    
        interactiveCanvas.addShape(setupBezier2());
        interactiveCanvas.addShape(setupBezier3());

        interactiveCanvas.requestDrawScreen();
        
        function setupBezier2() {
            var b = new shapes.QuadraticBezier(g.Point(0, 0), g.Point(30, 60), g.Point(200, 20), g.Point(190, 100));
            b.strokeStyle = '#888';
            return b;
        }

        function setupBezier3() {
            var b = new shapes.CubicBezier(g.Point(0, 0), g.Point(30, 120), g.Point(50, 250), g.Point(370, 90), g.Point(400, 200));
            b.strokeStyle = '#888';
            return b;
        }
    }

    return canvasApp;
});


