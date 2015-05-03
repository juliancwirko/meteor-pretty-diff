Package.describe({
    'summary': 'Prettify and export your raw git diff output',
    'version': '1.0.1',
    'git': 'https://github.com/juliancwirko/meteor-pretty-diff',
    'name': 'juliancwirko:pretty-diff'
});

Package.onUse(function (api) {
    api.use([
        'templating@1.0.0',
        'ui@1.0.0',
        'jquery@1.0.0',
        'underscore@1.0.0',
        'reactive-var@1.0.0',
        'markdown@1.0.0'
    ], ['client']);
    api.use([
        'meteorhacks:ssr@2.1.1'
    ], ['server']);

    api.addFiles([
        'client/vendor/diff2html.css'
    ], 'server', {isAsset: true});
    api.addFiles([
        'client/vendor/download.js',
        'client/vendor/hljs.css',
        'client/vendor/diff2html.css',
        'client/style.css',
        'client/vendor/diff2html.js',
        'client/vendor/hljs.js',
        'client/pretty-diff.html',
        'client/pretty-diff.js'
    ], 'client');
    api.addFiles([
        'server/pretty-diff.js'
    ], 'server');
    api.addFiles([
        'server/pretty-diff-export-tmpl.html'
    ], 'server', {isAsset: true});
});
