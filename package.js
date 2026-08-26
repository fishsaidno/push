Package.describe({
  name: 'raix:push',
  version: '6.0.0',
  summary: 'Push notifications for Meteor, Cordova, APN and FCM',
  git: 'https://github.com/raix/push.git',
  // deprecated: true
});

// Server-side push deps
Npm.depends({
  'apn' : '1.6.2', // '1.7.4', // working: 1.6.2
  'firebase-admin': '12.0.0' // previously 6.1.0
});

Cordova.depends({
  // 'phonegap-plugin-push': '2.2.3',  // previously 1.9.0
  '@havesource/cordova-plugin-push': '4.0.0',
  'cordova-plugin-device': '2.1.0' // previously 2.0.2
});

Package.onUse(function(api) {
  // api.versionsFrom('1.2');
  api.versionsFrom(['2.14', '3.0']); // Meteor 2.14 required for compatibility with Cordova dependencies
  api.use(['ecmascript', 'meteor']);


  api.use([
    'tracker', // Push.id() is reactive
  ], 'client');

  // Keep track of users in the appCollection
  api.use([
    'accounts-base'
  ], ['client', 'server'], { weak: true });

  api.use([
    'check',
    'mongo',
    'underscore',
    'ejson',
    'random',   // The push id is created with Random.id()
  ], ['client', 'server']);

  api.use('mongo', 'server');

  // Internal event/state implementation shared by all architectures
  api.addFiles('lib/common/event-state.js', ['client', 'server']);

  // API
  api.addFiles('lib/client/cordova.js', 'web.cordova');

  // Common api
  api.addFiles([
    'lib/common/main.js',
  ], ['web.browser', 'server']);

  // Common api
  api.addFiles([
    'lib/common/notifications.js'
  ], ['client', 'server']);

  // API's
  api.addFiles('lib/client/browser.js', 'web.browser');
  api.addFiles('lib/server/push.api.js', 'server');

  // // Unified api
  api.addFiles('lib/client/client.js', 'client');
  api.addFiles('lib/server/server.js', 'server');

  api.export('Push');

  api.export('_matchToken', { testOnly: true });
  api.export('checkClientSecurity', { testOnly: true });
  api.export('initPushUpdates', { testOnly: true });
  api.export('_replaceToken', { testOnly: true });
  api.export('_removeToken', { testOnly: true });

});
