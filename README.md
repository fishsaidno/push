<img alt="Gi-SoftWare" src="https://raw.githubusercontent.com/raix/push/master/docs/logo.png" width="20%" height="20%">

raix:push Push notifications
============================
[![Build Status](https://travis-ci.org/raix/push.svg?branch=master)](https://travis-ci.org/raix/push)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> Push notifications for cordova (ios, android) browser (Chrome, Safari, Firefox) - One unified api on client and server.

Status:
* [x] APN iOS
* [x] GCM/FCM Android
* [x] FCM (Android & iOS)
* [x] APN Safari web push (partially implemented)
* [x] GCM Chrome OS (partially implemented)
* [x] Firefox OS (partially implemented)
* [ ] BPS Blackberry 10
* [ ] MPNS Windows phone 8
* [ ] MPNS Windows 8
* [ ] ADM Amazon Fire OS
* [ ] Meteor in app notifications

## Contributing

We are using [semantic-release](https://github.com/semantic-release/semantic-release) following the [AngularJS Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit) - Following this pattern will result in better versioning, better changelog and shorter release cycle.

## Install
```bash
  $ meteor add raix:push
```

## Getting started
Depending on the platforms you want to work with you will need some credentials or certificates.
* [Android](docs/ANDROID.md)
* [iOS](docs/IOS.md)
* [Firebase Cloud Messaging (Android & iOS)](docs/FIREBASE.md)

Have a look at the [Basic example](docs/BASIC.md)

Theres a good walkthrough by [Arthur Carabott](https://medium.com/@acarabott/meteor-native-ios-push-notifications-heroku-raix-push-cordova-213f486c4e6d#.akrtpzmi7)

Read the [raix:push Newbie Manual](https://github.com/raix/push/wiki/raix:push-Newbie-Manual) by [@harryward](https://github.com/harryward)

Or check out the [DEMO](https://github.com/elvismercado/meteor-raix-push-demo) by [@elvismercado](https://github.com/elvismercado)
(This example uses the deprecated config.push.json)

Example code for [sound](https://github.com/raix/push/issues/9#issuecomment-216068188) *(todo: add in docs)*

Note:
Version 3+ uses the cordova npm plugin ~~[phonegap-plugin-push](https://github.com/phonegap/phonegap-plugin-push#pushnotificationinitoptions)~~ [cordova-plugin-push](https://github.com/havesource/cordova-plugin-push/)

Note:
Some of the documentation is outdated, please file an issue or create a pull request - same if you find a bug or want to add tests
## Development

Watch the project [progress](https://github.com/raix/push/projects/1) for status or join development

## Config

Use the `Push.Configure` function on client and server.

### Client

For example in `Meteor.startup()` block of main.js

```js
// Android 26 requires you to use notification channels, cordova-plugin-push creates a default channel with id 'PushPluginChannel'
// Changes to the default notification channel need to be made before calling Push.Configure (see below)
if (Meteor.isCordova){
  PushNotification.createChannel(
    function(){
      console.log('Channel Created!');
    },
    function(){
      console.log('Channel not created :(');
    },
    {
      id: 'PushPluginChannel',
      description: 'Channel Name Shown To Users',
      importance: 3,
      vibration: true
    }
  );
}

Push.Configure({
  cordovaOptions: {
    // Options in here are passed to cordova-plugin-push, see the full API reference: https://github.com/havesource/cordova-plugin-push/blob/master/docs/API.md#pushnotificationinitoptions
    android: {
      // senderID: 12341234,
      sound: true,
      vibrate: true,
      clearBadge: false,
      clearNotifications: true,
      forceShow: false
      // icon: '',
      // iconColor: ''
    },
    ios: {
      // voip: false,
      alert: true,
      badge: true,
      sound: true,
      clearBadge: false,
      // categories: {},
      // fcmSandbox: false, // Doesn't need to be set if using FCM for iOS with 'APNs Authentication Key' instead of 'APNs Certificates'
      // topics: []

      critical: true, // Needs to be set to request critical / time-sensitive permissions
    }
  },
  appName: 'MyAppName'
});
```

Notes: 
* The `PushNotification` variable is made available by cordova-plugin-push.  
* This plugin calls PushNotification.init for you and saves the returned instance to `Push.push`, so you can access it.  
* See [here](https://github.com/havesource/cordova-plugin-push/blob/master/docs/API.md) for the full PushNotification (cordova-plugin-push) API reference.  
* Badge numbers actually can be set on some Android devices, the Push.setBadge function just hasn't be updated to reflect this. For example you could call `Push.push.setApplicationIconBadgeNumber()` directly.  

Additionally you have to touch `mobile-config.js`
```js
App.configurePlugin('phonegap-plugin-push', {
  SENDER_ID: 12341234
});
```
*This is due to changes in the cordova plugin itself*  
**Note:** with recent version of FCM, configuring SENDER_ID is not required. Instead you use the `google-services.json` file. Check the [Firebase Docs](docs/FIREBASE.md) for more.

### Server

For example in `Meteor.startup()` block of main.js

```js
Push.Configure({
  apn: {
    certData: Assets.getText('apnDevCert.pem'),
    keyData: Assets.getText('apnDevKey.pem'),
    passphrase: 'xxxxxxxxx',
    production: true,
    //gateway: 'gateway.push.apple.com',
  },
  gcm: {
    apiKey: 'xxxxxxx',  // GCM/FCM server key
  },
  fcm: {
    serviceAccountJson: JSON.parse(Assets.getText('FirebaseAdminSdkServiceAccountKey.json')); // File located in the /private directory
  },
  // production: true,
  // 'sound' true,
  // 'badge' true,
  // 'alert' true,
  // 'vibrate' true,
  // 'sendInterval': 15000, Configurable interval between sending
  // 'sendBatchSize': 1, Configurable number of notifications to send per batch
  // 'keepNotifications': false,
});
```
*Note: `config.push.json` is deprecating*

## Common API
```js
    // Push.debug = true; // Add verbosity

    Push.send({
        from: 'push',
        title: 'Hello',
        text: 'world',
        badge: 1, //optional, use it to set badge count of the receiver when the app is in background.
        // sound: '',
        androidChannelId: '', // If not specified will go to the default cordova-plugin-push channel
        androidPriority: 1, // Optional: // PRIORITY_MIN -2 // PRIORITY_LOW -1 // PRIORITY_DEFAULT 0 // PRIORITY_HIGH 1 // PRIORITY_MAX 2 //
        iosPriority: 'time-sensitive', // Optional: The string values passive, active, time-sensitive, or critical (default is active)
        query: {
            // Ex. send to a specific user if using accounts:
            userId: 'xxxxxxxxx'
        } // Query the appCollection
        // token: appId or token eg. "{ apn: token }"
        // tokens: array of appId's or tokens
        // payload: user data
        // delayUntil: Date
    });
```
*When in secure mode the client send features require adding allow/deny rules in order to allow the user to send push messages to other users directly from the client - Read more below*

## Client API
```js
    Push.id(); // Unified application id - not a token
    Push.setBadge(count); // ios specific - ignored everywhere else
    Push.enabled(); // Return true or false
    Push.enabled(false); // Will disable notifications
    Push.enabled(true); // Will enable notifications (requires a token...)
```

## Security allow/deny send
This package allows you to send notifications from the server and client. To restrict the client or allowing the client to send use `allow` or `deny` rules.

When a client calls send on Push, the Push's allow and deny callbacks are called on the server to determine if the send should be allowed. If at least one allow callback allows the send, and no deny callbacks deny the send, then the send is allowed to proceed.

```js
    Push.allow({
        send: function(userId, notification) {
            return true; // Allow all users to send
        }
    });

    // Or...
    Push.deny({
        send: function(userId, notification) {
            return false; // Allow all users to send
        }
    });
```

## Meteor Methods

### raix:push-update

Stores a token associated with an application and optionally, a userId.

**Parameters**:

*options* - An object containing the necessary data to store a token. Fields:
* `id` - String (optional) - a record id for the Application/Token document to update. If this does not exist, will return 404.
* `token` - Object - `{ apn: 'TOKEN' }` or `{ gcm: 'TOKEN' }`
* `appName` - String - the name of the application to associate the token with
* `userId` - String (optional) - the user id so associate with the token and application. If none is included no user will be associated. Use `raix:push-setuser` to later associate a userId with a token.

**Returns**:

*recordId* - The id of the stored document associating appName, token, and optionally user in an object of the form:

```
{
  result: 'recordId'
}
```

### raix:push-setuser

Associates the current users ID with an Application/Token record based on the given id.

**Parameters**:

*id* - String - The ID of the Application/Token record

### raix:push-metadata

Adds metadata to a particular Application/Token record.

**Parameters**

*data* - Object containing the following fields:
* `id` - String - the ID of the Application/Token record to update
* `metadata` - Object - The metadata object to add to the Application/Token document

## More Info


For more internal or advanced features read [ADVANCED.md](docs/ADVANCED.md)

## For maintainers

We have a slack channel to keep communication tight between contributors - it's on https://meteoropensourcecomm.slack.com in channel `#raixpush` 

Kind regards

Morten (aka RaiX)
