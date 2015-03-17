'use strict';

SSR.compileTemplate('emailText', Assets.getText('server/pretty-diff-export-tmpl.html'));

var css = Assets.getText('client/vendor/diff2html.css');

Meteor.methods({
    testmethod: function (data) {
        if (data) {
            return SSR.render('emailText', {
                prettyDiffTitle: data.prettyDiffTitle,
                prettyDiffDesc: data.prettyDiffDesc,
                prettyDiffCss: css,
                prettyDiffHtml: data.prettyDiffHtml
            });
        }
    }
});
