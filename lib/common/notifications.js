
// This is the match pattern for tokens
_matchToken = Match.OneOf({ apn: String }, { gcm: String }, { fcm: String });

// Notifications collection
Push.notifications = new Mongo.Collection('_raix_push_notifications');

_legalPayload = function(payload){
  if (typeof payload !== 'undefined'){
    check(payload, Object);
    var illegalKey = _.find(payload, function(value, key, list){
      // Illegal firebase data keys: https://firebase.google.com/docs/reference/admin/node/admin.messaging.DataMessagePayload
      // Also 'aps' for APNS is reserved, should be overridden directly by setting fcm.apns.payload.aps in Push.send()
      key = key.toLowerCase();
      if (
          key === 'from' || // Not permitted by firebase
          key.indexOf('google.') === 0 || // Not permitted by firebase
          key === 'aps' || // is an apns specific key
          key === 'gcm.message_id' || // Not sure if this is used by Google or phonegap-plugin-push
          key === 'coldstart' || // Set/overridden by phonegap-plugin-push on receipt of message
          key === 'foreground' || // Set/overridden by phonegap-plugin-push on receipt of message
          key === 'dismissed' // Set/overridden by phonegap-plugin-push on receipt of message
      ) { return true; }
    });
    if (illegalKey) {
      throw new Error('[Push] Illegal payload!');
    }
  }
  return true;
}

