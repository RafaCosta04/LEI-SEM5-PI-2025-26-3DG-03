# US 2.2.9

## 1. Context

*A Vessel Visit represents the planned arrival and departure of a vessel at the port, including associated operations such as cargo loading and unloading. The process begins when a shipping agent representative submits a Vessel Visit notification for an authorized vessel, providing key information such as expected arrival (ETA), departure (ETD), cargo type and volume, and any special handling requirements.
Additionally, a Vessel Visit Notification may also include basic crew information to support regulatory and operational needs. For most visits, this information is limited to the captain’s name and the total number of crew members on board However, when the vessel carries dangerous cargo, the notification must explicitly identify the designated crew safety officers, as their presence is a  prerequisite for port operations involving hazardous materials.*

## 2. Requirements

**US 2.2.9** As a Shipping Agent Representative, I want to change / complete a Vessel Visit Notification while it is still in progress, so that I can correct errors or withdraw requests if necessary.


**Acceptance Criteria:**

- Status can be maintained "in progress" or changed to "submitted / approval pending" by the representative.

**Dependencies/References:**

*There is a dependency with US2.2.6, since a shipping agent representative must exist to change/complete a vessel visit notification.*
*There is a dependency with US2.2.8, since a vessel visit notification must exist so it can be changed or completed.* 


**Forum Insight:**

>> In the US, the term "withdraw request" is often used. Could you clarify what this action consists of?
Specifically:
When an order is withdrawn, can it later be restored, or does it disappear permanently?
If the status of a notification is "submitted", is it possible to withdraw that request?
>
> Under the US 2.2.9, the mention to "withdraw request" refers to the ability of the Shipping Agent Representative to mark a given Vessel Visit Notification as having no intention to complete it til the point of submitting it for approval.
As so, (s)he does not see that Notification as being "in progress" any more. However, the Notification should not be deleted since, occasionally, (s)he may change her/his mind a resume it from there.
After being submitted, the Shipping Agent Representative cannot change the Notification.

## 3. Analysis

Review and Approved 

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.7-approved.png)

Review and Rejected

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.7-rejected.png)


