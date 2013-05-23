
PointImpl = function (x, y) {
    this.x = x ? x : 0;
    this.y = y ? y : 0;
};

PointImpl.prototype.toString = function () {
    return this.x + ',' + this.y;
};

Point = function (x, y) {
    return new PointImpl(x, y);
};


Size = function (w, h) {
  return {
    w: w,
    h: h
  };
};


PointsEqual = function (a, b) {
    var equal = a && b && a.x == b.x && a.y == b.y;
    return equal;
};

OffsetPoint = function (point, offset) {
    return Point(point.x + offset.x, point.y + offset.y);
};

OffsetBetweenPoints = function (a, b) {
    return Point(a.x - b.x, a.y - b.y);
};

PointsColinear = function (a, b, c) {
    var crossProduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
    return Math.abs(crossProduct) < 100;
};

ValueWithin = function (a, b, c) {
    return (a <= b && b <= c) || (c <= b && b <= a)
};

// based on http://stackoverflow.com/a/328110/182781
PointOnLineSegment = function (a, b, c) {
    return PointsColinear(a, b, c) && (a.x != b.x ? ValueWithin(a.x, c.x, b.x) : ValueWithin(a.y, c.y, b.y));
};

PointInCircle = function (origin, radius, point) {
    return Math.pow(point.x - origin.x, 2) + Math.pow(point.y - origin.y, 2) < Math.pow(radius, 2);
};

InterpolatePoint = function (a, b, t) {
    return Point(t * a.x + (1 - t) * b.x, t * a.y + (1 - t) * b.y);
};

InterpolatePoint3 = function (a, b, c, t) {
//     return InterpolatePoint(InterpolatePoint(a, b, t), InterpolatePoint(b, c, t), t);
    var t1 = 1 - t;
    var x = Math.pow(t1, 2) * a.x + 2 * t1 * t * b.x + Math.pow(t, 2) * c.x;
    var y = Math.pow(t1, 2) * a.y + 2 * t1 * t * b.y + Math.pow(t, 2) * c.y;
    return Point(x, y);
};

InterpolatePoint4 = function (a, b, c, d, t) {
//     var p1 = InterpolatePoint(a, b, t);
//     var p2 = InterpolatePoint(b, c, t);
//     var p3 = InterpolatePoint(c, d, t);
//     return InterpolatePoint3(p1, p2, p3, t);
    var t1 = 1 - t;
    var x = Math.pow(t1, 3) * a.x + 3 * Math.pow(t1, 2) * t * b.x + 3 * t1 * Math.pow(t, 2) * c.x + Math.pow(t, 3) * d.x;
    var y = Math.pow(t1, 3) * a.y + 3 * Math.pow(t1, 2) * t * b.y + 3 * t1 * Math.pow(t, 2) * c.y + Math.pow(t, 3) * d.y;
    return Point(x, y);
};



