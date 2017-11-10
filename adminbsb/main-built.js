(function () {
/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond", function(){});

define('lib/pubsub',['require'],function (require) {

    var target = $({});
    var knownEvents = {};
    return {
        subscribe: function () {
            target.on.apply(target, arguments);
        },
        unsubscribe: function () {
            target.off.apply(target, arguments);
        },
        publish: function () {
            var ch = arguments[0];
            knownEvents[ch] = null;
            console.dir(arguments);
            target.trigger.apply(target, arguments);
        },
        listEvents: function () {
            return Object.keys(knownEvents);
        }
    }
});
define('framework',['require','lib/pubsub'],function (require) {
    var pubsub = require('lib/pubsub');

    const emptyStr = "";

    function setViewModel($shell, viewmodel, args, query, channel) {
        var instance = null;
        args = args || {};
        query = query || {};
        if (typeof viewmodel === "function") {
            try {
                instance = new viewmodel(args, query);
            } catch (e) {
                console.error(e);
            }
            finally {
                if (!instance) instance = {};
            }

        } else {
            instance = viewmodel;
        }

        var view = emptyStr;
        if (typeof instance.getView === "function") {
            try {
                view = instance.getView.call(instance);
            } catch (e) {
                console.error(e);
            }
        }

        $shell.html(view);

        var node = $shell.children().first()[0];
        if (node) {
            try {
                ko.applyBindings(instance, node);
            } catch (e) {
                console.error(e);
            }
        }

        /* métodos activate podem retornar uma Promise */
        if (typeof instance.activate === "function") {
            try {
                pubsub.publish(channel, true);
                /* Promise.resolve() aceita um metodo que retorna um valor ou uma promise */
                Promise.resolve(instance.activate.call(instance)).then(function () {
                    pubsub.publish(channel, false);
                });

            } catch (e) {
                console.error(e);
            }
            finally {
                pubsub.publish('navigated', {});
            }
        } else {
            pubsub.publish('navigated', {});
        }

        return true;
    }

    function framework(config) {
        var self = this;
        var router = config.router || new Navigo(null, true, "#!");
        var $shell = config.shell || $('body');
        var channel = config.channel || 'changingview';

        router.hooks({
            before: function (done, params) {
                var node = $shell.children().first()[0];
                if (node) ko.cleanNode(node);

                $shell.empty();

                done(true); //done(false); //cancels
            },
            after: function (params) {
                router.updatePageLinks();
                window.scrollTo(0, 0);
                var lr = router.lastRouteResolved();
                console.dir(lr);
            }
        });

        return {
            goto: function (viewmodel, args, query) {
                if (setViewModel.call(self, $shell, viewmodel, args, query, channel)) {
                    console.log('view/viewmodel binded');
                }
            }
        }
    }

    return framework;
});
/**
 * @license text 2.0.15 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/text/LICENSE
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    'use strict';

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    function useDefault(value, defaultValue) {
        return value === undefined || value === '' ? defaultValue : value;
    }

    //Allow for default ports for http and https.
    function isSamePort(protocol1, port1, protocol2, port2) {
        if (port1 === port2) {
            return true;
        } else if (protocol1 === protocol2) {
            if (protocol1 === 'http') {
                return useDefault(port1, '80') === useDefault(port2, '80');
            } else if (protocol1 === 'https') {
                return useDefault(port1, '443') === useDefault(port2, '443');
            }
        }
        return false;
    }

    text = {
        version: '2.0.15',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.lastIndexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || isSamePort(uProtocol, uPort, protocol, port));
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'] &&
            !process.versions['atom-shell'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file[0] === '\uFEFF') {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});


define('text!views/usuario.html',[],function () { return '<div class="row clearfix">\r\n    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">\r\n        <div class="card">\r\n            <div class="header">\r\n                <h2>\r\n                    Usuário\r\n                </h2>\r\n                <ul class="header-dropdown m-r--5">\r\n                    <li class="dropdown">\r\n                        <a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\r\n                            <i class="material-icons">more_vert</i>\r\n                        </a>\r\n                        <ul class="dropdown-menu pull-right">\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block" data-bind="click: showId">Action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block" data-bind="click: navigate">Another action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Something else here</a></li>\r\n                        </ul>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n            <div class="body">\r\n                <div class="row clearfix">\r\n                    <div class="col-md-12">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" data-bind="value: id" class="form-control" placeholder="col-md-12">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-6">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-6">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <div class="col-md-6">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-6">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-4">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-4">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-4">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-4">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-4">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-4">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('viewmodels/usuario',['require','text!views/usuario.html','lib/pubsub'],function (require) {
    var view = require('text!views/usuario.html');
    var pubsub = require('lib/pubsub');

    /* returns a function that will be a factory */
    function viewmodel(args) {
        var self = this;
        this.id = ko.observable(args.id || 0);

        return {
            getView: function () {
                return view;
            },

            id: self.id,

            showId: function () {
                swal({
                    title: "Info!",
                    text: "Id: " + self.id(),
                    icon: "success",
                });
            },
            navigate: function () {
                pubsub.publish('navigate', '/permissao/123');
            },
            canDeactivate: function () {
                return self.id() == 1;
            },
            deactivate: function () {
                //clean up
                console.log('deactivate');
            }
        }
    }

    return viewmodel;
});

