/*
 *
 * Diff to HTML (diff2html.js)
 * Author: rtfpessoa (https://github.com/rtfpessoa/diff2html)
 * Date: Friday 29 August 2014
 * Last Update: Sunday 2 February 2015
 *
 * Diff command:
 *   git diff
 */


(function (window) {


    /*
     * Javascript Diff Algorithm
     *  By John Resig (http://ejohn.org/)
     *  Modified by Chu Alan "sprite"
     *  Modified by Rodrigo Fernandes "rtfpessoa"
     *
     * Released under the MIT license.
     *
     * More Info:
     *  http://ejohn.org/projects/javascript-diff-algorithm/
     */

    function diffString(o, n) {
        o = o.replace(/\s+$/, '');
        n = n.replace(/\s+$/, '');

        var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/));
        var str = "";

        var oSpace = o.match(/\s+/g);
        if (oSpace == null) {
            oSpace = ["\n"];
        } else {
            oSpace.push("\n");
        }
        var nSpace = n.match(/\s+/g);
        if (nSpace == null) {
            nSpace = ["\n"];
        } else {
            nSpace.push("\n");
        }

        if (out.n.length == 0) {
            for (var i = 0; i < out.o.length; i++) {
                str += '<del>' + out.o[i] + oSpace[i] + "</del>";
            }
        } else {
            if (out.n[0].text == null) {
                for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
                    str += '<del>' + out.o[n] + oSpace[n] + "</del>";
                }
            }

            for (var i = 0; i < out.n.length; i++) {
                if (out.n[i].text == null) {
                    str += '<ins>' + out.n[i] + nSpace[i] + "</ins>";
                } else {
                    var pre = "";

                    for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++) {
                        pre += '<del>' + out.o[n] + oSpace[n] + "</del>";
                    }
                    str += " " + out.n[i].text + nSpace[i] + pre;
                }
            }
        }

        return str;
    };

    function diff(o, n) {
        var ns = new Object();
        var os = new Object();

        for (var i = 0; i < n.length; i++) {
            if (ns[n[i]] == null)
                ns[n[i]] = {rows: new Array(), o: null};
            ns[n[i]].rows.push(i);
        }

        for (var i = 0; i < o.length; i++) {
            if (os[o[i]] == null)
                os[o[i]] = {rows: new Array(), n: null};
            os[o[i]].rows.push(i);
        }

        for (var i in ns) {
            if (ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1) {
                n[ns[i].rows[0]] = {text: n[ns[i].rows[0]], row: os[i].rows[0]};
                o[os[i].rows[0]] = {text: o[os[i].rows[0]], row: ns[i].rows[0]};
            }
        }

        for (var i = 0; i < n.length - 1; i++) {
            if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null &&
                n[i + 1] == o[n[i].row + 1]) {
                n[i + 1] = {text: n[i + 1], row: n[i].row + 1};
                o[n[i].row + 1] = {text: o[n[i].row + 1], row: i + 1};
            }
        }

        for (var i = n.length - 1; i > 0; i--) {
            if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null &&
                n[i - 1] == o[n[i].row - 1]) {
                n[i - 1] = {text: n[i - 1], row: n[i].row - 1};
                o[n[i].row - 1] = {text: o[n[i].row - 1], row: i - 1};
            }
        }

        return {o: o, n: n};
    };


    var ClassVariable;

    ClassVariable = (function () {

        var LINE_TYPE = {
            INSERTS: "d2h-ins",
            DELETES: "d2h-del",
            CONTEXT: "d2h-cntx",
            INFO: "d2h-info"
        };

        function Diff2Html() {
        }

        /*
         * Generates pretty html from string diff input
         */
        Diff2Html.prototype.getPrettyHtmlFromDiff = function (diffInput) {
            var diffJson = generateDiffJson(diffInput);
            return generateJsonHtml(diffJson);
        };

        /*
         * Generates json object from string diff input
         */
        Diff2Html.prototype.getJsonFromDiff = function (diffInput) {
            return generateDiffJson(diffInput);
        };

        /*
         * Generates pretty html from a json object
         */
        Diff2Html.prototype.getPrettyHtmlFromJson = function (diffJson) {
            return generateJsonHtml(diffJson);
        };

        /*
         * Generates pretty side by side html from string diff input
         */
        Diff2Html.prototype.getPrettySideBySideHtmlFromDiff = function (diffInput) {
            var diffJson = generateDiffJson(diffInput);
            return generateSideBySideJsonHtml(diffJson);
        };

        /*
         * Generates pretty side by side html from a json object
         */
        Diff2Html.prototype.getPrettySideBySideHtmlFromJson = function (diffJson) {
            return generateSideBySideJsonHtml(diffJson);
        };

        var generateDiffJson = function (diffInput) {
            var files = [],
                currentFile = null,
                currentBlock = null,
                oldLine = null,
                newLine = null;

            var saveBlock = function () {
                /* add previous block(if exists) before start a new file */
                if (currentBlock) {
                    currentFile.blocks.push(currentBlock);
                    currentBlock = null;
                }
            };

            var saveFile = function () {
                /*
                 * add previous file(if exists) before start a new one
                 * if it has name (to avoid binary files errors)
                 */
                if (currentFile && currentFile.newName) {
                    files.push(currentFile);
                    currentFile = null;
                }
            };

            var startFile = function () {
                saveBlock();
                saveFile();

                /* create file structure */
                currentFile = {};
                currentFile.blocks = [];
                currentFile.deletedLines = 0;
                currentFile.addedLines = 0;
            };

            var startBlock = function (line) {
                saveBlock();

                var values = /^@@ -(\d+),\d+ \+(\d+),\d+ @@.*/.exec(line) ||
                    /^@@@ -(\d+),\d+ -\d+,\d+ \+(\d+),\d+ @@@.*/.exec(line) ||
                    [0, 0, 0];

                oldLine = values[1];
                newLine = values[2];

                /* create block metadata */
                currentBlock = {};
                currentBlock.lines = [];
                currentBlock.oldStartLine = oldLine;
                currentBlock.newStartLine = newLine;
                currentBlock.header = line;
            };

            var createLine = function (line) {
                var currentLine = {};
                currentLine.content = line;

                /* fill the line data */
                if (startsWith(line, "+") || startsWith(line, " +")) {
                    currentFile.addedLines++;

                    currentLine.type = LINE_TYPE.INSERTS;
                    currentLine.oldNumber = null;
                    currentLine.newNumber = newLine++;

                    currentBlock.lines.push(currentLine);

                } else if (startsWith(line, "-") || startsWith(line, " -")) {
                    currentFile.deletedLines++;

                    currentLine.type = LINE_TYPE.DELETES;
                    currentLine.oldNumber = oldLine++;
                    currentLine.newNumber = null;

                    currentBlock.lines.push(currentLine);

                } else {
                    currentLine.type = LINE_TYPE.CONTEXT;
                    currentLine.oldNumber = oldLine++;
                    currentLine.newNumber = newLine++;

                    currentBlock.lines.push(currentLine);
                }
            };

            var diffLines = diffInput.split("\n");
            diffLines.forEach(function (line) {
                // Unmerged paths, and possibly other non-diffable files
                // https://github.com/scottgonzalez/pretty-diff/issues/11
                // Also, remove some useless lines
                if (!line || startsWith(line, "*") ||
                    startsWith(line, "new") || startsWith(line, "index")) {
                    return;
                }

                var values = [];
                if (startsWith(line, "diff")) {
                    startFile();
                } else if (currentFile && !currentFile.oldName && (values = /^--- a\/(\S+).*$/.exec(line))) {
                    currentFile.oldName = values[1];
                } else if (currentFile && !currentFile.newName && (values = /^\+\+\+ b\/(\S+).*$/.exec(line))) {
                    currentFile.newName = values[1];

                    var fileSplit = currentFile.newName.split(".");
                    currentFile.language = fileSplit[fileSplit.length - 1];
                } else if (currentFile && startsWith(line, "@@")) {
                    startBlock(line);
                } else if (currentBlock) {
                    createLine(line);
                }
            });

            saveBlock();
            saveFile();

            return files;
        };

        /*
         * Line By Line HTML
         */

        var generateJsonHtml = function (diffFiles) {
            return "<div class=\"d2h-wrapper\">\n" +
                diffFiles.map(function (file) {
                    return "<div class=\"d2h-file-wrapper\" data-lang=\"" + file.language + "\">\n" +
                        "     <div class=\"d2h-file-header\">\n" +
                        "       <div class=\"d2h-file-stats\">\n" +
                        "         <span class=\"d2h-lines-added\">+" + file.addedLines + "</span>\n" +
                        "         <span class=\"d2h-lines-deleted\">-" + file.deletedLines + "</span>\n" +
                        "       </div>\n" +
                        "       <div class=\"d2h-file-name\">" + getDiffName(file.oldName, file.newName) + "</div>\n" +
                        "     </div>\n" +
                        "     <div class=\"d2h-file-diff\">\n" +
                        "       <div class=\"d2h-code-wrapper\">\n" +
                        "         <table class=\"d2h-diff-table\">\n" +
                        "           <tbody class=\"d2h-diff-tbody\">\n" +
                        "         " + generateFileHtml(file) +
                        "           </tbody>\n" +
                        "         </table>\n" +
                        "       </div>\n" +
                        "     </div>\n" +
                        "   </div>\n";
                }).join("\n") +
                "</div>\n";
        };

        var generateFileHtml = function (file) {
            return file.blocks.map(function (block) {

                var lines = "<tr>\n" +
                    "  <td class=\"d2h-code-linenumber " + LINE_TYPE.INFO + "\"></td>\n" +
                    "  <td class=\"" + LINE_TYPE.INFO + "\">" +
                    "    <div class=\"d2h-code-line " + LINE_TYPE.INFO + "\">" + escape(block.header) + "</div>" +
                    "  </td>\n" +
                    "</tr>\n";

                for (var i = 0; i < block.lines.length; i++) {
                    var prevLine = block.lines[i - 1];
                    var line = block.lines[i];
                    var newLine = block.lines[i + 1];
                    var nextNewLine = block.lines[i + 2];

                    var isOppositeTypeTwoLineBlock =
                        line.type == LINE_TYPE.DELETES &&
                        newLine && newLine.type == LINE_TYPE.INSERTS &&
                        (!nextNewLine || nextNewLine && nextNewLine.type != LINE_TYPE.INSERTS) &&
                        (!prevLine || prevLine && prevLine.type != LINE_TYPE.DELETES);

                    var escapedLine = escape(line.content);

                    if (isOppositeTypeTwoLineBlock) {
                        var nextEscapedLine = escape(newLine.content);

                        var diff = diffHighlight(escapedLine, nextEscapedLine);

                        lines += generateLineHtml(line.type, line.oldNumber, line.newNumber, diff.o) +
                        generateLineHtml(newLine.type, newLine.oldNumber, newLine.newNumber, diff.n);

                        i++;
                    } else {
                        lines += generateLineHtml(line.type, line.oldNumber, line.newNumber, escapedLine);
                    }
                }

                return lines;
            }).join("\n");
        };

        var generateLineHtml = function (type, oldNumber, newNumber, content) {
            return "<tr>\n" +
                "  <td class=\"d2h-code-linenumber " + type + "\">" +
                "    <div class=\"line-num1\">" + valueOrEmpty(oldNumber) + "</div>" +
                "    <div class=\"line-num2\">" + valueOrEmpty(newNumber) + "</div>" +
                "  </td>\n" +
                "  <td class=\"" + type + "\">" +
                "    <div class=\"d2h-code-line " + type + "\">" + content + "</div>" +
                "  </td>\n" +
                "</tr>\n";
        };

        /*
         * Side By Side HTML (work in progress)
         */

        var generateSideBySideJsonHtml = function (diffFiles) {
            return "<div class=\"d2h-wrapper\">\n" +
                diffFiles.map(function (file) {
                    var diffs = generateSideBySideFileHtml(file);

                    return "<div class=\"d2h-file-wrapper\" data-lang=\"" + file.language + "\">\n" +
                        "     <div class=\"d2h-file-header\">\n" +
                        "       <div class=\"d2h-file-stats\">\n" +
                        "         <span class=\"d2h-lines-added\">+" + file.addedLines + "</span>\n" +
                        "         <span class=\"d2h-lines-deleted\">-" + file.deletedLines + "</span>\n" +
                        "       </div>\n" +
                        "       <div class=\"d2h-file-name\">" + getDiffName(file.oldName, file.newName) + "</div>\n" +
                        "     </div>\n" +
                        "     <div class=\"d2h-files-diff\">\n" +
                        "       <div class=\"d2h-file-side-diff\">\n" +
                        "         <div class=\"d2h-code-wrapper\">\n" +
                        "           <table class=\"d2h-diff-table\">\n" +
                        "             <tbody class=\"d2h-diff-tbody\">\n" +
                        "           " + diffs.left +
                        "             </tbody>\n" +
                        "           </table>\n" +
                        "         </div>\n" +
                        "       </div>\n" +
                        "       <div class=\"d2h-file-side-diff\">\n" +
                        "         <div class=\"d2h-code-wrapper\">\n" +
                        "           <table class=\"d2h-diff-table\">\n" +
                        "             <tbody class=\"d2h-diff-tbody\">\n" +
                        "           " + diffs.right +
                        "             </tbody>\n" +
                        "           </table>\n" +
                        "         </div>\n" +
                        "       </div>\n" +
                        "     </div>\n" +
                        "   </div>\n";
                }).join("\n") +
                "</div>\n";
        };

        var generateSideBySideFileHtml = function (file) {
            var fileHtml = {};
            fileHtml.left = "";
            fileHtml.right = "";

            file.blocks.forEach(function (block) {

                fileHtml.left += "<tr>\n" +
                "  <td class=\"d2h-code-side-linenumber " + LINE_TYPE.INFO + "\"></td>\n" +
                "  <td class=\"" + LINE_TYPE.INFO + "\">" +
                "    <div class=\"d2h-code-side-line " + LINE_TYPE.INFO + "\">" + escape(block.header) + "</div>" +
                "  </td>\n" +
                "</tr>\n";

                fileHtml.right += "<tr>\n" +
                "  <td class=\"d2h-code-side-linenumber " + LINE_TYPE.INFO + "\"></td>\n" +
                "  <td class=\"" + LINE_TYPE.INFO + "\">" +
                "    <div class=\"d2h-code-side-line " + LINE_TYPE.INFO + "\"></div>" +
                "  </td>\n" +
                "</tr>\n";

                for (var i = 0; i < block.lines.length; i++) {
                    var prevLine = block.lines[i - 1];
                    var line = block.lines[i];
                    var newLine = block.lines[i + 1];
                    var nextNewLine = block.lines[i + 2];

                    var isOpositeTypeTwoLineBlock = line.type == LINE_TYPE.DELETES && newLine && newLine.type == LINE_TYPE.INSERTS &&
                        (!nextNewLine || nextNewLine && nextNewLine.type != LINE_TYPE.INSERTS) &&
                        (!prevLine || prevLine && prevLine.type != LINE_TYPE.DELETES);

                    var escapedLine = escape(line.content);

                    if (isOpositeTypeTwoLineBlock) {
                        var nextEscapedLine = escape(newLine.content);

                        var diff = diffHighlight(escapedLine, nextEscapedLine);

                        fileHtml.left += generateSingleLineHtml(line.type, line.oldNumber, diff.o);
                        fileHtml.right += generateSingleLineHtml(newLine.type, newLine.newNumber, diff.n);

                        i++;
                    } else if (line.type == LINE_TYPE.DELETES) {
                        fileHtml.left += generateSingleLineHtml(line.type, line.oldNumber, escapedLine);
                        fileHtml.right += generateSingleLineHtml(LINE_TYPE.CONTEXT, "", "", "");
                    } else if (line.type == LINE_TYPE.INSERTS) {
                        fileHtml.left += generateSingleLineHtml(LINE_TYPE.CONTEXT, "", "", "");
                        fileHtml.right += generateSingleLineHtml(line.type, line.newNumber, escapedLine);
                    } else {
                        fileHtml.left += generateSingleLineHtml(line.type, line.oldNumber, escapedLine);
                        fileHtml.right += generateSingleLineHtml(line.type, line.newNumber, escapedLine);
                    }
                }

            });

            return fileHtml;
        };

        var generateSingleLineHtml = function (type, number, content) {
            return "<tr>\n" +
                "    <td class=\"d2h-code-side-linenumber " + type + "\">" + number + "</td>\n" +
                "    <td class=\"" + type + "\">" +
                "      <div class=\"d2h-code-side-line " + type + "\">" + content + "</div>" +
                "    </td>\n" +
                "  </tr>\n";
        };

        /*
         * HTML Helpers
         */

        var getDiffName = function (oldFilename, newFilename) {
            if (oldFilename && newFilename && oldFilename !== newFilename) {
                return oldFilename + " -> " + newFilename;
            } else if (newFilename) {
                return newFilename;
            } else if (oldFilename) {
                return oldFilename;
            } else {
                return "Unknown filename";
            }
        };

        var removeIns = function (line) {
            return line.replace(/(<ins>((.|\n)*?)<\/ins>)/g, "");
        };

        var removeDel = function (line) {
            return line.replace(/(<del>((.|\n)*?)<\/del>)/g, "");
        };

        /*
         * Utils
         */

        function escape(str) {
            return str.slice(0)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\t/g, "    ");
        }

        function startsWith(str, start) {
            return str.indexOf(start) === 0;
        }

        function valueOrEmpty(value) {
            return value ? value : "";
        }

        function diffHighlight(diffLine1, diffLine2) {
            /* remove the initial -/+ to avoid always having diff in the first char */
            var highlightedLine = diffString(diffLine1.substr(1), diffLine2.substr(1));

            return {
                o: diffLine1.charAt(0) + removeIns(highlightedLine),
                n: diffLine2.charAt(0) + removeDel(highlightedLine)
            }
        }

        /* singleton pattern */
        var instance;
        return {
            getInstance: function () {
                if (instance === undefined) {
                    instance = new Diff2Html();
                    /* Hide the constructor so the returned objected can't be new'd */
                    instance.constructor = null;
                }
                return instance;
            }
        };

    })();

    window.Diff2Html = ClassVariable.getInstance();
    return window.Diff2Html;

})(window);
