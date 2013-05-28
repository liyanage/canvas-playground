
"use strict";

define(['jquery', 'geometry', 'canvas_shapes'], function ($, g, shapes) {

    var InteractiveCanvasState = (function () {

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


    var InteractiveCanvasStateStart = (function () {

        var constructor = function (interactiveCanvas) {
            InteractiveCanvasState.apply(this, arguments);
        };

        constructor.prototype = Object.create(InteractiveCanvasState.prototype);

        constructor.prototype.mousemove = function (event) {
            var hitShape = this.interactiveCanvas.shapes.shapeAtPoint(g.Point(event.offsetX, event.offsetY));
            if (!hitShape) {
                return;
            }
            var hoverState = new InteractiveCanvasStateHover(this.interactiveCanvas, hitShape);
            this.interactiveCanvas.transitionToState(hoverState);
        };
    
        return constructor;
    
    })();


    var InteractiveCanvasStateHover = (function () {

        var constructor = function (interactiveCanvas, hoverShape) {
            InteractiveCanvasState.apply(this, arguments);
            this.hoverShape = hoverShape;
        };

        constructor.prototype = Object.create(InteractiveCanvasState.prototype);

        constructor.prototype.mousemove = function (event) {
            var hitShape = this.interactiveCanvas.shapes.shapeAtPoint(g.Point(event.offsetX, event.offsetY));
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



    var InteractiveCanvasStateMouseDownOnShape = (function () {

        var constructor = function (interactiveCanvas, shape, event) {
            InteractiveCanvasState.apply(this, arguments);
            this.shape = shape;
            this.mouseDownPosition = g.Point(event.offsetX, event.offsetY);
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


    var InteractiveCanvasStateDraggingShape = (function () {

        var constructor = function (interactiveCanvas, shape, mouseDownPosition) {
            InteractiveCanvasState.apply(this, arguments);
            this.shape = shape;
            this.mouseDownPosition = mouseDownPosition;
            this.lastPosition = mouseDownPosition;
        };

        constructor.prototype = Object.create(InteractiveCanvasState.prototype);

        constructor.prototype.mousemove = function (event) {
            var newPosition = g.Point(event.offsetX, event.offsetY);
            var offset = this.lastPosition.offsetToPoint(newPosition);
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



    var InteractiveCanvas = (function () {

        var constructor = function (canvas) {
            this.canvas = $(canvas)[0];
            this.context = this.canvas.getContext("2d");
            this.shapes = new shapes.ShapeCollection();
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
    
    return {
        'InteractiveCanvas': InteractiveCanvas
    };

});


