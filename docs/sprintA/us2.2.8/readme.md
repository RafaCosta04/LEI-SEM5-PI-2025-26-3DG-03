# US 2.2.8

## 1. Context

*A Vessel Visit represents the planned arrival and departure of a vessel at the port, including associated
operations such as cargo loading and unloading. The process begins when a shipping agent
representative submits a Vessel Visit notification for an authorized vessel, providing key information
such as expected arrival (ETA), departure (ETD), cargo type and volume, and any special handling
requirements.\
Additionally, a Vessel Visit Notification may also include basic crew information to support regulatory
and operational needs. For most visits, this information is limited to the captain’s name and the total
number of crew members on board However, when the vessel carries dangerous cargo, the
notification must explicitly identify the designated crew safety officers, as their presence is a
prerequisite for port operations involving hazardous materials*

## 2. Requirements

**US 2.2.8** As a Shipping Agent Representative, I want to create/submit a Vessel Visit Notification, so that the vessel berthing and subsequent (un)loading operations at the port are scheduled and planned in space and timely manner.


**Acceptance Criteria:**

- The Cargo Manifest data for unloading and/or loading is included.

- The system must validate that referred containers identifiers comply with the ISO 6346:2022 standard.

- Information about the crew (name, citizen id, nationality) might be requested, when necessary, for compliance with security protocols.

- Vessel Visit Notifications might become at an "in progress" status (e.g. cargo information is incomplete) to be further update/completed.

- When completed / ready for asking approval, the agent is required to change its state to "submitted".

**Dependencies/References:**

*There is a dependency with US2.2.2, since a vessel must exist so the vessel visit notification can be created.* 
*There is a dependency with US2.2.6, since a shipping agent representative must exist to perform the creation/submit of a vessel visit notification.*


**Forum Insight:**

>> In the assignment, it is stated that, for most visits, the crew information to be stored is limited to the captain's name and the number of crewmates, and that, should the vessel carry hazardous or dangerous cargo, that it should also include information regarding safety officers on board.
Is this all the necessary crew information? Do we need additional crew information of anyone who isn't a safety officer?
>
> Yes! By now, no need for more crew information than that.

>> Boa tarde, 
Reparei que na US 2.2.8 refere, no acceptance criteria, que informação pode ser adicionada no futuro. Apenas deu o exemplo de adicionar informação da carga.
Informação de tripulantes ou outros dados podem ser alterados ou adicionados mais tarde? Ou apenas certas informações podem ser adicionadas/alteradas.
Cumprimentos,
>
> Enquanto o estado do Vessel Visit Notification for "in progress" (US 2.2.8 e US 2.2.9) todos os seus dados podem ser alterados/adicionados.
Depois de ser submetido, já não pode ser alterado pelo Shipping Agent Representative.


>>"The process begins when a shipping agent representative submits a Vessel Visit notification for an authorized vessel, providing key information such as expected arrival (ETA), departure (ETD), cargo type and volume, and any special handling
requirements."\
Quando fazemos uma notificação, o navio só está a carregar um tipo de carga?
>
>Não! O tipo de carga varia de um contentor para outro.
Contudo, no mesmo manifesto de carga, podem existir vários contentores com o mesmo tipo de carga.

>>"Information about the crew (name, citizen id, nationality) might be requested, when
necessary, for compliance with security protocols."\
Gostariamos de saber se  esta informação é relativa apenas ao capitão ou a todos os membros da crew.
>
>No contexto de uma Vessel Visit Notification, é sempre necessário solicitar o identificação do capitão (name, citizen id, nationality) e o número total de pessoas que compõe a tripulação a bordo.\
Adicionalmente, quando ocorre o transporte de mercadoria perigosa é necessário solicitar também a identificação (name, citizen id, nationality) dos oficiais responsáveis pela segurança (safety).

>>What is the attribute that uniquely identifies a vessel visit notification?
>
>Great question!!!\
Different approaches are usually followed.\
However, in this case, each Vessel Visit Notificationmust have a unique business identifier following the pattern
{YEAR}-{PORT_CODE}-{SEQUENTIAL_NUMBER}
where:\
-- YEAR: the calendar year when the visit is first registered.\
-- PORT_CODE: a short alphanumeric code uniquely identifying the port (e.g., “PTLEI” for "Porto de Leixões").\
-- SEQUENTIAL_NUMBER: a zero-padded integer (e.g., 000001, 000002, …) assigned incrementally per port and year.
The combination (YEAR, PORT_CODE, SEQUENTIAL_NUMBER) must be unique across the system.\
Once assigned, the identifier must remain immutable even if other visit details (dates, vessel, etc.) are updated.

## 3. Analysis

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.8.png)





