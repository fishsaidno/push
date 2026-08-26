/* global Push: false, _matchToken: false */

import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';

Push.appCollection = new Mongo.Collection('_raix_push_app_tokens');
Push.appCollection.createIndexAsync({ userId: 1 }).catch(function(error) {
  console.error('Push: Could not create app token index:', error);
});

Push.addListener('token', function(currentToken, value) {
  if (value) {
    // Update the token for app
    Push.appCollection.updateAsync({ token: currentToken }, { $set: { token: value } }, { multi: true })
      .catch(function(error) {
        console.error('Push: Could not replace token:', error);
      });
  } else if (value === null) {
    // Remove the token for app
    Push.appCollection.updateAsync({ token: currentToken }, { $unset: { token: true } }, { multi: true })
      .catch(function(error) {
        console.error('Push: Could not remove token:', error);
      });
  }
});

Meteor.methods({
  'raix:push-update': async function(options) {
    if (Push.debug) {
      console.log('Push: Got push token from app:', options);
    }

    check(options, {
      id: Match.Optional(String),
      token: _matchToken,
      appName: String,
      userId: Match.OneOf(String, null),
      metadata: Match.Optional(Object)
    });

    // The if user id is set then user id should match on client and connection
    if (options.userId && options.userId !== this.userId) {
      throw new Meteor.Error(403, 'Forbidden access');
    }

    var doc;

    // lookup app by id if one was included
    if (options.id) {
      doc = await Push.appCollection.findOneAsync({_id: options.id});
    } else if (options.userId) {
      doc = await Push.appCollection.findOneAsync({userId: options.userId});
    }

    //console.log("docCheck",doc);
    // No doc was found - we check the database to see if
    // we can find a match for the app via token and appName
    if (!doc) {
      doc = await Push.appCollection.findOneAsync({
        $and: [
          { token: options.token },     // Match token
          { appName: options.appName }, // Match appName
          { token: { $exists: true } }  // Make sure token exists
        ]
      });
    }
    //console.log("docCheckSecond",doc);
    // if we could not find the id or token then create it
    if (!doc) {
      // Rig default doc
      doc = {
        token: options.token,
        appName: options.appName,
        userId: options.userId,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // XXX: We might want to check the id - Why isnt there a match for id
      // in the Meteor check... Normal length 17 (could be larger), and
      // numbers+letters are used in Random.id() with exception of 0 and 1
      doc._id = options.id || Random.id();
      // The user wanted us to use a specific id, we didn't find this while
      // searching. The client could depend on the id eg. as reference so
      // we respect this and try to create a document with the selected id;
      await Push.appCollection.insertAsync(doc);
    } else {
      // We found the app so update the updatedAt and set the token
      await Push.appCollection.updateAsync({ _id: doc._id }, {
        $set: {
          updatedAt: new Date(),
          token: options.token
        }
      });
    }
    //console.log("docCheckThird",doc);

    if (doc) {
      if(doc.token)
      { 
        var removed = await Push.appCollection.removeAsync({
          $and: [ { _id: { $ne: doc._id } },
          { token: doc.token }, // Match token 
          { appName: doc.appName }, // Match appName 
          { token: { $exists: true } } // Make sure token exists 
          ] }); 
      }
      if (removed && Push.debug) {
        console.log('Push: Removed ' + removed + ' existing app items');
      }
    }

    if (doc && Push.debug) {
      console.log('Push: updated', doc);
    }

    if (!doc) {
      throw new Meteor.Error(500, 'setPushToken could not create record');
    }
    // Return the doc we want to use
    return doc;
  },
  'raix:push-setuser': async function(id) {
    check(id, String);

    if (Push.debug) {
      console.log('Push: Settings userId "' + this.userId + '" for app:', id);
    }
    // We update the appCollection id setting the Meteor.userId
    var found = await Push.appCollection.updateAsync({ _id: id }, { $set: { userId: this.userId } });

    // Note that the app id might not exist because no token is set yet.
    // We do create the new app id for the user since we might store additional
    // metadata for the app / user

    // If id not found then create it?
    // We dont, its better to wait until the user wants to
    // store metadata or token - We could end up with unused data in the
    // collection at every app re-install / update
    //
    // The user could store some metadata in appCollectin but only if they
    // have created the app and provided a token.
    // If not the metadata should be set via ground:db

    return !!found;
  },
  'raix:push-metadata': async function(data) {
    check(data, {
      id: String,
      metadata: Object
    });

    // Set the metadata
    var found = await Push.appCollection.updateAsync({ _id: data.id }, { $set: { metadata: data.metadata } });

    return !!found;
  },
  'raix:push-enable': async function(data) {
    check(data, {
      id: String,
      enabled: Boolean
    });

    if (Push.debug) {
      console.log('Push: Setting enabled to "' + data.enabled + '" for app:', data.id);
    }

    var found = await Push.appCollection.updateAsync({ _id: data.id }, { $set: { enabled: data.enabled } });

    return !!found;
  }
})
