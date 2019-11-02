"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

if (!utilitiesChecksum) var utilitiesChecksum = 'af41f3b4a24bf5ba08b91dc79d4d0eecad05bd752dfb75b16314cab6c6e09dd5';
/* Polyfill(s) */

if (!Object.values) {
  Object.values = function values(O) {
    return Object.keys(O).reduce(function (v, k) {
      return v.concat(typeof k === 'string' && O.propertyIsEnumerable(k) ? [O[k]] : []);
    }, []);
  };
}

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) {
      // .length of function is 2
      'use strict';

      if (target == null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }

      return to;
    },
    writable: true,
    configurable: true
  });
}

if (!String.prototype.includes) {
  Object.defineProperty(String.prototype, 'includes', {
    value: function value(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    }
  });
}
/*
 * Utility functions for measuring InVision feature success
 *
 * Do more of what works for users, less of what doesn't!
 *
 */

/*
 * Initialize libraries
 *
 */


!function () {
  var allowExternalScripts = true;

  if (allowExternalScripts === false) {
    console.log('Environment does not allow external scripts - abort initializing segment');
    return;
  } // Do not reinitialize utilities more than once


  if (window.measure && window.measure.fullyLoaded) {
    return;
  } // Segment include snippet


  var analytics = window.analytics = window.analytics || [];
  if (!analytics.initialize) if (analytics.invoked) window.console && console.error && console.error("Segment snippet included twice.");else {
    analytics.invoked = !0;
    analytics.methods = ["trackSubmit", "trackClick", "trackLink", "trackForm", "pageview", "identify", "reset", "group", "track", "ready", "alias", "debug", "page", "once", "off", "on"];

    analytics.factory = function (t) {
      return function () {
        var e = Array.prototype.slice.call(arguments);
        e.unshift(t);
        analytics.push(e);
        return analytics;
      };
    };

    for (var t = 0; t < analytics.methods.length; t++) {
      var e = analytics.methods[t];
      analytics[e] = analytics.factory(e);
    }

    analytics.load = function (t, e) {
      var n = document.createElement("script");
      n.type = "text/javascript";
      n.async = !0;
      n.src = "https://cdn.segment.com/analytics.js/v1/" + t + "/analytics.min.js";
      var a = document.getElementsByTagName("script")[0];
      a.parentNode.insertBefore(n, a);
      analytics._loadOptions = e;
    };

    analytics.SNIPPET_VERSION = "4.1.0";
  }
  ; // Find Utilities.js script

  var utilitiesScript = document.querySelectorAll('[src*="/measure/utilities.js"]'); // Initialize Measure

  var measure = window.measure = window.measure || {};
  measure.queue = measure.queue || [];
  measure.identifyAttempted = measure.identifyAttempted || false; // Initialize dual dispatch to segment and analytics-api

  measure.dualDispatchSegmentOverrideEnabled = isDualDispatchForSegmentOverideEnabled();

  if (typeof measure.loadBraze === 'undefined') {
    measure.loadBraze = !(utilitiesScript && utilitiesScript[0] && /loadBraze=false/.test(utilitiesScript[0].src));
  } // InVision Braze Components


  ;

  (function () {
    if (measure.loadBraze) {
      var brazeJS = 'braze-overriding-js';

      if (!document.getElementById(brazeJS)) {
        var script = document.createElement("script");
        script.src = '/measure/braze-components.bundle.js';
        script.id = brazeJS;

        script.onload = function () {
          analytics.ready(function () {
            if (window.brazeReadyHandlers && window.brazeReadyHandlers.length > 0) {
              var cb;

              while (cb = window.brazeReadyHandlers.shift()) {
                if (typeof cb === 'function') {
                  try {
                    cb();
                  } catch (e) {
                    console.error(e);
                  }
                }
              }
            }
          });
        };

        document.head.appendChild(script);
      }
    }
  })(); // mark that the utilities measure library has been fully loaded
  // and any subsequent loads should reuse the window.measure that already exists


  measure.fullyLoaded = true; // mark that the utilities measure library has NOT called the Segment page method

  measure.pageMethodFired = false;

  function isDualDispatchForSegmentOverideEnabled() {
    return window.location.href.indexOf('analytics-dual-dispatch') > 0;
  }

  function shouldShipEventToSegment(writeKey) {
    var segmentDefaultKeyUsed = writeKey === measure.defaultSegmentKey;

    if (!(measure.dualDispatchSegmentOverrideEnabled || segmentDefaultKeyUsed)) {
      return false;
    }

    return true;
  }

  function transformPayload(payload) {
    // userId must be a string
    if (typeof payload.userId === "number" || payload.userId instanceof Number) {
      payload.userId = payload.userId + '';
    }

    return payload;
  }

  measure.callAnalyticsAPI = function (onAnalyticsApiResponseCb, args) {
    onAnalyticsApiResponseCb = onAnalyticsApiResponseCb || function () {};

    var timeout = 1300; // analytics-api generally has a sub 1 ms response time.
    // Translate args into specific payload

    var segmentCallBodyAsJSON = JSON.parse(args);
    var destinationUrl = measure.getAnalyticsAPIDestinationURL(segmentCallBodyAsJSON.type);

    if (destinationUrl === null) {
      // unsupported method
      var result = {};
      result.status = 0;
      result.responseText = "Url not supported";
      onAnalyticsApiResponseCb(result);
      return;
    }

    var payload = transformPayload(segmentCallBodyAsJSON);
    var envelope = createAnalyticsAPIEnvelope(payload);

    if (!shouldShipEventToSegment(envelope.payload.writeKey)) {
      var result = {};
      result.status = 0;
      result.responseText = "Segment project not supported";
      onAnalyticsApiResponseCb(result);
      return;
    }

    var xhr = new window.XMLHttpRequest();
    xhr.open('POST', destinationUrl, true);
    xhr.timeout = timeout;
    xhr.setRequestHeader('Content-Type', 'application/json'); // the edge gateway requires all calls routing through the gateway to require v7 tracing headers.
    //   Request-id is implemented in the edge gateway.
    // https://invisionapp.atlassian.net/wiki/spaces/EDOC/pages/752817588/V7+Tracing+Headers

    xhr.setRequestHeader('Request-Source', 'analytics-ui');
    xhr.setRequestHeader('Calling-Service', 'analytics-ui');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status !== 0) {
        var result = {};
        result.status = xhr.status;
        result.responseText = xhr.responseText;
        onAnalyticsApiResponseCb(result);
      }
    };

    xhr.ontimeout = function (x) {
      var result = {};
      result.status = xhr.status;
      result.responseText = "timeout";
      onAnalyticsApiResponseCb(result);
    };

    xhr.send(JSON.stringify(envelope));
  };

  measure.getAnalyticsAPIDestinationURL = function (callType) {
    var analyticsAPIPath = measure.origin + '/analytics-api';

    switch (callType) {
      case 'track':
        return analyticsAPIPath + '/track';
    }

    return null;
  };

  function createAnalyticsAPIEnvelope(payload) {
    return {
      client_source: 'analytics-ui',
      team_id: measure.teamId,
      segment_user_id: measure.segmentUserId,
      vendor_id: measure.vendorId,
      target_segment_source: measure.defaultSegmentSourceName,
      payload: payload
    };
  }

  function callSegmentMethod(name) {
    if (measure.isEnvironmentDenyListed()) {
      // Don't send events in these environments
      return;
    } else if (window.analytics && typeof window.analytics[name] === 'function') {
      // Pass all arguments after 'name' to the Segment method
      var args = Array.prototype.slice.call(arguments, 1);
      return window.analytics[name].apply(window.analytics, args);
    } else {// TODO: Log error
    }
  }

  measure.debugLog = function (key) {
    // Check if segment debug is enabled and if it is console log
    try {
      if (window.localStorage && window.localStorage.debug == 'analytics:*') {
        console['log'].apply(window, arguments);
      }
    } catch (e) {// can fail if in private browsing mode
    }
  }; // patches XMLHTTPREQUEST to dual dispach calls to segment to analytics-api


  measure.patchXMLHTTPREQUEST = function (callAnalyticsAPI) {
    callAnalyticsAPI = callAnalyticsAPI || measure.callAnalyticsAPI;
    var originalSend = XMLHttpRequest.prototype.send;
    var originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.send = function () {
      var overideSendContext = this;
      var overideSendArguments = arguments;

      if (this.patchUrl.indexOf('https://api.segment.io/v1') === 0) {
        var onAnalyticsAPIResponse = function onAnalyticsAPIResponse(results) {
          if (results.status != 200 || results.responseText == "timeout") {
            overideSendContext.sentToSegment = true;
            originalSend.apply(overideSendContext, overideSendArguments);
          }
        };

        this.sentToAnalyticsAPI = true;
        callAnalyticsAPI(onAnalyticsAPIResponse, overideSendArguments[0]);
      } else {
        originalSend.apply(overideSendContext, overideSendArguments);
      }
    };

    XMLHttpRequest.prototype.open = function (method, url) {
      this.patchUrl = url;
      this.sentToAnalyticsAPI = false;
      this.sentToSegment = false;
      originalOpen.apply(this, arguments);
    };
  }; // Key param is optional.
  // If no key provided, default will be used.


  measure.initializeSegment = function (key) {
    // patch xmlhttp request to capture segment call for dual dispatch
    if (!measure.patchedForAnalyticsAPI) {
      measure.patchXMLHTTPREQUEST(measure.callAnalyticsAPI);
      measure.patchedForAnalyticsAPI = true;
    }

    if (!key) {
      key = measure.defaultSegmentKey;

      if (key.indexOf('DEFAULT') >= 0) {
        return;
      }
    }

    var segmentScript = window.document.querySelectorAll('script[src*="/analytics.min.js"]');

    if (!segmentScript.length) {
      var integrationsObj = {
        integrations: {
          'Appboy': measure.loadBraze
        }
      };
      callSegmentMethod('load', key, integrationsObj);
    }

    if (!measure.pageMethodFired) {
      var name = page_allowed_list[location.pathname.replace(/\/$/, "")] || null;
      measure.page(name);
      measure.pageMethodFired = true;
    }
  };

  measure.setSegmentKey = function (key) {
    // TODO: Log usage
    console.warn('`measure.setSegmentKey` is deprecated. Please use `measure.initializeSegment` instead.');
    measure.initializeSegment(key);
  };
  /*
  * Note context of feature use
  *
  */


  var getInvisionEnv = function getInvisionEnv() {
    var invisionEnv = 'production';

    if (invisionEnv.indexOf('SET_INV') >= 0) {
      invisionEnv = 'unknown';
    }

    return invisionEnv;
  };

  var getInvisionTier = function getInvisionTier() {
    var invisionTier = 'multi-tenant';

    if (invisionTier.indexOf('SET_INV') >= 0) {
      invisionTier = 'unknown';
    }

    return invisionTier;
  };

  var getInvisionNamespace = function getInvisionNamespace() {
    var invisionNamespace = 'v7';

    if (invisionNamespace.indexOf('SET_INV') >= 0) {
      invisionNamespace = 'unknown';
    }

    return invisionNamespace;
  };

  measure.teamId = '';
  measure.segmentUserId = '';
  measure.invisionVersion = '6.0+';
  measure.vendorId = '';
  measure.invisionEnv = getInvisionEnv();
  measure.invisionTier = getInvisionTier();
  measure.invisionNamespace = getInvisionNamespace();
  measure.defaultSegmentKey = 'DWbnZBBFMh0032NAb32QRdQpIagKlzFS';
  measure.defaultSegmentSourceName = 'invision-prod';
  measure.origin = '';

  measure.getInvisionVersion = function (version) {
    return measure.invisionVersion;
  };

  measure.setInvisionVersion = function (version) {
    if (version && ['6.0+', '7.0', '7.1'].indexOf(version) > -1) {
      measure.invisionVersion = version;
    } else {
      measure.debugLog("Unrecognized version contact service owner.");
    }
  };

  measure.setOrigin = function (origin) {
    measure.origin = origin;
  };
  /*
  * Measure feature uses & outcomes
  *
  */


  var propsToAppend = {};
  /*
  * Specify one or more properties (in object form)
  * to append to every collect() call, including translations.
  *
  * Calling this function multiple times is cumulative.
  * However, calling append() with no param, will clear
  * the appended properties to an empty set.
  */

  measure.append = function (customProps) {
    if (!customProps) {
      propsToAppend = {}; // clear the list
    } else if (customProps && _typeof(customProps) === "object") {
      propsToAppend = Object.assign({}, propsToAppend, customProps);
    }
  };

  function stampProps(rawProps) {
    var result = {};

    if (rawProps && _typeof(rawProps) === "object") {
      result = Object.assign({}, rawProps);
    }

    if (!result.teamId) {
      result.teamId = measure.teamId ? measure.teamId : '';
    }

    if (!result.invisionVersion) {
      result.invisionVersion = measure.invisionVersion;
    }

    if (!result.invisionEnv) {
      result.invisionEnv = measure.invisionEnv;
    }

    if (!result.invisionTier) {
      result.invisionTier = measure.invisionTier;
    }

    if (!result.invisionNamespace) {
      result.invisionNamespace = measure.invisionNamespace;
    }

    return result;
  }

  measure.collect = function (name, props, options) {
    // Check if we've tried to identify the user yet. If not, queue this event.
    if (!measure.identifyAttempted) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('collect');
      measure.queue.push(args);
      return;
    }

    var user = callSegmentMethod('user'); // Check if segmentUserId matches Segment cookie ID. If a user is using
    // multiple Invision environments in the same browser, their Segment cookie
    // can change mid-session based on where they were last identified. We want
    // to compare the current Segment cookie ID to the one we determined for the
    // user on load of this script, and re-set it if they differ.

    if (user && measure.segmentUserId && measure.segmentUserId != user.id()) {
      measure.identify(measure.segmentUserId);
    } // append any custom props


    var extendedProps = Object.assign({}, propsToAppend, props);

    switch (measure.getNameType(name)) {
      case ORIGINAL:
        // Fire original event, EXcluding some Segment integrations
        var optionsExcludeIntegrations = Object.assign({}, options);
        optionsExcludeIntegrations.integrations = Object.assign(optionsExcludeIntegrations.integrations || {}, {
          'Amplitude': false,
          'Appboy': false,
          'Optimizely': false,
          'Hotjar': false
        });
        callSegmentMethod('track', name, stampProps(extendedProps), optionsExcludeIntegrations);
        measure.debugLog("Just fired \"" + name + "\" to Segment, Excluding some integrations, as shown in options: ", optionsExcludeIntegrations, "The event had properties: ", stampProps(extendedProps)); // Translate and fire including all destinations

        var translated = measure.translate(name, extendedProps);

        if (translated && translated['name']) {
          // Since the allowlist is based off the translation map,
          // translated events are already on the allowlist
          callSegmentMethod('track', translated['name'], stampProps(Object.assign({}, translated['opts'], propsToAppend)));
          measure.debugLog("Just fired \"" + translated['name'] + "\" to Segment. The event had properties: ", stampProps(Object.assign({}, translated['opts'], propsToAppend)));
        }

        break;

      case INTERMEDIATE:
        // growth events should be migrated to STANDARD in code
        // TODO: Log to error log not console
        measure.debugLog("The following event should be updated in code: " + name);
        break;

      case STANDARD:
        if (allowlist.includes(name) || getInvisionEnv() != 'production') {
          var stampedProps = stampProps(extendedProps);
          var optionsIntegrations = Object.assign({}, options);
          var optedOutOfAmplitude = optionsIntegrations.integrations && (optionsIntegrations.integrations.All === false || optionsIntegrations.integrations.Amplitude === false);

          if (stampedProps.teamId && !optedOutOfAmplitude) {
            // Set the event group level for Amplitude // https://segment.com/docs/destinations/amplitude/#setting-event-level-groups-via-track-
            optionsIntegrations.integrations = Object.assign(optionsIntegrations.integrations || {}, {
              'Amplitude': {
                'groups': {
                  'teamId': stampedProps.teamId
                }
              }
            });
          }

          if (stampedProps.invisionVersion !== '7.0' || !user || !user.id() || user.id() == "") {
            optionsIntegrations.integrations = Object.assign(optionsIntegrations.integrations || {}, {
              'Appboy': false
            });
          } // fire standardised events to segment and all integrations


          callSegmentMethod('track', name, stampedProps, optionsIntegrations);
          measure.debugLog("Just fired \"" + name + "\" to Segment. The event had properties: ", stampedProps);

          if (!allowlist.includes(name)) {
            console.warn("Just fired \"" + name + "\" a non-allowlisted event. This event will be blocked in production environments");
          }
        }

        break;

      default: // no op

    }
  };

  measure.identify = function (id, traits, options, fn) {
    var stampedTraits = stampProps(traits);
    var optionsIntegrations = Object.assign({}, options);

    if (stampedTraits.invisionVersion !== '7.0') {
      optionsIntegrations.integrations = Object.assign(optionsIntegrations.integrations || {}, {
        'Appboy': false
      });
    }

    callSegmentMethod('identify', id, stampedTraits, optionsIntegrations, fn);
  };

  var page_allowed_list = {
    '/auth/success': '/auth/success',
    '/auth/sign-up': '/auth/sign-up',
    '/auth/sign-in': '/auth/sign-in',
    '/auth/select-a-team': '/auth/select-a-team',
    '/auth/sign-in/subdomain': '/auth/sign-in/subdomain',
    '/auth/sign-up/create-team': '/auth/sign-up/create-team',
    '/auth/sign-up/new-user': '/auth/sign-up/new-user'
  };

  measure.page = function (name) {
    callSegmentMethod('page', null, name, stampProps({}));
  };

  measure.debug = callSegmentMethod.bind(null, 'debug'); // CAUTION: **** We are using a timeout when injecting the script tag as
  // changing the DOM structure is breaking in the context of some Chrome
  // browser plugins (that block and remove certain DOM elements). The
  // plugin-based change of the DOM is breaking the AngularJS $compile() and
  // linking workflow. By deferring the injection of the script tag, we seem to
  // get around this problem.

  setTimeout(measure.optimizelySync, 10, false);

  measure.optimizelySync = function () {
    measure.loadScript('//cdn.optimizely.com/js/10316326513.js'); // default this value

    window.optimizely = window.optimizely || [];
  };

  measure.loadScript = function (url, cb) {
    var el = document.createElement('script');
    el.async = true;
    el.src = url;

    if (cb && typeof cb === "function") {
      el.onload = el.onreadystatechange = cb;
    }

    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(el, s);
  }; // Param should take format (name, {opts})


  measure.translate = function (n, o) {
    // When name is invalid, translation is empty object
    // When name is already translated, it is returned as is
    if (!n) {
      return {};
    }

    if ([STANDARD, INTERMEDIATE].includes(measure.getNameType(n))) {
      return {
        "name": n,
        "opts": o
      };
    }

    if (!(emap[n] && emap[n]["name"])) {
      return {};
    }

    var translation = {
      "name": emap[n]["name"]
    }; // Translated opts = (mapped opts w/ fixed values)
    //                 + (caller-supplied param opts w/ mapped keys/values)
    // Retrieve mapped opts w/ fixed values

    var opts = {};
    var p = emap[n]["opts"];

    if (p) {
      Object.keys(p).forEach(function (key) {
        var f = p[key].toString().charAt(0);

        if (!['<', '('].includes(f)) {
          opts[key] = p[key];
        }
      });
    } // If no param opts, translation is complete


    if (o === undefined || o === null || o === '') {
      if (Object.keys(opts).length > 0) {
        translation['opts'] = opts;
      }

      return translation;
    } // If param opts, map their keys/values


    var mk = emap[n]["mapk"];
    var mv = emap[n]["mapv"];

    if (mk) {
      Object.keys(mk).forEach(function (key) {
        return opts[mk[key]] = o[key];
      }); //map the keys

      if (mv) {
        Object.keys(mk).forEach(function (key) {
          var v = mv[o[key]];

          if (v) {
            opts[mk[key]] = v; //map the values
          }
        });
      }
    }

    translation['opts'] = opts;
    return translation;
  };

  var STANDARD = "standardized";
  var INTERMEDIATE = "intermediate";
  var ORIGINAL = "original";

  measure.getNameType = function (n) {
    if (!n) {
      return "";
    } // substr because match & startswith break tests, due to bug in test dependency


    if (n.substr(0, 4) === 'App.' || n.substr(0, 7) === 'Studio.' || n.substr(0, 5) === 'Jira.' || n.substr(0, 7) === 'Sketch.' || n.substr(0, 6) === 'Craft.' || n.substr(0, 8) === 'Inspect.' || n.substr(0, 4) === 'IMI.' || n.substr(0, 4) === 'IMA.' || n.substr(0, 4) === 'IFI.') {
      return STANDARD;
    }

    if (n.substr(0, 5) === 'App -') {
      return INTERMEDIATE;
    }

    if (n.substr(0, 7) === 'Trello.' || n.substr(0, 11) === 'Confluence.' || n.substr(0, 5) === 'JIRA.' || n.substr(0, 6) === 'Slack.' || n.substr(0, 5) === 'Conv.') {
      var arr = ['JIRA.Added', 'JIRA.Comment', 'JIRA.Inspect', 'JIRA.Preview', 'JIRA.Removed', 'JIRA.Viewed', 'Trello.AddInvalidLink', 'Trello.AddPrototype', 'Trello.MakeCover', 'Trello.OpenComments', 'Trello.OpenInspect', 'Trello.OpenPreview', 'Trello.RemoveCover', 'Trello.RemovePrototype', 'Confluence.OpenInInVision', 'Confluence.Resizemax', 'Confluence.Resizemin', 'Confluence.ThumbClicked', 'Slack.Button', 'Slack.Connect', 'Slack.ActivityPreferences'];

      if (arr.includes(n)) {
        return ORIGINAL;
      } else {
        return STANDARD;
      }
    }

    return ORIGINAL;
  };

  var emap = {
    "Prototype.Create": {
      "name": "App.Prototype.Created",
      "opts": {
        "isDemo": false,
        "isFirstProject": true
      },
      "flag": true
    },
    "SignupSelfServe": {
      "name": "App.Signup.Succeeded",
      "opts": {
        "signupSource": "shareComment"
      }
    },
    "Comment.AccountCreationFailure": {
      "name": "App.Signup.Failed",
      "opts": {
        "signupSource": "shareComment"
      }
    },
    "Comment.SignupFormView": {
      "name": "App.Signup.Form.Viewed",
      "opts": {
        "signupSource": "(shareComment|enterpriseShareComment)"
      }
    },
    "Comment.ToggleCommentModeOn": {
      "name": "App.Share.CommentMode.Activated",
      "opts": {
        "loggedIn": "<boolean>"
      },
      "mapk": {
        "loggedIn": "loggedIn"
      }
    },
    "Comment.Adding": {
      "name": "App.Conversation.Comment.Drafted",
      "opts": {
        "documentType": "prototype",
        "commentLocation": "prototypeShare"
      }
    },
    "Comment.Added": {
      "name": "App.Conversation.Comment.Added",
      "opts": {
        "commentLocation": "(prototype|prototypeShare)",
        "loggedIn": "<boolean>",
        "isReply": "<boolean>",
        "commentType": "(comment|private-comment|dev-note|tour-point)",
        "containsMentions": "<boolean>"
      },
      "mapk": {
        "commentLocation": "commentLocation",
        "isAuthenticated": "loggedIn",
        "isReply": "isReply",
        "commentType": "commentType",
        "userNotified": "containsMentions"
      }
    },
    "Share viewed via desktop": {
      "name": "App.Share.Viewed",
      "opts": {
        "documentId": "<id>",
        "projectType": "prototype"
      },
      "mapk": {
        "projectid": "documentId"
      }
    },
    "MobileShare.Viewed": {
      "name": "App.Share.Viewed",
      "opts": {
        "browser": "mobile"
      }
    },
    "Version.Clicked": {
      "name": "App.Console.HistoryMode.VersionClicked",
      "opts": {
        "projectId": "<id>",
        "screenId": "<id>",
        "version": "<string>"
      },
      "mapk": {
        "projectID": "projectId",
        "screenID": "screenId",
        "version": "version"
      }
    },
    "RequestAccess.Requested": {
      "name": "App.Prototypes.Access.Requested",
      "opts": {
        "userRole": "<string>"
      },
      "mapk": {
        "userRole": "userRole"
      }
    },
    "RequestAccess.Viewed": {
      "name": "App.Prototypes.Access.Viewed",
      "opts": {
        "userRole": "<string>"
      },
      "mapk": {
        "userRole": "userRole"
      }
    },
    "RequestAccess.Approved": {
      "name": "App.Prototypes.Access.Approved",
      "opts": {
        "userRole": "<string>"
      },
      "mapk": {
        "userRole": "userRole"
      }
    },
    "Hotspot Template Created": {
      "name": "App.Console.Hotspot.Template.Created"
    },
    "Fixed Header Added": {
      "name": "App.Console.FixedHeader.Added",
      "opts": {
        "screenId": "<id>",
        "projectType": "<string>"
      },
      "mapk": {
        "screenId": "screenId",
        "Project Type": "projectType"
      }
    },
    "Fixed Footer Added": {
      "name": "App.Console.FixedFooter.Added",
      "opts": {
        "screenId": "<id>",
        "projectType": "<string>"
      },
      "mapk": {
        "screenId": "screenId",
        "Project Type": "projectType"
      }
    },
    "Console Uploader Used": {
      "name": "App.Console.Uploader.Used",
      "opts": {
        "isReplacement": "<boolean>",
        "isInline": "<boolean>",
        "fileType": "<extension>"
      },
      "mapk": {
        "replacement": "isReplacement",
        "inline": "isInline",
        "ext": "fileType"
      }
    },
    "Hotspot.Create": {
      "name": "App.Console.Hotspot.Created",
      "opts": {
        "hotspotAction": "<string>",
        "hotspotGesture": "<string>",
        "hotspotTransitions": "<string>",
        "hotspotProperties": "<json>",
        "projectOrientation": "<string>",
        "screenId": "<id>"
      },
      "mapk": {
        "hotspotAction": "hotspotAction",
        "hotspotGesture": "hotspotGesture",
        "hotspotTransitions": "hotspotTransitions",
        "hotspotProperties": "hotspotProperties",
        "projectOrientation": "projectOrientation",
        "screenId": "screenId"
      }
    },
    "Screen.DragAndDrop": {
      "name": "App.Console.Screen.DragAndDropped"
    },
    "Slack.Button": {
      "name": "App.Slack.ConnectModal.Displayed",
      "opts": {
        "slackButtonType": "<string>"
      },
      "mapk": {
        "slackButtonType": "slackButtonType"
      }
    },
    "Slack.Connect": {
      "name": "App.Slack.Connected"
    },
    "Slack.ActivityPreferences": {
      "name": "App.Slack.Preferences.Set",
      "opts": {
        "isCollaboratorActivity": "<boolean>",
        "isCommentActivity": "<boolean>",
        "isConversationActivity": "<boolean>",
        "isScreenActivity": "<boolean>",
        "isScreenStatusActivity": "<boolean>",
        "isShareActivity": "<boolean>",
        "sendActivity": "<boolean>"
      },
      "mapk": {
        "isCollaboratorActivity": "isCollaboratorActivity",
        "isCommentActivity": "isCommentActivity",
        "isConversationActivity": "isConversationActivity",
        "isScreenActivity": "isScreenActivity",
        "isScreenStatusActivity": "isScreenStatusActivity",
        "isShareActivity": "isShareActivity",
        "sendActivity": "sendActivity"
      }
    },
    "Upgrade.EntQuestionModalSuccess": {
      "name": "App.Upgrade.EntForm.Submitted.Success",
      "flag": true
    },
    "Prototype.View Browser == Home Screen Android": {
      "name": "App.Prototype.Viewed",
      "opts": {
        "browser": "mobile",
        "os": "android"
      }
    },
    "Prototype.View Browser == Home Screen Share iOS": {
      "name": "App.Prototype.Viewed",
      "opts": {
        "browser": "mobile",
        "os": "ios"
      }
    },
    "MobileShare.Interstitial": {
      "name": "App.Share.Interstitial.Viewed",
      "opts": {
        "browser": "mobile"
      }
    },
    "MobileShare.ViewedInBrowser": {
      "name": "App.Share.Viewed",
      "opts": {
        "browser": "mobile"
      }
    },
    "Trello.OpenPreview": {
      "name": "Trello.Link.Clicked",
      "opts": {
        "linkClicked": "preview"
      }
    },
    "Slack Share Sent": {
      "name": "Slack.Share.Sent"
    },
    "HypotheticalEvent": {
      "name": "App.Hypothetical",
      "flag": true
    },
    "Account.PasswordReset": {
      "name": "App.PasswordReset.Submitted"
    },
    "Team.Create": {
      "name": "App.Team.Created"
    },
    "Account.SignUp": {
      "name": "App.SignedUp"
    },
    "Account.Login": {
      "name": "App.LoggedIn"
    }
  };

  measure.emap = function () {
    return emap;
  };

  var allowlist = ["App.AcceptInvite.CreateAccount.Failed", "App.AcceptInvite.CreateAccount.Submitted", "App.AcceptInvite.CreateAccount.Succeeded", "App.AcceptInvite.CreateAccount.Viewed", "App.AcceptInvite.CreatePassword.Failed", "App.AcceptInvite.CreatePassword.Submitted", "App.AcceptInvite.CreatePassword.Succeeded", "App.AcceptInvite.CreatePassword.Viewed", "App.AcceptInvite.Form.Submitted", "App.AcceptInvite.JoinTeam.Failed", "App.AcceptInvite.JoinTeam.Succeeded", "App.AcceptInvite.SignInToContinue.Failed", "App.AcceptInvite.SignInToContinue.Submitted", "App.AcceptInvite.SignInToContinue.Succeeded", "App.AcceptInvite.SignInToContinue.Viewed", "App.AcceptInvite.User.Created", "App.AcceptInvite.UserJoin.Failed", "App.AcceptInvite.UserJoin.Succeeded", "App.AccountSettings.Closed", "App.AccountSettings.EmailChange.Succeeded", "App.AccountSettings.NameChange.Succeeded", "App.AccountSettings.NewTeam.Selected", "App.AccountSettings.NotificationSetting.Changed", "App.AccountSettings.PasswordUpdate.Succeeded", "App.AccountSettings.RemoveAvatar.Succeeded", "App.AccountSettings.SwitchTeams.Selected", "App.AccountSettings.TeamJoin.Selected", "App.AccountSettings.Unsaved.Closed", "App.AccountSettings.UploadAvatar.Succeeded", "App.AccountSettings.Viewed", "App.ApprovedDomains.CreateAccount.Failed", "App.ApprovedDomains.CreateAccount.Submitted", "App.ApprovedDomains.CreateAccount.Succeeded", "App.ApprovedDomains.CreateAccount.Viewed", "App.ApprovedDomains.CreatePassword.Failed", "App.ApprovedDomains.CreatePassword.Submitted", "App.ApprovedDomains.CreatePassword.Succeeded", "App.ApprovedDomains.CreatePassword.Viewed", "App.ApprovedDomains.JoinTeam.Failed", "App.ApprovedDomains.JoinTeam.Succeeded", "App.ApprovedDomains.JoinTeam.Viewed", "App.ApprovedDomains.SelfInvite.Submitted", "App.ApprovedDomains.SelfInvite.Viewed", "App.ApprovedDomains.SignInToContinue.Failed", "App.ApprovedDomains.SignInToContinue.Submitted", "App.ApprovedDomains.SignInToContinue.Succeeded", "App.ApprovedDomains.SignInToContinue.Viewed", "App.ApprovedDomains.UserJoin.Failed", "App.ApprovedDomains.UserJoin.Succeeded", "App.AuditLog.CSV.Downloaded", "App.AuditLog.Viewed", "App.Banner.Actioned", "App.Banner.Dismissed", "App.Banner.Displayed", "App.Banner.Requested", "App.Billing.ActiveUserPopup.Viewed", "App.Billing.BillingHistory.Selected", "App.Billing.BillingPeriodForm.Viewed", "App.Billing.ChangePayment.Selected", "App.Billing.ChangePayment.Succeeded", "App.Billing.Downgrade.Selected", "App.Billing.EnterpriseForm.Submitted", "App.Billing.EnterpriseForm.Viewed", "App.Billing.FairBillingPolicy.Selected ", "App.Billing.InvoicePDF.Selected", "App.Billing.Overview.Viewed", "App.Billing.PaymentForm.Viewed", "App.Billing.PaymentMethod.Viewed", "App.Billing.PlansPage.Viewed", "App.Billing.SelfServeTrial.Started", "App.Billing.Trial.Succeeded", "App.Billing.TrialModal.Viewed", "App.Billing.Upgrade.Failed", "App.Billing.Upgrade.Succeeded", "App.Billing.Upgrade.Viewed", "App.Board.Created", "App.Board.Item.Added", "App.Board.Item.Repositioned", "App.Board.Item.Resized", "App.Board.Item.UploadFailed", "App.Board.Item.Viewed", "App.Board.Zoomed", "App.Console.BuildMode.Viewed", "App.Console.CommentMode.Viewed", "App.Console.Config.BackgroundColorSet", "App.Console.Config.ForegroundColorSet", "App.Console.Config.MobileStatusBarHidden", "App.Console.Config.MobileStatusStyleSet", "App.Console.ExperimentViewed", "App.Console.FixedHeader.Added", "App.Console.HistoryMode.Viewed", "App.Console.Hotspot.Created", "App.Console.Hotspot.Deleted", "App.Console.Hotspot.Template.Applied", "App.Console.Hotspot.Template.Created", "App.Console.InspectMode.Viewed", "App.Console.LoadData.Failed", "App.Console.PlayMode.NavigatedViaHotspot", "App.Console.PlayMode.NavigatedViaKeyboard", "App.Console.PlayMode.NavigationHidden", "App.Console.PlayMode.NavigationShown", "App.Console.PlayMode.SMSSent", "App.Console.PlayMode.Viewed", "App.Conversation.Comment.Added", "App.Conversation.Comment.Deleted", "App.Conversation.Comment.Drafted", "App.Conversation.Comment.Edited", "App.Conversation.Emoji.Menu.Opened", "App.Conversation.Emoji.Menu.Selected", "App.Conversation.Thread.Dragged", "App.Conversation.Thread.MarkAsRead", "App.Conversation.Thread.Opened", "App.Conversation.Thread.Placed", "App.Conversation.Thread.Resolved", "App.Conversation.Thread.Unresolved", "App.Create.Selected", "App.CreateDialog.Closed", "App.CreateDialog.Opened", "App.DesignTool.Clicked", "App.DesignTool.Viewed", "App.Document.Archived", "App.Document.Deleted", "App.Document.Duplicated", "App.Document.Opened", "App.Document.Unarchived", "App.DocViewer.Archived", "App.DocViewer.BuildMode.Opened", "App.DocViewer.CommentMode.Opened", "App.DocViewer.CopyMode.DiscardDialog.Closed", "App.DocViewer.CopyMode.DiscardDialog.Discarded", "App.DocViewer.CopyMode.DiscardDialog.Opened", "App.DocViewer.CopyMode.Loaded", "App.DocViewer.CopyMode.PublishDialog.Closed", "App.DocViewer.CopyMode.PublishDialog.Opened", "App.DocViewer.CopyMode.PublishDialog.Published", "App.DocViewer.CopyMode.Text.Focused", "App.DocViewer.CopyMode.Text.Saved", "App.DocViewer.Deleted", "App.DocViewer.DocLink.Copied", "App.DocViewer.Document.Opened.Error", "App.DocViewer.Document.Opened", "App.DocViewer.Document.UserJoined", "App.DocViewer.ExtraFeatures.Opened", "App.DocViewer.Inspect.AssetDownloaded", "App.DocViewer.Inspect.CloseMotionClicked", "App.DocViewer.Inspect.CollapsedAllGroups", "App.DocViewer.Inspect.ExperimentViewed", "App.DocViewer.Inspect.FeedbackClicked", "App.DocViewer.Inspect.InteractionClicked", "App.DocViewer.Inspect.Interactions.VisibilityToggled", "App.DocViewer.Inspect.ItemCopied", "App.DocViewer.Inspect.LayerClicked", "App.DocViewer.Inspect.LayerPropertiesToggled", "App.DocViewer.Inspect.LayerVisibilityToggled", "App.DocViewer.Inspect.Layout.VisibilityToggled", "App.DocViewer.Inspect.PanelToggled", "App.DocViewer.Inspect.Paywall.UpgradeSelected", "App.DocViewer.Inspect.Paywall.Viewed", "App.DocViewer.Inspect.PlaybackAction", "App.DocViewer.Inspect.PreviewerZoomChanged", "App.DocViewer.Inspect.ScreenInitialized", "App.DocViewer.Inspect.SidebarResized", "App.DocViewer.Inspect.TimelineAction", "App.DocViewer.Inspect.ViewSettingsChanged", "App.DocViewer.Inspect.ViewSettingsClicked", "App.DocViewer.InspectMode.Opened", "App.DocViewer.MyProjects.Opened", "App.DocViewer.PlayMode.AutoHideNavigationDisabled", "App.DocViewer.PlayMode.AutoHideNavigationEnabled", "App.DocViewer.PlayMode.FullScreen.Opened", "App.DocViewer.PlayMode.Hotspot.Clicked", "App.DocViewer.PlayMode.Opened", "App.DocViewer.PlayMode.Paginated", "App.DocViewer.Restored", "App.DocViewer.ScreensOverview.MyProjects.Opened", "App.DocViewer.ScreensOverview.Opened", "App.DocViewer.ScreensOverview.Renamed", "App.DocViewer.ScreensOverview.Search.Entered", "App.DocViewer.ScreensOverview.Search.Typed", "App.DocViewer.ScreensOverview.Thumbnails.Resized", "App.DocViewer.Share.Opened", "App.DocViewer.Shared", "App.DocViewer.SignUp.Clicked", "App.DocViewer.ZoomedIn", "App.DocViewer.ZoomedOut", "App.DocViewer.ZoomReset", "App.DocViewer.ZoomToFit", "App.DSM.AuthenToken.Generated", "App.DSM.AuthenToken.Revoked", "App.DSM.DataExport.DesignLibrary.CSS.Downloaded", "App.DSM.DataExport.DesignLibrary.CSS.Fetched", "App.DSM.DataExport.DesignLibrary.CSS.Link.Copied", "App.DSM.DataExport.DesignLibrary.Data.Downloaded", "App.DSM.DataExport.DesignLibrary.Data.Exported", "App.DSM.DataExport.DesignLibrary.Data.Link.Copied", "App.DSM.DataExport.DesignLibrary.Version.Exported", "App.DSM.DataExport.Icons.Zip.Created", "App.DSM.DataExport.Icons.Zip.Downloaded", "App.DSM.DataExport.Icons.Zip.Link.Copied", "App.DSM.DataExport.Mobile.StyleData.Created", "App.DSM.DataExport.Mobile.StyleData.Downloaded", "App.DSM.DataExport.Mobile.StyleData.Link.Copied", "App.DSM.DesignLibrary.Component.Code.Copied", "App.DSM.DesignLibrary.Component.Knob.Changed", "App.DSM.DesignLibrary.Component.Link.Followed", "App.DSM.DesignLibrary.Component.Story.FullView.Viewed", "App.DSM.DesignLibrary.Component.Story.Viewed", "App.DSM.DesignLibrary.Created", "App.DSM.DesignLibrary.Deleted", "App.DSM.DesignLibrary.Duplicated", "App.DSM.DesignLibrary.Edited", "App.DSM.DesignLibrary.Renamed", "App.DSM.DesignLibrary.Searched", "App.DSM.DesignLibrary.User.Invited", "App.DSM.DesignLibrary.User.Removed", "App.DSM.DesignLibrary.Version.Created", "App.DSM.DesignLibrary.Version.Deleted", "App.DSM.DesignLibrary.Version.Diff", "App.DSM.DesignLibrary.Version.Reverted", "App.DSM.DesignLibrary.Version.Viewed", "App.DSM.DesignLibrary.Versions.Loaded", "App.DSM.DesignLibrary.Viewed", "App.DSM.ExampleLibrary.Opened", "App.DSM.Organization.Created", "App.DSM.Organization.User.Invited", "App.DSM.Organization.User.Removed", "App.Freehand.ClickedAddImage", "App.Freehand.ColorChanged", "App.Freehand.Created", "App.Freehand.DocumentStatsSent", "App.Freehand.Edit.Redone", "App.Freehand.Edit.Undone", "App.Freehand.Element.ChangedColor", "App.Freehand.Element.ChangedFill", "App.Freehand.Element.ChangedOpacity", "App.Freehand.ElementAdded", "App.Freehand.Email.Entered", "App.Freehand.EverythingCleared", "App.Freehand.Exited", "App.Freehand.Help.Closed", "App.Freehand.Help.GetStarted", "App.Freehand.Help.Guide.Closed", "App.Freehand.Help.Guide.Opened", "App.Freehand.Help.SendFeedback", "App.Freehand.Help.Tutorial.Opened", "App.Freehand.Help.WhatsNew.Opened", "App.Freehand.InteractiveOnboarding.Selected", "App.Freehand.Item.Copied", "App.Freehand.Item.Cut", "App.Freehand.Item.Pasted", "App.Freehand.Joined", "App.Freehand.MobileOnboardingCompleted", "App.Freehand.MobileOnboardingShown", "App.Freehand.MobileOnboardingSkipped", "App.Freehand.MobileOnboardingStarted", "App.Freehand.MyDrawingsCleared", "App.Freehand.Object.Deleted", "App.Freehand.Object.Duplicated", "App.Freehand.Object.Erased", "App.Freehand.OnboardingTips.Selected", "App.Freehand.OpacityChanged", "App.Freehand.PresentMode.Ended", "App.Freehand.PresentMode.Started", "App.Freehand.ShapeMenu.Selected", "App.Freehand.ShareDialog.Closed", "App.Freehand.ShareDialog.Opened", "App.Freehand.Shortcuts.Hidden", "App.Freehand.Shortcuts.Hidden", "App.Freehand.Shortcuts.Shown", "App.Freehand.Sideguide.Closed", "App.Freehand.Sideguide.Opened", "App.Freehand.SideguideTip.Shown", "App.Freehand.Text.Formatted", "App.Freehand.TextBox.Modified", "App.Freehand.Tools.SelectedShape", "App.Freehand.ToolSelected", "App.Freehand.User.Followed", "App.Freehand.User.Unfollowed", "App.Freehand.UsersPerSessionSent", "App.Freehand.ZoomedIn", "App.Freehand.ZoomedOut", "App.Freehand.ZoomedToFit", "App.Freehand.ZoomReset", "App.GlobalSignIn.ForgotPassword.Failed", "App.GlobalSignIn.ForgotPassword.Submitted", "App.GlobalSignIn.ForgotPassword.Succeeded", "App.GlobalSignIn.ForgotPassword.Viewed", "App.GlobalSignIn.GetStarted.Selected", "App.GlobalSignIn.Home.Selected", "App.GlobalSignIn.ResetPassword.Failed", "App.GlobalSignIn.ResetPassword.Submitted", "App.GlobalSignIn.ResetPassword.Succeeded", "App.GlobalSignIn.ResetPassword.Viewed", "App.GlobalSignIn.ScheduleADemo.Selected", "App.GlobalSignIn.SignIn.Failed", "App.GlobalSignIn.SignIn.Submitted", "App.GlobalSignIn.SignIn.Succeeded", "App.GlobalSignIn.SignIn.Viewed", "App.Home.AccountDropdown.Opened", "App.Home.Bottom.Viewed", "App.Home.Document.Added", "App.Home.EmptyState.Selected", "App.Home.Favorites.Opened", "App.Home.Filtered", "App.Home.Link.Clicked", "App.Home.Mobile.Warning.Dismissed", "App.Home.Mobile.Warning.Downloaded", "App.Home.Opened", "App.Home.Pagination.Clicked", "App.Home.Recent.Opened", "App.Home.Spaces.Opened", "App.Home.StartDesignTool.Clicked", "App.Inbox.Bell.Selected", "App.Inbox.CommentList.BackButton.Selected", "App.Inbox.CommentList.Comment.Selected", "App.Inbox.CommentList.Filter.Selected", "App.Inbox.CommentList.Thread.MarkedAsRead", "App.Inbox.DocumentList.Document.Selected", "App.Inbox.DocumentList.SpaceToggle.Selected", "App.Inbox.Load.Failed", "App.Inspect.AssetClicked", "App.Inspect.AssetDownloaded", "App.Inspect.AssetSectionClicked", "App.Inspect.CollapsedAllGroups", "App.Inspect.ColorPicked", "App.Inspect.CraftSync.Video.Clicked", "App.Inspect.DSM.CodeLinkClicked", "App.Inspect.DSM.ExternalLinkClicked", "App.Inspect.DSM.LibrarySelected", "App.Inspect.DSM.LinkClicked", "App.Inspect.GridRulerToggled", "App.Inspect.GridToggled", "App.Inspect.ItemCopied", "App.Inspect.LayerClicked", "App.Inspect.PanelToggled", "App.Inspect.Paywall.UpgradeSelected", "App.Inspect.Paywall.Viewed", "App.Inspect.Screen.Loaded", "App.Inspect.SettingsChanged", "App.Inspect.SettingsClicked", "App.Inspect.TabSelected", "App.Inspect.ToolActivated", "App.Inspect.Zoomed", "App.Integrations.Home.Card.Selected", "App.Integrations.Home.Page.Viewed", "App.Integrations.Slack.Channel.Added", "App.Integrations.Slack.Integration.Created", "App.Integrations.Slack.Integration.Deleted", "App.Integrations.Slack.Integration.Updated", "App.Integrations.Slack.Notification.Sent", "App.Integrations.Slack.Page.Viewed", "App.Integrations.Slack.Workspace.Added", "App.JoinDocument.CreateAccount.Failed", "App.JoinDocument.CreateAccount.Submitted", "App.JoinDocument.CreateAccount.Succeeded", "App.JoinDocument.CreateAccount.Viewed", "App.JoinDocument.CreatePassword.Failed", "App.JoinDocument.CreatePassword.Submitted", "App.JoinDocument.CreatePassword.Succeeded", "App.JoinDocument.CreatePassword.Viewed", "App.JoinDocument.EnterEmail.Failed", "App.JoinDocument.EnterEmail.Submitted", "App.JoinDocument.EnterEmail.Succeeded", "App.JoinDocument.EnterEmail.Viewed", "App.JoinDocument.SignInToContinue.Failed", "App.JoinDocument.SignInToContinue.Submitted", "App.JoinDocument.SignInToContinue.Succeeded", "App.JoinDocument.SignInToContinue.Viewed", "App.JoinDocument.UserJoin.Failed", "App.JoinDocument.UserJoin.Succeeded", "App.JoinDocument.VerifyEmail.Submitted", "App.JoinDocument.VerifyEmail.Viewed", "App.Navigation.AccountDropdown.Opened", "App.Navigation.Link.Clicked", "App.Navigation.ResourcesDropdown.Link.Clicked", "App.Navigation.SecondaryNav.Selected", "App.Onboarding.ExperimentViewed", "App.Onboarding.JobsToBeDoneSurvey.Completed", "App.Onboarding.JobsToBeDoneSurvey.Skipped", "App.Onboarding.JobsToBeDoneTiles.Viewed", "App.Onboarding.Step.Closed", "App.Onboarding.Step.Opened", "App.Onboarding.Step.Started", "App.Onboarding.Tour.Completed", "App.Onboarding.Tour.Skipped", "App.Onboarding.Tour.Started", "App.Paywall.Actioned", "App.Paywall.Dismissed", "App.Paywall.Displayed", "App.Paywall.Requested", "App.PeopleMgmt.Invite.Closed", "App.PeopleMgmt.Invite.Failed", "App.PeopleMgmt.Invite.Selected", "App.PeopleMgmt.Invite.Submitted", "App.PeopleMgmt.Invite.Viewed", "App.PeopleMgmt.InviteBack.Selected", "App.PeopleMgmt.InviteConfirm.Closed ", "App.PeopleMgmt.InviteRemoved.Selected", "App.PeopleMgmt.InviteRoleToAdmin.Selected", "App.PeopleMgmt.InviteRoleToGuest.Selected", "App.PeopleMgmt.InviteRoleToOwner.Selected", "App.PeopleMgmt.PeopleSearch.Selected", "App.PeopleMgmt.RemovedUserInvite.Selected", "App.PeopleMgmt.RemoveInvitedUser.Succeeded", "App.PeopleMgmt.ResendInvite.Failed", "App.PeopleMgmt.ResendInvite.Selected", "App.PeopleMgmt.Role.Changed", "App.PeopleMgmt.Tab.Viewed", "App.PeopleMgmt.TransferPrimaryOwnership.Failed", "App.PeopleMgmt.TransferPrimaryOwnership.Succeeded", "App.PeopleMgmt.UserRemoved.Succeeded", "App.Prototype.AddScreens.Selected", "App.Prototype.AddScreens.Viewed", "App.Prototype.Archived", "App.Prototype.Deleted", "App.Prototype.DeviceType.Modified", "App.Prototype.ExperimentViewed", "App.Prototype.Restored", "App.Prototype.Screen.Added", "App.Prototype.Screen.Archived", "App.Prototype.Screen.Deleted", "App.Prototype.Screen.Filename.Renamed", "App.Prototype.Screen.Rearranged", "App.Prototype.Screen.Replaced", "App.Prototype.Screen.Restored", "App.Prototype.Screen.Searched", "App.Prototype.Screen.SectionAdded", "App.Prototype.Screen.SectionDeleted", "App.Prototype.Screen.SizeAdjusted", "App.Prototype.Screen.Upload.Completed", "App.Prototype.Screen.Upload.Exceeded", "App.Prototype.Screen.Upload.FileChooser.Opened", "App.Prototype.Screen.Upload.Initiated", "App.Prototype.Viewed", "App.PublicShare.PasswordGate.Submitted", "App.PublicShare.PasswordGate.Viewed", "App.QuickLink.AddMenu.Selected", "App.QuickLink.Collapsed", "App.QuickLink.Created", "App.QuickLink.Deleted", "App.QuickLink.Edited", "App.QuickLink.Expanded", "App.QuickLink.Opened", "App.Rhombus.Comment.Submitted", "App.Rhombus.Created", "App.Rhombus.Doc.Followed", "App.Rhombus.Doc.Unfollowed", "App.Rhombus.Embed.AccessRequested", "App.Rhombus.Embed.Added", "App.Rhombus.Embed.ClosedFullScreen", "App.Rhombus.Embed.Collapsed", "App.Rhombus.Embed.Deleted", "App.Rhombus.Embed.Downloaded", "App.Rhombus.Embed.Expanded", "App.Rhombus.Embed.ExpandedFullScreen", "App.Rhombus.Embed.Interacted", "App.Rhombus.Embed.OpenedinNewTab", "App.Rhombus.Embed.Paginated", "App.Rhombus.Embed.Resized", "App.Rhombus.PlusButton.Clicked", "App.Rhombus.Rearranged", "App.Rhombus.SSOExpirationMessagePresented", "App.Rhombus.SSOLoginStatusChecked", "App.Rhombus.TextStyle.Adjusted", "App.Rhombus.User.Mentioned", "App.Rhombus.Viewed", "App.RUM.ErrorRecorded", "App.RUM.NetworkRequestRecorded", "App.RUM.SPALoadTimingRecorded", "App.RUM.UserAssetTimingRecorded", "App.Search.Opened", "App.Search.Result.Opened", "App.SearchFilter.Opened", "App.SearchFilter.Started", "App.Share.ErrorOccurred", "App.Share.Viewed", "App.ShareDialog.AccessMenu.Modified", "App.ShareDialog.AccessMenu.Removed", "App.ShareDialog.Closed", "App.ShareDialog.ExistingTeammateInvite.Sent", "App.ShareDialog.Invite.Sent", "App.ShareDialog.InviteEntry.ResultShown", "App.ShareDialog.Link.Copied", "App.ShareDialog.Link.SettingsViewed", "App.ShareDialog.ManageSharingSettings.Closed", "App.ShareDialog.ManageSharingSettings.Saved", "App.ShareDialog.ManageSharingSettings.Viewed", "App.ShareDialog.NewTeammateInvite.Canceled", "App.ShareDialog.NewTeammateInvite.Closed", "App.ShareDialog.NewTeammateInvite.Sent", "App.ShareDialog.NewTeammateInvite.Viewed", "App.ShareDialog.Opened", "App.ShareDialog.PublicLink.Canceled", "App.ShareDialog.PublicLink.Closed", "App.ShareDialog.PublicLink.Copied", "App.ShareDialog.PublicLink.Created", "App.ShareDialog.PublicLink.Deleted", "App.ShareDialog.PublicLink.PasswordCreated", "App.ShareDialog.PublicLink.Settings.Changed", "App.ShareDialog.Settings.Changed", "App.ShareDialog.Space.Selected", "App.ShareDialog.Space.Settings.Changed", "App.ShareDialog.Tab.Link.Selected", "App.ShareDialog.Tab.MembersAndGuests.Viewed", "App.ShareDialog.Tab.Public.Viewed", "App.Signin.Failed", "App.Signin.ForgotPassword.Selected", "App.Signin.GetStarted.Selected", "App.Signin.Home.Selected", "App.Signin.KnowYourDomain.Selected", "App.Signin.LookingForInVision.Viewed", "App.Signin.Redirected", "App.Signin.ScheduleADemo.Selected", "App.Signin.Submitted", "App.Signin.Succeeded", "App.Signin.TeamSelector.Joinable.Selected", "App.Signin.TeamSelector.LoadMore.Selected", "App.Signin.TeamSelector.RefreshList.Selected", "App.Signin.TeamSelector.Team.Selected", "App.Signin.TeamSelector.Viewed", "App.Signin.Viewed", "App.Signup.EmailVerification.Failed", "App.Signup.EmailVerification.ResendCode.Selected", "App.Signup.EmailVerification.Succeeded", "App.Signup.EmailVerification.Viewed", "App.Signup.EnableApprovedDomains.Submitted", "App.Signup.EnableApprovedDomains.URLCopied", "App.Signup.EnableApprovedDomains.Viewed", "App.Signup.Failed", "App.Signup.Form.Submitted", "App.Signup.Form.Viewed", "App.Signup.Home.Selected", "App.Signup.Invites.Sent", "App.Signup.SelectATeam.Viewed", "App.Signup.SignIn.Selected", "App.Signup.Succeeded", "App.Signup.Team.Created", "App.Signup.TermsOfService.Selected", "App.Signup.User.Created", "App.Space.AddExisting.BatchAdded", "App.Space.AddExisting.Document.Added", "App.Space.AddExisting.Document.Removed", "App.Space.AddExisting.Opened", "App.Space.Created", "App.Space.Customize.Color", "App.Space.Deleted", "App.Space.Description.Edit.Clicked", "App.Space.Description.Edit.Saved", "App.Space.DescriptionLink.Clicked", "App.Space.Document.Added", "App.Space.Document.Moved", "App.Space.Document.Removed", "App.Space.Opened", "App.Space.Search.Entered", "App.Space.Search.Typed", "App.Space.Viewed", "App.Spaces.Filtered", "App.Spaces.Sorted", "App.Team.Created", "App.Team.Invites.Sent", "App.TeamSettings.Link.Clicked", "App.TeamSettings.OpenEnrollment.Updated", "App.TeamSettings.OpenEnrollment.Viewed", "App.TeamSettings.Passwords.Closed", "App.TeamSettings.Passwords.Failed", "App.TeamSettings.Passwords.Updated", "App.TeamSettings.Passwords.Viewed", "App.TeamSettings.PrincipalSettings.Closed", "App.TeamSettings.PrincipalSettings.Failed", "App.TeamSettings.PrincipalSettings.Viewed", "App.TeamSettings.PrincipalSettingsDomain.Succeeded", "App.TeamSettings.PrincipalSettingsName.Succeeded", "App.TeamSettings.ScheduleEnterpriseDemo.Selected", "App.TeamSettings.ScheduleEnterpriseTrial.Selected", "App.TeamSettings.SCIMSetting.Closed", "App.TeamSettings.SCIMSetting.Failed", "App.TeamSettings.SCIMSetting.TokenReset", "App.TeamSettings.SCIMSetting.Updated", "App.TeamSettings.SCIMSetting.Viewed", "App.TeamSettings.SSOSetting.Closed", "App.TeamSettings.SSOSetting.Failed", "App.TeamSettings.SSOSetting.Updated", "App.TeamSettings.SSOSetting.Viewed", "App.TeamSettings.TeamIcon.Closed", "App.TeamSettings.TeamIcon.Failed", "App.TeamSettings.TeamIcon.Viewed", "App.TeamSettings.TeamIconRemoved.Succeeded", "App.TeamSettings.TeamIconReplacement.Succeeded", "App.TeamSettings.TeamIconUpload.Succeeded", "App.TeamSettings.TimingOut.Closed", "App.TeamSettings.TimingOut.Failed", "App.TeamSettings.TimingOut.Succeeded", "App.TeamSettings.TimingOut.Viewed", "App.TeamSettings.Viewed", "App.TeamSharingSettings.Captured", "App.TeamSharingSettings.Closed", "App.TeamSharingSettings.ConfirmationModal.Canceled", "App.TeamSharingSettings.ConfirmationModal.Continued", "App.TeamSharingSettings.ConfirmationModal.Viewed", "App.TeamSharingSettings.Update.Selected", "App.TeamSharingSettings.UpgradeBlocker.Selected", "App.TeamSignin.Failed", "App.TeamSignIn.ForgotPassword.Failed", "App.TeamSignIn.ForgotPassword.Submitted", "App.TeamSignIn.ForgotPassword.Succeeded", "App.TeamSignIn.ForgotPassword.Viewed", "App.TeamSignIn.ResetPassword.Failed", "App.TeamSignIn.ResetPassword.Submitted", "App.TeamSignIn.ResetPassword.Succeeded", "App.TeamSignIn.ResetPassword.Viewed", "App.TeamSignIn.SignIn.Failed", "App.TeamSignIn.SignIn.Submitted", "App.TeamSignIn.SignIn.Succeeded", "App.TeamSignIn.SignIn.Viewed", "App.TeamSignin.Submitted", "App.TeamSignin.Succeeded", "App.TeamSignin.Viewed", "App.TestEvent", "App.UpgradeNow.Clicked", "Confluence.Attachment.Changed", "Confluence.Attachment.Resized", "Confluence.Attachment.Viewed", "Confluence.Installation.Changed", "Confluence.Link.Clicked", "Conv.JoinDocument.CreateAccount.Failed", "Conv.JoinDocument.CreateAccount.Submitted", "Conv.JoinDocument.CreateAccount.Succeeded", "Conv.JoinDocument.CreateAccount.Viewed", "Conv.JoinDocument.CreatePassword.Failed", "Conv.JoinDocument.CreatePassword.Submitted", "Conv.JoinDocument.CreatePassword.Succeeded", "Conv.JoinDocument.CreatePassword.Viewed", "Conv.JoinDocument.EnterEmail.Submitted", "Conv.JoinDocument.EnterEmail.Viewed", "Conv.JoinDocument.SignInToContinue.Failed", "Conv.JoinDocument.SignInToContinue.Submitted", "Conv.JoinDocument.SignInToContinue.Succeeded", "Conv.JoinDocument.SignInToContinue.Viewed", "Conv.JoinDocument.UserJoin.Failed", "Conv.JoinDocument.UserJoin.Succeeded", "Conv.JoinDocument.VerifyEmail.Submitted", "Conv.JoinDocument.VerifyEmail.Viewed", "Conv.PublicLink.CreateAccount.Failed", "Conv.PublicLink.CreateAccount.Submitted", "Conv.PublicLink.CreateAccount.Succeeded", "Conv.PublicLink.CreateAccount.Viewed", "Conv.PublicLink.CreatePassword.Failed", "Conv.PublicLink.CreatePassword.Submitted", "Conv.PublicLink.CreatePassword.Succeeded", "Conv.PublicLink.CreatePassword.Viewed", "Conv.PublicLink.EnterEmail.Failed", "Conv.PublicLink.EnterEmail.Submitted", "Conv.PublicLink.EnterEmail.Succeeded", "Conv.PublicLink.EnterEmail.Viewed", "Conv.PublicLink.SignInToContinue.Failed", "Conv.PublicLink.SignInToContinue.Submitted", "Conv.PublicLink.SignInToContinue.Succeeded", "Conv.PublicLink.SignInToContinue.Viewed", "Conv.PublicLink.VerifyEmail.Failed", "Conv.PublicLink.VerifyEmail.Submitted", "Conv.PublicLink.VerifyEmail.Succeeded", "Conv.PublicLink.VerifyEmail.Viewed", "Craft.AcceptInvite.Form.Submitted", "Craft.AcceptInvite.User.Created", "Craft.ApprovedDomains.JoinTeam.Failed", "Craft.ApprovedDomains.JoinTeam.Succeeded", "Craft.ApprovedDomains.JoinTeam.Viewed", "Craft.ApprovedDomains.SelfInvite.Submitted", "Craft.ApprovedDomains.SelfInvite.Viewed", "Craft.GlobalSignIn.ForgotPassword.Failed", "Craft.GlobalSignIn.ForgotPassword.Submitted", "Craft.GlobalSignIn.ForgotPassword.Succeeded", "Craft.GlobalSignIn.ForgotPassword.Viewed", "Craft.GlobalSignIn.GetStarted.Selected", "Craft.GlobalSignIn.Home.Selected", "Craft.GlobalSignIn.ScheduleADemo.Selected", "Craft.GlobalSignIn.SignIn.Failed", "Craft.GlobalSignIn.SignIn.Submitted", "Craft.GlobalSignIn.SignIn.Succeeded", "Craft.GlobalSignIn.SignIn.Viewed", "Craft.Signin.Failed", "Craft.Signin.ForgotPassword.Selected", "Craft.Signin.GetStarted.Selected", "Craft.Signin.Home.Selected", "Craft.Signin.KnowYourDomain.Selected", "Craft.Signin.LookingForInVision.Viewed", "Craft.Signin.Redirected", "Craft.Signin.ScheduleADemo.Selected", "Craft.Signin.Submitted", "Craft.Signin.Succeeded", "Craft.Signin.TeamSelector.Joinable.Selected", "Craft.Signin.TeamSelector.LoadMore.Selected", "Craft.Signin.TeamSelector.RefreshList.Selected", "Craft.Signin.TeamSelector.Team.Selected", "Craft.Signin.TeamSelector.Viewed", "Craft.Signin.Viewed", "Craft.Signup.EmailVerification.Failed", "Craft.Signup.EmailVerification.ResendCode.Selected", "Craft.Signup.EmailVerification.Succeeded", "Craft.Signup.EmailVerification.Viewed", "Craft.Signup.EnableApprovedDomains.Submitted", "Craft.Signup.EnableApprovedDomains.URLCopied", "Craft.Signup.EnableApprovedDomains.Viewed", "Craft.Signup.Failed", "Craft.Signup.Form.Submitted", "Craft.Signup.Form.Viewed", "Craft.Signup.Home.Selected", "Craft.Signup.Invites.Sent", "Craft.Signup.SelectATeam.Viewed", "Craft.Signup.SignIn.Selected", "Craft.Signup.Succeeded", "Craft.Signup.Team.Created", "Craft.Signup.TermsOfService.Selected", "Craft.Signup.User.Created", "Craft.TeamSignin.Failed", "Craft.TeamSignIn.ForgotPassword.Failed", "Craft.TeamSignIn.ForgotPassword.Submitted", "Craft.TeamSignIn.ForgotPassword.Succeeded", "Craft.TeamSignIn.ForgotPassword.Viewed", "Craft.TeamSignIn.SignIn.Failed", "Craft.TeamSignIn.SignIn.Submitted", "Craft.TeamSignIn.SignIn.Succeeded", "Craft.TeamSignIn.SignIn.Viewed", "Craft.TeamSignin.Submitted", "Craft.TeamSignin.Succeeded", "Craft.TeamSignin.Viewed", "IFI.AcceptInvite.Form.Submitted", "IFI.AcceptInvite.User.Created", "IFI.ApprovedDomains.JoinTeam.Failed", "IFI.ApprovedDomains.JoinTeam.Succeeded", "IFI.ApprovedDomains.JoinTeam.Viewed", "IFI.ApprovedDomains.SelfInvite.Submitted", "IFI.ApprovedDomains.SelfInvite.Viewed", "IFI.GlobalSignIn.ForgotPassword.Failed", "IFI.GlobalSignIn.ForgotPassword.Submitted", "IFI.GlobalSignIn.ForgotPassword.Succeeded", "IFI.GlobalSignIn.ForgotPassword.Viewed", "IFI.GlobalSignIn.GetStarted.Selected", "IFI.GlobalSignIn.Home.Selected", "IFI.GlobalSignIn.ScheduleADemo.Selected", "IFI.GlobalSignIn.SignIn.Failed", "IFI.GlobalSignIn.SignIn.Submitted", "IFI.GlobalSignIn.SignIn.Succeeded", "IFI.GlobalSignIn.SignIn.Viewed", "IFI.Signin.Failed", "IFI.Signin.ForgotPassword.Selected", "IFI.Signin.GetStarted.Selected", "IFI.Signin.Home.Selected", "IFI.Signin.KnowYourDomain.Selected", "IFI.Signin.LookingForInVision.Viewed", "IFI.Signin.Redirected", "IFI.Signin.ScheduleADemo.Selected", "IFI.Signin.Submitted", "IFI.Signin.Succeeded", "IFI.Signin.TeamSelector.Joinable.Selected", "IFI.Signin.TeamSelector.LoadMore.Selected", "IFI.Signin.TeamSelector.RefreshList.Selected", "IFI.Signin.TeamSelector.Team.Selected", "IFI.Signin.TeamSelector.Viewed", "IFI.Signin.Viewed", "IFI.Signup.EmailVerification.Failed", "IFI.Signup.EmailVerification.ResendCode.Selected", "IFI.Signup.EmailVerification.Succeeded", "IFI.Signup.EmailVerification.Viewed", "IFI.Signup.EnableApprovedDomains.Submitted", "IFI.Signup.EnableApprovedDomains.URLCopied", "IFI.Signup.EnableApprovedDomains.Viewed", "IFI.Signup.Failed", "IFI.Signup.Form.Submitted", "IFI.Signup.Form.Viewed", "IFI.Signup.Home.Selected", "IFI.Signup.Invites.Sent", "IFI.Signup.SelectATeam.Viewed", "IFI.Signup.SignIn.Selected", "IFI.Signup.Succeeded", "IFI.Signup.Team.Created", "IFI.Signup.TermsOfService.Selected", "IFI.Signup.User.Created", "IFI.TeamSignin.Failed", "IFI.TeamSignIn.ForgotPassword.Failed", "IFI.TeamSignIn.ForgotPassword.Submitted", "IFI.TeamSignIn.ForgotPassword.Succeeded", "IFI.TeamSignIn.ForgotPassword.Viewed", "IFI.TeamSignIn.SignIn.Failed", "IFI.TeamSignIn.SignIn.Submitted", "IFI.TeamSignIn.SignIn.Succeeded", "IFI.TeamSignIn.SignIn.Viewed", "IFI.TeamSignin.Submitted", "IFI.TeamSignin.Succeeded", "IFI.TeamSignin.Viewed", "IMA.AcceptInvite.Form.Submitted", "IMA.AcceptInvite.User.Created", "IMA.ApprovedDomains.JoinTeam.Failed", "IMA.ApprovedDomains.JoinTeam.Succeeded", "IMA.ApprovedDomains.JoinTeam.Viewed", "IMA.ApprovedDomains.SelfInvite.Submitted", "IMA.ApprovedDomains.SelfInvite.Viewed", "IMA.GlobalSignIn.ForgotPassword.Failed", "IMA.GlobalSignIn.ForgotPassword.Submitted", "IMA.GlobalSignIn.ForgotPassword.Succeeded", "IMA.GlobalSignIn.ForgotPassword.Viewed", "IMA.GlobalSignIn.GetStarted.Selected", "IMA.GlobalSignIn.Home.Selected", "IMA.GlobalSignIn.ScheduleADemo.Selected", "IMA.GlobalSignIn.SignIn.Failed", "IMA.GlobalSignIn.SignIn.Submitted", "IMA.GlobalSignIn.SignIn.Succeeded", "IMA.GlobalSignIn.SignIn.Viewed", "IMA.Signin.Failed", "IMA.Signin.ForgotPassword.Selected", "IMA.Signin.GetStarted.Selected", "IMA.Signin.Home.Selected", "IMA.Signin.KnowYourDomain.Selected", "IMA.Signin.LookingForInVision.Viewed", "IMA.Signin.Redirected", "IMA.Signin.ScheduleADemo.Selected", "IMA.Signin.Submitted", "IMA.Signin.Succeeded", "IMA.Signin.TeamSelector.Joinable.Selected", "IMA.Signin.TeamSelector.LoadMore.Selected", "IMA.Signin.TeamSelector.RefreshList.Selected", "IMA.Signin.TeamSelector.Team.Selected", "IMA.Signin.TeamSelector.Viewed", "IMA.Signin.Viewed", "IMA.Signup.EmailVerification.Failed", "IMA.Signup.EmailVerification.ResendCode.Selected", "IMA.Signup.EmailVerification.Succeeded", "IMA.Signup.EmailVerification.Viewed", "IMA.Signup.EnableApprovedDomains.Submitted", "IMA.Signup.EnableApprovedDomains.URLCopied", "IMA.Signup.EnableApprovedDomains.Viewed", "IMA.Signup.Failed", "IMA.Signup.Form.Submitted", "IMA.Signup.Form.Viewed", "IMA.Signup.Home.Selected", "IMA.Signup.Invites.Sent", "IMA.Signup.SelectATeam.Viewed", "IMA.Signup.SignIn.Selected", "IMA.Signup.Succeeded", "IMA.Signup.Team.Created", "IMA.Signup.TermsOfService.Selected", "IMA.Signup.User.Created", "IMA.TeamSignin.Failed", "IMA.TeamSignIn.ForgotPassword.Failed", "IMA.TeamSignIn.ForgotPassword.Submitted", "IMA.TeamSignIn.ForgotPassword.Succeeded", "IMA.TeamSignIn.ForgotPassword.Viewed", "IMA.TeamSignIn.SignIn.Failed", "IMA.TeamSignIn.SignIn.Submitted", "IMA.TeamSignIn.SignIn.Succeeded", "IMA.TeamSignIn.SignIn.Viewed", "IMA.TeamSignin.Submitted", "IMA.TeamSignin.Succeeded", "IMA.TeamSignin.Viewed", "IMI.AcceptInvite.Form.Submitted", "IMI.AcceptInvite.User.Created", "IMI.ApprovedDomains.JoinTeam.Failed", "IMI.ApprovedDomains.JoinTeam.Succeeded", "IMI.ApprovedDomains.JoinTeam.Viewed", "IMI.ApprovedDomains.SelfInvite.Submitted", "IMI.ApprovedDomains.SelfInvite.Viewed", "IMI.GlobalSignIn.ForgotPassword.Failed", "IMI.GlobalSignIn.ForgotPassword.Submitted", "IMI.GlobalSignIn.ForgotPassword.Succeeded", "IMI.GlobalSignIn.ForgotPassword.Viewed", "IMI.GlobalSignIn.GetStarted.Selected", "IMI.GlobalSignIn.Home.Selected", "IMI.GlobalSignIn.ScheduleADemo.Selected", "IMI.GlobalSignIn.SignIn.Failed", "IMI.GlobalSignIn.SignIn.Submitted", "IMI.GlobalSignIn.SignIn.Succeeded", "IMI.GlobalSignIn.SignIn.Viewed", "IMI.Signin.Failed", "IMI.Signin.ForgotPassword.Selected", "IMI.Signin.GetStarted.Selected", "IMI.Signin.Home.Selected", "IMI.Signin.KnowYourDomain.Selected", "IMI.Signin.LookingForInVision.Viewed", "IMI.Signin.Redirected", "IMI.Signin.ScheduleADemo.Selected", "IMI.Signin.Submitted", "IMI.Signin.Succeeded", "IMI.Signin.TeamSelector.Joinable.Selected", "IMI.Signin.TeamSelector.LoadMore.Selected", "IMI.Signin.TeamSelector.RefreshList.Selected", "IMI.Signin.TeamSelector.Team.Selected", "IMI.Signin.TeamSelector.Viewed", "IMI.Signin.Viewed", "IMI.Signup.EmailVerification.Failed", "IMI.Signup.EmailVerification.ResendCode.Selected", "IMI.Signup.EmailVerification.Succeeded", "IMI.Signup.EmailVerification.Viewed", "IMI.Signup.EnableApprovedDomains.Submitted", "IMI.Signup.EnableApprovedDomains.URLCopied", "IMI.Signup.EnableApprovedDomains.Viewed", "IMI.Signup.Failed", "IMI.Signup.Form.Submitted", "IMI.Signup.Form.Viewed", "IMI.Signup.Home.Selected", "IMI.Signup.Invites.Sent", "IMI.Signup.SelectATeam.Viewed", "IMI.Signup.SignIn.Selected", "IMI.Signup.Succeeded", "IMI.Signup.Team.Created", "IMI.Signup.TermsOfService.Selected", "IMI.Signup.User.Created", "IMI.TeamSignin.Failed", "IMI.TeamSignIn.ForgotPassword.Failed", "IMI.TeamSignIn.ForgotPassword.Submitted", "IMI.TeamSignIn.ForgotPassword.Succeeded", "IMI.TeamSignIn.ForgotPassword.Viewed", "IMI.TeamSignIn.SignIn.Failed", "IMI.TeamSignIn.SignIn.Submitted", "IMI.TeamSignIn.SignIn.Succeeded", "IMI.TeamSignIn.SignIn.Viewed", "IMI.TeamSignin.Submitted", "IMI.TeamSignin.Succeeded", "IMI.TeamSignin.Viewed", "Jira.Attachment.Changed", "Jira.Attachment.Details.Viewed", "Jira.Attachment.Viewed", "Jira.Installation.Changed", "Jira.Link.Clicked", "Jira.Modal.Opened", "Sketch.DSM.Analytics.Unload", "Sketch.DSM.Color.Dropped", "Sketch.DSM.DesignLibrary.Edited", "Sketch.DSM.DesignLibrary.Searched", "Sketch.DSM.DesignLibrary.Version.Created", "Sketch.DSM.DesignLibrary.Version.Viewed", "Sketch.DSM.DesignLibrary.Viewed", "Sketch.DSM.ExampleLibrary.Opened", "Sketch.DSM.Image.Dropped", "Sketch.DSM.Layer.Color.Set", "Sketch.DSM.Layer.Dropped", "Sketch.DSM.Layer.Style.Set", "Sketch.DSM.LayerStyle.Dropped", "Sketch.DSM.LeftPane.Adjusted", "Sketch.DSM.Organization.Created", "Sketch.DSM.StyleData.Imported", "Sketch.DSM.StyleData.Updated", "Sketch.DSM.Text.Dropped", "Sketch.DSM.TypographyStyle.Set", "Studio.AcceptInvite.Form.Submitted", "Studio.AcceptInvite.User.Created", "Studio.ApprovedDomains.JoinTeam.Failed", "Studio.ApprovedDomains.JoinTeam.Succeeded", "Studio.ApprovedDomains.JoinTeam.Viewed", "Studio.ApprovedDomains.SelfInvite.Submitted", "Studio.ApprovedDomains.SelfInvite.Viewed", "Studio.GlobalSignIn.ForgotPassword.Failed", "Studio.GlobalSignIn.ForgotPassword.Submitted", "Studio.GlobalSignIn.ForgotPassword.Succeeded", "Studio.GlobalSignIn.ForgotPassword.Viewed", "Studio.GlobalSignIn.GetStarted.Selected", "Studio.GlobalSignIn.Home.Selected", "Studio.GlobalSignIn.ScheduleADemo.Selected", "Studio.GlobalSignIn.SignIn.Failed", "Studio.GlobalSignIn.SignIn.Submitted", "Studio.GlobalSignIn.SignIn.Succeeded", "Studio.GlobalSignIn.SignIn.Viewed", "Studio.Signin.Failed", "Studio.Signin.ForgotPassword.Selected", "Studio.Signin.GetStarted.Selected", "Studio.Signin.Home.Selected", "Studio.Signin.KnowYourDomain.Selected", "Studio.Signin.LookingForInVision.Viewed", "Studio.Signin.Redirected", "Studio.Signin.ScheduleADemo.Selected", "Studio.Signin.Submitted", "Studio.Signin.Succeeded", "Studio.Signin.TeamSelector.Joinable.Selected", "Studio.Signin.TeamSelector.LoadMore.Selected", "Studio.Signin.TeamSelector.RefreshList.Selected", "Studio.Signin.TeamSelector.Team.Selected", "Studio.Signin.TeamSelector.Viewed", "Studio.Signin.Viewed", "Studio.Signup.EmailVerification.Failed", "Studio.Signup.EmailVerification.ResendCode.Selected", "Studio.Signup.EmailVerification.Succeeded", "Studio.Signup.EmailVerification.Viewed", "Studio.Signup.EnableApprovedDomains.Submitted", "Studio.Signup.EnableApprovedDomains.URLCopied", "Studio.Signup.EnableApprovedDomains.Viewed", "Studio.Signup.Failed", "Studio.Signup.Form.Submitted", "Studio.Signup.Form.Viewed", "Studio.Signup.Home.Selected", "Studio.Signup.Invites.Sent", "Studio.Signup.SelectATeam.Viewed", "Studio.Signup.SignIn.Selected", "Studio.Signup.Succeeded", "Studio.Signup.Team.Created", "Studio.Signup.TermsOfService.Selected", "Studio.Signup.User.Created", "Studio.TeamSignin.Failed", "Studio.TeamSignIn.ForgotPassword.Failed", "Studio.TeamSignIn.ForgotPassword.Submitted", "Studio.TeamSignIn.ForgotPassword.Succeeded", "Studio.TeamSignIn.ForgotPassword.Viewed", "Studio.TeamSignIn.SignIn.Failed", "Studio.TeamSignIn.SignIn.Submitted", "Studio.TeamSignIn.SignIn.Succeeded", "Studio.TeamSignIn.SignIn.Viewed", "Studio.TeamSignin.Submitted", "Studio.TeamSignin.Succeeded", "Studio.TeamSignin.Viewed", "Trello.Attachment.Changed", "Trello.Attachment.Viewed", "Trello.CardCover.Changed", "Trello.Link.Clicked", "Trello.Powerup.Installed"];
  Object.values(emap).forEach(function (e) {
    allowlist.push(e.name);
  });

  measure.allowlist = function () {
    return allowlist;
  };

  measure.identifyUser = function (callback) {
    callback = callback || function () {};

    var request = new window.XMLHttpRequest(); // We queue events until this request completes, so we want a timeout
    // that will allow the request to return but isn't so long that users
    // might potentially leave the page before the events fire.
    //
    // Based on New Relic data for MT, we're averaging ~285ms for calls to
    // /measure/traits with standard deviation of ~385ms. Request RTT for
    // the 95th percentile is ~636ms and for the 99th percentile is ~1216ms.

    var timeout = 1300; // We use inline closure to get our user-supplied callback into scope for the
    // inner callback.

    request.onreadystatechange = function (callback) {
      return function () {
        if (this.readyState == 4 && this.status != 0) {
          if (this.status == 200) {
            var json = JSON.parse(this.responseText);

            if (json && json.vendorID) {
              measure.segmentUserId = json.vendorID;
              measure.identify(measure.segmentUserId, json.traits);
            }
          }

          measure.identifyAttempted = true;
          callback();
        }
      };
    }(callback); // We're not using request.timeout because it can't be faked in Sinon
    // and it's important to have automated tests for this.


    setTimeout(function (request, callback) {
      if (request.readyState != 4 || request.status == 0) {
        request.onreadystatechange = null;
        request.abort();
        measure.identifyAttempted = true;
        callback();
      }
    }, timeout, request, callback);
    request.open('GET', '/measure/traits?credentials=include', true);
    request.send();
  };

  measure.dequeue = function () {
    // Dequeue any existing events that were sent to the stubs
    // created by our snippet.
    //
    // Events are arrays in the format:
    //   [methodName, firstArg, secondArg, ..., lastArg]
    while (measure.queue && measure.queue.length) {
      var event = measure.queue.shift();
      var method = event.shift();
      measure[method].apply(this, event);
    }
  }; // Some environments, such as automated testing environments, can skew our
  // metrics upstream because of how often they can trigger any given event.
  // This function allows us to look at environment features to determine if
  // we consider this environment bad for sending data upstream.


  measure.isEnvironmentDenyListed = function () {
    // adding defensive check incase privacy modes throw errors when accessing session storage
    var sessionStorage;

    try {
      sessionStorage = window.sessionStorage;
      sessionStorage.setItem('ana-test', 1);
      sessionStorage.removeItem('ana-test');
    } catch (e) {
      sessionStorage = {
        setItem: function setItem() {},
        getItem: function getItem() {},
        removeItem: function removeItem() {}
      };
    }

    var sessionState = sessionStorage.getItem('analytics-force');
    var forceAllowInSessionState = sessionState && sessionState === 'allow';
    var forceDenyInSessionState = sessionState && sessionState === 'deny';
    var isForceAllow = window.location.href.includes('analytics-force-allow') || !!forceAllowInSessionState;
    var isForceDeny = window.location.href.includes('analytics-force-deny') || !!forceDenyInSessionState;

    if (forceAllowInSessionState && isForceDeny) {
      // we have previously opted into forcing allow but now want it off
      sessionStorage.setItem('analytics-force', 'deny');
      isForceAllow = false;
    } else if (!forceAllowInSessionState && isForceAllow) {
      // we have not previously opted into forcing allow and now we want to
      sessionStorage.setItem('analytics-force', 'allow');
    }

    return function () {
      var URL_DENYLIST_PATTERNS = [/^https:\/\/performance.invisionapp.com/i];
      var isURLDenied = URL_DENYLIST_PATTERNS.some(function (pattern) {
        return pattern.test(window.location.href);
      });
      var isGlobalStateDenied = !!window.analyticsForceDeny;
      return isForceAllow ? false : isForceDeny || isGlobalStateDenied || isURLDenied;
    };
  }();

  if (window.measure.invisionVersion == '7.0') {
    measure.identifyUser(measure.dequeue);
  } else {
    measure.identifyAttempted = true;
    measure.dequeue();
  }

  if (measure.isEnvironmentDenyListed()) {
    console.log('This environment is blacklisted in analytics-ui (utilities.js) and will not send events to Segment');
  }
}(); // https://github.com/InVisionApp/storage-consent/blob/master/dist/snippet.js

