Firebase Guide (Android & iOS)
===========================

## Background
These changes introduce a new token type `{ fcm: <token> }`. Only tokens keyed with fcm will be handled by these changes.  
You can continue using apn and gcm keyed tokens and they will be handled as before.  

You can send notifications for both Android and iOS via FCM (for iOS, Firebase handles sending the notifications to APNS for you). 
You can also continue sending notifications for iOS using APNS directly, using the existing apn/ios functionality of this package.

## Get started

See the cordova-plugin-push installation docs for full details and other particulars https://github.com/havesource/cordova-plugin-push/blob/master/docs/INSTALLATION.md  
Such as how to include your `google-services.json` for sending to Android devices and `GoogleService-Info.plist` if you wish to send to iOS with Firebase.  
FCM messages are sent using the firebase-admin npm package and this requires you to authenticate with a service account.

* Go to https://console.firebase.google.com/ and create a project (you can choose to add Firebase to an existing Google Cloud project).
* In the project settings, add your apps by their bundle IDs.
* For iOS apps, generate an APNs Authentication Key for your Apple developer account (the key is valid for all apps under the account), here: https://developer.apple.com/account/resources/authkeys/list
* For iOS apps, go to the Cloud Messaging tab of the Firebase project settings and add your APNs Authentication Key for your Apple developer account. You could alternatively use APNs certificates, however it is **strongly** recommended to use a key instead.
* On the Firebase project settings page, download the `Google-Service-Info.plist` for *each* iOS app and the `google-services.json` for Android.
* In the service accounts tab, generate and download a service account key (JSON file).

Ensure these files are added to the Cordova project's config.xml, using Meteor's mobile-config.js, eg: 
```js
var googleServiceInfoPlistFileName = 'ProductionApp-GoogleService-Info.plist'; // change this as per the app bundle ID, eg. for production/beta/development etc.
App.addResourceFile('./resources/'+googleServiceInfoPlistFileName, 'GoogleService-Info.plist', 'ios');
App.addResourceFile('./resources/google-services.json', '/app/google-services.json', 'android');
```

## API Details

### Server api
```js
    const serviceAccountJson = JSON.parse(Assets.getText('FirebaseAdminSdkServiceAccountKey.json')); // File located in the /private directory

    Push.Configure({
        fcm: {
            serviceAccountJson: serviceAccountJson
        },
        // gcm: {},
        // apn: {},
        // production: true, // apn production flag (not needed if using fcm for iOS)
        // keepNotifications: true,
        // sendInterval: 15000, 
        // sendBatchSize: 1000, 
        appName: 'MyAppName'
    });
```

### Client api
See the updated [Client section of the README](https://github.com/Meteor-Community-Packages/raix-push#client).

### Push.send API Changes
As previously, but with the `fcm` key. For the structure of the fcm object, see: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages  
If you omit the fcm object (or parts of it), the plugin will correctly poulate/complete it with the top-level fields you specify, namely:  
'title', 'text', 'badge', 'sound', 'notId', 'contentAvailable', 'androidChannelId', 'androidPriority', 'iosPriority', 'payload'

If you plan on using the fcm override, be mindful of various gotchas with the necessary phonegap-plugin-push message structure,
as some things contradict Google's docs, see: https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md

```js
Push.send({
    from: '',
    title: '', 
    text: '',
    badge: 1,
    sound: '',
    notId: 12345678, // unique ID for the message, used by cordova-plugin-push for grouping on Android
    // contentAvailable: 1, // optional, 0 or 1, see: https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md

    androidChannelId: '', // If not specified will go to the default cordova-plugin-push channel
    androidPriority: 1, // PRIORITY_MIN -2 // PRIORITY_LOW -1 // PRIORITY_DEFAULT 0 // PRIORITY_HIGH 1 // PRIORITY_MAX 2 //
    iosPriority: 'time-sensitive', // The string values passive, active, time-sensitive, or critical

    apn: {}, // unchanged
    gcm: {}, // unchanged
    fcm: {
        // Optional: use this to override / have full control of the message object sent to FCM.
        // If you omit the fcm object (or any of it's subkeys), the package will correctly poulate/complete it with the top-level fields you specify, 
        // e.g. these top-level fields will be used to populate relevant fcm fields: 'title','text','badge','sound','notId','contentAvailable','androidChannelId','androidPriority','iosPriority','payload'

        // field reference - see: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
        // be mindful of various gotchas with the necessary cordova-plugin-push message structure, as some things contradict Google's docs, see: https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md
        android: {
            // Android overrides
        },
        apns: {
            // iOS overrides
            headers: {},
            payload: {}
        },
        webpush: { 
            // TODO webpush with fcm not implemented yet
        },
        // data: (Don't use: we set this from 'payload')
        // notification: Don't use this, see: https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md#notification-vs-data-payloads
        // token: (Don't use directly: we set this with the user's token)
        // topic: (not supported as we currently only send to tokens directly)
        // condition: (not supported as we currently only send to tokens directly)
    }),
    query: {},
    token: {},
    tokens: [{}, {}],
    payload: {}, // All payload values must be strings if sending using FCM
    delayUntil: new Date(),
});
```

### iOS Background Handling of Notifications
If you want your Push event handlers to be called when your app is in the background (before the user clicks the notification),  
have a read of https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md#background-notifications-1  
To call the finish function use `Push.push.finish()`  

