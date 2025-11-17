:- module(http_handler, []).
:- use_module(library(http/http_client)).
:- use_module(library(http/json)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_parameters)).
:- consult('Algorithms/vessel_schedule.pl').
:- consult('Algorithms/improved_vessel_schedule.pl').

:- http_handler(root(api/scheduling/compute), handle_scheduling_request, []).

handle_scheduling_request(Request) :-
    catch(
        (
            http_read_json_dict(Request, Dict),
            http_parameters(Request, [algorithm(AlgParam, [optional(true)])]),
            (   (get_dict(algorithm, Dict, AlgJson) -> true ; AlgJson = '' ),
                (AlgParam \= '' -> Algorithm = AlgParam ; (AlgJson \= '' -> Algorithm = AlgJson ; Algorithm = default))
            ),
            with_output_to(user_error, format('Selected algorithm: ~w~n', [Algorithm])),
            ( process_data_with_algorithm(Algorithm, Dict, Result)
            -> reply_json_dict(_{status: "ok", schedule: Result})
            ; reply_json_dict(_{error: "processing_failed"}, [status(500)])
            )
        ),
        Error,
        (
            with_output_to(user_error, format("ERRO ao processar JSON: ~w~n", [Error])),
            reply_json_dict(_{error: Error}, [status(400)])
        )
    ).


% process_data_with_algorithm(+Algorithm, +Dict, -Result)
% Dispatches to the selected algorithm implementation.
process_data_with_algorithm(Algorithm, Dict, Result) :-
    retractall(vessel(_,_,_,_,_)),
    Notifications = Dict.vesselVisitNotifications,
    Crane = Dict.assignedCrane,
    CraneCapacity = Crane.operationalCapacity,
    process_vessels(Notifications, CraneCapacity, _),
    downcase_atom(Algorithm, AlgorithmAtom),
    (   AlgorithmAtom = 'improved'
    ->  obtain_seq_shortest_delay_improved(SeqTriplets, ShortestDelay, ExecutionTime)
    ;   obtain_seq_shortest_delay(SeqTriplets, ShortestDelay, ExecutionTime)
    ),
    triplets_to_dicts(SeqTriplets, SeqDicts),
    Result = _{
        schedule: SeqDicts,
        totalDelay: ShortestDelay,
        executionTime: ExecutionTime
    }.

process_vessels([], _, []).
process_vessels([V|Rest], CraneCapacity, [_|Facts]) :-
    VesselName = V.vesselIMO,
    ETAString = V.eta,
    ETDString = V.etd,
    CargoManifests = V.get(cargoManifests, []),


    datetime_to_hour(ETAString, ETAHour),
    datetime_to_hour(ETDString, ETDHour),

    % Conta containers por tipo
    count_cargo(CargoManifests, loading, NLoading),
    count_cargo(CargoManifests, unloading, NUnloading),

    % Calcula tempos (horas ou qualquer unidade que uses)
    compute_loading_unloading(NLoading, NUnloading, CraneCapacity, LoadingTime, UnloadingTime),

    % Cria facto vessel(...)
    assertz(vessel(VesselName, ETAHour, ETDHour, UnloadingTime, LoadingTime)),

    with_output_to(user_error, format("Fato criado: vessel(~w, ~2f, ~2f, ~2f, ~2f)~n",
        [VesselName, ETAHour, ETDHour, LoadingTime, UnloadingTime])),
    with_output_to(user_error, format("  Containers: Loading=~w, Unloading=~w, CraneCapacity=~w~n",
        [NLoading, NUnloading, CraneCapacity])),

    process_vessels(Rest, CraneCapacity, Facts).

% Conta quantos containers existem para cada tipo de manifest
count_cargo([], _, 0).
count_cargo([M|Rest], TypeAtom, Count) :-
    string_lower(M.manifestType, ManifestType), 
    Entries = M.get(entries, []),
    length(Entries, NumEntries),
    atom_string(TypeAtom, TypeString), 
    (ManifestType = TypeString -> ThisCount = NumEntries ; ThisCount = 0),
    count_cargo(Rest, TypeAtom, OtherCount),
    Count is ThisCount + OtherCount.

% Calcula tempos de carga/descarga
compute_loading_unloading(NLoading, NUnloading, CraneCapacity, LoadingTime, UnloadingTime) :-
    (CraneCapacity =:= 0 -> EffectiveCap = 1 ; EffectiveCap = CraneCapacity),
    LoadingTime is NLoading / EffectiveCap,
    UnloadingTime is NUnloading / EffectiveCap.


datetime_to_hour(DateTimeStr, HourDecimal) :-
    sub_atom(DateTimeStr, _, _, After, "T"), 
    sub_atom(DateTimeStr, _, After, 0, TimePart),
    split_string(TimePart, ":", "", [HStr, MStr | _]),
    number_string(H, HStr),
    number_string(M, MStr),
    HourDecimal is H + (M / 60).


triplets_to_dicts([], []).
triplets_to_dicts([(V, TIn, TEnd)|Rest], [Dict|DictsRest]) :-
    Dict = _{
        vessel: V,
        start: TIn,
        end: TEnd
    },
    triplets_to_dicts(Rest, DictsRest).