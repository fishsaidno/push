Basic example
=============

This is an example of how `raix:push` works at a minimal level.

Depending on the platforms you want to work with you will need some credentials or certificates.
* [Android](ANDROID.md)
* [iOS](IOS.md)
* [Firebase Cloud Messaging (Android & iOS)](FIREBASE.md)

## Config
Use the `Push.Configure` function on client and server.

On the client
```js
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

Additionally you have to touch `mobile-config.js`
```js
App.configurePlugin('phonegap-plugin-push', {
  SENDER_ID: 12341234
});
```
*This is due to changes in the cordova plugin it self*  
**Note:** with recent version of FCM, configuring SENDER_ID is not required. Instead you use the `google-services.json` file. Check the [Firebase Docs](docs/FIREBASE.md) for more.  

Server:
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
    apiKey: 'xxxxxxx',
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
//
});
```
*Note: `config.push.json` is deprecating*

## Test
You can send push notifications to all users from client and server - Use browser console or Meteor shell:

```js
Push.send({
  from: 'Test',
  title: 'Hello',
  text: 'World',
  badge: 12,
  query: {}
});
```

## Security
If you remove the `insecure` package from Meteor you have to explicitly allow users to send push notifications from client-side.
`common.js`
```js
  Push.allow({
    send: function(userId, notification) {
      // Allow all users to send to everybody - For test only!
      return true;
    }
  });
```

## More
Try adding the Meteor `accounts-password` package and let users login. Try sending a push notification to a user:

```js
Push.send({
  from: 'Test',
  title: 'Hello',
  text: 'World',
  badge: 12,
  // sound: fileInPublicFolder
  query: {
    userId: 'xxxxxxxxxxxx'
  }
});
```

## Debug
Help me fix bugs - you can enable debugging by setting `Push.debug = true;` - This will log details about whats going on in the system.

Kind regards

Morten (aka RaiX)