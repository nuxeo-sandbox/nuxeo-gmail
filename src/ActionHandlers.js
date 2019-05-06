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

function handleLinks(owner, repoName, id) {
  var docLinks = extractNuxeoLinks(message.getBody());
  if (!_.isEmpty(docLinks)) {
    return handleDocs_();
  }
  var nuxeoResponse = nuxeoClientWrapper().query(Queries.ISSUE, {
    owner: owner,
    repo: repoName,
    issue: id
  });

  var repo = githubResponse.repository;
  var issue = githubResponse.repository.issue;

  var card = buildIssueCard({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    url: issue.url,
    authorAvatarUrl: issue.author.avatarUrl,
    repositoryName: repo.nameWithOwner,
    labels: _.map(issue.labels.nodes, "name"),
    state: issue.state,
    author: issue.author.login,
    assignee: _.get(issue, "assignees.nodes[0].login"),
    createdAt: issue.createdAt,
    updatedAt: issue.lastEditedAt
  });

  return card;
}

function handleAttachments(event) {
  var message = getCurrentMessage(event);
  var attachments = message.getAttachments();
  if (_.isEmpty(attachments)) {
    return showSimpleCard("Oops!", "There is no attachment to this email. Please select another one.");
  }
  for (var i = 0; i < attachments.length; i++) {
    console.log(JSON.stringify(attachments[i]));
  }
  return showSimpleCard("yes", "you have attachments");
}

function handleNotes(event) {
  var message = getCurrentMessage(event);
  var content = message.getBody();
  var sender = message.getFrom();
  var date = message.getDate();
  // TODO: send here the note to user workspace or return a new card for browsing
  return showSimpleCard("Yeeha!", "You have pushed a new note!");
}
