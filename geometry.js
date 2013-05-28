
"use strict";

define(function () {

    var Point = function (x, y) {
        if (!(this instanceof Point)) {
            return new Point(x, y);
        }
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    };

    Point.prototype.toString = function () {
        return this.x + ',' + this.y;
    };

    Point.prototype.isEqualToPoint = function (point) {
        return point && this.x == point.x && this.y == point.y;
    }

    Point.prototype.offsetToPoint = function (point) {
        return Point(point.x - this.x, point.y - this.y);
    }

    Point.prototype.pointOffsetBy = function (offset) {
        return Point(this.x + offset.x, this.y + offset.y);
    }

    Point.prototype.isColinearWithPoints = function (b, c) {
        var crossProduct = (c.y - this.y) * (b.x - this.x) - (c.x - this.x) * (b.y - this.y);
        return Math.abs(crossProduct) < 100;
    }

    Point.prototype.isOnLineSegment = function (lineStart, lineEnd) {
        function ValueWithin(a, b, c) {
            return (a <= b && b <= c) || (c <= b && b <= a)
        };

        // based on http://stackoverflow.com/a/328110/182781
        return this.isColinearWithPoints(lineStart, lineEnd) && (lineStart.x != lineEnd.x ? ValueWithin(lineStart.x, this.x, lineEnd.x) : ValueWithin(lineStart.y, this.y, lineEnd.y));
    };

    Point.prototype.isColinearWithPoints = function (b, c) {
        var crossProduct = (c.y - this.y) * (b.x - this.x) - (c.x - this.x) * (b.y - this.y);
        return Math.abs(crossProduct) < 100;
    }

    Point.prototype.isInCircle = function (origin, radius) {
        return Math.pow(this.x - origin.x, 2) + Math.pow(this.y - origin.y, 2) < Math.pow(radius, 2);
    };

    Point.prototype.pointByInterpolatingToPoint = function (point, t) {
        return Point(t * this.x + (1 - t) * point.x, t * this.y + (1 - t) * point.y);
    }

    Point.prototype.pointByInterpolatingToPoint = function (point, t) {
        return Point(t * this.x + (1 - t) * point.x, t * this.y + (1 - t) * point.y);
    }

    Point.prototype.pointByInterpolatingToPoints3 = function (b, c, t) {
    //     return this.pointByInterpolatingToPoint(b, t).pointByInterpolatingToPoint(b.pointByInterpolatingToPoint(c, t), t);
        var t1 = 1 - t;
        var x = Math.pow(t1, 2) * this.x + 2 * t1 * t * b.x + Math.pow(t, 2) * c.x;
        var y = Math.pow(t1, 2) * this.y + 2 * t1 * t * b.y + Math.pow(t, 2) * c.y;
        return Point(x, y);
    }

    Point.prototype.pointByInterpolatingToPoints4 = function (b, c, d, t) {
    //     var p1 = this.pointByInterpolatingToPoint(b, t);
    //     var p2 = b.pointByInterpolatingToPoint(c, t);
    //     var p3 = c.pointByInterpolatingToPoint(d, t);
    //     return p1.pointByInterpolatingToPoints3(p2, p3, t);
        var t1 = 1 - t;
        var x = Math.pow(t1, 3) * this.x + 3 * Math.pow(t1, 2) * t * b.x + 3 * t1 * Math.pow(t, 2) * c.x + Math.pow(t, 3) * d.x;
        var y = Math.pow(t1, 3) * this.y + 3 * Math.pow(t1, 2) * t * b.y + 3 * t1 * Math.pow(t, 2) * c.y + Math.pow(t, 3) * d.y;
        return Point(x, y);
    }

    var Size = function (w, h) {
        if (!(this instanceof Size)) {
            return new Size(w, h);
        }
        this.w = w ? w : 0;
        this.h = h ? h : 0;
    };
    
    return {
        'Point': Point,
        'Size': Size,
    };

});

