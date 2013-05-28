
"use strict";

define(['geometry'], function (g) {

    var Shape = (function () {

        var constructor = function (origin) {
            if (!origin) {
                origin = g.Point(0, 0);
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
            if (this.origin && this.origin.isEqualToPoint(origin)) {
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
            this.setOrigin(this.origin.pointOffsetBy(offset));
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


    var ShapeCollection = (function () {

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
                point = point.pointOffsetBy(g.Point(-this.origin.x, -this.origin.y));
            }
        
            var hit = this.shapes.some(function (item) {
                return item.hitTest(point);
            });
            return hit;
        }

        constructor.prototype.shapeAtPoint = function (point) {
            if (this.origin) {
                point = point.pointOffsetBy(g.Point(-this.origin.x, -this.origin.y));
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


    var NodeVertexChain = (function () {

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


    var QuadraticBezier = (function () {

        var constructor = function (origin, a, b, c) {
            NodeVertexChain.apply(this, arguments);
            this.a = this.addNode(a);
            this.b = this.addNode(b);
            this.c = this.addNode(c);
        };

        constructor.prototype = Object.create(NodeVertexChain.prototype);

        constructor.prototype.doDraw = function (context) {
            NodeVertexChain.prototype.doDraw.apply(this, arguments);

            var marker = new Circle(g.Point(0, 0), 3);
            marker.strokeStyle = '#000';
            marker.alpha = 0.5;

            var line = new Line();
            line.strokeStyle = '#000';

            var a = this.a.origin;
            var b = this.b.origin;
            var c = this.c.origin;

            var previous = 0;
            for (var t = 0; t <= 1; t += 0.05) {
                var p = a.pointByInterpolatingToPoints3(b, c, t);
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


    var CubicBezier = (function () {

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

            var marker = new Circle(g.Point(0, 0), 3);
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
                var p = a.pointByInterpolatingToPoints4(b, c, d, t);
                marker.setOrigin(p);
                marker.draw(context);
                line.setOrigin(previous);
                line.setEndPoint(p);
                line.draw(context);
                previous = p;
            }
        
    //         var offset = [a, b, c, d].map(function (item) {return OffsetPoint(item, g.Point(0, -10))});
    //         context.beginPath();
    //         context.moveTo(offset[0].x, offset[0].y);
    //         context.bezierCurveTo(offset[1].x, offset[1].y, offset[2].x, offset[2].y, offset[3].x, offset[3].y);
    //         context.stroke();
        };
        return constructor;
    })();



    var Line = (function () {

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
            if (this.endPoint && this.endPoint.isEqualToPoint(endPoint)) {
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
            this.setEndPoint(this.endPoint.pointOffsetBy(offset));
        };

        constructor.prototype.hitTest = function (point) {
            return point.isOnLineSegment(this.origin, this.endPoint);
        }

        return constructor;  

    })();


    var Circle = (function () {
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
                var text = new Text(this.origin.pointOffsetBy(g.Point(-20, -15)), this.origin.toString());
                text.draw(context);
            }
        };
        constructor.prototype.hitTest = function (point) {
            return point.isInCircle(this.origin, this.radius);
        }
        return constructor;  
    })();


    var Text = (function () {

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


    var Rectangle = (function () {

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

    return {
        'ShapeCollection': ShapeCollection,
        'NodeVertexChain': NodeVertexChain,
        'QuadraticBezier': QuadraticBezier,
        'CubicBezier': CubicBezier,
        'Line': Line,
        'Circle': Circle,
        'Text': Text,
        'Rectangle': Rectangle
    };

});

