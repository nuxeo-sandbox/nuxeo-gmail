/*
 * (C) Copyright 2018-2019 Nuxeo SA (http://nuxeo.com/).
 * This is unpublished proprietary source code of Nuxeo SA. All rights reserved.
 * Notice of copyright on this source code does not indicate publication.
 *
 * Contributors:
 *     Nuxeo
 */

var NUXEO_ICON = "https://media.glassdoor.com/sql/1066046/nuxeo-squarelogo-1516893998893.png";
var SPACES = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
var CREATE_NOTE_LABEL = "Create Nuxeo document from an email";
var PUSH_ATTACH_LABEL = "Push attachments from an email to Nuxeo";

function buildHomeCard() {
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl(NUXEO_ICON)
      .setMultiline(true)
      .setTopLabel("Nuxeo presents")
      .setContent("<b>Nuxeo Gmail Inbox!</b>")
  );
  var sectionWelcome = CardService.newCardSection()
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.EMAIL)
        .setMultiline(true)
        .setContent(PUSH_ATTACH_LABEL)
    )
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.DESCRIPTION)
        .setMultiline(true)
        .setContent(CREATE_NOTE_LABEL)
    )
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.INVITE)
        .setMultiline(true)
        .setContent("Start workflow on uploads for any Nuxeo user(s)")
    )
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.OFFER)
        .setMultiline(true)
        .setContent("Browse and attach any document to emails")
    );
  var sectionOAuthCreds = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("Please fill information to access Nuxeo:"))
    .addWidget(
      CardService.newTextInput()
        .setFieldName("nuxeoUrl")
        .setTitle("Nuxeo URL")
        .setHint("https://CLIENT.nuxeocloud.com/nuxeo")
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName("clientId")
        .setTitle("Client Id")
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName("clientSecret")
        .setTitle("Client Secret")
    )
    .addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText('<font color="#334CFF">Save Infos</font>')
          .setOnClickAction(createAction_(SAVE_CREDS))
      )
    );
  var card = CardService.newCardBuilder()
    .addSection(sectionLogo)
    .addSection(sectionWelcome)
    .addSection(sectionOAuthCreds);
  return card.build();
}

/**
 * Builds the custom authorization card to connect to the user's Nuxeo
 * account.
 *
 *  @param {Object} opts Parameters for building the card
 * @param {string} opts.url - Authorization URL to redirect to.
 * @return {Card}
 */
function buildAuthorizationCard(opts) {
  var header = CardService.newCardHeader().setTitle("Authorization required");
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("Please authorize access to your Nuxeo account."))
    .addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText("Authorize")
          .setAuthorizationAction(CardService.newAuthorizationAction().setAuthorizationUrl(opts.url))
      )
    );
  var card = CardService.newCardBuilder()
    .setHeader(header)
    .addSection(section);
  return card.build();
}

/**
 * Creates a card for display error details.
 *
 * @param {Object} opts Parameters for building the card
 * @param {Error} opts.exception - Exception that caused the error
 * @param {string} opts.errorText - Error message to show
 * @param {boolean} opts.showStackTrace - True if full stack trace should be displayed
 * @return {Card}
 */
function buildErrorCard(opts) {
  var errorText = opts.errorText;

  if (opts.exception && !errorText) {
    errorText = opts.exception.toString();
  }

  if (!errorText) {
    errorText = "No additional information is available.";
  }

  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle("An unexpected error occurred"));
  card.addSection(
    CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(errorText))
      .addWidget(
        CardService.newButtonSet().addButton(
          CardService.newTextButton()
            .setText('<font color="#334CFF">Reset/Disconnect</font>')
            .setOnClickAction(CardService.newAction().setFunctionName("disconnect"))
        )
      )
      .addWidget(CardService.newTextParagraph().setText("(Refresh the page after clicking on the button)"))
  );

  if (opts.showStackTrace && opts.exception && opts.exception.stack) {
    var stack = opts.exception.stack.replace(/\n/g, "<br/>");
    card.addSection(
      CardService.newCardSection()
        .setHeader("Stack trace")
        .addWidget(CardService.newTextParagraph().setText(stack))
    );
  }
  return card.build();
}

