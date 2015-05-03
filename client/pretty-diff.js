'use strict';

Template.prettyDiffInput.events({
    'click .js-fake-file-name, click .js-fake-choose-file-btn': function (e, tmpl) {
        e.preventDefault();
        tmpl.$('.js-file-reader').trigger('click');
    },
    'change .js-file-reader': function (e, tmpl) {
        var file = $(e.target)[0].files[0];
        var diffJson;
        var prettyDiffData;
        var languages;
        var uniqueLanguages;
        var data = {};
        var reader = new FileReader();
        if (!file) {
            return false;
        }
        if (file.type === 'text/plain' || file.type === 'text/diff' || file.type === 'text/x-patch') {
            reader.onload = function () {
                diffJson = Diff2Html.getJsonFromDiff(reader.result);
                languages = diffJson.map(function (line) {
                    return line.language;
                });
                uniqueLanguages = languages.filter(function (v, i) {
                    return languages.indexOf(v) === i;
                });
                prettyDiffData = Diff2Html.getPrettySideBySideHtmlFromJson(diffJson);
                data = {
                    prettyDiffHtml: prettyDiffData,
                    uniqueLanguages: uniqueLanguages
                };
                Session.set('prettyDiffError');
                Session.set('prettyDiffData', data);
                tmpl.$('.js-fake-file-name').val(file.name);
                $('.js-fake-file-name').trigger({
                    type: 'pretty-diff-success'
                });
            };
            reader.readAsBinaryString(file);
        } else {
            Session.set('prettyDiffData');
            Session.set('prettyDiffError', 'Unsupported media type. Supported file types are: text/plain, text/x-diff, text/x-patch');
        }
    }
});

Template.prettyDiffOutput.onCreated(function () {
    this.isExportDesc = new ReactiveVar(false);
    this.markdownConverter = new Showdown.converter();
});

Template.prettyDiffOutput.onRendered(function () {
    var html = Blaze.toHTML(Template.prettyDiffPreviewPlaceholder);
    this.$('.js-export-description-preview').html(html);
});

Template.prettyDiffOutput.events({
    'click .js-export-html': function (e, tmpl) {
        e.preventDefault();
        var data = Session.get('prettyDiffData');
        var exportTitle = tmpl.$('.js-export-title').val();
        var exportDesc = tmpl.markdownConverter.makeHtml(tmpl.$('.js-export-description').val());
        var exportFooter = tmpl.markdownConverter.makeHtml(tmpl.$('.js-export-footer').val());
        data = _.extend(data, {
            prettyDiffTitle: exportTitle || '',
            prettyDiffDesc: exportDesc || '',
            prettyDiffFooter: exportFooter || ''
        });
        if (data) {
            Meteor.call('downloadHTMLFile', data, function (err, result) {
                if (!err) {
                    downloadFile(result, 'pretty-diff.html', 'text/html');
                }
            });
        }
    },
    'click .js-add-description': function (e, tmpl) {
        e.preventDefault();
        var state = tmpl.isExportDesc.get();
        tmpl.isExportDesc.set(!state);
    },
    'keyup .js-export-description': function (e, tmpl) {
        var html = tmpl.markdownConverter.makeHtml(tmpl.$('.js-export-description').val()) || Blaze.toHTML(Template.prettyDiffPreviewPlaceholder);
        $('.js-export-description-preview').html(html);
    }
});

Template.prettyDiffOutput.helpers({
    prettyDiffFileData: function () {
        return Session.get('prettyDiffData');
    },
    isExportDescription: function () {
        return Template.instance().isExportDesc.get();
    }
});

Template.prettyDiffError.helpers({
    prettyDiffError: function () {
        return Session.get('prettyDiffError');
    }
});

Template.prettyDiffContent.onRendered(function () {
    var self = this;
    var langs;
    this.autorun(function () {
        var data = Session.get('prettyDiffData');
        if (data) {
            langs = data && data.uniqueLanguages;
            if (langs) {
                Meteor.defer(function () {
                    hljs.configure({languages: langs});
                    var codeSide = self.$('.d2h-code-side-line');
                    codeSide.map(function (i, line) {
                        hljs.highlightBlock(line);
                    });
                });
            }
        }
    });
});

Template.registerHelper('isPrettyDiffDataLoaded', function () {
    return Session.get('prettyDiffData');
});
