(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    var sheet = doc.createStyleSheet()
    sheet.cssText = css;
    return sheet.ownerNode;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }

    head.appendChild(style);
    return style;
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    return document.createStyleSheet(url).ownerNode;
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
    return link;
  }
};

},{}],2:[function(require,module,exports){
module.exports = require('cssify');

},{"cssify":1}],3:[function(require,module,exports){
'use strict';

// Our Braze integration depends on overriding their default styling. This
// will indicate to the process to include this less file upon bundling.
// What will happen is it will be transformed into a module that injects a stylesheet
// dynamically on the page.

require('../less/index.less');

var templateBuilder = require('./template-builder');

var debugging = window.location.search.indexOf('__brazeDebug') !== -1;
var debugLog = function debugLog() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (debugging) {
    var _console;

    (_console = console).log.apply(_console, ['Invision + Braze Debug:'].concat(args));
  }
};

// post process the in app message to enrich our aesthetic and styles
var brazeInAppMessageDisplayed = function brazeInAppMessageDisplayed(inAppMessage) {
  try {

    debugLog('processing display for message:', inAppMessage);

    var modal = document.querySelector('.ab-iam-root .ab-modal');

    if (!modal) {
      debugLog('message modal was not in the dom');
      return;
    }

    // Handle enriching the plain text copy from braze with support for line breaks and formatted text
    var messageEl = modal.querySelector('.ab-message-text');
    var messageNode = messageEl.childNodes[messageEl.childNodes.length - 1];
    var plainTextMessage = messageNode.textContent;

    if (plainTextMessage) {

      // remove the current node so we can replace it
      messageNode.parentNode.removeChild(messageNode);

      var fragment = document.createDocumentFragment();
      var lineBreaks = plainTextMessage.split('\n');

      lineBreaks.forEach(function (lineText, lineIndex) {

        if (lineIndex > 0) {
          // handles support for line breaks
          fragment.appendChild(document.createElement('br'));
        }

        var boldGroups = lineText.split('*');

        boldGroups.forEach(function (text, index) {
          if (index > 0 && index % 2 !== 0) {
            var bold = document.createElement('b');
            bold.appendChild(document.createTextNode(text));
            fragment.appendChild(bold);
          } else {
            fragment.appendChild(document.createTextNode(text));
          }
        });
      });

      messageEl.appendChild(fragment);
    }

    // Handle support for deep linking buttons
    if (inAppMessage && inAppMessage.buttons) {
      var buttonElements = modal.querySelectorAll('.ab-message-buttons button');
      inAppMessage.buttons.forEach(function (button, index) {
        if ((button.uri || '').indexOf('js:') === 0) {

          debugLog('message has trigger', button.uri);

          var currentButton = buttonElements[index];

          // cloning will safely remove all event listeners allowing us
          // to take over the interactions
          var updatedButton = currentButton.cloneNode(true);

          updatedButton.addEventListener('click', function () {

            var messageToSend = 'braze-trigger:' + button.uri;

            console.log('Submitting Braze Trigger with message value:"', messageToSend, '"');

            window.postMessage(messageToSend, '*');
            window.appboy.logInAppMessageButtonClick(button, inAppMessage);

            // remove the modal entirely
            modal.parentNode.removeChild(modal);
          });

          currentButton.parentNode.replaceChild(updatedButton, currentButton);
        }
      });
    }

    if (inAppMessage.extras && inAppMessage.extras.template) {
      templateBuilder({
        templateName: inAppMessage.extras.template,
        inAppMessage: inAppMessage,
        modal: modal,
        messageContainer: messageEl
      });
    }
  } catch (e) {
    console.error(e);
  }
};

var normalizeRoute = function normalizeRoute(route) {
  route = route.trim();

  if (route[route.length - 1] === '/') {
    route = route.substr(0, route.length - 1);
  }

  if (route[0] !== '/') {
    route = '/' + route;
  }
  return route;
};

window.brazeReadyHandlers = window.brazeReadyHandlers || [];

window.brazeReadyHandlers.push(function () {
  debugLog('subscribed to messages');

  window.appboy.subscribeToNewInAppMessages(function (inAppMessages) {

    debugLog('new messages', inAppMessages);

    var allowedMessages = inAppMessages.filter(function (message) {
      var allowedRoutes = message && message.extras && message.extras.allowedRoutes;
      if (allowedRoutes) {
        var currentPath = normalizeRoute(location.pathname);

        return allowedRoutes.split(',').reduce(function (allowed, route) {
          debugLog('allowed routes comparison performed', currentPath, normalizeRoute(route));
          return allowed || currentPath.indexOf(normalizeRoute(route)) === 0;
        }, false);
      }

      return true;
    });

    debugLog('messages allowed to present', allowedMessages);

    if (allowedMessages.length > 0) {
      // Display the first in-app message.
      window.appboy.display.showInAppMessage(allowedMessages[0], null, function () {
        requestAnimationFrame(brazeInAppMessageDisplayed.bind(null, allowedMessages[0]));
      });

      // Return an array with any remaining, unhandled messages to Braze's internal queue.
      // These will be part of the inAppMessages param the next time this subscriber is invoked.
      inAppMessages.splice(inAppMessages.indexOf(allowedMessages[0]), 1);
      return inAppMessages;
    }

    return inAppMessages;
  });
});

},{"../less/index.less":8,"./template-builder":4}],4:[function(require,module,exports){

'use strict';

var utilityViews = require('./utility-views');

var templateBuilders = {
  scheduleDemoForm: require('./templates/schedule-demo-form'),
  emailMeTheApp: require('./templates/email-me-the-app')
};

var track = function track(event, props) {
  if (event && window.InvGrowth && window.InvGrowth.trackGrowth) {
    window.InvGrowth.trackGrowth(event, props);
  }
};

module.exports = function templateBuilder(_ref) {
  var templateName = _ref.templateName,
      inAppMessage = _ref.inAppMessage,
      modal = _ref.modal;


  var builder = templateBuilders[templateName];

  if (builder) {

    if (builder.modalClass) {
      modal.classList.add(builder.modalClass);
    }

    // some templates that don't require buttons need
    // to allow interaction within the content. In Braze,
    // if you don't have buttons it will close the modal upon
    // being clicked
    if (builder.dontCloseOnClick) {

      if (!modal.onclick) {
        // This is strictly for the debugging scenario if braze ever stops
        // using onclick as the containers click listener method.
        // In this case, we need a different approach for allowing clicks
        // in child components
        console.error('A template builder in braze-integration-components is attempting to unset the modal click handler but none was set to begin with');
      } else {
        // Note, braze assigns handlers directly on the onclick
        // method so setting it to a noop allows events to propagate
        // to other elements on the modals like close.
        modal.onclick = function () {};
      }
    }

    // create a workable container for the template builder
    var templateContainer = document.createElement('div');
    templateContainer.className = 'inv-braze-template-container';
    modal.querySelector('.ab-message-text').appendChild(templateContainer);

    // use the close button to close the modal so we let braze
    // propagate any tracking. But fallback to hiding if that's
    // not available for some reason
    var closeModal = function closeModal() {
      var close = modal.querySelector('.ab-close-button');
      if (close) {
        close.click();
      } else {
        modal.style.display = 'none';
      }
    };

    var showSuccessMessage = function showSuccessMessage(_ref2) {
      var header = _ref2.header,
          body = _ref2.body;

      utilityViews.showSuccessMessage({
        modal: modal,
        header: header,
        body: body,
        closeModal: closeModal
      });
    };

    builder.mount({
      modal: modal,
      templateContainer: templateContainer,
      inAppMessage: inAppMessage,
      showSuccessMessage: showSuccessMessage,
      track: track,
      closeModal: closeModal
    });
  } else {
    console.error('Braze Template specified by it does not match a template builder name. Template name passed:', templateName, 'Templates available:', templateBuilders);
  }
};

},{"./templates/email-me-the-app":5,"./templates/schedule-demo-form":6,"./utility-views":7}],5:[function(require,module,exports){
'use strict';

module.exports = {
  dontCloseOnClick: true,
  modalClass: 'email-me-the-app',
  mount: function mount(_ref) {
    var templateContainer = _ref.templateContainer,
        track = _ref.track,
        closeModal = _ref.closeModal,
        showSuccessMessage = _ref.showSuccessMessage;


    track('App - In-Product Message - View Send me the App Form');

    var userEmail = window.InvBrazeBridge && typeof window.InvBrazeBridge.getUserEmail === 'function' && window.InvBrazeBridge.getUserEmail() || '';

    templateContainer.innerHTML = '\n      <div class="email-me-the-app-template">\n        <div class="braze-input-label">Email me the App</div>\n        <div class="braze-input-button-combo">\n          <input type="email" placeholder="Your email" value="' + userEmail + '"/>\n          <button type="button">\n            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" viewBox="0 0 6 10">\n              <polygon points="8.939 8 10 6.939 15.061 12 10 17.061 8.939 16 12.939 12" transform="translate(-9 -7)"/>\n            </svg>\n          </button>\n        </div>\n        <div class="braze-input-errors"></div>\n      </div>\n    ';

    var button = templateContainer.querySelector('button');
    var input = templateContainer.querySelector('input');

    // Retrieve XSRF token from cookie, we pass this along with the post request
    var getXsrfTokenCookie = function getXsrfTokenCookie() {
      var cookieString = document.cookie;
      var matches = cookieString.match(/\bXSRF-TOKEN=([^;]+)/i);
      return decodeURIComponent(matches && matches[1] || '');
    };

    var handleSubmit = function handleSubmit() {

      if (input && !button.disabled) {

        button.disabled = true;

        input.classList.remove('errored');
        var emailRegex = /^[^@]+@([\w-]+\.)+[\w-]{2,4}$/i;
        if (!input.value || !emailRegex.test(input.value.trim())) {
          input.classList.add('errored');
          button.disabled = false;
        } else {

          // HANDLE DATA SUBMISSION
          fetch('/api/account/emailmeapp', {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify({ email: input.value.trim() }),
            headers: {
              'Content-Type': 'application/json',
              'X-XSRF-TOKEN': getXsrfTokenCookie()
            }
          }).then(function () {
            showSuccessMessage({
              header: 'Keep an eye on your inbox',
              body: 'Click the download link in the email from a mobile or tablet device to get started.'
            });
            track('App - In-Product Message - Successful App Link Requested', { Location: 'In-Product Message' });
            button.disabled = false;
          }, function (er) {
            // submission failed - allow retry
            input.classList.add('errored');
            button.disabled = false;
          });
        }
      }
    };

    // HANDLE INTERACTIONS
    if (button) {
      button.addEventListener('click', handleSubmit);
    }

    if (input) {
      input.addEventListener('keypress', function (e) {
        if (e.keyCode === 13) {
          handleSubmit();
        }
      });
    }
  }
};

},{}],6:[function(require,module,exports){
'use strict';

module.exports = {
  dontCloseOnClick: true,
  modalClass: 'schedule-demo',
  mount: function mount(_ref) {
    var templateContainer = _ref.templateContainer,
        track = _ref.track,
        closeModal = _ref.closeModal,
        showSuccessMessage = _ref.showSuccessMessage;


    track('App - In-Product Message - View Enterprise Form');

    templateContainer.innerHTML = '\n      <div class="schedule-demo-form-template">\n        <div class="braze-input-label">Schedule A Demo</div>\n        <div class="braze-input-button-combo">\n          <input type="phone" placeholder="Your phone number" />\n          <button type="button">\n            <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" viewBox="0 0 6 10">\n              <polygon points="8.939 8 10 6.939 15.061 12 10 17.061 8.939 16 12.939 12" transform="translate(-9 -7)"/>\n            </svg>\n          </button>\n        </div>\n        <div class="braze-input-errors"></div>\n      </div>\n    ';

    var button = templateContainer.querySelector('button');
    var input = templateContainer.querySelector('input');

    var handleSubmit = function handleSubmit() {

      if (input && !button.disabled) {

        button.disabled = true;

        input.classList.remove('errored');
        var phoneRegex = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/i;
        if (!input.value || input.value.length < 10 || !phoneRegex.test(input.value.trim())) {
          input.classList.add('errored');
          button.disabled = false;
        } else {

          // HANDLE DATA SUBMISSION
          if (window.InvBrazeBridge && window.InvBrazeBridge.submitEnterpriseLeadInfo) {
            window.InvBrazeBridge.submitEnterpriseLeadInfo({
              phone: input.value.trim()
            }).then(function () {

              showSuccessMessage({
                header: 'Keep an eye on your inbox',
                body: 'We will be in touch soon with details on how <br /> to get your team started with InVision Enterprise'
              });

              track('App - Upgrade - Successful Enterprise Submission', { Location: 'In-Product Message' });

              button.disabled = false;
            }, function (er) {

              // submission failed - allow retry
              input.classList.add('errored');

              track('App - Upgrade - Successful Enterprise Submission', { Location: 'In-Product Message' });

              button.disabled = false;
            });
          } else {
            console.error('window.InvBrazeBridge.submitEnterpriseLeadInfo was not available to schedule-demo-form.js');
            closeModal();
          }
        }
      }
    };

    // HANDLE INTERACTIONS
    if (button) {
      button.addEventListener('click', handleSubmit);
    }

    if (input) {
      input.addEventListener('keypress', function (e) {
        if (e.keyCode === 13) {
          handleSubmit();
        }
      });
    }
  }
};

},{}],7:[function(require,module,exports){
'use strict';

module.exports = {
  showSuccessMessage: function showSuccessMessage(_ref) {
    var modal = _ref.modal,
        header = _ref.header,
        body = _ref.body,
        closeModal = _ref.closeModal;

    modal.querySelector('.ab-message-text').style.display = 'none';
    modal.querySelector('.ab-image-area').style.display = 'none';

    modal.classList.add('success-message');

    var successMessage = document.createElement('div');
    successMessage.className = 'braze-success-message';
    successMessage.innerHTML = '\n      <div class="braze-success-check-container">\n        <span class=braze-success-check></span>\n      </div>\n      ' + (header ? '<div class="braze-success-header">' + header + '</div>' : '') + '\n      ' + (body ? '<div class="braze-success-body">' + body + '</div>' : '') + '        \n    ';
    modal.appendChild(successMessage);

    setTimeout(closeModal, 6000);
  }
};

},{}],8:[function(require,module,exports){
var css = ".braze-input-label {\n  color: #434c5e;\n  text-transform: uppercase;\n  font-size: 11px;\n  font-weight: bold;\n  line-height: 15px;\n}\n.ab-modal input::placeholder {\n  color: #C7CAD1;\n}\n.ab-modal input[type=text],\n.ab-modal input[type=email],\n.ab-modal input[type=phone] {\n  margin-top: 4px;\n  padding: 11px 16px;\n  border: 1px solid #C7CAD1;\n  width: 100%;\n  border-radius: 2px;\n}\n.ab-modal input[type=text].errored,\n.ab-modal input[type=email].errored,\n.ab-modal input[type=phone].errored {\n  border-color: #d1102b;\n}\n.braze-input-button-combo {\n  display: flex;\n  justify-content: flex-end;\n}\n.ab-modal .braze-input-button-combo input {\n  border-radius: 4px 0 0 4px;\n  border-right: 0;\n}\n.braze-input-button-combo button {\n  margin-top: 4px;\n  width: 54px;\n  background: #f36;\n  border: 0;\n  border-radius: 0 4px 4px 0;\n  border-left: 0;\n  display: flex;\n  color: #fff;\n  justify-content: center;\n  align-items: center;\n}\n.braze-input-errors {\n  display: none;\n}\n.braze-input-errors--active {\n  display: block;\n}\n.inv-braze-template-container {\n  white-space: normal;\n}\n.ab-modal.schedule-demo {\n  padding-bottom: 20px;\n}\n.schedule-demo-form-template {\n  padding-top: 26px;\n}\n.schedule-demo-form-template svg {\n  fill: #fff;\n}\n.email-me-the-app-template {\n  padding-top: 26px;\n}\n.email-me-the-app-template svg {\n  fill: #fff;\n}\n.email-me-the-app .ab-message-text {\n  margin-bottom: 20px !important;\n}\n.email-me-the-app input[type='email'] {\n  max-width: 110px;\n}\n.ab-modal.success-message {\n  padding: 33px;\n}\n.braze-success-message {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  flex-direction: column;\n  text-align: center;\n  padding-top: 20px;\n}\n.braze-success-check-container {\n  width: 80px;\n  height: 80px;\n  border-radius: 40px;\n  border: 2px solid #F36;\n  box-sizing: border-box;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.braze-success-check {\n  display: block;\n  border: 3px solid #f36;\n  border-top: 0;\n  border-right: 0;\n  width: 26px;\n  height: 12px;\n  transform-origin: center;\n  transform: rotate(-45deg) translate3d(4px, -2px, 0);\n}\n.braze-success-header {\n  font-weight: bold;\n  padding-top: 30px;\n  color: #313745;\n  font-family: \"Inv Eina 03\", \"Eina 03\", -apple-system, BlinkMacSystemFont, \"Open Sans\", open-sans, sans-serif;\n  font-size: 16px;\n  line-height: 22px;\n}\n.braze-success-body {\n  color: #313745;\n  font-family: \"Inv Maison Neue\", \"Maison Neue\", -apple-system, BlinkMacSystemFont, \"Open Sans\", open-sans, sans-serif;\n  font-size: 14px;\n  padding-top: 8px;\n  line-height: 19px;\n}\n";(require('lessify'))(css); module.exports = css;
},{"lessify":2}]},{},[3]);