/**
 * Creates an action that routes through the `dispatchAction` entry point.
 *
 * @param {string} name - Action handler name
 * @param {Object} opt_params - Additional parameters to pass through
 * @return {Action}
 * @private
 */
function createAction_(name, opt_params) {
  var params = _.extend({}, opt_params);
  if (params.action) {
    params.nextAction = params.action;
  }
  params.action = name;
  return CardService.newAction()
    .setFunctionName("dispatchAction")
    .setParameters(params);
}

/**
 * Creates a link to an external URL.
 *
 * @param {string} url - URL to link to 
 * @return {OpenLink}
 */
function createExternalLink(url) {
  return CardService.newOpenLink()
    .setUrl(url)
    .setOpenAs(CardService.OpenAs.FULL_SIZE)
    .setOnClose(CardService.OnClose.NOTHING);
}

/**
 * Just a card to remind the user of refresh the page after disconnecting.
 */
function buildDisconnectCardInfo() {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle("Disconnect"));
  card.addSection(
    CardService.newCardSection().addWidget(CardService.newTextParagraph().setText("You have to refresh the web page."))
  );
  var cardsUniversalAction = CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([card.build()])
    .build();

  return cardsUniversalAction;
}

/**
 * Display the possible actions card.
 */
function buildNuxeoAction() {
  var card = CardService.newCardBuilder();
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl(NUXEO_ICON)
      .setMultiline(true)
      .setContent("<b>What do you like to do:</b>")
  );
  var sectionActions = CardService.newCardSection()
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.EMAIL)
        .setMultiline(true)
        .setContent(PUSH_ATTACH_LABEL)
        .setOnClickAction(createAction_(HANDLE_ATTACHMENTS))
    )
    .addWidget(
      CardService.newKeyValue()
        .setIcon(CardService.Icon.DESCRIPTION)
        .setMultiline(true)
        .setContent(CREATE_NOTE_LABEL)
        .setOnClickAction(createAction_(HANDLE_NOTES))
    );
  return card
    .addSection(sectionLogo)
    .addSection(sectionActions)
    .build();
}

/**
 * show simple card.
 */
function showSimpleCard(title, message) {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader().setTitle(title);
  var section = CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(message));
  var build = card
    .setHeader(header)
    .addSection(section)
    .build();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(build))
    .build();
}

/**
 * show simple card for pickup.
 */
function showSimpleCardForPickup(title, message) {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader().setTitle(title);
  var section = CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(message));
  return card
    .setHeader(header)
    .addSection(section)
    .build();
}

/**
 * show doc creation result.
 */
function showResultDoc(title, message, link, docId) {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader().setTitle(title);
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(message))
    .addWidget(
      CardService.newTextButton()
        .setText("Access to the document")
        .setOpenLink(createExternalLink(link))
    );
  var params = {
    docId: docId
  };
  var sectionTask = CardService.newCardSection();
  sectionTask.addWidget(
    CardService.newKeyValue()
      .setIcon(CardService.Icon.INVITE)
      .setMultiline(true)
      .setContent("Execute a workflow on this content")
      .setOnClickAction(createAction_(DISPLAY_WORKFLOW, params))
  );
  return card
    .setHeader(header)
    .addSection(section)
    .addSection(sectionTask)
    .build();
}

/**
 * Create the children docs tree card.
 * 
 * @param {Array} children docs
 * @param {String} action to execute when saving
 */
function buildChildrenCard(children, action, params) {
  var card = CardService.newCardBuilder();
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl(NUXEO_ICON)
      .setMultiline(true)
      .setContent("<b>Please choose a folder to save content:</b>")
  );
  var sectionUserWS = CardService.newCardSection();
  sectionUserWS.addWidget(
    CardService.newKeyValue()
      .setIcon(CardService.Icon.PERSON)
      .setMultiline(true)
      .setContent("Create in User Workspace")
      .setOnClickAction(createAction_(action + "WS", params))
  );
  var sectionChildren = [];
  for (var i = 0; i < children.length; i++) {
    var sectionChild = CardService.newCardSection();
    params = _.extend({}, params);
    params.parentId = children[i].uid;
    params.action = action;
    sectionChild
      .addWidget(
        CardService.newKeyValue()
          .setIcon(CardService.Icon.MEMBERSHIP)
          .setMultiline(true)
          .setContent(children[i].title)
          .setOnClickAction(createAction_(CHILD_NAVIGATE, params))
      )
      .addWidget(
        CardService.newButtonSet().addButton(
          CardService.newTextButton()
            .setText('<font color="#334CFF">' + SPACES + "> Save Here</font>")
            .setOnClickAction(createAction_(action, params))
        )
      );
    sectionChildren.push(sectionChild);
  }
  var card = card.addSection(sectionLogo).addSection(sectionUserWS);
  for (var i = 0; i < sectionChildren.length; i++) {
    card.addSection(sectionChildren[i]);
  }
  var build = card.build();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(build))
    .build();
}

