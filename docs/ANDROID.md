ANDROID GUIDE
=============

## Get started
In order to get started with Android you will have to obtain a __projectNumber__ and a server __apiKey__

As of September 2016 it's not possible to obtain a new GCM server key. Instead, use an FCM server key.

## Creating a Google API project & obtaining a server key
To create a Google API project:

1. Open the Firebase Developers Console (https://console.firebase.google.com).
2. If you haven't created an API project yet, click Create Project.
3. Supply a project name and click Create. 
4. Once the project has been created, the Firebase Overview page is displayed. In the top left you'll see the name of your project and a cog. Click the cog and select Project Settings.
5. Click the Settings->Cloud Messaging tab. 
6. Write down your Sender ID (it should be all digits) and your Server key (has upper and lower case letters, numbers, underscores and dashes)

## Using your FCM sender ID and server key

In this example, my sender ID is 111111111111 and my server key is abc-123

Use the `Push.Configure` function on client and server.

On the client
```js
Push.Configure({
  cordovaOptions: {
    android: {
      senderID: 111111111111,
      alert: true,
      badge: true,
      sound: true,
      vibrate: true,
      clearNotifications: true
      // icon: '',
      // iconColor: ''
    },
    ios: {
      alert: true,
      badge: true,
      sound: true
    }
  },
});
```

Additionally you have to touch `mobile-config.js`
```js
App.configurePlugin('phonegap-plugin-push', {
  SENDER_ID: 111111111111
});
```
*This is due to changes in the cordova plugin it self*

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
    apiKey: 'abc-123',
    projectNumber: 111111111111
  }
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

* The server config differs from the README config in that it includes the projectNumber.
* The project number does not require any type of quotes.
* The apiKey requires quotes.
```

## Linking the FCM service to your Android app
To link your FCM service with your app in the Play Store.

1. Go to the Google Play Developer Console (https://play.google.com/apps/publish)
2. Select your app
3. In the left column, click Services & APIs
4. Find Firebase Cloud Messaging (FCM) and click the Link Sender ID button
5. Enter your FCM sender ID and click Link


For more info and checking the validity of a server key, reference [official documentation](https://firebase.google.com/docs/cloud-messaging/server#implementing-http-connection-server-protocol)

## Note about SENDER_ID

With recent version of FCM, configuring SENDER_ID is not required. Instead you use the `google-services.json` file. Check the [Firebase Docs](docs/FIREBASE.md) for more.

## Notification Icon

To show you app's icon in the notification you will have to prepare an image file with your icon in it and every else being transparent. You can see [here](https://clevertap.com/blog/fixing-notification-icon-for-android-lollipop-and-above/) how it can be done.


Then put the file (e.g. "logo.png") in your project directory under this path:

```
cordova-build-override/platforms/android/res/drawable/
``` 

In your `Push.configure` block on the **client** you have to set the name of the file and you can also define a color:

```js 
  Push.Configure({
    android: {
      ...
      icon: 'logo',
      iconColor: '#4cae4c',
    },
    
``` 
    
If your notification icon is not displayed using the above, you may need to add the following to your config.xml via Meteor's mobile-config.js

```js
App.appendToConfig(`
  <platform name="android">
    <!-- Add the color string for ic_notification_color to the colors.xml file -->
    <config-file target="/app/src/main/res/values/colors.xml" parent="/resources">
        <color name="ic_notification_color">#000000</color>
    </config-file> 

    <config-file target="AndroidManifest.xml" parent="/manifest/application">
        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_notification" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/ic_notification_color" />
    </config-file>
  </platform>
`);

// Instead of using the `cordova-build-override` directory to add you notification icon, you can use this (adjust to suit):
App.addResourceFile('./resources/icons/android/ic_notification-mdpi.png', '/app/src/main/res/drawable-mdpi/ic_notification.png', 'android');
App.addResourceFile('./resources/icons/android/ic_notification-hdpi.png', '/app/src/main/res/drawable-hdpi/ic_notification.png', 'android');
App.addResourceFile('./resources/icons/android/ic_notification-xhdpi.png', '/app/src/main/res/drawable-xhdpi/ic_notification.png', 'android');
App.addResourceFile('./resources/icons/android/ic_notification-xxhdpi.png', '/app/src/main/res/drawable-xxhdpi/ic_notification.png', 'android');
App.addResourceFile('./resources/icons/android/ic_notification-xxxhdpi.png', '/app/src/main/res/drawable-xxxhdpi/ic_notification.png', 'android');
```