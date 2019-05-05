/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

/**
 * Extracted information from Nuxeo links.

 * @typedef {Object} NuxeoLink
 * @property {string} doc - Document id.
 * @property {string} repo - Name of the repository.
 * @property {string} action - Action to dispatch.
 */

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

/**
 * Extracts documents from one or more messages.
 *
 * @param {string|string[]} messageBodies - message bodies to scan for links.
 * @return {NuxeoLink[]} extracted link information, empty array if none found.
 */
function extractNuxeoLinks(messageBodies) {
  var bodies = _.castArray(messageBodies);
  var links = [];
  _.each(bodies, function(body) {
    extractNuxeoLinksFromText_(body, links);
  });
  return _.uniqBy(links, function(item) {
    return item.owner + item.repo + item.id;
  });
}

/**
 * Extracts documents from text.
 *
 * @param {string|string[]} text - raw text to scan for links.
 * @return {NuxeoLink[]} extracted link information, empty array if none found.
 */
function extractNuxeoLinksFromText_(text, appendTo) {
  var re = /https:\/\/nightly.nuxeo.com\/nuxeo\/(nxdoc)\/\/([^\/]+?)\/([^\/]+?)/gi;
  while ((match = re.exec(text)) !== null) {
    var type = stripHtmlTags(match[3]);
    appendTo.push({
      doc: stripHtmlTags(match[1]),
      repo: stripHtmlTags(match[2])
    });
  }
}
/**
 * Strips HTML tags from a string. Not a general purpose implementation,
 * just removes anything encased in <>.
 *
 * @param {string} text - text to strip tags from.
 * @return {string}
 */
function stripHtmlTags(str) {
  return str.replace(/<.+?>/g,'');
}
