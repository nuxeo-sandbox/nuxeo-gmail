/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

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
   * Execute a NXQL query against the Nuxeo API.
   *
   * @param {Query} query - NXQL query to run
   * @param {Object} vars - Named variables to include in the query
   * @return {Object} API response
   */
  query: function(query, vars) {
      if (!this.oauthService.hasAccess()) {
        throw new AuthorizationRequiredException();
      }
      var payload = JSON.stringify({
        query: query,
        variables: vars
      });
      var headers = {
        Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken())
      };
      var response = UrlFetchApp.fetch(this.apiEndpoint, {
        method: "post",
        headers: headers,
        payload: payload,
        muteHttpExceptions: true
      });
      var rawResponse = response.getContentText();
      var parsedResponse = JSON.parse(rawResponse);
      if (parsedResponse.message == "Bad credentials") {
        throw new AuthorizationRequiredException();
      }

      return parsedResponse.data;
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
    apiEndpoint: nuxeoUrl.nuxeoUrl
  });
}
