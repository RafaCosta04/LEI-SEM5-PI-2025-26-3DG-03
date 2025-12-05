% Simple rebalancing algorithm (Greedy temporal) for vessel->dock assignment.
%
% Facts format expected in this file (examples provided below):
%   vessel(Name, ArrivalTime, DepartureTime, Load).
%     - ArrivalTime and DepartureTime are integers (time units)
%     - Load is integer processing time (unload+load)
%   dock(Name, NumCranes).
%     - NumCranes is the number of cranes (parallelism) at the dock
%
% The algorithm implemented here follows Option 2 (temporal greedy):
% 1) Compute priority score = Arrival + Departure + Slack, where
% Simple rebalancing algorithm (Greedy temporal) for vessel->dock assignment.
%
% Facts format expected in this file (examples provided below):
%   vessels(Name, ArrivalTime, DepartureTime, Cargo).
%     - ArrivalTime and DepartureTime are integers (time units)
%     - Cargo is integer number of containers
%   dock(Name, OperationalCapacity).
%     - OperationalCapacity is number of containers per hour
%
% The algorithm implemented here follows Option 2 (temporal greedy):
% 1) Compute priority score = Arrival + Departure + Slack, where
%    Slack = max(Departure - Arrival - Duration, 0).
%    (Duration is computed as ceil(Cargo / OperationalCapacity)).
% 2) Sort vessels by increasing score (higher urgency first).
% 3) For each vessel in order, try each dock and find the earliest start >= Arrival
%    where the dock has a free slot during [start, start+duration).
% 4) Choose dock minimizing (Delay, EndTime, -OperationalCapacity) lexicographically, where
%    Delay = max(0, EndTime - Departure).
%
% The return is a list of assign(Vessel, Dock, Start, End, Delay).

:- module(rebalancing_algorithm, [rebalance_assignments/1, rebalance_assignments/2, example_run/1]).

:- dynamic vessels/4.
:- dynamic vessel/4.
:- dynamic dock/2.

%% Example data (uncomment or provide your own facts)
%% Use the following format as requested by the user:
%%   vessels(Name, ArrivalTime, DepartureTime, Cargo).
%%   dock(Name, OperationalCapacity).
%% Execution time for a vessel = ceil(Cargo / OperationalCapacity)
%% Examples:
% Example facts removed. The controller should assert `vessels/4` and `dock/2` dynamically
% before calling `rebalance_assignments/2` so that the algorithm works on runtime data.

%% Public predicate: rebalance_assignments(-Assignments)
%% Assignments = [assign(Vessel, Dock, Start, DeclaredDeparture, Delay, ActualDeparture, ActualArrival), ...]
rebalance_assignments(Assignments) :-
    % Debug: entry log
    with_output_to(user_error, format('rebalancing_algorithm: rebalance_assignments called~n', [])),
    % Collect vessels from both `vessels/4` and `vessel/4` if present.
    findall(vessel(Name,A,D,L), vessels(Name,A,D,L), V1),
    % avoid calling an undefined predicate by using catch
    ( catch(findall(vessel(Name2,A2,D2,L2), vessel(Name2,A2,D2,L2), V2), _, V2 = []) ),
    append(V1, V2, Vessels),
    findall(dock(NameC,OpCap), dock(NameC,OpCap), Docks),
    % Debug: report collected counts
    length(Vessels, VCount), length(Docks, DCount),
    with_output_to(user_error, format('rebalancing_algorithm: collected ~w vessels and ~w docks~n', [VCount, DCount])),
    build_dock_schedules(Docks, DockSchedules),
    % compute average operational capacity for slack estimation
    average_opcap(Docks, AvgCap),
    score_and_sort_vessels(Vessels, AvgCap, SortedVessels),
    % Debug: list sorted vessels (print header, then each line separately)
    with_output_to(user_error, format('rebalancing_algorithm: sorted vessels:~n', [])),
    forall(member(vessel(N,A2,D2,L2), SortedVessels), with_output_to(user_error, format('  - ~w (A=~w D=~w L=~w)~n',[N,A2,D2,L2]))),
    rebalance_vessels(SortedVessels, DockSchedules, Assignments).

% Backwards-compatible wrapper: allow calling with a Mode argument.
% Mode is currently unused by the core algorithm (kept for compatibility).
rebalance_assignments(Assignments, _Mode) :-
    rebalance_assignments(Assignments).

%% example_run(-Assignments) runs with current facts and prints the assignments
example_run(Assignments) :-
    rebalance_assignments(Assignments),
    forall(member(assign(V,Dock,Start,DeclaredDeparture,Delay,ActualDeparture,ActualArrival), Assignments),
           format('~w -> ~w  arrivalAllowed:~w declaredDeparture:~w delay:~w actualDeparture:~w actualArrival:~w~n',[V,Dock,Start,DeclaredDeparture,Delay,ActualDeparture,ActualArrival]) ).

%% build initial dock schedules: dock(Name, OperationalCapacity, Tasks)
build_dock_schedules(Docks, Schedules) :-
    findall(dock(Name,Op,[]), member(dock(Name,Op), Docks), Schedules).

%% average_opcap(+Docks, -AvgCap)
average_opcap(Docks, Avg) :-
        ( Docks == [] -> Avg = 0
        ; findall(Op, member(dock(_Name,Op), Docks), Ops),
            sum_list(Ops, Sum),
            length(Ops, N),
            (N > 0 -> Avg is Sum / N ; Avg = 0)
        ).

%% score_and_sort_vessels(+Vessels, -Sorted) where Vessels are vessel(Name,A,D,L)
score_and_sort_vessels(Vessels, AvgCap, Sorted) :-
    maplist(add_score(AvgCap), Vessels, Scored),
    % Scored is a list of Score-Vessel pairs. Use keysort to sort by Score (the key).
    keysort(Scored, ScoredSorted),
    pairs_values(ScoredSorted, Sorted).