// This is a general function to validate that the data added to notifications
// is in the correct format. If not this function will throw errors
var _validateDocument = function(notification) {

  // Check the general notification
  check(notification, {
    from: String,
    title: Match.Optional(String), // title & text not required if sending a data-only message (contentAvailable needs to be 1)
    text: Match.Optional(String),
    sent: Match.Optional(Boolean),
    sending: Match.Optional(Match.Integer),
    badge: Match.Optional(Match.Integer),
    sound: Match.Optional(String),
    notId: Match.Optional(Match.Integer),
    contentAvailable: Match.Optional(Match.Integer),
    forceStart: Match.Optional(Match.Integer),
    androidChannel: Match.Optional(String),      // TODO: used for FCM - propose to unify with below (server?)
    android_channel_id: Match.Optional(String),  // TODO: used for GCM - propose to unify with above (plugin option?)
    androidPriority: Match.Optional(Match.Integer), // PRIORITY_MIN -2 // PRIORITY_LOW -1 // PRIORITY_DEFAULT 0 // PRIORITY_HIGH 1 // PRIORITY_MAX 2 //
    iosPriority: Match.Optional(String), // The string values passive, active, time-sensitive, or critical
    apn: Match.Optional({
      from: Match.Optional(String),
      title: Match.Optional(String),
      text: Match.Optional(String),
      badge: Match.Optional(Match.Integer),
      sound: Match.Optional(String),
      notId: Match.Optional(Match.Integer),
      category: Match.Optional(String)
    }),
    gcm: Match.Optional({
      from: Match.Optional(String),
      title: Match.Optional(String),
      text: Match.Optional(String),
      image: Match.Optional(String),
      style: Match.Optional(String),
      summaryText: Match.Optional(String),
      picture: Match.Optional(String),
      badge: Match.Optional(Match.Integer),
      sound: Match.Optional(String),
      notId: Match.Optional(Match.Integer),
      actions: Match.Optional([Match.Any])
    }),
    fcm: Match.Optional({

      // Optional: use this to override / have full control of the message object sent to FCM.
      // If you omit the fcm object (or any of it's subkeys), the plugin will correctly poulate/complete it with the top-level fields you specify (in push.api.js), 
      // e.g. these top-level fields will be used to populate relevant fcm fields: 'title','text','badge','sound', 'notId', 'contentAvailable', 'androidChannel', 'payload'

      // field reference - see: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
      // be mindful of various gotchas with the necessary cordova-plugin-push message structure, as some things contradict Google's docs, see: https://github.com/havesource/cordova-plugin-push/blob/master/docs/PAYLOAD.md

      android: Match.Optional({
        // see: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#androidconfig
        collapseKey: Match.Optional(String),
        priority: Match.Optional(String), // must be 'normal' or 'high' // controls when urgency for message delivery by the server, not the actual notification priority
        ttl: Match.Optional(Match.Integer), // in ms
        restricted_package_name: Match.Optional(String),
        data: Match.Optional(Match.Where(_legalPayload)), // will override the top level 'payload'
        notification: Match.Optional({
          // see: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#AndroidNotification
          title: Match.Optional(String),
          body: Match.Optional(String),
          icon: Match.Optional(String),
          color: Match.Optional(String),
          sound: Match.Optional(String),
          tag: Match.Optional(String),
          click_action: Match.Optional(String),
          body_loc_key: Match.Optional(String),
          body_loc_args: Match.Optional([String]),
          title_loc_key: Match.Optional(String),
          title_loc_args: Match.Optional([String]),
          channel_id: Match.Optional(String),
          ticker: Match.Optional(String),
          sticky: Match.Optional(Boolean),
          event_time: Match.Optional(String),
          local_only: Match.Optional(Boolean),
          notification_priority: Match.Optional(Match.Integer), // PRIORITY_MIN -2 // PRIORITY_LOW -1 // PRIORITY_DEFAULT 0 // PRIORITY_HIGH 1 // PRIORITY_MAX 2 //
          default_sound: Match.Optional(Boolean),
          default_vibrate_timings: Match.Optional(Boolean),
          default_light_settings: Match.Optional(Boolean),
          vibrate_timings: Match.Optional([String]),
          visibility: Match.Optional(Match.Integer), // VISIBILITY_PRIVATE 0 // VISIBILITY_PUBLIC 1 // VISIBILITY_SECRET -1 //
          notification_count: Match.Optional(Match.Integer),
          light_settings: Match.Optional(Object),
          image: Match.Optional(String),
        }),
        fcm_options: Match.Optional(Object),
        direct_boot_ok: Match.Optional(Boolean),

      }),
      apns: Match.Optional({
        headers: Match.Optional({
          // see: https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
          'authorization': Match.Optional(String),
          'apns-push-type': Match.Optional(String),
          'apns-id': Match.Optional(String),
          'apns-expiration': Match.Optional(String), // epoch date in seconds
          'apns-priority': Match.Optional(String),   // 1 or 5 or 10 (Apple's default) // controls when urgency for message delivery by the server, not the actual notification priority
          'apns-topic': Match.Optional(String),
          'apns-collapse-id': Match.Optional(String),
        }),
        payload: Match.Optional(Match.ObjectIncluding({ // not the same as our top-level 'payload'
          // see: https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification
          // If this apns.payload key has been included specificly, the aps key must exist, other user-defined keys are optional..
          aps: Match.Optional({
            'alert': Match.Optional({
              'title': Match.Optional(String),
              'subtitle': Match.Optional(String),
              'body': Match.Optional(String),
              'launch-image': Match.Optional(String),
              'title-loc-key': Match.Optional(String),
              'title-loc-args': Match.Optional([String]),
              'subtitle-loc-key': Match.Optional(String),
              'subtitle-loc-args': Match.Optional([String]),
              'loc-key': Match.Optional(String),
              'loc-args': Match.Optional([String]),
              
            }),
            'badge': Match.Optional(Match.Integer),
            'sound': Match.Optional(Match.OneOf([String, Object])), // A dictionary that contains sound information for critical alerts. For regular notifications, use the sound string instead.
            'thread-id': Match.Optional(String),
            'category': Match.Optional(String),
            'content-available': Match.Optional(Match.Integer), // 0 or 1
            'mutable-content': Match.Optional(Match.Integer), // 0 or 1
            'target-content-id': Match.Optional(String),
            'interruption-level': Match.Optional(String), // The importance and delivery timing of a notification. The string values passive, active, time-sensitive, or critical
            'relevance-score': Match.Optional(Number),
            'filter-criteria': Match.Optional(String),
            'stale-date': Match.Optional(Match.Integer), // unix timestamp
            'content-state': Match.Optional(Object),
            'timestamp': Match.Optional(Match.Integer), // unix timestamp
            'event': Match.Optional(String),
            'dismissal-date': Match.Optional(Match.Integer), // unix timestamp
            'attributes-type': Match.Optional(String),
            'attributes': Match.Optional(Object),
          })
        })),
        fcm_options: Match.Optional(Object)
      }),
      // TODO webpush with fcm not implemented yet
      webpush: Match.Optional({
        headers: Match.Optional(Object), // valid WebPush specification headers at https://tools.ietf.org/html/rfc8030#section-5
        data: Match.Where(_legalPayload), // will override the top level 'payload'
        notification: Match.Optional(Object),
        fcm_options: Match.Optional(Object),
      }),

      // name: (output only)
      // data: (we set this from 'payload')
      // notification: (we set this from 'title' & 'text')
      // token: (we set this with the user's token)
      // topic: (not supported as we currently only send to tokens directly)
      // condition: (not supported as we currently only send to tokens directly)

      fcm_options: Match.Optional(Object),
    }),

    query: Match.Optional(String),
    token: Match.Optional(_matchToken),
    tokens: Match.Optional([_matchToken]),
    payload: Match.Optional(Match.Where(_legalPayload)),
    delayUntil: Match.Optional(Date),
    createdAt: Date,
    createdBy: Match.OneOf(String, null)
  });

  // Make sure a token selector or query have been set
  if (!notification.token && !notification.tokens && !notification.query) {
    throw new Error('No token selector or query found');
  }

  // If tokens array is set it should not be empty
  if (notification.tokens && !notification.tokens.length) {
    throw new Error('No tokens in array');
  }
};

