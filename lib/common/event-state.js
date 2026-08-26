// A small event emitter that works consistently on the client and server.
class EventEmitter {
  constructor(options) {
    options = options || {};

    this._eventEmitter = {
      onListeners: {},
      onceListeners: {},
      maxListeners: options.maxListeners || 10
    };
  }

  setMaxListeners(count) {
    this._eventEmitter.maxListeners = count;
  }

  _addListener(list, eventName, listener) {
    if (typeof list[eventName] === 'undefined') {
      list[eventName] = [];
    }

    var listenerCount = list[eventName].push(listener);
    var maxListeners = this._eventEmitter.maxListeners;

    if (maxListeners && listenerCount > maxListeners) {
      var warning = 'warning: possible EventEmitter memory leak detected. ' +
        listenerCount + ' listeners added on event "' + eventName +
        '". Use emitter.setMaxListeners() to increase limit. (' +
        maxListeners + ')';

      console.warn((new Error(warning)).stack);
    }
  }

  on(eventName, listener) {
    this._addListener(this._eventEmitter.onListeners, eventName, listener);
    return this;
  }

  once(eventName, listener) {
    this._addListener(this._eventEmitter.onceListeners, eventName, listener);
    return this;
  }

  emit(eventName /* arguments */) {
    var args = Array.prototype.slice.call(arguments, 1);
    var listeners = this._eventEmitter.onListeners[eventName] || [];
    var onceListeners = this._eventEmitter.onceListeners[eventName] || [];

    // Empty the once list before triggering it so nested emits cannot run the
    // same once listener twice.
    this._eventEmitter.onceListeners[eventName] = [];

    listeners.slice().forEach((listener) => listener.apply(this, args));
    onceListeners.slice().forEach((listener) => listener.apply(this, args));

    return listeners.length + onceListeners.length > 0;
  }

  off(eventName, listener) {
    if (!eventName) {
      this._eventEmitter.onListeners = {};
      this._eventEmitter.onceListeners = {};
      return;
    }

    if (typeof listener !== 'function') {
      this._eventEmitter.onListeners[eventName] = [];
      this._eventEmitter.onceListeners[eventName] = [];
      return;
    }

    this._eventEmitter.onListeners[eventName] = removeOne(
      this._eventEmitter.onListeners[eventName] || [],
      listener
    );
    this._eventEmitter.onceListeners[eventName] = removeOne(
      this._eventEmitter.onceListeners[eventName] || [],
      listener
    );
  }
}

function removeOne(list, listener) {
  var found = false;

  return list.filter(function(item) {
    if (!found && item === listener) {
      found = true;
      return false;
    }

    return true;
  });
}

// EventState remembers the latest arguments for each event. New listeners are
// immediately called with that state, which is how push tokens and readiness
// events remain available to listeners registered after the original event.
export class EventState extends EventEmitter {
  constructor(map) {
    super();

    this.map = map || {};
    Object.keys(this.map).forEach((key) => {
      var value = this.map[key];
      this.map[key] = Array.isArray(value) ? value : [value];
    });
  }

  emitState(name /* arguments */) {
    var args = Array.prototype.slice.call(arguments);

    this.map[name] = args.slice(1);
    this.emit.apply(this, args);

    return this;
  }

  on(name, listener) {
    super.on(name, listener);

    if (Object.prototype.hasOwnProperty.call(this.map, name)) {
      listener.apply(this, this.map[name]);
    }

    return this;
  }

  once(name, listener) {
    if (Object.prototype.hasOwnProperty.call(this.map, name)) {
      listener.apply(this, this.map[name]);
    } else {
      super.once(name, listener);
    }

    return this;
  }

  clearState(name) {
    if (name) {
      delete this.map[name];
    } else {
      this.map = {};
    }
  }
}

EventEmitter.prototype.addListener = EventEmitter.prototype.on;
EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
EventEmitter.prototype.removeAllListeners = EventEmitter.prototype.off;
EventEmitter.prototype.one = EventEmitter.prototype.once;
EventEmitter.prototype.trigger = EventEmitter.prototype.emit;

EventState.prototype.addListener = EventState.prototype.on;
EventState.prototype.one = EventState.prototype.once;
