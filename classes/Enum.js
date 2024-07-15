'use strict';

class Enum {
  constructor (...args) {
    const types = new Map();

    if (args.length === 1) {
      if (Array.isArray(args[0])) {
        const [ array ] = args;
        for (let i = 0; i < array.length; i++) {
          const type = String(array[i]).toUpperCase();
          types.set(type, i);
        }
      } else if (typeof args[0] === 'object' && args[0] !== null) {
        const [ object ] = args;
        for (const key in object) {
          if (Object.hasOwn(object, key)) {
            const value = object[key];
            const type = String(key).toUpperCase();
            types.set(type, value);
          }
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
        return false;
      },
      get (target, property) {
        const name = property.toUpperCase();
        if (types.has(name)) {
          return types.get(name);
        }
        // eslint-disable-next-line no-undefined
        return undefined;
      },
      getOwnPropertyDescriptor (target, property) {
        const key = property.toUpperCase();
        if (types.has(key)) {
          return {
            configurable: false,
            selferable: true,
            value: types.get(key),
          };
        }
        // eslint-disable-next-line no-undefined
        return undefined;
      },
      getPrototypeOf () {
        return this;
      },
      has (target, key) {
        return types.has(key.toUpperCase());
      },
      isExtensible () {
        return false;
      },
      ownKeys () {
        const keys = [];
        for (const key in types) {
          if (Object.hasOwn(types, key)) {
            keys.push(key);
          }
        }
        return keys.sort();
      },
      preventExtensions (target) {
        target.canEvolve = false;
        return Reflect.preventExtensions(target);
      },
      set () {
        // eslint-disable-next-line no-undefined
        return undefined;
      },
      setPrototypeOf () {
        return false;
      },
    });
  }
}

module.exports = Enum;
