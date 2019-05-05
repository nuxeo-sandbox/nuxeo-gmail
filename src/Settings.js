/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

var CREDENTIALS_KEY = "nuxeoCredentials";
var NUXEO_URL = "nuxeoUrl";

/**
 * Get the effective settings for the current user.
 *
 * @return {Object}
 */
function getNuxeoCredentials() {
  var credentials = cachedPropertiesForScript_().get(CREDENTIALS_KEY, null);
  if (!credentials) {
    credentials = {};
    credentials.clientId = "nuxeo-gmail";
    credentials.clientSecret = "secret";
  }
  return credentials;
}

/**
 * Get the Nuxeo server infos.
 *
 * @return {Object}
 */
function getNuxeoURL() {
  var nuxeoUrl = cachedPropertiesForScript_().get(NUXEO_URL, null);
  if (!nuxeoUrl) {
    nuxeoUrl = {};
    nuxeoUrl.nuxeoUrl = "https://bloublou.nuxeo.com/nuxeo";
  }
  return nuxeoUrl;
}

/**
 * Put values in cache.
 * @param {string} key - key for storage.
 */
function putInCache(key, value) {
  return cachedPropertiesForScript_().put(key, value);
}

/**
 * Get the values from cache for a given key.
 * @param {string} key - Key to lookup.
 * @return {Object}
 */
function getFromCache(key) {
  return cachedPropertiesForScript_().get(key, null);
}

/**
 * Prototype object for cached access to script/user properties.
 */
var cachedPropertiesPrototype = {
  /**
  * Retrieve a saved property.
  *
  * @param {string} key - Key to lookup
  * @param {Object} defaultValue - Value to return if no value found in storage
  * @return {Object} retrieved value
  */
  get: function(key, defaultValue) {
    var value = this.cache.get(key);
    if (!value) {
      value = this.properties.getProperty(key);
      if (value) {
        this.cache.put(key, value);
      }
    }
    try {
      if (value) {
        return JSON.parse(value);
      }
    } catch (err) {
      this.clear(key);
      console.error(err);
      return addOnErrorHandler(err);
    }
    return defaultValue;
  },

  /**
  * Saves a value to storage
  *
  * @param {string} key - Key to identify value
  * @param {Object} value - Value to save, will be serialized to JSON.
  */
  put: function(key, value) {
    var serializedValue = JSON.stringify(value);
    this.cache.remove(key);
    this.properties.setProperty(key, serializedValue);
  },

  /**
  * Deletes any saved settings
  *
  * @param {string} key - Key to identify value
  */
  clear: function(key) {
    this.cache.remove(key);
    this.properties.deleteProperty(key);
  }
};

/**
 * Gets a cached property instance for the script
 * @return {CachedProperties}
 */
function cachedPropertiesForScript_() {
  return _.assign(Object.create(cachedPropertiesPrototype), {
    properties: PropertiesService.getScriptProperties(),
    cache: CacheService.getScriptCache()
  });
}