Shape = (function () {

    var constructor = function (origin) {
        if (!origin) {
            origin = Point(0, 0);
        }
        this.fillStyle = undefined;
        this.strokeStyle = undefined;
        this.hover = false;
        this.observers = {};
        this.zIndex = 0;
        this.alpha = undefined;
        this.setOrigin(origin);
    };

    constructor.prototype.addPropertyChangeObserver = function (propertyName, handler) {
        var observers = this.observers[propertyName];
        if (!observers) {
            observers = [];
            this.observers[propertyName] = observers;
        }
        observers.push(handler);
    };
    
    constructor.prototype.notifyPropertyChange = function (propertyName) {
        var observers = this.observers[propertyName];
        if (!observers) {
            return;
        }
        observers.forEach(function (handler) {
            handler(propertyName, this);
        }, this);
    };
    
    constructor.prototype.setOrigin = function (origin) {
        if (PointsEqual(this.origin, origin)) {
            return;
        }
        this.origin = origin;
        this.notifyPropertyChange('origin');
    };

    constructor.prototype.draw = function (context) {
        this.preDraw(context);
        this.doDraw(context);
        this.postDraw(context);
    };

    constructor.prototype.preDraw = function (context) {
        context.save();
        if (this.alpha !== undefined) {
            context.globalAlpha = this.alpha;
        }
        if (this.hover) {
            context.fillStyle = '#f00';
        } else if (this.fillStyle) {
            context.fillStyle = this.fillStyle;
        }
        if (this.hover) {
            context.strokeStyle = '#f00';
        } else if (this.strokeStyle) {
            context.strokeStyle = this.strokeStyle;
        }
    };
    
    constructor.prototype.getDescription = function () {
        return "Shape";
    };

    constructor.prototype.postDraw = function (context) {
        context.restore();
    };

    constructor.prototype.moveBy = function (offset) {
        this.setOrigin(OffsetPoint(this.origin, offset));
    };

    constructor.prototype.startHover = function () {
        this.hover = true;
    };

    constructor.prototype.endHover = function () {
        this.hover = false;
    };

    constructor.prototype.hitTest = function (point) {
        return false;
    };

    constructor.prototype.shapeAtPoint = function (point) {
        if (this.hitTest(point)) {
            return this;
        }
        return null;
    }

    return constructor;
})();


ShapeCollection = (function () {

    var constructor = function (origin) {
        Shape.apply(this, arguments);
        this.shapes = [];
        this.zOrderedShapes = [];
    };

    constructor.prototype = Object.create(Shape.prototype);

    constructor.prototype.doDraw = function (context) {
        if (this.origin) {
            context.translate(this.origin.x, this.origin.y);
        }
        this.forEach(function(shape) {
            shape.draw(context);
        });
    };

    constructor.prototype.addShape = function (shape) {
        this.shapes.push(shape);
        this.zOrderedShapes.push(shape);
        this.updateZOrderedShapes();
    };
    
    constructor.prototype.removeShape = function (shape) {
        var index = this.shapes.indexOf(shape);
        if (index != -1) {
            this.shapes.splice(index, 1);
        }
        index = this.zOrderedShapes.indexOf(shape);
        if (index != -1) {
            this.zOrderedShapes.splice(index, 1);
        }
    };

    constructor.prototype.forEach = function (handler) {
        this.shapes.forEach(handler);
    };

    constructor.prototype.updateZOrderedShapes = function () {
        this.zOrderedShapes.sort(function (a, b) {
            return b.zIndex - a.zIndex;
        });
    };

    constructor.prototype.hitTest = function (point) {
        if (this.origin) {
            point = OffsetPoint(point, Point(-this.origin.x, -this.origin.y))
        }
        
        var hit = this.shapes.some(function (item) {
            return item.hitTest(point);
        });
        return hit;
    }

    constructor.prototype.shapeAtPoint = function (point) {
        if (this.origin) {
            point = OffsetPoint(point, Point(-this.origin.x, -this.origin.y));
        }

        var hitItem;
        this.zOrderedShapes.some(function (item) {
            if (item.hitTest(point)) {
                hitItem = item.shapeAtPoint(point);
                return true;
            }
        });
        return hitItem;
    }

    return constructor;
})();


NodeVertexChain = (function () {

    var constructor = function (origin) {
        ShapeCollection.apply(this, arguments);
    };

    constructor.prototype = Object.create(ShapeCollection.prototype);

    constructor.prototype.addNode = function (point) {
        var circle = new Circle(point);
//         circle.shouldLabelOrigin = true;
        circle.zIndex = 1;

        var lastCircle = this.shapes[this.shapes.length - 1];
        if (lastCircle) {
            var line = new Line(lastCircle.origin, point);
            this.addShape(line);
            lastCircle.addPropertyChangeObserver('origin', function (propertyName, changedCircle) {
                line.setOrigin(changedCircle.origin);
            });
            line.addPropertyChangeObserver('origin', function (propertyName, changedLine) {
                lastCircle.setOrigin(changedLine.origin);
            });
            line.addPropertyChangeObserver('endPoint', function (propertyName, changedLine) {
                circle.setOrigin(changedLine.endPoint);
            });
            circle.addPropertyChangeObserver('origin', function (propertyName, changedCircle) {
                line.setEndPoint(changedCircle.origin);
            });
        }

        this.addShape(circle);
        return circle;
    }

    return constructor;
})();


