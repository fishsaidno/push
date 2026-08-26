More advanced details
=====================

## API Details

Common:
```js
    // The Push object is an EventEmitter
    Push.addListener();
```

Client:
```js
    // Internal events
    Push.addListener('token', function(token) {
        // Token is { apn: 'xxxx' } or { fcm: 'xxxx' }
    });

    Push.addListener('error', function(err) {
        if (err.type == 'apn.cordova') {
            console.log(err.error);
        }
    });

    Push.addListener('register', function(evt) {
        // Platform specific event - not really used
    });

    Push.addListener('alert', function(notification) {
        // Called when message got a message in forground
    });

    Push.addListener('sound', function(notification) {
        // Called when message got a sound
    });

    Push.addListener('badge', function(notification) {
        // Called when message got a badge
    });

    Push.addListener('startup', function(notification) {
        // Called when message recieved on startup (cold+warm)
    });

    Push.addListener('message', function(notification) {
        // Called when the app is in the foreground
    });
```

**iOS Background Handling of Notifications:**
If you want your Push event handlers to be called when your app is in the background (before the user clicks the notification),  
have a read of https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md#background-notifications-1
To call the finish function use `Push.push.finish()`  

The returned `notification` object from events:
```js
var notification = {    
    message,
    sound, // Relative to the platform
    badge,
    coldstart, // True if the app havent been resumed
    background, // If message recieved while app was in background
    foreground, // If message recieved while app was in foreground
    open, // Flag marking if the note triggered the app to open
    payload // Custom object
};
```

Event types:
* `apn.cordova`
* `fcm.cordova`
* `apn.browser`
* `cordova.browser`

## Setting credentials / certificates

Configure credentials directly in server code with `Push.Configure`.

### Server api
`Push.Configure` may only be called once; subsequent calls throw an error.