define('text!views/usuarios.html',[],function () { return '\r\n<div class="block-header">\r\n    <h2>\r\n        Usuários\r\n        <small>Cadastro de Usuários do Sistema</small>\r\n    </h2>\r\n</div>\r\n\r\n<div class="row clearfix">\r\n    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">\r\n        <div class="card">\r\n            <div class="header">\r\n                <h2>\r\n                    Listagem de Usuários\r\n                </h2>\r\n                <ul class="header-dropdown m-r--5">\r\n                    <li class="dropdown">\r\n                        <a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\r\n                            <i class="material-icons">more_vert</i>\r\n                        </a>\r\n                        <ul class="dropdown-menu pull-right">\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Another action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Something else here</a></li>\r\n                        </ul>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n            <div class="body">\r\n                <div class="table-responsive">\r\n                    <table class="table table-bordered table-striped table-hover js-basic-example dataTable">\r\n                        <thead>\r\n                            <tr>\r\n                                <th>Name</th>\r\n                                <th>Position</th>\r\n                                <th>Office</th>\r\n                                <th>Age</th>\r\n                                <th>Start date</th>\r\n                                <th>Salary</th>\r\n                            </tr>\r\n                        </thead>\r\n                        <tbody>\r\n                            <tr>\r\n                                <td><a data-navigo href="/usuario/1">Tiger Nixon</a></td>\r\n                                <td>System Architect</td>\r\n                                <td>Edinburgh</td>\r\n                                <td>61</td>\r\n                                <td>2011/04/25</td>\r\n                                <td>$320,800</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td><a data-navigo href="/usuario/2">Garrett Winters</a></td>\r\n                                <td>Accountant</td>\r\n                                <td>Tokyo</td>\r\n                                <td>63</td>\r\n                                <td>2011/07/25</td>\r\n                                <td>$170,750</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Ashton Cox</td>\r\n                                <td>Junior Technical Author</td>\r\n                                <td>San Francisco</td>\r\n                                <td>66</td>\r\n                                <td>2009/01/12</td>\r\n                                <td>$86,000</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Cedric Kelly</td>\r\n                                <td>Senior Javascript Developer</td>\r\n                                <td>Edinburgh</td>\r\n                                <td>22</td>\r\n                                <td>2012/03/29</td>\r\n                                <td>$433,060</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Airi Satou</td>\r\n                                <td>Accountant</td>\r\n                                <td>Tokyo</td>\r\n                                <td>33</td>\r\n                                <td>2008/11/28</td>\r\n                                <td>$162,700</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Brielle Williamson</td>\r\n                                <td>Integration Specialist</td>\r\n                                <td>New York</td>\r\n                                <td>61</td>\r\n                                <td>2012/12/02</td>\r\n                                <td>$372,000</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Herrod Chandler</td>\r\n                                <td>Sales Assistant</td>\r\n                                <td>San Francisco</td>\r\n                                <td>59</td>\r\n                                <td>2012/08/06</td>\r\n                                <td>$137,500</td>\r\n                            </tr>\r\n                        </tbody>\r\n                    </table>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('lib/utils',['require'],function (require) {

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
define('viewmodels/usuarios',['require','text!views/usuarios.html','lib/utils'],function (require) {
    var view = require('text!views/usuarios.html');
    var utils = require('lib/utils');

    /* returns a function that will be a factory */
    function viewmodel(args) {

        return {
            getView: function () {
                return view;
            },

            activate: function () {
                return utils.promiseTimeout(500);
            }
        }
    }

    return viewmodel;
});

define('text!views/permissao.html',[],function () { return '<div class="row clearfix">\r\n    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">\r\n        <div class="card">\r\n            <div class="header">\r\n                <h2>\r\n                    Permissão\r\n                </h2>\r\n                <ul class="header-dropdown m-r--5">\r\n                    <li class="dropdown">\r\n                        <a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\r\n                            <i class="material-icons">more_vert</i>\r\n                        </a>\r\n                        <ul class="dropdown-menu pull-right">\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block" data-bind="click: showId">Action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Another action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Something else here</a></li>\r\n                        </ul>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n            <div class="body">\r\n                <div class="row clearfix">\r\n                    <div class="col-md-12">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" data-bind="value: id" class="form-control" placeholder="col-md-12">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-6">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-6">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n\r\n                    <div class="col-md-6">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-6">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-4">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-4">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-4">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-4">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-4">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-4">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-3">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-3">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row clearfix">\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-md-2">\r\n                        <div class="form-group">\r\n                            <div class="form-line">\r\n                                <input type="text" class="form-control" placeholder="col-md-2">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('viewmodels/permissao',['require','text!views/permissao.html','lib/utils'],function (require) {
    var view = require('text!views/permissao.html');
    var utils = require('lib/utils');

    /* returns a function that will be a factory */
    function viewmodel(args) {
        var self = this;
        this.id = ko.observable(args.id || 0);

        return {
            getView: function () {
                return view;
            },

            id: self.id,

            showId: function () {
                swal({
                    title: "Info!",
                    text: "Id: " + self.id(),
                    icon: "success",
                });
            },

            activate: function () {
                return utils.promiseTimeout(500);
            }
        }
    }

    return viewmodel;
});

define('text!views/permissoes.html',[],function () { return '\r\n<div class="block-header">\r\n    <h2>\r\n        Permissões\r\n        <small>Cadastro de Permissões</small>\r\n    </h2>\r\n</div>\r\n\r\n<div class="row clearfix">\r\n    <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">\r\n        <div class="card">\r\n            <div class="header">\r\n                <h2>\r\n                    Listagem de Permissões\r\n                </h2>\r\n                <ul class="header-dropdown m-r--5">\r\n                    <li class="dropdown">\r\n                        <a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">\r\n                            <i class="material-icons">more_vert</i>\r\n                        </a>\r\n                        <ul class="dropdown-menu pull-right">\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Another action</a></li>\r\n                            <li><a href="javascript:void(0);" class=" waves-effect waves-block">Something else here</a></li>\r\n                        </ul>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n            <div class="body">\r\n                <div class="table-responsive">\r\n                    <table class="table table-bordered table-striped table-hover js-basic-example dataTable">\r\n                        <thead>\r\n                            <tr>\r\n                                <th>Name</th>\r\n                                <th>Position</th>\r\n                                <th>Office</th>\r\n                                <th>Age</th>\r\n                                <th>Start date</th>\r\n                                <th>Salary</th>\r\n                            </tr>\r\n                        </thead>\r\n                        <tbody>\r\n                            <tr>\r\n                                <td><a data-navigo href="/permissao/1">Tiger Nixon</a></td>\r\n                                <td>System Architect</td>\r\n                                <td>Edinburgh</td>\r\n                                <td>61</td>\r\n                                <td>2011/04/25</td>\r\n                                <td>$320,800</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td><a data-navigo href="/permissao/2">Garrett Winters</a></td>\r\n                                <td>Accountant</td>\r\n                                <td>Tokyo</td>\r\n                                <td>63</td>\r\n                                <td>2011/07/25</td>\r\n                                <td>$170,750</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Ashton Cox</td>\r\n                                <td>Junior Technical Author</td>\r\n                                <td>San Francisco</td>\r\n                                <td>66</td>\r\n                                <td>2009/01/12</td>\r\n                                <td>$86,000</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Cedric Kelly</td>\r\n                                <td>Senior Javascript Developer</td>\r\n                                <td>Edinburgh</td>\r\n                                <td>22</td>\r\n                                <td>2012/03/29</td>\r\n                                <td>$433,060</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Airi Satou</td>\r\n                                <td>Accountant</td>\r\n                                <td>Tokyo</td>\r\n                                <td>33</td>\r\n                                <td>2008/11/28</td>\r\n                                <td>$162,700</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Brielle Williamson</td>\r\n                                <td>Integration Specialist</td>\r\n                                <td>New York</td>\r\n                                <td>61</td>\r\n                                <td>2012/12/02</td>\r\n                                <td>$372,000</td>\r\n                            </tr>\r\n                            <tr>\r\n                                <td>Herrod Chandler</td>\r\n                                <td>Sales Assistant</td>\r\n                                <td>San Francisco</td>\r\n                                <td>59</td>\r\n                                <td>2012/08/06</td>\r\n                                <td>$137,500</td>\r\n                            </tr>\r\n                        </tbody>\r\n                    </table>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>';});

define('viewmodels/permissoes',['require','text!views/permissoes.html','lib/utils'],function (require) {
    var view = require('text!views/permissoes.html');
    var utils = require('lib/utils');

    /* returns a function that will be a factory */
    function viewmodel(args) {
        return {
            getView: function () {
                return view;
            },

            activate: function () {
                return utils.promiseTimeout(2000);
            }
        }
    }

    return viewmodel;
});

define('text!views/home.html',[],function () { return '<div>\r\n    <div class="block-header">\r\n        <h2>HOME</h2>\r\n        <p data-bind="text: message">msg...</p>\r\n        <hello v-bind:message="message"></hello>\r\n    </div>\r\n</div>';});

define('dataservice',['require','lib/pubsub'],function (require) {
    const pubsub = require('lib/pubsub');
    return {
        ping: function () {
            return new Promise(function (resolve, reject) {
                pubsub.publish('busy', true);
                $.post('/hello').done(function (data) {
                    resolve(data);
                }).fail(function (err) {
                    console.error('ping error:', err);
                    reject(err);
                }).always(function () {
                    pubsub.publish('busy', false);
                });
            });
        }
    }
});
define('viewmodels/home',['require','text!views/home.html','lib/pubsub','dataservice','lib/utils'],function (require) {
    var view = require('text!views/home.html');
    var pubsub = require('lib/pubsub');
    var dataservice = require('dataservice');
    var utils = require('lib/utils');
    var count = 0;

    function viewmodel(args, query) {
        count++;
        var self = this;
        this.message = ko.observable('');
        function activate() {
            console.log('activate: ' + count);
           
            return dataservice.ping().then(function (data) {
                var date = utils.jsonDateConverter(data.DateTime);
                self.message(date);

            }, function (err) {
                swal({
                    title: "Erro!",
                    text: err.statusText,
                    icon: "error",
                });
            });
        }

        return {
            getView: function () {
                return view;
            },
            activate: activate,
            message: self.message
        }
    }

    return viewmodel;
});
define('main',['require','./framework','lib/pubsub','viewmodels/usuario','viewmodels/usuarios','viewmodels/permissao','viewmodels/permissoes','viewmodels/home'],(require) => {
    var framework = require('./framework');
    var pubsub = require('lib/pubsub');

    var $shell = $('#shell');
    var router = new Navigo(null, true, "#!");

    var app = new framework({
        shell: $shell,
        router: router,
        channel: 'busy' //channel pubsub
    });
    
    var modules = {
        usuario: require('viewmodels/usuario'),
        usuarios: require('viewmodels/usuarios'),
        permissao: require('viewmodels/permissao'),
        permissoes: require('viewmodels/permissoes'),
        home: require('viewmodels/home')
    }

    router.on({
        '/usuario/:id': function (args, query) {
            app.goto(modules.usuario, args, query);
        },
        '/usuarios': function (args, query) {
            app.goto(modules.usuarios, args, query);
        },
        '/permissao/:id': function (args, query) {
            app.goto(modules.permissao, args, query);
        },
        '/permissoes': function (args, query) {
            app.goto(modules.permissoes, args, query);
        },
        '*': function (args, query) {
            app.goto(modules.home, args, query);
        }
    }).resolve();

    function setBusy(bool) {
        if (bool) {
            $('.page-loader-wrapper').fadeIn();
        } else {
            $('.page-loader-wrapper').fadeOut();
        }
    }

    $(function () {
        $("ul.list a").click(function () {
            $("ul.list li").each(function () {
                var $this = $(this);
                $this.removeClass("active");
            });

            var $this = $(this);
            $this.parent().addClass("active");
        });

        /* componentes podem colocar um overlay quando fazem chamadas assincronas */
        pubsub.subscribe('busy', function (_, bool) {
            setBusy(bool);
        });

        /* componentes podem navegar enviando mensagens ao channel navigate */
        pubsub.subscribe('navigate', function (_, url) {
            router.navigate(url);
        });

        /* fecha o menu da esquerda caso esteja aberto */
        pubsub.subscribe('navigated', function (_, url) {
            $('.overlay').fadeOut();
            $('body').removeClass('overlay-open');
        });

        /* ajax related*/



        $(document).ajaxError(function (event, request, settings) {
            console.log('ajax error.'); //to be handled
        });

        $(document).ajaxSuccess(function (event, request, settings) {
            console.log('ajax success');
        });

        $(document).ajaxComplete(function (event, request, settings) {
            console.log('ajax complete.');
        });

        $(document).ajaxSend(function (event, jqxhr, settings) {
            console.log('ajax send.');
            jqxhr.setRequestHeader('my-custom-token', '1234567890');
        });

        $(document).ajaxStart(function () {
            console.log('ajax start.');
            pubsub.publish('ajax', true);
        });

        $(document).ajaxStop(function () {
            pubsub.publish('ajax', false);
        });
    });
});

require(["main"]);
}());