QuadraticBezier = (function () {

    var constructor = function (origin, a, b, c) {
        NodeVertexChain.apply(this, arguments);
        this.a = this.addNode(a);
        this.b = this.addNode(b);
        this.c = this.addNode(c);
    };

    constructor.prototype = Object.create(NodeVertexChain.prototype);

    constructor.prototype.doDraw = function (context) {
        NodeVertexChain.prototype.doDraw.apply(this, arguments);

        var marker = new Circle(Point(0, 0), 3);
        marker.strokeStyle = '#000';
        marker.alpha = 0.5;

        var line = new Line();
        line.strokeStyle = '#000';

        var a = this.a.origin;
        var b = this.b.origin;
        var c = this.c.origin;

        var previous = 0;
        for (var t = 0; t <= 1; t += 0.05) {
            var p = InterpolatePoint3(a, b, c, t);
            marker.setOrigin(p);
            marker.draw(context);
            line.setOrigin(previous);
            line.setEndPoint(p);
            line.draw(context);
            previous = p;
        }
    };

    return constructor;
})();


CubicBezier = (function () {

    var constructor = function (origin, a, b, c, d) {
        NodeVertexChain.apply(this, arguments);
        this.a = this.addNode(a);
        this.b = this.addNode(b);
        this.c = this.addNode(c);
        this.d = this.addNode(d);
    };

    constructor.prototype = Object.create(NodeVertexChain.prototype);

    constructor.prototype.doDraw = function (context) {
        NodeVertexChain.prototype.doDraw.apply(this, arguments);

        var marker = new Circle(Point(0, 0), 3);
        marker.strokeStyle = '#000';
        marker.alpha = 0.5;

        var line = new Line();
        line.strokeStyle = '#000';

        var a = this.a.origin;
        var b = this.b.origin;
        var c = this.c.origin;
        var d = this.d.origin;

        var previous = 0;
        for (var t = 0; t <= 1; t += 0.03) {
            var p = InterpolatePoint4(a, b, c, d, t);
            marker.setOrigin(p);
            marker.draw(context);
            line.setOrigin(previous);
            line.setEndPoint(p);
            line.draw(context);
            previous = p;
        }
        
//         var offset = [a, b, c, d].map(function (item) {return OffsetPoint(item, Point(0, -10))});
//         context.beginPath();
//         context.moveTo(offset[0].x, offset[0].y);
//         context.bezierCurveTo(offset[1].x, offset[1].y, offset[2].x, offset[2].y, offset[3].x, offset[3].y);
//         context.stroke();
    };
    return constructor;
})();



Line = (function () {

    var constructor = function (startPoint, endPoint) {
        Shape.apply(this, arguments);
        this.setEndPoint(endPoint);
    };

    constructor.prototype = Object.create(Shape.prototype);

    constructor.prototype.doDraw = function (context) {
        context.beginPath();
        context.moveTo(this.origin.x, this.origin.y);
        context.lineTo(this.endPoint.x, this.endPoint.y);
        context.closePath();
        context.stroke();
    };
    
    constructor.prototype.setEndPoint = function (endPoint) {
        if (PointsEqual(this.endPoint, endPoint)) {
            return;
        }
        this.endPoint = endPoint;
        this.notifyPropertyChange('endPoint');
    };

    constructor.prototype.getDescription = function () {
        return "Line";
    };

    constructor.prototype.moveBy = function (offset) {
        Shape.prototype.moveBy.apply(this, arguments);
        this.setEndPoint(OffsetPoint(this.endPoint, offset));
    };

    constructor.prototype.hitTest = function (point) {
        return PointOnLineSegment(this.origin, this.endPoint, point);
    }

    return constructor;  

})();


