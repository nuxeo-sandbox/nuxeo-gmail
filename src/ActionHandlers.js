/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

var SHOW_ADDON = "showAddOn";
var SHOW_AUTHORIZATION_CARD = "showAuthorizationCard";
var DISCONNECT_ACTION = "disconnectAccount";
var SHOW_DISCONNECT_INFOS = "showDisconnectInfo";
var HANDLE_ATTACHMENTS = "handleAttachments";
var HANDLE_NOTES = "handleNotes";
var PUSH_NOTE = "pushNote";
var PUSH_NOTE_WS = "pushNoteWS";
var PUSH_ATTACHMENT = "pushAttachment";
var PUSH_ATTACHMENT_WS = "pushAttachmentWS";
var CHILD_NAVIGATE = "childNavigate";
var ASSET_NAVIGATE = "assetNavigate";
var SAVE_CREDS = "saveCreds";
var SAVE_ATTACHMENTS = "saveAttachments";
var DISPLAY_WORKFLOW = "displayWF";
var EXECUTE_WF = "executeWF";
var ATTACH_DOCUMENT = "attachDocument";
var SEARCH_DOCUMENTS = "searchDocuments";

/**
 * Collection of functions to handle user interactions with the add-on. 
 *
 * @constant
 */
var ActionHandlers = {
  /**
   * Primary handler for the add-on. Display welcome/login or analyse email content.
   *
   * @param {Event} e - Event from Gmail
   * @return {Card[]}
   */
  showAddOn: function(e) {
    // Check if the OAuth client is set - if not go to welcome page.
    if (!nuxeoClientWrapper().hasAccess()) {
      return buildHomeCard();
    }

    // Show Nuxeo Card Actions.
    return buildNuxeoAction();
  },

  /**
   * Return the disconnect card info.
   * 
   * @param {*} e - Event from Gmail
   * @return {CardService.Card}
   */
  showDisconnectInfo: function(e) {
    return buildDisconnectCardInfo();
  },

  /**
   * Disconnects the user's GitHub account.
   *
   * @param {Event} e - Event from Gmail
   */
  disconnectAccount: function(e) {
    nuxeoClientWrapper().disconnect();
    throw new AuthorizationRequiredException();
  },

  /**
   * Shows a the GitHub authorization card.
   *
   * @param {Event} e - Event from Gmail
   * @return {CardService.Card}
   */
  showAuthorizationCard: function(e) {
    return buildAuthorizationCard({
      url: nuxeoClientWrapper().authorizationUrl()
    });
  },

  /**
   * Save oauth infos and trigger Auth.
   *
   * @param {event} event
   * @return {Card} the auth card 
   */
  saveCreds: function(event) {
    if (event) {
      var nuxeoUrl = getNuxeoURL();
      nuxeoUrl.nuxeoUrl = event.formInput.nuxeoUrl;
      putInCache(NUXEO_URL, nuxeoUrl);

      var credentials = getNuxeoCredentials();
      credentials.clientId = event.formInput.clientId;
      credentials.clientSecret = event.formInput.clientSecret;
      putInCache(CREDENTIALS_KEY, credentials);

      return handleAuthorizationRequired();
    }
  },

  /**
  * Fetch the next children for a given doc.
  */
  childNavigate: function(param) {
    var parentId = param.parameters.parentId;
    var action = param.parameters.nextAction;
    var children = nuxeoClientWrapper().children(parentId);
    if (_.isEmpty(children)) {
      return showSimpleCard("Nothing here!", "There is no other folders here.");
    }
    return buildChildrenCard(children, action, param.parameters);
  },

  assetNavigate: function(param) {
    var parentId = param.parameters.parentId;
    var children = nuxeoClientWrapper().children(parentId);
    if (_.isEmpty(children)) {
      return showSimpleCard("Nothing here!", "There is no other folders here.");
    }
    return buildPickUpCard(children, param.parameters);
  },

  /**
   * Handle the push of attachment(s) to Nuxeo from a Gmail email.
   */
  handleAttachments: function(event) {
    var message = getCurrentMessage(event);
    var attachments = message.getAttachments();

    if (_.isEmpty(attachments)) {
      return showSimpleCard("Oops!", "There is no attachment to this email. Please select another one.");
    }

    return buildAttachCard(attachments);
  },

  /**
   * Handle the push of a note to Nuxeo from a Gmail email.
   */
  handleNotes: function(event) {
    // Read current email
    var message = getCurrentMessage(event);

    // Taking metadata from the email to propagate to the Note
    var params = {
      content: message.getBody(),
      sender: message.getFrom()
    };
    return buildChildrenCard_(PUSH_NOTE, params);
  },

  /**
   * Save attachments
   */
  saveAttachments: function(event) {
    // Take selected attachments
    var inputs = event.formInputs;
    var keys = Object.keys(inputs);
    var attachIndexes = [];
    for (var i = 0; i < keys.length; i++) {
      attachIndexes.push(parseInt(keys[i], 10));
    }

    // Building params
    var params = {
      attachIndexes: JSON.stringify(attachIndexes),
      event: JSON.stringify(event)
    };

    return buildChildrenCard_(PUSH_ATTACHMENT, params);
  },

  /**
   * Push attachment(s) to Nuxeo server for given parent id.
   */
  pushAttachment: function(e) {
    var document = nuxeoClientWrapper().pushAttachment(e.parameters);
    return showResultDoc(
      "Success!",
      "You have successfully created the document",
      document.contextParameters.documentURL,
      document.uid
    );
  },

  /**
   * Push attachment(s) to Nuxeo server into the current user workspace.
   */
  pushAttachmentWS: function(e) {
    var document = nuxeoClientWrapper().pushAttachmentWS(e.parameters);
    return showResultDoc(
      "Success!",
      "You have successfully created the document",
      document.contextParameters.documentURL,
      document.uid
    );
  },

  /**
   * Push a note with the email content to a specific location.
   */
  pushNote: function(e) {
    var document = nuxeoClientWrapper().pushNote(e.parameters);
    return showResultDoc(
      "Success!",
      "You have successfully created the document",
      document.contextParameters.documentURL,
      document.uid
    );
  },

  /**
   * Push a note as a file into the current user workspace.
   */
  pushNoteWS: function(e) {
    var document = nuxeoClientWrapper().pushNoteWS(e.parameters);
    return showResultDoc(
      "Success!",
      "You have successfully created the document",
      document.contextParameters.documentURL,
      document.uid
    );
  },

  /**
   * Display workflow card.
   */
  displayWF: function(e) {
    var suggestions = nuxeoClientWrapper().workflows();
    var wfNames = suggestions.map(function(suggestion) {
      return suggestion.name;
    });
    return displayWFCard(e.parameters.docId, wfNames);
  },

  /**
   * Execute a workflow for a given user on content
   */
  executeWF: function(e) {
    console.log(JSON.stringify(e));
    var workflowId = e.formInputs.input;
    var docId = e.parameters.docId;
    nuxeoClientWrapper().startWF(docId, workflowId);
    return showResultDoc(
      "Done!",
      "Your workflow has started on the document",
      document.contextParameters.documentURL,
      document.uid
    );
  },

  attachDocument: function(e) {
    var url = e.parameters.url;
    var title = e.parameters.title;
    var linkToAdd = '<img style="width: 20px" src="' + NUXEO_ICON + '"/><a href="' + url + '">"  ' + title + '"</a>';
    return (build = CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftBodyAction(
        CardService.newUpdateDraftBodyAction()
          .addUpdateContent(linkToAdd, CardService.ContentType.IMMUTABLE_HTML)
          .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT)
      )
      .build());
  },

  searchDocuments: function(e) {
    var fulltext = e.formInput.suggestion;
    var assets = nuxeoClientWrapper().assets(fulltext);
    if (_.isEmpty(assets)) {
      return showSimpleCardForPickup("Nothing here!", "There is no documents.");
    }
    return buildPickUpCard(assets, {});
  }
};

/**
 * Build the children card depending on action.
 */
function buildChildrenCard_(action, params) {
  // Fetch the root document to list children
  var rootDocument = nuxeoClientWrapper().root();
  if (!rootDocument) {
    return showSimpleCard("Oops!", "There is a problem with the Nuxeo instance. Please check with the support.");
  }

  // List children
  var children = nuxeoClientWrapper().children(rootDocument.uid);
  if (_.isEmpty(children)) {
    return showSimpleCard("Nothing here!", "There is no other folders here.");
  }

  return buildChildrenCard(children, action, params);
}

/**
 * Retrieves the current message given an add-on event.
 * @param {Event} event - Add-on event
 * @return {Message}
 */
function getCurrentMessage(event) {
  var accessToken = event.messageMetadata.accessToken;
  var messageId = event.messageMetadata.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  return GmailApp.getMessageById(messageId);
}
