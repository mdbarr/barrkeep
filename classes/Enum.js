'use strict';

class Enum {
  constructor (...args) {
    const types = new Map();

    if (args.length === 1) {
      if (Array.isArray(args[0])) {
        const array = args[0];
        for (let i = 0; i < array.length; i++) {
          const type = String(array[i]).toUpperCase();
          types.set(type, i);
        }
      } else if (typeof args[0] === 'object' && args[0] !== null) {
        for (const key in args[0]) {
          const value = args[0][key];
          const type = String(key).toUpperCase();
          types.set(type, value);
        }
      } else {
        throw new Error('Invalid self type specification');
      }
    } else {
      for (let i = 0; i < args.length; i++) {
        const type = String(args[i]).toUpperCase();
        types.set(type, i);
      }
    }

    return new Proxy(this, {
      defineProperty () {
        throw new Error('Invalid attempt to define property on self');
      },
      deleteProperty () {
        return undefined;
      },
      get (target, property) {
        property = property.toUpperCase();
        if (types.has(property)) {
          return types.get(property);
        }
        return undefined;
      },
      getOwnPropertyDescriptor (target, property) {
        property = property.toUpperCase();
        if (self.type.has(property)) {
          return {
            configurable: false,
            selferable: true,
            value: types.get(property),
          };
        }
        return undefined;
      },
      getPrototypeOf () {
        return self;
      },
      has (target, key) {
        key = key.toUpperCase();
        return types.has(key);
      },
      isExtensible () {
        return false;
      },
      ownKeys () {
        const keys = [];
        for (const key in types) {
          keys.push(key);
        }
        return keys.sort();
      },
      preventExtensions (target) {
        target.canEvolve = false;
        return Reflect.preventExtensions(target);
      },
      set () {
        return undefined;
      },
      setPrototypeOf () {
        return false;
      },
    });
  }
}

module.exports = Enum;
