/*jshint -W106 */

"use strict";

var fs          = require("fs"),
    path        = require("path"),
    _replace    = {
        // HACK: 1. We have to mock shell app.
        // HACK: 2. Brackets inBrowser behaves very differently, that's why we have to fake it.
        // HACK: 3. We need the menus in the Browser.
        // HACK: 4/5. Brackets extension registry services don't allow CORS, that's why we have to proxy the requests.
        "utils/Global": {
            match: "global.brackets.app = {};",
            value: "global.brackets.app = require(\"hacks.app\"); global.brackets.inBrowser = false; global.brackets.nativeMenus = false; global.brackets.config.extension_registry = '/brackets/s3.amazonaws.com/extend.brackets/registry.json'; global.brackets.config.extension_url = '/brackets/s3.amazonaws.com/extend.brackets/{0}/{0}-{1}.zip';"
        },
        // HACK: Remove warning dialog about Brackets not been ready for browsers.
        "brackets": [
            {
                match: /\/\/ Let the user know Brackets doesn't run in a web browser yet\s+if \(brackets.inBrowser\) {/,
                value: "if (false) {"
            },
            {
                match: "!url.match(/^file:\\/\\//) && url !== \"about:blank\" && url.indexOf(\":\") !== -1",
                varlue: "false"
            }
        ],
        // TODO: Needs more investigaton.
        // HACK: For some reason this line cases languageDropdown to be populated before it si initialized.
        "editor/EditorStatusBar": {
            match: "$(LanguageManager).on(\"languageAdded languageModified\", _populateLanguageDropdown);",
            value: "// $(LanguageManager).on(\"languageAdded languageModified\", _populateLanguageDropdown);"
        },
        "command/DefaultMenus": [
            {
                match: "menu.addMenuItem(Commands.FILE_OPEN);",
                value: " "
            },
            {
                match: "menu.addMenuItem(Commands.FILE_OPEN_FOLDER);",
                value: " "
            },
            {
                match: "menu.addMenuItem(Commands.FILE_SAVE_AS);",
                value: " "
            }
        ]
    };

function addCodeMirrorModes(config) {
    var root = path.join(__dirname, "brackets-src", "src", "thirdparty", "CodeMirror2", "mode"),
        dirs = fs.readdirSync(root),
        include = config.requirejs.main.options.include;

    dirs.forEach(function (file) {
        var stat = fs.statSync(root + "/" + file);
        if (stat.isDirectory()) {
            include.push("thirdparty/CodeMirror2/mode/" + file + "/" + file);
        }
    });
}

function addDefaultExtesions(config) {
    var root = path.join(__dirname, "brackets-src", "src", "extensions", "default"),
        dirs = fs.readdirSync(root),
        rj = config.requirejs;

    dirs.forEach(function (file) {
        var stat = fs.statSync(root + "/" + file);
        if (stat.isDirectory() && fs.existsSync(root + "/" + file + "/main.js") && file !== "JavaScriptCodeHints") {
            var mod = {
                options: {
                    name: "main",
                    out: "brackets-dist/extensions/default/" + file + "/main.js",
                    baseUrl: "brackets-src/src/extensions/default/" + file + "/",
                    preserveLicenseComments: false,
                    optimize: "uglify2",
                    uglify2: {},
                    paths: {
                        "text" : "../../../thirdparty/text/text",
                        "i18n" : "../../../thirdparty/i18n/i18n",
                    }
                }
            };

            rj[file] = mod;

//            if (file === "JavaScriptCodeHints") {
//                mod.options.onBuildRead = function (moduleName, path, contents) {
//                    return contents.replace("== \"use strict\"", "== \"use\\ strict\"");
//                };
//
//                rj.ternWorker = {
//                    options: {
//                        name: "tern-worker",
//                        out: "brackets-dist/extensions/default/JavaScriptCodeHints/tern-worker.js",
//                        baseUrl: "brackets-src/src/extensions/default/JavaScriptCodeHints/",
//                        preserveLicenseComments: false,
//                        optimize: "uglify2",
//                        uglify2: {},
//                        paths: {
//                            "text" : "../../../thirdparty/text/text",
//                            "i18n" : "../../../thirdparty/i18n/i18n",
//                        },
//                        wrap: false
//                    }
//                };
//            }
        }
    });
}