Circle = (function () {
    var constructor = function (origin, radius) {
        Shape.apply(this, arguments);
        this.radius = radius ? radius : 3;
        this.shouldLabelOrigin = false;
    };
    constructor.prototype = Object.create(Shape.prototype);
    constructor.prototype.doDraw = function (context) {
        context.beginPath();
        context.arc(this.origin.x, this.origin.y, this.radius, (Math.PI/180)*0, (Math.PI/180)*360, false);
        context.stroke();
        context.closePath();
        if (this.shouldLabelOrigin) {
            var text = new Text(OffsetPoint(this.origin, Point(-20, -15)), this.origin.toString());
            text.draw(context);
        }
    };
    constructor.prototype.hitTest = function (point) {
        return PointInCircle(this.origin, this.radius, point);
    }
    return constructor;  
})();


Text = (function () {

    var constructor = function (origin, string) {
        Shape.apply(this, arguments);
        this.string = string;
        this.font = "10px Sans-Serif";
    };

    constructor.prototype = Object.create(Shape.prototype);

    constructor.prototype.doDraw = function (context) {
        context.font = this.font;
        context.textBaseline = "top";
        context.fillText(this.string, this.origin.x, this.origin.y);
    };

    return constructor;  

})();


Rectangle = (function () {

    var constructor = function (origin, size) {
        Shape.apply(this, arguments);
        this.size = size;
    };

    constructor.prototype = Object.create(Shape.prototype);

    constructor.prototype.doDraw = function (context) {
        if (this.fillStyle) {
            context.fillRect(this.origin.x, this.origin.y, this.size.w, this.size.h);
        }
    };

    return constructor;

})();


InteractiveCanvasState = (function () {

    var constructor = function (interactiveCanvas) {
        this.interactiveCanvas = interactiveCanvas; // reference cycle
    };
    
    constructor.prototype.willTransitionToState = function () {};
    constructor.prototype.willTransitionFromState = function () {};
    constructor.prototype.didTransitionToState = function () {};
    constructor.prototype.didTransitionFromState = function () {};
    
    constructor.prototype.mousedown = function (event) {
        console.log("Ignoring mousedown in state %o", this);
    };
    constructor.prototype.mouseup = function (event) {
        console.log("Ignoring mouseup in state %o", this);
    };
    constructor.prototype.mousemove = function (event) {
        console.log("Ignoring mousemove in state %o", this);
    };
    
    return constructor;
    
})();


InteractiveCanvasStateStart = (function () {

    var constructor = function (interactiveCanvas) {
        InteractiveCanvasState.apply(this, arguments);
    };

    constructor.prototype = Object.create(InteractiveCanvasState.prototype);

    constructor.prototype.mousemove = function (event) {
        var hitShape = this.interactiveCanvas.shapes.shapeAtPoint(Point(event.offsetX, event.offsetY));
        if (!hitShape) {
            return;
        }
        var hoverState = new InteractiveCanvasStateHover(this.interactiveCanvas, hitShape);
        this.interactiveCanvas.transitionToState(hoverState);
    };
    
    return constructor;
    
})();

// begingroup/commitgroup
// centralize state creation