"use strict";

(function () {
  function a(a) {
    console.error("`" + a + "` called before trustarc is ready. use `onConsentLevelReady`");
  }

  if (!window.__storageConsentAdded) {
    window.__storageConsentAdded = !0, "function" != typeof Object.assign && Object.defineProperty(Object, "assign", {
      value: function value(a) {
        "use strict";

        if (null == a) throw new TypeError("Cannot convert undefined or null to object");

        for (var b, c = Object(a), d = 1; d < arguments.length; d++) {
          if (b = arguments[d], null != b) for (var e in b) {
            Object.prototype.hasOwnProperty.call(b, e) && (c[e] = b[e]);
          }
        }

        return c;
      },
      writable: !0,
      configurable: !0
    });
    var b = (/privacy-force-country=(\w{2})/i.exec(window.location.search || "") || [])[1],
        c = -1 < (window.location.search || "").indexOf("privacy-force-banner"),
        d = -1 < (window.location.search || "").indexOf("privacy-force-implied"),
        e = [/(iPhone|iPod|iPad)(?!.*Safari)/gi, /Android.*(wv|\.0\.0\.0)/gi, /Linux; U; Android/gi],
        f = top && self && top !== self,
        g = f || ["invisionapp_ima", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36", "InVisionStudio", "WebView"].some(function (a) {
      return -1 < window.navigator.userAgent.toLowerCase().indexOf(a.toLowerCase());
    }) || e.some(function (a) {
      return a.test(window.navigator.userAgent);
    });

    if (c) {
      var G = document.createElement("div");
      G.id = "teconsent", document.body && document.body.appendChild(G);
    }

    if (!g) {
      var H = document.createElement("div");
      H.id = "consent_blackbar", Object.assign(H.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 2147483638
      }), document.body ? document.body.appendChild(H) : document.addEventListener("readystatechange", function () {
        document.getElementById("consent_blackbar") || "interactive" !== document.readyState && "complete" !== document.readyState || document.body.appendChild(H);
      });
      var h = "https://consent.truste.com/notice?domain=invisionapp.com&c=teconsent&js=nj&noticeType=bb&pcookie" + (b ? "&country=" + b : "") + (d ? "&behavior=implied" : ""),
          i = document.createElement("script");
      i.src = h, i.async = !0, (document.body || document.head).appendChild(i);
    }

    var j = [],
        k = function k() {
      var a = r();
      return (j || []).every(function (b, c) {
        return b === a[c];
      });
    },
        l = {},
        m = function m() {
      return Object.keys(l).every(function (a) {
        return !l[a] || l[a] === StorageConsent.consentedToDomain(a);
      });
    };

    window.postMessage(JSON.stringify({
      PrivacyManagerAPI: {
        action: "getConsent",
        timestamp: new Date().getTime(),
        self: "invisionapp.com"
      }
    }), "*");
    var n = !1;
    window.addEventListener("message", function (a) {
      var b;
      if (a && a.data) try {
        b = JSON.parse(a.data);
      } catch (a) {}
      b && b.source && "preference_manager" === b.source && ("submit_preferences" === b.message ? setTimeout(function () {
        var a = k(),
            b = m(),
            c = 0 === j[0] && !a;
        c || a && b ? A.forEach(function (a) {
          return a();
        }) : (console.log("User consent levels have changed to be more strict, reloading the page to establish a clean environment with these stricter preferences"), n = !0), j = r(), l = s();
      }, 16) : "remove_iframe" === b.message && n && (n = !1, window.location.reload()));
    }, !1);

    var o,
        p = function p(a) {
      var b = document.cookie.match(new RegExp("(^| )" + a + "=([^;]+)"));
      if (b) return b[2];
    },
        q = function q() {
      var a = p("notice_gdpr_prefs");
      return a && a.split(",").map(function (a) {
        return parseInt(a.toString()[0], 10) + 1;
      });
    },
        r = function r() {
      var a = [],
          b = window.StorageConsent.getGDPRConsentDecision();
      return a = b && b.consentDecision ? b.consentDecision : q(), a;
    },
        s = function s() {
      return Object.keys(l).reduce(function (a, b) {
        return a[b] = StorageConsent.consentedToDomain(b), a;
      }, {});
    },
        t = function t() {
      return -1 < document.cookie.indexOf("notice_behavior") || -1 < document.cookie.indexOf("notice_gdpr_prefs") || -1 < document.cookie.indexOf("notice_preference");
    },
        u = function u() {
      return t() && -1 < (p("notice_behavior") || "").indexOf("eu");
    },
        v = function v() {
      return window.truste && window.truste.cma;
    },
        w = function w() {
      return v() && t();
    },
        x = function x() {
      return window.truste && !window.truste.cma && t() && !u();
    },
        y = function y() {
      return w() || x();
    },
        z = [],
        A = [],
        B = !1,
        C = 20,
        D = window.forceStorageConsentTimeout || 5e3,
        E = 0,
        F = function F() {
      setTimeout(function () {
        g || y() ? (B = !0, j = !g && r() || [], z.forEach(function (a) {
          return a();
        })) : E < D && (E += C, C += 180, F());
      }, C);
    };

    F(), window.StorageConsent = window.StorageConsent || {
      REQUIRED: 1,
      FUNCTIONAL: 2,
      ADVERTISING: 3,
      consentDomain: "invisionapp.com",
      getConsentDecisionForDomain: function c(b) {
        return y() || a("getConsentDecisionForDomain"), v() && truste.cma.callApi("getConsent", this.consentDomain, b, this.consentDomain);
      },
      getConsentDecision: function b() {
        return y() || a("getConsentDecision"), v() && truste.cma.callApi("getConsentDecision", this.consentDomain);
      },
      getGDPRConsentDecision: function b() {
        return y() || a("getGDPRConsentDecision"), v() && truste.cma.callApi("getGDPRConsentDecision", this.consentDomain);
      },
      getConsentCategories: function b() {
        return y() || a("getConsentCategories"), v() && truste.cma.callApi("getConsentCategories", this.consentDomain).categories;
      },
      hasGDPRCookies: t,
      isForceRequiredLevelOnly: function a() {
        return g;
      },
      qualifiesForGDPR: u,
      canRunFunctionalScripts: function c() {
        var b = this;
        return y() || a("canRunFunctionalScripts"), !g && (!this.qualifiesForGDPR() || r().some(function (a) {
          return b.FUNCTIONAL === a;
        }));
      },
      canRunAdvertisingScripts: function c() {
        var b = this;
        return y() || a("canRunFunctionalScripts"), !g && (!this.qualifiesForGDPR() || r().some(function (a) {
          return b.ADVERTISING === a;
        }));
      },
      consentedToDomain: function c(a) {
        a && -1 < a.indexOf("/") && (!o && (o = document.createElement("a")), o.href = a, a = o.hostname || a);
        var b = !0;
        if (g) b = !1;else if (this.qualifiesForGDPR()) if (w()) {
          var d = this.getConsentDecisionForDomain(a) || {};
          b = "approved" === d.consent && "asserted" === d.source;
        } else b = !1;
        return void 0 === l[a] && (l[a] = b), b;
      },
      onConsentLevelReady: function b(a) {
        return B ? setTimeout(function () {
          return a();
        }, 14) : z.push(a);
      },
      onConsentLevelChange: function b(a) {
        return A.push(a);
      }
    };
  }
})();