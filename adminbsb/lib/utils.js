define(function (require) {

    //polyfill
    (function () {
        // https://tc39.github.io/ecma262/#sec-array.prototype.find
        if (!Array.prototype.find) {
            Object.defineProperty(Array.prototype, 'find', {
                value: function (predicate) {
                    // 1. Let O be ? ToObject(this value).
                    if (this == null) {
                        throw new TypeError('"this" is null or not defined');
                    }

                    var o = Object(this);

                    // 2. Let len be ? ToLength(? Get(O, "length")).
                    var len = o.length >>> 0;

                    // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                    if (typeof predicate !== 'function') {
                        throw new TypeError('predicate must be a function');
                    }

                    // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                    var thisArg = arguments[1];

                    // 5. Let k be 0.
                    var k = 0;

                    // 6. Repeat, while k < len
                    while (k < len) {
                        // a. Let Pk be ! ToString(k).
                        // b. Let kValue be ? Get(O, Pk).
                        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                        // d. If testResult is true, return kValue.
                        var kValue = o[k];
                        if (predicate.call(thisArg, kValue, k, o)) {
                            return kValue;
                        }
                        // e. Increase k by 1.
                        k++;
                    }

                    // 7. Return undefined.
                    return undefined;
                }
            });
        }
    })();


    /* utilities */

    function format() {
        var self = arguments[0];
        var args = [].slice.call(arguments, 1);
        return self.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    }

    function clone(src) {
        var newObj = {};
        Object.keys(src).forEach(function (key) {
            newObj[key] = src[key];
        });
        return newObj;
    }

    function isArray(it) {
        return Object.prototype.toString.call(it) === '[object Array]';
    }

    function isPromise(fn) {
        return fn && typeof fn.then === "function";
    }

    function permalink(str) {
        return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
    }

    function trimStart(str, ch) {
        while (str) {
            if (str[0] === ch)
                str = str.substring(1);
            else break;
        }
        return str;
    }

    function trimEnd(str, ch) {
        while (str) {
            if (str[str.length - 1] === ch)
                str = str.slice(0, -1);
            else break;
        }
        return str;
    }

    function trimStartEnd(str, ch) {
        str = trimStart(str, ch);
        str = trimEnd(str, ch);
        return str;
    }

    function bindFn(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(null, args);
        };
    }

    function queryStringToObject(qstr) {
        var result = {},
            nvPairs = ((qstr || "").replace(/^\?/, "").split(/&/)),
            i, pair, n, v;

        for (i = 0; i < nvPairs.length; i++) {
            var pstr = nvPairs[i];
            if (pstr) {
                pair = pstr.split(/=/);
                n = pair[0];
                v = pair[1];
                if (result[n] === undefined) {
                    result[n] = v;
                } else {
                    if (typeof result[n] !== "object") {
                        result[n] = [result[n]];
                    }
                    result[n].push(v);
                }
            }
        }

        return result;
    }

    var generatedNumbers = [];
    function generateRandomNumber(precision) { // precision --> number precision in integer 
        if (precision <= 20) {
            var randomNum = Math.round(Math.random().toFixed(precision) * Math.pow(10, precision));
            if (generatedNumbers.indexOf(randomNum) > -1) {
                if (generatedNumbers.length == Math.pow(10, precision))
                    //return "Generated all values with this precision";
                    generatedNumbers = [];
                return generateRandomNumber(precision);
            } else {
                generatedNumbers.push(randomNum);
                return randomNum;
            }
        } else
            return "Number Precision shoould not exceed 20";
    }

    /**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
    function getMobileOperatingSystem() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera || "unknown";

        // Windows Phone must come first because its UA also contains "Android"
        if (/windows phone/i.test(userAgent)) {
            return "Windows Phone";
        }

        if (/android/i.test(userAgent)) {
            return "Android";
        }

        // iOS detection from: http://stackoverflow.com/a/9039885/177710
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return "iOS";
        }

        return "unknown";
    }

    function jsonDateConverter(dotNetJavaScriptSerializerFormat) {
        var dateValue = parseInt(dotNetJavaScriptSerializerFormat.replace(/\/Date\((\d+)\)\//g, "$1"));
        var date = new Date(dateValue);
        return date;
    }

    function promiseTimeout(timeout) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve();
            }, timeout);
        });
    }

    return {
        format: format,
        clone: clone,
        isArray: isArray,
        isPromise: isPromise,
        trimStart: trimStart,
        trimEnd: trimEnd,
        trimStartEnd: trimStartEnd,
        permalink: permalink,
        bindFn: bindFn,
        queryStringToObject: queryStringToObject,
        generateRandomNumber: generateRandomNumber,
        getMobileOperatingSystem: getMobileOperatingSystem,
        jsonDateConverter: jsonDateConverter,
        promiseTimeout: promiseTimeout
    };
});