:- module(rebalancing_controller, [handle_rebalance_request/1]).

:- use_module(library(http/http_client)).
:- use_module(library(http/json)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).

:- dynamic vessels/4.
:- dynamic vessel/4.
:- dynamic dock/2.

% Load rebalancing algorithm
:- ensure_loaded('../Algorithms/rebalancing_algorithm.pl').

% Register a single HTTP handler for the path and dispatch internally by method
:- http_handler(root(api/scheduling/rebalance), handle_rebalance_any, []).

% Print debug info when module is loaded to aid diagnostics
% Initialization logging disabled to avoid console noise.
% To enable, uncomment the following directive:
% :- initialization(report_rebalance_handlers).

handle_rebalance_request(Request) :-
        catch(handle_rebalance_request_inner(Request), Error,
                ( term_to_atom(Error, ErrAtom),
                    with_output_to(user_error, format('Error in rebalancing handler: ~w~n', [ErrAtom])),
                    reply_json_dict(_{status: "error", error: ErrAtom}, [status(400)])
                ) ).

handle_rebalance_request_inner(Request) :-
    http_read_json_dict(Request, Dict),
    Notifications = Dict.get(vesselVisitNotifications, []),
    Docks = Dict.get(docks, []),
    ModeStr = Dict.get(mode, "per_dock"),
    ( ModeStr = "per_dock" -> Mode = per_dock ; Mode = avg ),

    % Clear previously asserted dynamic facts in the algorithm module (only those we added at runtime)
    retractall(rebalancing_algorithm:vessels(_,_,_,_)), retractall(rebalancing_algorithm:vessel(_,_,_,_)), retractall(rebalancing_algorithm:dock(_,_)),

    % Process docks: create dock(Name, OpCap) facts
    maplist(process_dock_dict, Docks),

    % Process notifications: create vessels(Name, ArrivalHourInt, DepartureHourInt, TotalContainers)
    maplist(process_notification_dict, Notifications),

    % Debug: report how many facts were asserted for diagnostics (in algorithm module)
    findall(Vn, rebalancing_algorithm:vessels(Vn,_,_,_), Vs), length(Vs, _VCount),
    findall(Dn, rebalancing_algorithm:dock(Dn,_), Ds), length(Ds, _DCount),

    % Run algorithm and collect assignments
    get_time(T0),
    ( catch(rebalance_assignments(Assignments, Mode), E, (with_output_to(user_error, format('Rebalance error: ~w~n',[E])), Assignments = [])) ),
    get_time(T1), _ExecTime is T1 - T0,

    % Build minimal assignments list: assign(Vessel, Dock, ActualDeparture, ActualArrival, Delay)
    findall(_{
                vessel: V,
                dock: Dock,
                actualDeparture: ActualDeparture,
                actualArrival: ActualArrival,
                delay: Delay
            }, ( member(assign(V,Dock,_Start,_DeclaredDeparture,Delay,ActualDeparture,ActualArrival), Assignments) ), AssignmentsJson),

    % Debug: report how many assignments were produced
    length(AssignmentsJson, _AssignCount),

    % Return only the assignments array (user will map to DTOs on backend)
    reply_json_dict(_{status: "ok", assignments: AssignmentsJson}).


% Simple GET handler to check service health and show counts
handle_rebalance_get(_Request) :-
    % Count vessels and docks currently asserted (if any)
    findall(V, rebalancing_algorithm:vessels(V,_,_,_), Vs), length(Vs, VCount),
    findall(D, rebalancing_algorithm:dock(D,_), Ds), length(Ds, DCount),
    reply_json_dict(_{status: "ok", message: "rebalancing handler loaded", vesselsAsserted: VCount, docksAsserted: DCount}).


% Generic dispatcher for any HTTP method on the same path
handle_rebalance_any(Request) :-
    ( member(method(post), Request) -> handle_rebalance_request(Request)
    ; member(method(get), Request)  -> handle_rebalance_get(Request)
    ; reply_json_dict(_{status: "error", message: "Method not allowed"}, [status(405)])
    ).


report_rebalance_handlers :-
    findall(Path-Handler, http_current_handler(Path, Handler), Pairs),
    with_output_to(user_error, (
        format('rebalancing_controller loaded. Registered HTTP handlers:~n', []),
        forall(member(Path-Handler, Pairs), format('  ~w -> ~w~n', [Path, Handler]))
    )).

% process a dock dict { name: ..., operationalCapacity: N }
process_dock_dict(DockDict) :-
    NameRaw = DockDict.get(name, ""),
    ( string(NameRaw) -> atom_string(Name, NameRaw) ; Name = NameRaw ),
    OpRaw = DockDict.get(operationalCapacity, 0),
    ( number(OpRaw) -> OpCap = OpRaw ; ( catch(number_string(OpCap, OpRaw), _, OpCap = 0) ) ),
    % Assert into the rebalancing_algorithm module so the algorithm can see the facts
    assertz(rebalancing_algorithm:dock(Name, OpCap)).

% process a notification dict: convert datetime to hours and count containers
process_notification_dict(Dict) :-
    VesselIMO = Dict.get(vesselIMO, "unknown"),
    ETAString = Dict.get(eta, ""), ETDString = Dict.get(etd, ""),
    CargoManifests = Dict.get(cargoManifests, []),
    datetime_to_hour(ETAString, ETAHour), datetime_to_hour(ETDString, ETDHour),
    count_cargo(CargoManifests, loading, NLoading), count_cargo(CargoManifests, unloading, NUnloading),
    TotalContainers is NLoading + NUnloading,
    ETAInt is ceiling(ETAHour), ETDInt is ceiling(ETDHour),
    % Assert into the rebalancing_algorithm module so the algorithm can see the facts
    assertz(rebalancing_algorithm:vessels(VesselIMO, ETAInt, ETDInt, TotalContainers)).

% Count containers in cargoManifests list
count_cargo([], _, 0).
count_cargo([M|Rest], TypeAtom, Count) :-
    atom_string(TypeAtom, TypeStr), string_lower(TypeStr, TypeLower),
    ManifestTypeRaw = M.get(manifestType, ""), string_lower(ManifestTypeRaw, ManifestLower),
    Entries = M.get(entries, []), length(Entries, NumEntries),
    ( ManifestLower = TypeLower -> ThisCount = NumEntries ; ThisCount = 0 ),
    count_cargo(Rest, TypeAtom, OtherCount), Count is ThisCount + OtherCount.

% Convert ISO datetime string "YYYY-MM-DDTHH:MM:..." to hours (decimal)
datetime_to_hour(DateTimeStr, HourDecimal) :-
    ( string(DateTimeStr), split_string(DateTimeStr, "T", "", [_Date, TimePart|_]) ->
        split_string(TimePart, ":", "", [HStr, MStr | _]),
        catch(number_string(H, HStr), _, fail), catch(number_string(M, MStr), _, fail), HourDecimal is H + (M / 60)
    ; % fallback: if it's a number string
        ( catch(number_string(N, DateTimeStr), _, fail) -> HourDecimal = N ; HourDecimal = 0 )
    ).
