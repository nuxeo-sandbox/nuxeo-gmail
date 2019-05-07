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
  }
};

function handleAttachments(event) {
  var message = getCurrentMessage(event);
  var attachments = message.getAttachments();

  if (_.isEmpty(attachments)) {
    return showSimpleCard("Oops!", "There is no attachment to this email. Please select another one.");
  }

  var rootDocument = nuxeoClientWrapper().root();
  if(!rootDocument){
    return showSimpleCard("Oops!", "There is a problem with the Nuxeo instance. Please check with the support.");
  }

  var children = nuxeoClientWrapper().children(rootDocument.uid);
  if(_.isEmpty(children)){
    return showSimpleCard("Nothing here!", "There is no other folders here.");
  }

  return buildChildrenCard(children);
}

function handleNotes(event) {
  var message = getCurrentMessage(event);
  var content = message.getBody();
  var sender = message.getFrom();
  var date = message.getDate();
  // TODO: send here the note to user workspace or return a new card for browsing
  return showSimpleCard("Yeehaa!", "You have pushed a new note!");
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