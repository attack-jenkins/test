/*
 * Copyright 2016-2018 KaaIoT Technologies, LLC.
 * Copyright 2014-2016 CyberVision, Inc.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

(function() {
  var FEEDBACK_FORM_SELECTOR = '.form--feedback';

  $(FEEDBACK_FORM_SELECTOR).validator().on('submit', function (e) {
    if (!e.isDefaultPrevented()) {
      var TITLE = document.title;
      var VERSION = UTILS.getVersionFromURL();
      var ACTION_URL = $(FEEDBACK_FORM_SELECTOR).data('url');
      var formData = {};

      $.each($(FEEDBACK_FORM_SELECTOR).serializeArray(), function(_, field) {
        formData[field.name] = field.value.trim();
      });

      /* Send feedback to google analytics */
      Analytic.getInstance().sendFeedback('Without type', VERSION, TITLE, formData['name'], formData['email'], formData['description']);

      $(FEEDBACK_FORM_SELECTOR + ' .btn').prop('disabled', true).addClass('disabled');

      $.post(ACTION_URL,
        {
          "email": formData['email'],
          "name": formData['name'],
          "feedback": "Title: " + TITLE + "; Version: " + VERSION + "; Description: " + formData['description'] + ";",
        }
      ).always(function() {
        window.location.reload();
      });
    }

    return false;
  });
}());