Push.send = function(options) {
  // If on the client we set the user id - on the server we need an option
  // set or we default to "<SERVER>" as the creator of the notification
  // If current user not set see if we can set it to the logged in user
  // this will only run on the client if Meteor.userId is available
  var currentUser = Meteor.isClient && Meteor.userId && Meteor.userId() ||
          Meteor.isServer && (options.createdBy || '<SERVER>') || null;

  // Rig the notification object
   var notification = _.extend({
    createdAt: new Date(),
    createdBy: currentUser
  }, _.pick(options, 'from', 'title', 'text'));

   // Add extra
   _.extend(notification, _.pick(options, 'payload', 'badge', 'sound', 'notId', 'delayUntil', 'android_channel_id', 'androidChannel', 'androidPriority', 'iosPriority'));

  if (Match.test(options.apn, Object)) {
    notification.apn = _.pick(options.apn, 'from', 'title', 'text', 'badge', 'sound', 'notId', 'category');
  }

  if (Match.test(options.gcm, Object)) {
    notification.gcm = _.pick(options.gcm, 'image', 'style', 'summaryText', 'picture', 'from', 'title', 'text', 'badge', 'sound', 'notId','actions', 'android_channel_id');
  }

  // Use the whole fcm object provided by the user. Validated by _validateDocument()
  if (typeof options.fcm !== 'undefined') {
    notification.fcm = options.fcm;
  }

  // Set one token selector, this can be token, array of tokens or query
  if (options.query) {
    // Set query to the json string version fixing #43 and #39
    notification.query = JSON.stringify(options.query);
  } else if (options.token) {
    // Set token
    notification.token = options.token;
  } else if (options.tokens) {
    // Set tokens
    notification.tokens = options.tokens;
  }

  if (typeof options.contentAvailable !== 'undefined') {
    notification.contentAvailable = options.contentAvailable; // Android & iOS
  }
  if (typeof options.forceStart !== 'undefined') {
    notification.forceStart = options.forceStart;  // Android only
  }

  notification.sent = false;
  notification.sending = 0;

  // Validate the notification
  _validateDocument(notification);

  // Try to add the notification to send, we return an id to keep track
  return Push.notifications.insert(notification);
};

Push.allow = function(rules) {
  if (rules.send) {
    Push.notifications.allow({
      'insert': function(userId, notification) {
        // Validate the notification
        _validateDocument(notification);
        // Set the user defined "send" rules
        return rules.send.apply(this, [userId, notification]);
      }
    });
  }
};

Push.deny = function(rules) {
  if (rules.send) {
    Push.notifications.deny({
      'insert': function(userId, notification) {
        // Validate the notification
        _validateDocument(notification);
        // Set the user defined "send" rules
        return rules.send.apply(this, [userId, notification]);
      }
    });
  }
};