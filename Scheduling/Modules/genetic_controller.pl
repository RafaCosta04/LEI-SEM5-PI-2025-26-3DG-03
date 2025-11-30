:- module(genetic_controller, [handle_genetic_request/1]).
:- use_module(library(http/http_client)).
:- use_module(library(http/json)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_parameters)).

% Load genetic algorithm predicates
:- ensure_loaded('../Algorithms/genetic_algorithm.pl').

handle_genetic_request(Request) :-
    catch(handle_genetic_request_inner(Request), Error,
        (
            ( catch(term_to_atom(Error, ErrAtom), _, ErrAtom = 'unknown_error') ),
            with_output_to(user_error, format('ERRO ao processar JSON: ~w~n', [ErrAtom])),
            reply_json_dict(_{error: ErrAtom}, [status(400)])
        )
    ).

handle_genetic_request_inner(Request) :-
    http_read_json_dict(Request, Dict),
    
    % Extract parameters from the DataGeneticScheduleDTO
    Notifications = Dict.vesselVisitNotifications,
    MaxCranes = Dict.get(maxCranes, 1),
    MedianCapacity = Dict.get(medianOperationalCapacity, 1),
    FastestCapacity = Dict.get(fastestOperationalCapacity, 1),
    EnableMultiCrane = Dict.get(enableMultiCrane, false),
    NumGenerations = Dict.get(numberOfGenerations, 100),
    PopSize = Dict.get(populationSize, 10),
    CrossoverRate = Dict.get(crossoverRate, 0.8),
    MutationRate = Dict.get(mutationRate, 0.1),
    DesiredTime = Dict.get(desiredTime, -1),
    StableGens = Dict.get(stableGenrations, 0),
    
    with_output_to(user_error, format('Genetic Algorithm Parameters:~n', [])),
    with_output_to(user_error, format('  Generations: ~w, Population: ~w~n', [NumGenerations, PopSize])),
    with_output_to(user_error, format('  Crossover: ~w%, Mutation: ~w%~n', [CrossoverRate, MutationRate])),
    with_output_to(user_error, format('  MaxCranes: ~w, MedianCapacity: ~w, FastestCapacity: ~w~n', [MaxCranes, MedianCapacity, FastestCapacity])),
    with_output_to(user_error, format('  EnableMultiCrane: ~w~n', [EnableMultiCrane])),
    
    % Clear any existing vessel facts
    retractall(vessel(_,_,_,_)),
    retractall(vessels(_)),
    
    % Process notifications and create vessel facts
    process_genetic_vessels(Notifications, MedianCapacity, FastestCapacity, EnableMultiCrane, VesselCount),
    assertz(vessels(VesselCount)),
    
    % Initialize genetic algorithm parameters
    initialize_params(NumGenerations, PopSize, CrossoverRate*100, MutationRate*100, StableGens, DesiredTime),
    
    with_output_to(user_error, format('Running genetic algorithm...~n', [])),
    
    % Run genetic algorithm - it returns Result directly
    generate(Result),
    
    % Extract components from result
    BestSeq = Result.best_sequence,
    BestDelay = Result.best_delay,
    Triplets = Result.triplets,
    ExecutionTime = Result.execution_time,
    
    with_output_to(user_error, format('Best solution found: ~w with delay ~w~n', [BestSeq, BestDelay])),
    
    % Convert triplets to schedule format
    triplets_to_schedule(Triplets, Schedule),
    
    % Build messages
    format(atom(TimeMsg), 'Genetic algorithm execution time: ~w', [ExecutionTime]),
    format(atom(GenMsg), 'Generations: ~w, Population size: ~w', [NumGenerations, PopSize]),
    format(atom(ParamsMsg), 'Crossover: ~1f%, Mutation: ~1f%', [CrossoverRate*100, MutationRate*100]),
    format(atom(DelayMsg), 'Total delay: ~w ', [BestDelay]),
    
    Messages = [TimeMsg, GenMsg, ParamsMsg, DelayMsg],
    
    % Prepare response
    Response = _{
        schedule: Schedule,
        totalDelay: BestDelay,
        executionTime: ExecutionTime,
        messages: Messages
    },
    
    reply_json_dict(_{status: "ok", schedule: Response}).