/**
 * Create the children docs tree card for pickup.
 */
function buildPickUpCard(children, params) {
  var card = CardService.newCardBuilder();
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl(NUXEO_ICON)
      .setMultiline(true)
      .setContent("<b>Please choose the document to attach:</b>")
  );
  var inputSection = CardService.newCardSection()
    .addWidget(
      CardService.newTextInput()
        .setFieldName("suggestion")
        .setTitle("Search for...")
    )
    .addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText("Search")
          .setOnClickAction(createAction_(SEARCH_DOCUMENTS))
      )
    );
  var sectionChildren = [];
  for (var i = 0; i < children.length; i++) {
    var sectionChild = CardService.newCardSection();
    params = _.extend({}, params);
    params.parentId = children[i].uid;
    params.title = children[i].title;
    params.url = children[i].contextParameters.documentURL;
    sectionChild
      .addWidget(
        CardService.newKeyValue()
          .setIcon(CardService.Icon.MEMBERSHIP)
          .setMultiline(true)
          .setContent(children[i].title)
          .setOnClickAction(createAction_(ASSET_NAVIGATE, params))
      )
      .addWidget(
        CardService.newButtonSet().addButton(
          CardService.newTextButton()
            .setText('<font color="#334CFF">' + SPACES + "> Attach</font>")
            .setOnClickAction(createAction_(ATTACH_DOCUMENT, params))
        )
      );
    sectionChildren.push(sectionChild);
  }
  var card = card.addSection(sectionLogo).addSection(inputSection);
  for (var i = 0; i < sectionChildren.length; i++) {
    card.addSection(sectionChildren[i]);
  }
  return card.build();
}

/**
 * Display attachments to select.
 */
function buildAttachCard(attachments) {
  var card = CardService.newCardBuilder();
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl(NUXEO_ICON)
      .setMultiline(true)
      .setContent("<b>Please select attachments:</b>")
  );
  var sectionAttachments = [];
  for (var i = 0; i < attachments.length; i++) {
    var sectionAttach = CardService.newCardSection();
    var switchKeyValue = CardService.newKeyValue()
      .setIcon(CardService.Icon.EMAIL)
      .setMultiline(true)
      .setContent(attachments[i].getName())
      .setSwitch(
        CardService.newSwitch()
          .setFieldName(i.toString())
          .setValue("true")
      );
    sectionAttach.addWidget(switchKeyValue);
    sectionAttachments.push(sectionAttach);
  }
  var sectionAction = CardService.newCardSection();
  sectionAction.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('<font color="#334CFF">' + SPACES + "> Select</font>")
        .setOnClickAction(createAction_(SAVE_ATTACHMENTS))
    )
  );
  var card = card.addSection(sectionLogo);
  for (var i = 0; i < sectionAttachments.length; i++) {
    card.addSection(sectionAttachments[i]);
  }
  card.addSection(sectionAction);
  var build = card.build();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(build))
    .build();
}

function displayWFCard(docId) {
  var card = CardService.newCardBuilder();
  var sectionLogo = CardService.newCardSection().addWidget(
    CardService.newKeyValue()
      .setIconUrl(NUXEO_ICON)
      .setMultiline(true)
      .setContent("<b>Workflow</b>")
  );
  var sectionAction = CardService.newCardSection();
  sectionAction.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('<font color="#334CFF">Execute</font>')
        .setOnClickAction(createAction_(EXECUTE_WF))
    )
  );
  var card = card.addSection(sectionLogo);
}