If you want to use the Push.Configure on the client use the options described [here](https://github.com/phonegap/phonegap-plugin-push#pushnotificationinitoptions)
```js
Meteor.startup(async function() {
    Push.Configure({
        apn: {
            // setting this on client throws security error
            passphrase: 'xxx',
            // pem files are placed in the app private folder
            certData: await Assets.getTextAsync('apnProdCert.pem'),
            keyData: await Assets.getTextAsync('apnProdKey.pem'),
        },
        fcm: {
            serviceAccountJson: JSON.parse(await Assets.getTextAsync('FirebaseAdminSdkServiceAccountKey.json')) // File located in the /private directory
        },
        production: true, // use production server or sandbox (relevant for APNS only, not Android/Firebase)
    });
});
```

### Client api
```js
    // Common client api
    Push.Configure({
        apn: {
            // Only required if using safari web push, not required
            // for iOS / cordova
            websitePushId: 'com.push.server'
            webServiceUrl: 'http://some.server.com'
        },
        bagde: true,
        sound: true,
        alert: true
    });

    Push.id(); // Unified application id - not a token
    Push.setBadge(count); // ios specific - ignored everywhere else
```

### Internal server API

```js
    // Internal events
    Push.addListener('token', function(currentToken, newToken) {
        // Token is { apn: 'xxxx' } or { fcm: 'xxxx' } or null
        // if newToken is null then the currentToken is invalid
        // if newToken is set then this should replace the currentToken
    });

    // Direct access to the send functions
    Push.sendAPN(userToken, options);
    Push.sendFCM(userToken, options);
```

### Send API

You can send push notifications from the client or the server using Push.send(). If sending from the client you are required to use [allow/deny](ADVANCED.md#client-security)) rules.

On the server, `Push.send()` returns a promise for the queued notification ID and must be awaited. Client-side sends remain synchronous.

There are 4 required parameters that must be passed to `Push.send`. They are:
* `from` : reserved for future use; this can be any string at the moment
* `title` : the bold title text that is displayed in the notification
* `text` : the normal sub-text that is displayed in the notification
* a selection query from below

The 4th parameter is a selection query for determining who the message should be sent to. This query can be one of the three following items:
* `query` : {} or {userId : 'XXXXX'} or {id : 'XXXXX'}
* `token` : {fcm : 'XXXXXX'} or {apn : 'XXXXX'}
* `tokens` : [{fcm : 'XXXXX0'},{fcm : 'XXXXX1'}, {apn : 'XXXXX0'}]

`query` can be left empty in which case the notification will be sent to all devices that have registered a token. `query` can also be one or more ids obtained from clients via `Push.id()` or one or more userIds associated with the accounts-base package and Meteor.userId().

`token` is an APN or FCM token registered by the device in the form:
```js
{ apn: String } or { fcm: String }
```

`tokens` is simply and array of tokens from the previous example

`delayUntil` is an optional Date. If set, sending will be delayed until then.

The query selector is used against a Mongo Collection created by the push package called `Push.appCollection`. This collection stores the userIds, pushIds, and tokens of all devices that register with the server. With a desired selection query chosen a minimal `Push.send` takes the following form (using one of the queries).

```js
Push.send({
  from: 'Test',
  title: 'Hello',
  text: 'World',
  query: {}
  token: {}
  tokens: [{},{}]
  delayUntil: new Date(),
  notId: numberId
});
```
#### Display multiple notifications on Android
 * `notId` : a unique identifier for an Android notification

'notId' supplies a unique id to the Cordova Push plugin for the Android `tag` field, allowing a per-message id. This can be used to replace an unread message on both server and client. It differs from collapseKey, which only collapses undelivered messages server-side. It defaults to zero and must be a 32-bit integer.
If `notId` is not set then the Push plugin defaults to a value of 0 causing each message to overwrite the previous and only ever display a single notification.


### Client Security
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

## Action Buttons

Your notification can include a maximum of three action buttons. You register the event callback name for each of your actions, then when a user clicks on one of notification's buttons, the event corresponding to that button is fired and the listener you have registered is invoked. For instance, here is a setup with three actions `snoozeAction6Hour` `snoozeAction1Day` and `closeAlert`.

```javascript
window.Notification = {};

// data contains the push payload just like a notification event
Notification.snoozeAction6Hour = function(data) {
  data.additionalData.snoozeHours = 6;
  Meteor.call('snoozeRuleAlerts', data, function() {});
};

Notification.snoozeAction1Day = function(data) {
  data.additionalData.snoozeHours = 24;
  Meteor.call('snoozeRuleAlerts', data, function() {});
};

//closing function for alert
Notification.closeAlert = function() {};
```

If you wish to include an icon along with the button name, they must be placed in the `res/drawable` directory of your Android project. Then you can send the following JSON through FCM:

```json
{
   "title": "Snooze Notification",
   "message": "Snooze your daily requirement alerts for a specific amount of time.",
   "query": {
       "userId": 123456789
   },
   "actions": [
     {
       "icon": "halfDay",
       "title": "6 hours",
       "callback": "Notification.snoozeAction6Hour",
       "foreground": true
     },
     {
       "icon": "oneDay",
       "title": "1 Day",
       "callback": "Notification.snoozeAction1Day",
       "foreground": true
     },
     {
       "icon": "discard",
       "title": "Cancel",
       "callback": "Notification.closeAlert",
       "foreground": false
     }
   ]
}
```
This will produce the following notification in your tray:

![action_combo](https://cloud.githubusercontent.com/assets/353180/9313435/02554d2a-44f1-11e5-8cd9-0aadd1e02b18.png)

If your user clicks on the main body of the notification, then your app will be opened. However, if they click on either of the action buttons the app will open (or start) and the specified event will be triggered with the callback name. In this case it is `emailGuests` and `snooze`, respectively. If you set the `foreground` property to `true`, the app will be brought to the front, if `foreground` is `false` then the callback is run without the app being brought to the foreground.

#### Actionable Notification for IOS

You must setup the possible actions when you initialize the plugin:
```javascript
var categories = {
  "snoozeRule": {
    "yes": {
      "callback": "Notification.snoozeAction6Hour",
      "title": "6 Hours",
      "foreground": false,
      "destructive": false
    },
    "no": {
      "callback": "Notification.snoozeAction1Day",
      "title": "1 Day",
      "foreground": false,
      "destructive": false
    },
    "maybe": {
      "callback": "Notification.closeAlert",
      "title": "Cancel",
      "foreground": false,
      "destructive": false
    }
  },
  "delete": {
    "yes": {
      "callback": "Notification.delete",
      "title": "Delete",
      "foreground": true,
      "destructive": false
    },
    "no": {
      "callback": "Notification.closeAlert",
      "title": "Cancel",
      "foreground": true,
      "destructive": false
    }
  }
};

Push.Configure({
    ios: {
      "alert": true,
      "badge": true,
      "sound": true,
      "clearBadge": true,
      "categories": categories
    }
  });
```

Each category is a named object, snoozeRule and delete in this case. These names will need to match the ones you send via your payload to APNS if you want the action buttons to be displayed. Each category can have up to three buttons which must be labeled yes, no and maybe (This is strict, it will not work if you label them anything other than this). In turn each of these buttons has four properties, callback the javascript function you want to call, title the label for the button, foreground whether or not to bring your app to the foreground and destructive which doesn’t actually do anything destructive, it just colors the button red as a warning to the user that the action may be destructive.

## Force Starting App

When you implement the actionable notifications, you might notice that if the user has force closed his application, then the background actions will not work untill user opens the app the next time (Note: If you have used 'foreground': true, which will restart the app, this is not the intended behaviour for many providers). In this situation, 'forceStart' comes in handy. This will start the app again BUT the application will not be brought to foreground, hence it will not disrupt any task that the user was performing. In order to take advantage of this feature, you will need to be using cordova-android 6.0.0 or higher. If you add force-start: 1 to the data payload the application will be restarted in background even if it was force closed.

Example:
```javascript
Push.send({
  "from": 'push',
  "title": "Test Notification for Force Start",
  "text": "This will forcestart your app.",
  "badge": 1,
  "sound": "testApp",
  "notId": 123456,
  "query": {},
  "apn": {
    "sound": "www/application/app/testApp.wav"
  },
  "forceStart": 1
});
```

Note: This is restricted to Android only. In IOS, once the user closes an app, you can not restart it forcefully unlike android.