module.exports = function (grunt) {

    // load dependencies
    require("load-grunt-tasks")(grunt, {pattern: ["grunt-*"]});
    //grunt.loadTasks("tasks");

    var config = {
        jsdoc: {
            dist: {
                src: ["./server", "README.md"],
                options: {
                    destination: "./cache/docs",
                    tutorials: "./cache/docs/tutorials",
                    template: "./node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    configure: "./jsdoc.json"
                }
            }
        },
        "gh-pages": {
            options: {
                base: "./cache/docs"
            },
            src: ["**"]
        },
        simplemocha: {
            options: {
                timeout: 3000,
                ignoreLeaks: false,
                reporter: "spec"
            },
            all: {
                src: ["./test/*_test.js"]
            },
            server: {
                src: ["./test/server_test.js"]
            }
        },
        shell: {
            debug: {
                options: {
                    stdout: true
                },
                command: function (target) {
                    if (process.platform === "win32") {
                        return "grunt-debug test:" + target;
                    }

                    return "node --debug-brk $(which grunt) test:" + target;
                }
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            debug_all: ["node-inspector", "shell:debug:all"],
            debug_server: ["node-inspector", "shell:debug:server"]
        },
        "node-inspector": {
            "default": {}
        },
        release: {
            options: {
                npm: false
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        "brackets-dist",
                        "brackets-src/src/.index.html",
                        "brackets-src/src/styles/brackets.css"
                    ]
                }]
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        "brackets-dist/index.html": "brackets-src/src/.index.html"

                    },
                    /* static files */
                    {
                        expand: true,
                        dest: "brackets-dist/",
                        cwd: "brackets-src/src/",
                        src: [
                            "nls/{,*/}*.js",
                            "xorigin.js",
                            "dependencies.js",
                            "thirdparty/requirejs/require.js",
                            "LiveDevelopment/launch.html"
                        ]
                    },
                    /* extensions and CodeMirror modes */
                    {
                        expand: true,
                        dest: "brackets-dist/",
                        cwd: "brackets-src/src/",
                        src: [
                            "extensions/default/JavaScriptCodeHints/**",
                            "extensions/default/*/**/*.{css,less,json,svg,png}",
                            "!extensions/default/*/unittest-files/**",
                            "extensions/dev/*",
//                            "extensions/samples/**/*",
//                            "thirdparty/CodeMirror2/addon/{,*/}*",
//                            "thirdparty/CodeMirror2/keymap/{,*/}*",
                            "thirdparty/CodeMirror2/lib/{,*/}*.css",
//                            "thirdparty/CodeMirror2/mode/{,*/}*",
//                            "thirdparty/CodeMirror2/theme/{,*/}*",
                            "thirdparty/i18n/*.js",
                            "thirdparty/text/*.js"
                        ]
                    },
                    /* styles, fonts and images */
                    {
                        expand: true,
                        dest: "brackets-dist/styles",
                        cwd: "brackets-src/src/styles",
                        src: ["jsTreeTheme.css", "fonts/{,*/}*.*", "images/*", "brackets.min.css*"]
                    },
                    /* samples */
                    {
                        expand: true,
                        dest: "brackets-dist/",
                        cwd: "brackets-src/",
                        src: [
                            "samples/**"
                        ]
                    }
                ]
            }
        },
        less: {
            dist: {
                files: {
                    "brackets-src/src/styles/brackets.min.css": "brackets-src/src/styles/brackets.less"
                },
                options: {
                    compress: true,
                    sourceMap: true,
                    sourceMapFilename: "brackets-src/src/styles/brackets.min.css.map",
                    outputSourceFiles: true,
                    sourceMapRootpath: "",
                    sourceMapBasepath: "brackets-src/src/styles"
                }
            }
        },
        requirejs: {
            main: {
                options: {
                    // `name` and `out` is set by grunt-usemin
                    name: "main",
                    out: "brackets-dist/main.js",
                    mainConfigFile: "brackets-src/src/main.js",
                    baseUrl: "brackets-src/src",
                    optimize: "uglify2",
                    uglify2: {}, // https://github.com/mishoo/UglifyJS2
                    include: ["utils/Compatibility", "brackets"],
                    preserveLicenseComments: false,
                    exclude: ["text!config.json"],
                    paths: {
                        "hacks.app": "../../hacks/app",
                        "socket.io": "../../node_modules/socket.io/node_modules/socket.io-client/socket.io"
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        var rpl = _replace[moduleName];
                        if (rpl) {
                            if (Array.isArray(rpl)) {
                                rpl.forEach(function (el) {
                                    contents = contents.replace(el.match, el.value);
                                });
                                return contents;
                            }
                            return contents.replace(rpl.match, rpl.value);
                        } else if (moduleName === "fileSystemImpl") {
                            // HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
                            return fs.readFileSync(__dirname + "/client-fs/file-system.js", {
                                encoding: "utf8"
                            });
                        }
                        return contents;
                    },
//                    generateSourceMaps: true,
//                    useSourceUrl: true,
                    wrap: false
                }
            }
        },
        replace: {
            dist: {
                src: "brackets-src/src/.index.html",
                overwrite: true,
                replacements: [{
                    from: "<!-- build:js main.js -->",
                    to: " "
                }]
            }
        },
        targethtml: {
            dist: {
                files: {
                    "brackets-src/src/.index.html": "brackets-src/src/index.html"
                }
            }
        },
        useminPrepare: {
            options: {
                dest: "brackets-dist"
            },
            html: "brackets-src/src/.index.html"
        },
        usemin: {
            options: {
                dirs: ["brackets-dist"]
            },
            html: ["brackets-dist/{,*/}*.html"]
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: "brackets-src/src",
                    src: "*.html",
                    dest: "brackets-dist"
                }]
            }
        },
        compress: {
            main: {
                options: {
                    mode: "gzip"
                },
                files: [
                    {
                        expand: true,
                        cwd: "brackets-dist/",
                        src: ["**/*.js", "!samples/**"],
                        extDot: "last",
                        dest: "brackets-dist/",
                        ext: ".js.gz"
                    },
                    {
                        expand: true,
                        cwd: "brackets-dist/",
                        src: ["**/*.css", "!samples/**"],
                        extDot: "last",
                        dest: "brackets-dist/",
                        ext: ".css.gz"
                    }
                ]
            }
        }
    };

    addDefaultExtesions(config);
    addCodeMirrorModes(config);
    grunt.initConfig(config);

    var common  = require("./brackets-src/tasks/lib/common")(grunt),
        build   = require("./brackets-src/tasks/build")(grunt);

    grunt.registerTask("build-config", "Update config.json with the build timestamp, branch and SHA being built", function () {
        var done = this.async(),
            distConfig = grunt.file.readJSON("brackets-src/src/config.json");

        build.getGitInfo(path.resolve("./brackets-src")).then(function (gitInfo) {
            distConfig.version = distConfig.version.substr(0, distConfig.version.lastIndexOf("-") + 1) + gitInfo.commits;
            distConfig.repository.SHA = gitInfo.sha;
            distConfig.repository.branch = gitInfo.branch;
            distConfig.config.build_timestamp = new Date().toString().split("(")[0].trim();

            common.writeJSON(grunt, "brackets-dist/config.json", distConfig);

            done();
        }, function (err) {
            grunt.log.writeln(err);
            done(false);
        });
    });

    // task: build
    grunt.registerTask("build", [
        "clean",
        "less",
        "targethtml",
        "replace",
        "useminPrepare",
        "htmlmin",
        "requirejs",
        "concat",
        "copy",
        "usemin",
        "compress",
        "build-config"
    ]);

    grunt.registerTask("test", function () {
        var arg = "all";
        if (this.args && this.args.length > 0) {
            arg = this.args[0];
        }

        grunt.task.run(["simplemocha:" + arg]);
    });

    grunt.registerTask("test-debug", function () {
        var arg = "all";
        if (this.args && this.args.length > 0) {
            arg = this.args[0];
        }

        grunt.task.run(["concurrent:debug_" + arg]);
    });

    grunt.registerTask("docs", ["jsdoc", "gh-pages"]);
};