InteractiveCanvasStateHover = (function () {

    var constructor = function (interactiveCanvas, hoverShape) {
        InteractiveCanvasState.apply(this, arguments);
        this.hoverShape = hoverShape;
    };

    constructor.prototype = Object.create(InteractiveCanvasState.prototype);

    constructor.prototype.mousemove = function (event) {
        var hitShape = this.interactiveCanvas.shapes.shapeAtPoint(Point(event.offsetX, event.offsetY));
        if (!hitShape) {
            var newState = new InteractiveCanvasStateStart(this.interactiveCanvas);
            this.interactiveCanvas.transitionToState(newState);
            return;
        }
        if (hitShape == this.hoverShape) {
            return;
        }
        this.updateHoverShape(hitShape);
    };

    constructor.prototype.mousedown = function (event) {
        var downState = new InteractiveCanvasStateMouseDownOnShape(this.interactiveCanvas, this.hoverShape, event);
        this.interactiveCanvas.transitionToState(downState);
    };

    constructor.prototype.didTransitionFromState = function (oldState) {
        this.updateHoverShape();
    };

    constructor.prototype.willTransitionToState = function (newState) {
        if (newState instanceof InteractiveCanvasStateStart) {
            this.hoverShape.endHover();
            this.interactiveCanvas.requestDrawScreen();
        }
    };
    
    constructor.prototype.updateHoverShape = function (newShape) {
        if (newShape) {
            if (this.hoverShape) {
                this.hoverShape.endHover();
            }
            this.hoverShape = newShape;
        }
        this.hoverShape.startHover();
        this.interactiveCanvas.requestDrawScreen();
    };
    
    return constructor;
    
})();



InteractiveCanvasStateMouseDownOnShape = (function () {

    var constructor = function (interactiveCanvas, shape, event) {
        InteractiveCanvasState.apply(this, arguments);
        this.shape = shape;
        this.mouseDownPosition = Point(event.offsetX, event.offsetY);
    };

    constructor.prototype = Object.create(InteractiveCanvasState.prototype);
    
    constructor.prototype.mousemove = function (event) {
        var dragState = new InteractiveCanvasStateDraggingShape(this.interactiveCanvas, this.shape, this.mouseDownPosition);
        this.interactiveCanvas.transitionToState(dragState);
        dragState.mousemove(event); // forward event
    };

    constructor.prototype.mouseup = function (event) {
        var hoverState = new InteractiveCanvasStateHover(this.interactiveCanvas, this.shape);
        this.interactiveCanvas.transitionToState(hoverState);
    };
    
    return constructor;
    
})();


InteractiveCanvasStateDraggingShape = (function () {

    var constructor = function (interactiveCanvas, shape, mouseDownPosition) {
        InteractiveCanvasState.apply(this, arguments);
        this.shape = shape;
        this.mouseDownPosition = mouseDownPosition;
        this.lastPosition = mouseDownPosition;
    };

    constructor.prototype = Object.create(InteractiveCanvasState.prototype);

    constructor.prototype.mousemove = function (event) {
        var newPosition = Point(event.offsetX, event.offsetY);
        var offset = OffsetBetweenPoints(newPosition, this.lastPosition);
        this.lastPosition = newPosition;
        this.shape.moveBy(offset);
        this.interactiveCanvas.requestDrawScreen();
        this.interactiveCanvas.requestDrawScreen();
        this.interactiveCanvas.requestDrawScreen();
    };

    constructor.prototype.mouseup = function (event) {
        var hoverState = new InteractiveCanvasStateHover(this.interactiveCanvas, this.shape);
        this.interactiveCanvas.transitionToState(hoverState);
    };
    
    return constructor;
    
})();