% add_score(+AvgCap, +Vessel, -Score-Vessel)
add_score(AvgCap, vessel(Name,A,D,Cargo), Score-vessel(Name,A,D,Cargo)) :-
    % estimate duration using average capacity
    (AvgCap =:= 0 -> DurF = 1.0 ; DurF is Cargo / AvgCap),
    Dur is ceiling(DurF),
    Temp is D - A - Dur,
    (Temp > 0 -> Slack = Temp ; Slack = 0),
    % priority = arrival + departure + slack (user requested)
    Score is A + D + Slack.

pairs_values([], []).
pairs_values([_K-V|T], [V|VT]) :- pairs_values(T, VT).

%% rebalance_vessels(+VesselsSorted, +DockSchedulesIn, -AssignmentsOut)
rebalance_vessels([], _DockSchedules, []).
rebalance_vessels([vessel(Name,A,D,L)|VT], DockSchedulesIn, [assign(Name,ChosenDock,Start,DeclaredDeparture,Delay,ActualDeparture,ActualArrival)|AT]) :-
    evaluate_docks(Name,A,D,L,DockSchedulesIn,Options),
    select_best_option(Options, best(ChosenDock,ActualStart,ActualEnd,_OptDelay,OpCap)),
    % compute duration
    (OpCap =:= 0 -> DurF = 1.0 ; DurF is L / OpCap),
    Duration is ceiling(DurF),
    % compute delay (actual end vs declared departure)
    TempDelay is ActualEnd - D,
    (TempDelay > 0 -> Delay = TempDelay ; Delay = 0),
    % Debug: report assignment decision including delay
    with_output_to(user_error, format('rebalancing_algorithm: assigning ~w -> ~w start=~w end=~w duration=~w delay=~w~n',[Name, ChosenDock, ActualStart, ActualEnd, Duration, Delay])),
    % update dock schedules: add task(ActualStart,ActualEnd) to chosen dock
    select(dock(ChosenDock,OpCap,Tasks), DockSchedulesIn, RestSchedules),
    NewTasks = [task(ActualStart,ActualEnd)|Tasks],
    DockSchedulesNext = [dock(ChosenDock,OpCap,NewTasks)|RestSchedules],
    ActualDeparture = ActualEnd,
    ActualArrival = ActualStart,
    DeclaredDeparture = D,
    % Start is the time the vessel can start operations (arrival allowed)
    Start = A,
    % Delay computed from actual departure vs declared departure
    TempDelay is ActualDeparture - D,
    (TempDelay > 0 -> Delay = TempDelay ; Delay = 0),
    rebalance_vessels(VT, DockSchedulesNext, AT).

%% evaluate_docks(+Vname,+A,+D,+L,+DockSchedules, -Options)
%% Options is list of option(Dock,Start,End,Delay,OperationalCapacity)
evaluate_docks(_V,_A,_D,_L,[],[]) :- !.
evaluate_docks(V,A,Dep,Load,[dock(Name,OpCap,Tasks)|DT], [opt(Name,Start,End,Delay,OpCap)|OT]) :-
    % compute duration = ceil(Cargo / OperationalCapacity)
    (OpCap =:= 0 -> DurationFloat = 1.0 ; DurationFloat is Load / OpCap),
    Duration is ceiling(DurationFloat),
    % find earliest start >= A where during [Start,Start+Duration) no overlapping task (dock is serial)
    max_search_horizon(Horizon),
    StartLimit is A + Horizon,
    find_earliest_start(Tasks, 1, A, Duration, StartLimit, Start),
    End is Start + Duration,
    TempDelay is End - Dep,
    (TempDelay > 0 -> Delay = TempDelay ; Delay = 0),
    evaluate_docks(V,A,Dep,Load,DT,OT).

%% max_search_horizon(-H)
max_search_horizon(10000).

%% find_earliest_start(+Tasks,+Concurrency,+Earliest,+Duration,+Limit,-Start)
find_earliest_start(Tasks, Concurrency, Earliest, Duration, Limit, Start) :-
    (Earliest > Limit -> Start = Earliest ;
     ( slot_free(Tasks, Concurrency, Earliest, Earliest+Duration) -> Start = Earliest
     ; Next is Earliest + 1,
       find_earliest_start(Tasks, Concurrency, Next, Duration, Limit, Start)
     ) ).

%% slot_free(+Tasks,+Concurrency,+S,+E) true if number of overlapping tasks < Concurrency
slot_free(Tasks, _Concurrency, S, E) :-
    % docks treated as serial resources (one vessel at a time). If needed,
    % concurrency parameter can be restored later.
    findall(1, (member(task(A,B), Tasks), intervals_overlap(A,B,S,E)), L),
    length(L,Count),
    Count < 1.

intervals_overlap(A,B,S,E) :- A < E, B > S.

%% select_best_option(+Options, -Best)
%% Options: list of opt(Dock,Start,End,Delay,OpCap)
select_best_option([Opt], Best) :-
    Opt = opt(Name,Start,End,Delay,OpCap),
    Best = best(Name,Start,End,Delay,OpCap).
select_best_option(Options, Best) :-
    % Sort lexicographically by (Delay, End, -OperationalCapacity) and pick first
    maplist(opt_to_key, Options, Pairs),
    keysort(Pairs, Sorted),
    Sorted = [ _Key-Best | _ ].

opt_to_key(opt(Name,Start,End,Delay,OpCap), Key-best(Name,Start,End,Delay,OpCap)) :-
    % Key = (Delay, End, -OpCap) so docks with higher throughput are preferred on tie
    NegCap is -OpCap,
    Key = (Delay, End, NegCap).
