import {
  lunary_default
} from "./chunk-AX3726TK.js";
import {
  __name
} from "./chunk-AGSXOS4O.js";

// src/browser.ts
var FrontendLunary = class extends lunary_default {
  static {
    __name(this, "FrontendLunary");
  }
  userId;
  userProps;
  /**
   * Identifies a user with a unique ID and properties.
   * @param {string} userId - The unique identifier for the user.
   * @param {cJSON} [userProps] - Custom properties to associate with the user.
   */
  identify(userId, userProps) {
    this.userId = userId;
    this.userProps = userProps;
  }
  /**
   * Extends the trackEvent method to include userId and userProps.
   * @param {RunType} type - The type of the run.
   * @param {EventName} event - The name of the event.
   * @param {Partial<RunEvent>} data - The data associated with the event.
   */
  trackEvent(type, event, data) {
    super.trackEvent(type, event, {
      ...data,
      userId: this.userId,
      userProps: this.userProps
    });
  }
};
var lunary = new FrontendLunary();
var browser_default = lunary;

export {
  browser_default
};