InteractiveCanvas = (function () {

    var constructor = function (canvas) {
        this.canvas = $(canvas)[0];
        this.context = this.canvas.getContext("2d");
        this.shapes = new ShapeCollection();
        this.hoverShape = null;
        this.transitionToState(new InteractiveCanvasStateStart(this));


        this.updateLevel = 0;
        this.pendingDrawRequests = 0;
        this.pendingOverlayDrawOperations = [];

        setupHiDpiCanvas.apply(this);
        setupListeners.apply(this);
    };

    constructor.prototype.addShape = function (shape) {
        this.shapes.addShape(shape);
    };

    constructor.prototype.removeShape = function (shape) {
        this.shapes.removeShape(shape);
    };
    
    constructor.prototype.requestDrawScreen = function () {
        if (this.updateLevel > 0) {
            this.pendingDrawRequests++;
        } else {
            drawScreen.apply(this);
        }
    }
    
    constructor.prototype.transitionToState = function (newState) {
        var oldState = this.state;
        if (oldState) {
            oldState.willTransitionToState(newState);
        }
        newState.willTransitionFromState(oldState);
        this.state = newState;
        if (oldState) {
            oldState.didTransitionToState(newState);
        }
        newState.didTransitionFromState(oldState);
    };
    
    constructor.prototype.registerOverlayDrawOperation = function (operation) {
        this.pendingOverlayDrawOperations.push(operation);
    };

    // begin private
    
    function beginUpdate() {
        this.updateLevel++;
    };

    function endUpdate() {
        this.updateLevel--;
        if (this.updateLevel == 0 && this.pendingDrawRequests) {
            drawScreen.apply(this);
            this.pendingDrawRequests = 0;
        }
    }

    function drawScreen() {
        this.shapes.draw(this.context);
        performOverlayDrawOperations.apply(this);
    }
    
    function performOverlayDrawOperations() {
        if (!this.pendingOverlayDrawOperations.length) {
            return;
        }
        this.context.save();
        this.pendingOverlayDrawOperations.forEach(function (drawingOperation) {
            drawingOperation(this.context);
        }, this);
        this.pendingOverlayDrawOperations.length = 0;
        this.context.restore();
    }
    
    function setupListeners() {
        var t = this;
        $(this.canvas).mousedown(function (event) {
            event.preventDefault();
            t.state.mousedown(event);
        });
        $(this.canvas).mousemove(function (event) {
            event.preventDefault();
            beginUpdate.apply(t);
            t.state.mousemove(event);
            endUpdate.apply(t);
        });
        $(this.canvas).mouseup(function (event) {
            event.preventDefault();
            t.state.mouseup(event);
        });
    }

    function setupHiDpiCanvas() {
        if (!window.devicePixelRatio) {
            return;
        }

        var hidefCanvasWidth = $(this.canvas).attr('width');
        var hidefCanvasHeight = $(this.canvas).attr('height');
        var hidefCanvasCssWidth = hidefCanvasWidth;
        var hidefCanvasCssHeight = hidefCanvasHeight;

        $(this.canvas).attr('width', hidefCanvasWidth * window.devicePixelRatio);
        $(this.canvas).attr('height', hidefCanvasHeight * window.devicePixelRatio);
        $(this.canvas).css('width', hidefCanvasCssWidth);
        $(this.canvas).css('height', hidefCanvasCssHeight);

        this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // end private
    
    return constructor;
})();


function canvasApp() {

    var interactiveCanvas = new InteractiveCanvas('#canvasOne');
    
    var r = new Rectangle(Point(0, 0), Size(500, 300));
    r.fillStyle = "#fff0f0";
    interactiveCanvas.addShape(r);

//     var t = new Text(Point(195, 80), "Hello World2!");
//     t.fillStyle = '#000';
//     interactiveCanvas.addShape(t);

//     var sc = new ShapeCollection(Point(10, 10));
//     interactiveCanvas.addShape(sc);
// 
//     var c = new Circle(Point(80, 30), 3);
//     c.strokeStyle = '#000';
//     sc.addShape(c);
// 
//     var l = new Line(Point(10, 10), Point(80, 30));
//     l.strokeStyle = '#000';
//     sc.addShape(l);
    
    interactiveCanvas.addShape(setupBezier2());
    interactiveCanvas.addShape(setupBezier3());

    interactiveCanvas.requestDrawScreen();
        
    function setupBezier2() {
        var b = new QuadraticBezier(Point(0, 0), Point(30, 60), Point(200, 20), Point(190, 100));
        b.strokeStyle = '#888';
        return b;
    }

    function setupBezier3() {
        var b = new CubicBezier(Point(0, 0), Point(30, 120), Point(50, 250), Point(370, 90), Point(400, 200));
        b.strokeStyle = '#888';
        return b;
    }
    
}

canvasApp();
if (console.clear) {
    console.clear();
}