% Process vessel notifications and create vessel/4 facts
process_genetic_vessels([], _, _, _, 0).
process_genetic_vessels([V|Rest], MedianCapacity, FastestCapacity, EnableMultiCrane, Count) :-
    VesselIMO = V.vesselIMO,
    ETAString = V.eta,
    ETDString = V.etd,
    CargoManifests = V.get(cargoManifests, []),
    
    % Convert datetime to hours
    datetime_to_hour(ETAString, ETAHour),
    datetime_to_hour(ETDString, ETDHour),
    
    % Count containers
    count_cargo(CargoManifests, loading, NLoading),
    count_cargo(CargoManifests, unloading, NUnloading),
    
    % Calculate processing time based on EnableMultiCrane flag
    TotalContainers is NLoading + NUnloading,
    (EnableMultiCrane = true ->
        % Multi-crane mode: use MedianCapacity
        (MedianCapacity =:= 0 -> EffectiveCap = 1 ; EffectiveCap = MedianCapacity)
    ;
        % Single crane mode: use FastestCapacity
        (FastestCapacity =:= 0 -> EffectiveCap = 1 ; EffectiveCap = FastestCapacity)
    ),
    ProcessTimeRaw is TotalContainers / EffectiveCap,
    
    % Round up to nearest integer and ensure minimum 1 hour if there are containers
    (TotalContainers > 0 -> ProcessTime is ceiling(ProcessTimeRaw), (ProcessTime < 1 -> ProcessTimeFinal = 1 ; ProcessTimeFinal = ProcessTime) ; ProcessTimeFinal = 0),
    
    % Round ETA and ETD to integers for genetic algorithm
    ETAInt is ceiling(ETAHour),
    ETDInt is ceiling(ETDHour),
    
    % Create vessel fact: vessel(VesselIMO, ProcessTime, ETA, ETD)
    assertz(vessel(VesselIMO, ProcessTimeFinal, ETAInt, ETDInt)),
    
    with_output_to(user_error, format('Vessel ~w: ProcessTime=~w, ETA=~w, ETD=~w~n', 
        [VesselIMO, ProcessTimeFinal, ETAInt, ETDInt])),
    
    process_genetic_vessels(Rest, MedianCapacity, FastestCapacity, EnableMultiCrane, RestCount),
    Count is RestCount + 1.

% Convert triplets (from genetic algorithm) to schedule format
triplets_to_schedule([], []).
triplets_to_schedule([(VesselId, Start, End)|Rest], [Entry|RestEntries]) :-
    Entry = _{
        vessel: VesselId,
        start: Start,
        end: End
    },
    triplets_to_schedule(Rest, RestEntries).

% Helper predicates (reuse from http_handler.pl)
count_cargo([], _, 0).
count_cargo([M|Rest], TypeAtom, Count) :-
    string_lower(M.manifestType, ManifestType),
    Entries = M.get(entries, []),
    length(Entries, NumEntries),
    atom_string(TypeAtom, TypeString),
    (ManifestType = TypeString -> ThisCount = NumEntries ; ThisCount = 0),
    count_cargo(Rest, TypeAtom, OtherCount),
    Count is ThisCount + OtherCount.

datetime_to_hour(DateTimeStr, HourDecimal) :-
    sub_atom(DateTimeStr, _, _, After, "T"),
    sub_atom(DateTimeStr, _, After, 0, TimePart),
    split_string(TimePart, ":", "", [HStr, MStr | _]),
    number_string(H, HStr),
    number_string(M, MStr),
    HourDecimal is H + (M / 60).