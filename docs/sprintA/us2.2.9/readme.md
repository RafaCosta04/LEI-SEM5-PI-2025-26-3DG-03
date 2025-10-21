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
Specifically:\
When an order is withdrawn, can it later be restored, or does it disappear permanently?\
If the status of a notification is "submitted", is it possible to withdraw that request?
>
> Under the US 2.2.9, the mention to "withdraw request" refers to the ability of the Shipping Agent Representative to mark a given Vessel Visit Notification as having no intention to complete it til the point of submitting it for approval.\
As so, (s)he does not see that Notification as being "in progress" any more. However, the Notification should not be deleted since, occasionally, (s)he may change her/his mind a resume it from there.\
After being submitted, the Shipping Agent Representative cannot change the Notification.

>>Reparei que na US 2.2.8 refere, no acceptance criteria, que informação pode ser adicionada no futuro. Apenas deu o exemplo de adicionar informação da carga.\
Informação de tripulantes ou outros dados podem ser alterados ou adicionados mais tarde? Ou apenas certas informações podem ser adicionadas/alteradas.
>
>Enquanto o estado do Vessel Visit Notification for "in progress" (US 2.2.8 e US 2.2.9) todos os seus dados podem ser alterados/adicionados.
Depois de ser submetido, já não pode ser alterado pelo Shipping Agent Representative.

>>Should the shipping agent representative who requests to modify or remove a Vessel Visit Notification be allowed to change only the notifications they created, or any notification in the system, regardless of who created it?
>
>Most of the time, Shipping Agent Representative work on the Vessel Visit Notifications created by themselves.\
However, it may be possible to work on Vessel Visit Notifications submitted by other representatives working for the same shipping agent organization.

## 3. Analysis

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.9.png)




