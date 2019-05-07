/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

 var MAIN_PP = "tree_children";

/**
 * Exception to raise when authorization is required.
 *
 * @constructor
 */
function AuthorizationRequiredException() {}

/**
 * Prototype object for the Nuxeo API client.
 */
var NuxeoClientPrototype = {
  apiEndpoint: null,
  oauthService: null,

  /**
   * Fetch the root document.
   *
   * @return {Object} API response
   */
  root: function() {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken())
    };
    var url = this.apiEndpoint + "/path/?";
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    return parsedResponse;
  },

  /**
   * Fetch the children for a given doc.
   *
   * @param {String} id - Query param doc id to include in the query
   * @return {Object} API response
   */
  children: function(id) {
      if (!this.oauthService.hasAccess()) {
        throw new AuthorizationRequiredException();
      }
      var headers = {
        Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken())
      };
      var url = this.apiEndpoint + "/search/pp/" + MAIN_PP + "/execute?queryParams=" + id;
      console.log(url);
      var response = UrlFetchApp.fetch(url, {
        method: "get",
        headers: headers,
        muteHttpExceptions: true
      });
      var raw = response.getContentText();
      var parsedResponse = JSON.parse(raw);
      return parsedResponse.entries;
  },

  /**
   * Create note from email
   * @param {String} html 
   */
  createNote: function(parentId, html) {
    // TODO
  },

  /**
   * De-authorizes the Nuxeo client.
   */
  disconnect: function() {
    // Skipping this method call as it removes nothing from the storage apparently.
    // this.oauthService.reset();
    this.oauthService.saveToken_(null);
  },

  /**
   * Check if has access.
   */
  hasAccess: function() {
    return this.oauthService.hasAccess();
  },

  /**
   * Returns the URL for user authorization.
   *
   * @return {string} authorization URL
   */
  authorizationUrl: function() {
    return this.oauthService.getAuthorizationUrl();
  },

  /**
   * Handles the oauth response from Nuxeo. Raises an error
   * if authorization declined or failed.
   *
   * @param {Object} oauthResponse - response parameters
   */
  handleOAuthResponse: function(oauthResponse) {
    var authorized = this.oauthService.handleCallback(oauthResponse);
    if (!authorized) {
      throw new Error("Authorization declined.");
    }
  }
};

/**
 * Gets a client instance configured with the script's credentials.
 *
 * Requires the script property `nuxeoCredentials` to be defined. The value
 * must be a JSON object with the properties `clientId` and `clientSecret`
 * defined. Obtain these values by registering the project in Nuxeo's developer
 * console.
 *
 * @return {NuxeoClientWrapper} client instance
 */
function nuxeoClientWrapper() {
  var credentials = getNuxeoCredentials();
  var nuxeoUrl = getNuxeoURL();
  var oauthService = OAuth2.createService("nuxeo")
    .setAuthorizationBaseUrl(nuxeoUrl.nuxeoUrl + "/oauth2/authorize")
    .setTokenUrl(nuxeoUrl.nuxeoUrl + "/oauth2/access-token")
    .setClientId(credentials.clientId)
    .setClientSecret(credentials.clientSecret)
    .setCallbackFunction("handleNuxeoOAuthResponse")
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCache(CacheService.getUserCache())
    .setScope("user user:email user:follow repo");
  return _.assign(Object.create(NuxeoClientPrototype), {
    oauthService: oauthService,
    apiEndpoint: nuxeoUrl.nuxeoUrl + "/api/v1"
  });
}
