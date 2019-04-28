/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

var DEBUG = true;

/**
 * Typedef for events passed from Gmail to the add-on. Supplied for
 * reference.
 *
 * @typedef {Object} Event
 * @property {Object} parameters - Request parameters. Must include a 
 *    key "action" with the name of the action to dispatch
 * @property {Object} formInput - Values of input fields
 */

/**
 * Error handler
 * @callback ErrorHandler
 * @param {Error} exception - Exception to handle
 * @return {Card|ActionResponse|UnivseralActionResponse} optional card or action response to render
 */

/** 
 * Entry point for the add-on. Handles an user event and
 * invokes the corresponding action
 *
 * @param {Event} event - user event to process
 * @return {Card[]}
 */
function getContextualAddOn(event) {
  console.log("Nuxeo Gmail Starting...");
  event.parameters = { action: "showAddOn" };
  return dispatchActionInternal_(event, addOnErrorHandler);
}

/**
 * Entry point for custom authorization screen.
 * 
 * TODO - Remove once authorization error allows passing card directly
 *
 * @return {UniversalActionResponse} Card for authorization screen
 */
function handleShowSettings() {
  return dispatchActionInternal_(
    {
      parameters: {
        action: "showSettings"
      }
    },
    universalActionErrorHandler
  );
}

/**
 * Entry point for custom authorization screen.
 * 
 * TODO - Remove once authorization error allows passing card directly
 *
 * @return {Card} Card for authorization screen
 */
function handleAuthorizationRequired() {
  return dispatchActionInternal_({
    parameters: {
      action: "showAuthorizationCard"
    }
  });
}

/**
 * Handles the OAuth response from Nuxeo.
 * 
 * The redirect URL to enter is:
 * https://script.google.com/macros/d/<Apps Script ID>/usercallback
 *
 *
 * @param {Object} oauthResponse - The request data received from the
 *     callback function. Pass it to the service"s handleCallback() method
 *     to complete the authorization process.
 * @return {HtmlOutput} a success or denied HTML message to display to
 *     the user. Also sets a timer to close the window automatically.
 */
function handleNuxeoOAuthResponse(oauthResponse) {
  if (DEBUG) {
    console.time("handleNuxeoOAuthResponse");
  }

  try {
    nuxeoClientWrapper().handleOAuthResponse(oauthResponse);
    return HtmlService.createHtmlOutputFromFile("html/auth-success");
  } catch (e) {
    var template = HtmlService.createTemplateFromFile("html/auth-failure");
    template.errorMessage = e.toString();
    return template.evaluate();
  } finally {
    if (DEBUG) {
      console.timeEnd("handleNuxeoOAuthResponse");
    }
  }
}

/**
 * Entry point for secondary actions. Handles an user event and
 * invokes the corresponding action
 *
 * @param {Event} event - user event to process
 * @return {ActionResponse} Card or form action
 */
function dispatchAction(event) {
  return dispatchActionInternal_(event, actionErrorHandler);
}

/**
 * Validates and dispatches an action.
 *
 * @param {Event} event - user event to process
 * @param {ErrorHandler} errorHandler - Handles errors, optionally 
 *        returning a card or action response.
 * @return {ActionResponse|UniversalActionResponse|Card} Card or form action
 */
function dispatchActionInternal_(event, errorHandler) {
  if (DEBUG) {
    console.time("dispatchActionInternal");
    console.log(event);
  }

  try {
    var actionName = event.parameters.action;
    if (!actionName) {
      throw new Error("Missing action name.");
    }

    var actionFn = ActionHandlers[actionName];
    if (!actionFn) {
      throw new Error("Action not found: " + actionName);
    }

    return actionFn(event);
  } catch (err) {
    console.error(err);
    if (errorHandler) {
      return errorHandler(err);
    } else {
      throw err;
    }
  } finally {
    if (DEBUG) {
      console.timeEnd("dispatchActionInternal");
    }
  }
}

/**
 * Handle unexpected errors for the main universal action entry points.
 *
 * @param {Error} exception - Exception to handle
 * @return {Card|ActionResponse|UnivseralActionResponse} optional card or action response to render
 */
function addOnErrorHandler(err) {
  if (err instanceof AuthorizationRequiredException) {
    CardService.newAuthorizationException()
      .setAuthorizationUrl(nuxeoClientWrapper().authorizationUrl())
      .setResourceDisplayName("Nuxeo")
      .setCustomUiCallback("handleAuthorizationRequired")
      .throwException();
  } else {
    return buildErrorCard({
      exception: err,
      showStackTrace: DEBUG
    });
  }
}

/**
 * Handle unexpected errors for universal actions.
 *
 * @param {Error} exception - Exception to handle
 * @return {Card|ActionResponse|UnivseralActionResponse} optional card or action response to render
 */
function universalActionErrorHandler(err) {
  var card = addOnErrorHandler(err);
  return CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([card])
    .build();
}
/**
 * Handle unexpected errors for secondary actions.
 *
 * @param {Error} exception - Exception to handle
 * @return {Card|ActionResponse|UnivseralActionResponse} optional card or action response to render
 */
function actionErrorHandler(err) {
  var card = addOnErrorHandler(err);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card))
    .build();
}
