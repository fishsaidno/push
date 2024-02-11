Common probelms, bugs, known issues, etc.
===========================

## Android notification event handler's when app in background

Due to [an upstream bug in cordova-plugin-push](https://github.com/havesource/cordova-plugin-push/issues/254), notifications were not shown when the app is in the background/closed.  
I have implemented a workaround for this in this package, however the result is that the plugin's notification event handlers won't run for those (background Android) notifications.  
See: https://github.com/fishsaidno/push/blob/2d9fec6b19e5a03319e0f14f5f2671d89534594f/lib/server/push.api.js#L158  


## Updates For Android 8.0
### This was relevant at [commit 234eeb1](https://github.com/Meteor-Community-Packages/raix-push/commit/234eeb12daa9b553d246c0a6edd3d06d550aa41b) (circa Feb 2019) - outdated - but possibly still useful.

Meteor must be version 1.6.1 

Cordova Android must be version 6.3.0
Cordova IOS must be version 4.5.0

Meteor release 1.6.1 https://docs.meteor.com/changelog.html#changes-10
"The cordova-lib package has been updated to version 7.1.0, cordova-android has been updated to version 6.4.0 (plus one additional commit), and cordova-ios has been updated to version 4.5.4"

To verify the correct installation ADD phonegap-plugin-push@2.1.2 to your cordova plugins file.

After your app builds, Make the following changes to your build.gradle file. The simpliest solution to modify this file is in android studio. 

The correct gradle file to modify has this line at the begining of the file:

apply plugin: 'com.android.application'

Add this two your dependencies:

```js
classpath 'com.google.gms:google-services:4.1.0' // I added both of these
classpath 'com.google.firebase:firebase-core:11.0.1' // I added both of these
```
At the end of your build.gradle file add:

```js
apply plugin: 'com.google.gms.google-services'
```
In case your run into errors with conflicting google libraries add:

```js
configurations.all {
  resolutionStrategy {
    force 'com.android.support:support-v4:27.1.0'
  }
}

configurations {
  all*.exclude group: 'com.android.support', module: 'support-v13'
}
```
Other errors refer to:

https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/INSTALLATION.md#co-existing-with-plugins-that-use-firebase


Changes for the API:
On the client make sure you add a android channel:

```js
PushNotification.createChannel(
    () => {
        console.log('createChannel');
    },
    () => {
        console.log('error');
    },
    {
       id: Meteor.userId(), //Use any Id you prefer, but the same Id for this channel must be sent from the server, 
       description: 'Android Channel', //And any description your prefer
       importance: 3,
       vibration: true
      }
);
```

Server changes:
Add the android_channel_id so the Push message like below:

```js
Push.send({
	  from: 'test',
	  title: 'test',
	   text: 'hello',
          android_channel_id:this.userId,		//The android channel should match the id on the client
          query: {
              userId: this.userId
          }, 
          gcm: {
            style: 'inbox',
            summaryText: 'There are %n% notifications'
          },          
});  
```