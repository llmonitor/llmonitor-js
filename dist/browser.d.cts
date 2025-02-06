import { L as Lunary } from './lunary-vM5p-WW-.js';
import { cJSON, RunType, EventName, RunEvent } from './types.cjs';

declare class FrontendLunary extends Lunary {
    private userId?;
    private userProps?;
    /**
     * Identifies a user with a unique ID and properties.
     * @param {string} userId - The unique identifier for the user.
     * @param {cJSON} [userProps] - Custom properties to associate with the user.
     */
    identify(userId: string, userProps?: cJSON): void;
    /**
     * Extends the trackEvent method to include userId and userProps.
     * @param {RunType} type - The type of the run.
     * @param {EventName} event - The name of the event.
     * @param {Partial<RunEvent>} data - The data associated with the event.
     */
    trackEvent(type: RunType, event: EventName, data: Partial<RunEvent>): void;
}
declare const lunary: FrontendLunary;

export = lunary;
