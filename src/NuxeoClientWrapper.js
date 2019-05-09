/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

var MAIN_PP = "tree_children";
var SUGGESTION_PP = "default_document_suggestion";

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
   * Get back some current user infos.
   */
  login: function() {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken())
    };
    var url = this.apiEndpoint + "/automation/login";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    return parsedResponse;
  },

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
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
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
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/search/pp/" + MAIN_PP + "/execute?queryParams=" + id;
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse.entries;
  },

  assets: function(fulltext) {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/search/pp/" + SUGGESTION_PP + "/execute?queryParams=" + fulltext;
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse.entries;
  },

  /**
   * Push a note as a file into the current user workspace.
   * @param {Object} params 
   */
  pushNoteWS: function(params) {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    // Building the payload
    var blob = Utilities.newBlob(params.content, "text/html", "Email from " + params.sender);
    var json = {
      context: {},
      params: {},
      input: {}
    };
    var payload = {
      input: blob,
      automationBody: JSON.stringify(json)
    };
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/automation/UserWorkspace.CreateDocumentFromBlob";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payload,
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse;
  },

  /**
   * Create note from email.
   * @param {String} html 
   */
  pushNote: function(params) {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    // Building the payload
    var blob = Utilities.newBlob(params.content, "text/html", "Email from " + params.sender);
    var json = {
      context: {
        currentDocument: params.parentId
      },
      params: {},
      input: {}
    };
    var payload = {
      input: blob,
      automationBody: JSON.stringify(json)
    };
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/automation/FileManager.Import";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payload,
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse;
  },

  /**
   * Create documents for each attachment.
   * @param {String} html 
   */
  pushAttachment: function(params) {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    var json = {
      context: {
        currentDocument: params.parentId
      },
      params: {},
      input: {}
    };
    var ctx = JSON.parse(params.event);
    var message = getCurrentMessage(ctx);
    var attachments = message.getAttachments();
    var blobs = [];
    var indexes = JSON.parse(params.attachIndexes);
    for (var i = 0; i < indexes.length; i++) {
      blobs.push(attachments[indexes[i]]);
    }
    // TODO: investigate why we cannot send a list
    var payload = {
      input: blobs[0],
      automationBody: JSON.stringify(json)
    };
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/automation/FileManager.Import";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payload,
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse;
  },

  /**
   * Create documents for each attachment into user workspace.
   * @param {String} html 
   */
  pushAttachmentWS: function(params) {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    // Building the payload
    var json = {
      context: {},
      params: {},
      input: {}
    };
    var ctx = JSON.parse(params.event);
    var message = getCurrentMessage(ctx);
    var attachments = message.getAttachments();
    var blobs = [];
    var indexes = JSON.parse(params.attachIndexes);
    for (var i = 0; i < indexes.length; i++) {
      blobs.push(attachments[indexes[i]]);
    }
    // TODO: investigate why we cannot send a list
    var payload = {
      input: blobs[0],
      automationBody: JSON.stringify(json)
    };
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/automation/UserWorkspace.CreateDocumentFromBlob";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payload,
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse;
  },

  /**
   * Fetch the workflows.
   */
  workflows: function() {
    if (!this.oauthService.hasAccess()) {
      throw new AuthorizationRequiredException();
    }
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken())
    };
    var url = this.apiEndpoint + "/workflowModel";
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
    return parsedResponse.entries;
  },

  startWF: function(docId, workflowId){
    // Building the payload
    var payload = {
      context: {},
      params: {
        id: workflowId
      },
      input: docId
    };
    var headers = {
      Authorization: Utilities.formatString("Bearer %s", this.oauthService.getAccessToken()),
      "enrichers.document": "documentURL"
    };
    var url = this.apiEndpoint + "/automation/Context.StartWorkflow";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payload,
      headers: headers,
      muteHttpExceptions: true
    });
    var raw = response.getContentText();
    var parsedResponse = JSON.parse(raw);
    if (parsedResponse.status && parsedResponse.status === 500) {
      throw new Error(parsedResponse.message);
    }
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
