:- module(automatic_controller, [select_and_run_algorithm/5, select_and_run_with_rebalancing/6]).

:- use_module(library(http/json)).

% Dynamic predicates for vessel data
:- dynamic vessel/6.

% Load algorithm modules
:- ensure_loaded('../Algorithms/vessel_schedule.pl').
:- ensure_loaded('../Algorithms/improved_vessel_schedule.pl').
:- ensure_loaded('../Algorithms/improved_genetic_algorithm.pl').
:- ensure_loaded('../Algorithms/rebalancing_algorithm.pl').

% Safe logging helper
safe_log(Format, Args) :-
    catch(with_output_to(user_error, format(Format, Args)), _, true).

%% select_and_run_algorithm(+MaxCranes, +TimeLimit, -SeqResult, -DelayResult, -AlgorithmInfo)
%
% Automatically selects and runs the most appropriate scheduling algorithm based on:
% - Problem size (number of vessels)
% - Computational budget / urgency (TimeLimit parameter)
% - Complexity analysis and real-time requirements
%
% Selection Policy (Professors Guidance):
% - Optimal (Generate All & Select Better): For small instances (≤10 vessels)
%   * Guarantees best solution is achieved
%   * Manageable complexity for small n
%
% - Heuristic (Simple & Fast): When immediate solution needed
%   * TimeLimit = 0 or very small → forces heuristic even for large instances
%   * Provides quick response for real-time requirements
%
% - Genetic (Adequate Parametrization): For large instances with adequate time
%   * NumVessels ≥ 15 AND TimeLimit ≥ 5 hours
%   * Better exploration with proper parametrization based on available time
%
% @param MaxCranes The maximum number of cranes available
% @param TimeLimit Computational budget in hours (0=immediate, >0=time available)
% @param SeqResult The resulting schedule (list of vessel operations with timings)
% @param DelayResult The total delay value
% @param AlgorithmInfo Dictionary containing algorithm selection info and metadata
select_and_run_algorithm(MaxCranes, TimeLimit, SeqResult, DelayResult, AlgorithmInfo) :-
    % Gather problem characteristics
    findall(V, vessel(V,_,_,_,_,_), VesselList),
    length(VesselList, NumVessels),
    
    % Calculate simulation time horizon (difference between earliest ETA and latest ETD)
    findall(TIn, vessel(_, TIn, _, _, _, _), ETAs),
    findall(TDep, vessel(_, _, TDep, _, _, _), ETDs),
    (ETAs \= [], ETDs \= [] ->
        min_list(ETAs, MinETA),
        max_list(ETDs, MaxETD),
        SimulationTimeHours is MaxETD - MinETA
    ;
        SimulationTimeHours = 0
    ),
    
    % Log problem characteristics
    safe_log('~n=== AUTOMATIC ALGORITHM SELECTION ===~n', []),
    safe_log('Problem Characteristics:~n', []),
    safe_log('  - Number of vessels: ~w~n', [NumVessels]),
    safe_log('  - Simulation time horizon: ~w hours~n', [SimulationTimeHours]),
    safe_log('  - Max cranes available: ~w~n', [MaxCranes]),
    safe_log('  - User-specified time limit: ~w hours~n', [TimeLimit]),
    
    % Select algorithm based on policy
    select_algorithm(NumVessels, SimulationTimeHours, TimeLimit, SelectedAlgorithm, Reason),
    
    % Log selection
    safe_log('~nSelected Algorithm: ~w~n', [SelectedAlgorithm]),
    safe_log('Reason: ~w~n', [Reason]),
    safe_log('~n======================================~n~n', []),
    
    % Run the selected algorithm
    get_time(StartTime),
    run_algorithm(SelectedAlgorithm, MaxCranes, SeqResult, DelayResult, ExecutionTime, CraneMode),
    get_time(EndTime),
    ActualExecutionTime is EndTime - StartTime,
    
    % Prepare algorithm info for response
    AlgorithmInfo = _{
        selectedAlgorithm: SelectedAlgorithm,
        selectionReason: Reason,
        craneMode: CraneMode,
        problemSize: _{
            numberOfVessels: NumVessels,
            simulationTimeHours: SimulationTimeHours,
            maxCranes: MaxCranes
        },
        executionTime: ActualExecutionTime,
        algorithmExecutionTime: ExecutionTime
    },
    
    % Log results
    safe_log('Algorithm execution completed:~n', []),
    safe_log('  - Total delay: ~w~n', [DelayResult]),
    safe_log('  - Execution time: ~w seconds~n', [ActualExecutionTime]).

%% select_algorithm(+NumVessels, +SimulationTimeHours, +TimeLimit, -Algorithm, -Reason)
%
% Implements the algorithm selection policy based on problem size AND time availability:
%
% Policy (both factors considered simultaneously):
% 1. TimeLimit = 0 (immediate urgency): Use heuristic
%    - Real-time requirement regardless of vessel count
%    - Fast execution for immediate response
%
% 2. Small instances (≤10 vessels) with adequate time (≥24 hours): Use optimal
%    - Guarantees the best solution is achieved
%    - Complexity is manageable for small n
%    - Requires at least 24 hours to justify computation time
%
% 3. Large instances (>10 vessels): Decision based on available time:
%    a) TimeLimit < 24 hours: Use heuristic
%       - Insufficient time for complex optimization
%       - Fast solution for urgent scenarios
%    
%    b) TimeLimit ≥ 1 month (720 hours): Use genetic (standard)
%       - Adequate time for genetic evolution
%       - Better exploration of solution space
%       - Standard population/generation parameters
%
%    c) TimeLimit ≥ 3 months (2160 hours): Use genetic (enhanced)
%       - Extended time allows bigger population and more generations
%       - Deeper exploration for highest quality solution
%       - Increased parametrization for optimal convergence
%
% @param NumVessels Number of vessels to schedule
% @param SimulationTimeHours Time horizon of the simulation (informational)
% @param TimeLimit Computational budget available (0 = immediate, >0 = time available)
% @param Algorithm The selected algorithm name
% @param Reason Text explanation of why this algorithm was chosen
select_algorithm(NumVessels, _SimulationTimeHours, TimeLimit, Algorithm, Reason) :-
    % Priority 1: Immediate solution needed (real-time requirement) - regardless of vessel count
    (   TimeLimit =:= 0
    ->  Algorithm = heuristic,
        format(atom(Reason), 'Immediate urgency (TimeLimit=0): Heuristic provides fast response for ~w vessel(s)', [NumVessels])
    
    % Priority 2: Time available - decision based on BOTH problem size AND time budget
    ;   TimeLimit > 0 ->
        (   % Small instances with adequate time (>=24h): use optimal
            NumVessels =< 10, TimeLimit >= 24
        ->  Algorithm = optimal,
            format(atom(Reason), 'Small instance (~w vessels <= 10) with adequate time (~2f hours >= 24h): Optimal guarantees best solution', [NumVessels, TimeLimit])
        
        % Small instances with limited time (<24h): use heuristic (not worth optimal computation)
        ;   NumVessels =< 10, TimeLimit < 24
        ->  Algorithm = heuristic,
            format(atom(Reason), 'Small instance (~w vessels <= 10) with limited time (~2f hours < 24h): Heuristic for quick result', [NumVessels, TimeLimit])
        
        % Large instances with very long time (>=3 months = 2160h): enhanced genetic
        ;   NumVessels > 10, TimeLimit >= 2160
        ->  Algorithm = genetic_enhanced,
            format(atom(Reason), 'Large instance (~w vessels) with extended time (~2f hours >= 3 months): Genetic with enhanced parameters (bigger population & generations)', [NumVessels, TimeLimit])
        
        % Large instances with long time (>=1 month = 720h): standard genetic
        ;   NumVessels > 10, TimeLimit >= 720
        ->  Algorithm = genetic,
            format(atom(Reason), 'Large instance (~w vessels) with adequate time (~2f hours >= 1 month): Genetic with standard parametrization', [NumVessels, TimeLimit])
        
        % Large instances with medium time (<1 month = 720h): optimal
        ;   NumVessels > 10, TimeLimit < 720
        ->  Algorithm = optimal,
            format(atom(Reason), 'Large instance (~w vessels) with medium time (~2f hours < 1 month): Optimal for guaranteed best solution', [NumVessels, TimeLimit])
        
        % Fallback (should not reach here)
        ;   Algorithm = heuristic,
            format(atom(Reason), 'Default: Heuristic (~w vessels, TimeLimit=~2f hours)', [NumVessels, TimeLimit])
        )
    
    % Ultimate fallback
    ;   Algorithm = heuristic,
        format(atom(Reason), 'Fallback: Heuristic (~w vessels, TimeLimit=~w)', [NumVessels, TimeLimit])
    ).

%% run_algorithm(+Algorithm, +MaxCranes, -SeqResult, -DelayResult, -ExecutionTime)
%
% Executes the specified algorithm and returns results
%
% @param Algorithm The algorithm to run (optimal, heuristic, or genetic)
% @param MaxCranes Maximum number of cranes available
% @param SeqResult The resulting schedule
% @param DelayResult The total delay
% @param ExecutionTime Time taken to compute the solution
run_algorithm(optimal, MaxCranes, SeqResult, DelayResult, ExecutionTime, CraneMode) :-
    safe_log('Running OPTIMAL algorithm (brute-force permutation)...~n', []),
    % Use the standard vessel_schedule algorithm (optimal permutation search)
    obtain_seq_shortest_delay_multi(SeqResult, DelayResult, ExecutionTime, MaxCranes),
    detect_crane_mode(SeqResult, CraneMode).

run_algorithm(heuristic, MaxCranes, SeqResult, DelayResult, ExecutionTime, CraneMode) :-
    safe_log('Running HEURISTIC algorithm (greedy insertion + local search)...~n', []),
    % Use the improved vessel schedule algorithm (greedy + hill climbing)
    obtain_seq_shortest_delay_improved_multi(SeqResult, DelayResult, ExecutionTime, MaxCranes),
    detect_crane_mode(SeqResult, CraneMode).

run_algorithm(genetic, _MaxCranes, SeqResult, DelayResult, ExecutionTime, CraneMode) :-
    safe_log('Running GENETIC algorithm (standard parametrization)...~n', []),
    run_genetic_with_params(100, 10, SeqResult, DelayResult, ExecutionTime),
    detect_crane_mode(SeqResult, CraneMode).

run_algorithm(genetic_enhanced, _MaxCranes, SeqResult, DelayResult, ExecutionTime, CraneMode) :-
    safe_log('Running GENETIC algorithm (ENHANCED parametrization - bigger population & generations)...~n', []),
    % Enhanced parameters for long-term optimization (>=3 months available)
    % Increased generations and population size for deeper exploration
    run_genetic_with_params(500, 50, SeqResult, DelayResult, ExecutionTime),
    detect_crane_mode(SeqResult, CraneMode).

%% detect_crane_mode(+SeqResult, -CraneMode)
%
% Detects whether single-crane or multi-crane was used
detect_crane_mode(SeqResult, CraneMode) :-
    ( SeqResult = [] -> CraneMode = single_crane
    ; SeqResult = [FirstEntry|_],
      ( FirstEntry = (_, _, _, _, CraneCount) ->
          ( member((_, _, _, _, N), SeqResult), N > 1 ->
              CraneMode = multi_crane
          ;   CraneMode = single_crane
          )
      ; CraneMode = single_crane
      )
    ).

%% run_genetic_with_params(+Generations, +Population, -SeqResult, -DelayResult, -ExecutionTime)
%
% Helper predicate to run genetic algorithm with specified parameters
%
% @param Generations Number of generations to evolve
% @param Population Population size for genetic algorithm
% @param SeqResult The resulting schedule
% @param DelayResult The total delay
% @param ExecutionTime Time taken to compute the solution
run_genetic_with_params(Generations, Population, SeqResult, DelayResult, ExecutionTime) :-
    
    % The improved genetic algorithm uses vessel/5 format: vessel(Id, ProcessTime, ETA, ETD, MaxCranes)
    % We need to convert from vessel/6 format: vessel(Name, TIn, TDep, TUnload, TLoad, MaxC)
    % Clear old genetic facts and create new ones
    retractall(vessel(_,_,_,_,_)),
    retractall(vessels(_)),
    
    % Convert vessel/6 facts to vessel/5 facts for improved genetic algorithm
    findall(V, vessel(V,_,_,_,_,_), VesselList),
    length(VesselList, NumVessels),
    assertz(vessels(NumVessels)),
    
    % Create vessel/5 facts from vessel/6 facts
    forall(
        vessel(Name, TIn, TDep, TUnload, TLoad, MaxC),
        (
            ProcTime is TUnload + TLoad,
            assertz(vessel(Name, ProcTime, TIn, TDep, MaxC))
        )
    ),
    
    % Set genetic algorithm parameters based on input
    % Parameters: initialize_params(Generations, PopulationSize, SelectionPct, MutationPct, CrossoverType, MultiCranes)
    retractall(generations(_)),
    retractall(population(_)),
    retractall(selection(_)),
    retractall(mutation(_)),
    retractall(crossover(_)),
    retractall(multicranes(_)),
    
    % Use provided parameters with standard selection/mutation/crossover ratios
    initialize_params(Generations, Population, 80, 10, 0, -1),
    
    safe_log('  Genetic parameters: Generations=~w, Population=~w~n', [Generations, Population]),
    
    % Run improved genetic algorithm with multi-crane support
    generate_multi(Result),
    
    % Extract results - the improved genetic algorithm returns a result dict
    DelayResult = Result.best_delay,
    Triplets = Result.triplets,
    ExecutionTime = Result.execution_time,
    
    % The improved genetic algorithm already returns triplets in the correct format
    % (with exec time and crane allocation if multi-crane was applied)
    SeqResult = Triplets,
    
    safe_log('Genetic algorithm completed. Best delay: ~w, Execution time: ~w~n', [DelayResult, ExecutionTime]).

%% select_and_run_with_rebalancing(+Docks, +MaxCranes, +TimeLimit, -SeqResult, -DelayResult, -AlgorithmInfo)
%
% Advanced scheduling with rebalancing: first distributes vessels across docks,
% then applies automatic algorithm selection per dock based on each docks characteristics.
%
% This allows different docks to use different algorithms:
% - Dock A with 10 vessels after rebalancing → uses optimal
% - Dock B with 15 vessels and short time horizon → uses heuristic
% - Dock C with 20 vessels and long time horizon → uses genetic
%
% @param Docks List of dock dictionaries with name and operational capacity
% @param MaxCranes Maximum number of cranes available per dock
% @param TimeLimit Time limit for computation (in hours)
% @param SeqResult Aggregated schedule from all docks
% @param DelayResult Total delay across all docks
% @param AlgorithmInfo Dictionary containing rebalancing and algorithm selection info
select_and_run_with_rebalancing(Docks, MaxCranes, TimeLimit, SeqResult, DelayResult, AlgorithmInfo) :-
    safe_log('~n=== REBALANCING-BASED SCHEDULING ===~n', []),
    safe_log('Step 1: Running rebalancing algorithm to distribute vessels across docks...~n', []),
    
    % Run rebalancing to assign vessels to docks
    get_time(RebalanceStart),
    rebalance_assignments(Assignments),
    get_time(RebalanceEnd),
    RebalanceTime is RebalanceEnd - RebalanceStart,
    
    length(Assignments, NumAssignments),
    safe_log('Rebalancing completed: ~w vessel assignments in ~w seconds~n', [NumAssignments, RebalanceTime]),
    
    % Group vessels by dock
    group_vessels_by_dock(Assignments, DockGroups),
    length(DockGroups, NumDocks),
    safe_log('Vessels distributed across ~w docks~n', [NumDocks]),
    
    safe_log('~nStep 2: Applying automatic algorithm selection per dock...~n', []),
    
    % For each dock, select and run the appropriate algorithm
    process_docks_with_auto_selection(DockGroups, Docks, MaxCranes, TimeLimit, DockResults),
    
    % Aggregate results from all docks
    aggregate_dock_results(DockResults, SeqResult, DelayResult, AlgorithmSummary),
    
    % Prepare comprehensive algorithm info
    AlgorithmInfo = _{
        approach: rebalancing_based,
        rebalancingTime: RebalanceTime,
        numberOfDocks: NumDocks,
        dockResults: DockResults,
        algorithmSummary: AlgorithmSummary,
        totalDelay: DelayResult
    },
    
    safe_log('~n=== REBALANCING-BASED SCHEDULING COMPLETE ===~n', []),
    safe_log('Total delay across all docks: ~w~n', [DelayResult]).

%% group_vessels_by_dock(+Assignments, -DockGroups)
% Groups vessel assignments by dock
% DockGroups = [dock_group(DockName, [VesselAssignments]), ...]
group_vessels_by_dock(Assignments, DockGroups) :-
    findall(Dock, member(assign(_,Dock,_,_,_,_,_), Assignments), AllDocks),
    sort(AllDocks, UniqueDocks),
    maplist(group_for_dock(Assignments), UniqueDocks, DockGroups).

group_for_dock(Assignments, Dock, dock_group(Dock, VesselAssignments)) :-
    findall(VesselAssignment, 
            member(assign(V,Dock,Start,DeclDep,Delay,ActualDep,ActualArr), Assignments),
            VesselAssignments),
    VesselAssignment = assign(V,Dock,Start,DeclDep,Delay,ActualDep,ActualArr).

%% process_docks_with_auto_selection(+DockGroups, +Docks, +MaxCranes, +TimeLimit, -DockResults)
% For each dock, analyze vessel assignments and select appropriate algorithm
process_docks_with_auto_selection([], _, _, _, []).
process_docks_with_auto_selection([dock_group(DockName, VesselAssignments)|RestDocks], Docks, MaxCranes, TimeLimit, [DockResult|RestResults]) :-
    length(VesselAssignments, NumVessels),
    
    % Find dock operational capacity
    ( member(_{name: DockName, medianOperationalCapacity: DockCap}, Docks) 
    -> true 
    ; DockCap = 1 % default if not found
    ),
    
    safe_log('~n--- Dock: ~w (~w vessels, capacity: ~w) ---~n', [DockName, NumVessels, DockCap]),
    
    % Calculate time horizon for this dock
    findall(Start, member(assign(_,_,Start,_,_,_,_), VesselAssignments), Starts),
    findall(ActualDep, member(assign(_,_,_,_,_,ActualDep,_), VesselAssignments), Deps),
    (Starts \= [], Deps \= [] ->
        min_list(Starts, MinStart),
        max_list(Deps, MaxDep),
        DockTimeHorizon is MaxDep - MinStart
    ;
        DockTimeHorizon = 0
    ),
    
    % Create temporary vessel facts for this dock only
    retractall(vessel(_,_,_,_,_,_)),
    create_vessel_facts_from_assignments(VesselAssignments, DockCap),
    
    % Select algorithm for this dock
    select_algorithm(NumVessels, DockTimeHorizon, TimeLimit, SelectedAlgo, Reason),
    safe_log('Selected algorithm for ~w: ~w~n', [DockName, SelectedAlgo]),
    safe_log('Reason: ~w~n', [Reason]),
    
    % Run the selected algorithm for this dock
    get_time(DockStart),
    run_algorithm(SelectedAlgo, MaxCranes, DockSchedule, DockDelay, _DockExecTime),
    get_time(DockEnd),
    DockActualTime is DockEnd - DockStart,
    
    safe_log('Dock ~w completed: delay=~w, time=~w sec~n', [DockName, DockDelay, DockActualTime]),
    
    % Store result for this dock
    DockResult = _{
        dock: DockName,
        algorithm: SelectedAlgo,
        reason: Reason,
        numVessels: NumVessels,
        timeHorizon: DockTimeHorizon,
        schedule: DockSchedule,
        delay: DockDelay,
        executionTime: DockActualTime
    },
    
    process_docks_with_auto_selection(RestDocks, Docks, MaxCranes, TimeLimit, RestResults).

%% create_vessel_facts_from_assignments(+VesselAssignments, +DockCapacity)
% Creates vessel/6 facts from rebalancing assignments
create_vessel_facts_from_assignments([], _).
create_vessel_facts_from_assignments([assign(VesselName,_Dock,ArrivalTime,DeclaredDep,_Delay,_ActualDep,_ActualArr)|Rest], DockCap) :-
    % Get original vessel cargo information
    ( rebalancing_algorithm:vessels(VesselName, _, _, TotalContainers) 
    -> Cargo = TotalContainers
    ; Cargo = 0
    ),
    
    % Estimate loading and unloading time based on cargo and capacity
    % Assume 50/50 split between loading and unloading for simplicity
    (DockCap =:= 0 -> EffCap = 1 ; EffCap = DockCap),
    TotalTime is Cargo / EffCap,
    UnloadTime is TotalTime / 2,
    LoadTime is TotalTime / 2,
    
    % Create vessel/6 fact: vessel(Name, TIn, TDep, TUnload, TLoad, MaxCranes)
    assertz(vessel(VesselName, ArrivalTime, DeclaredDep, UnloadTime, LoadTime, 3)),
    
    create_vessel_facts_from_assignments(Rest, DockCap).

%% aggregate_dock_results(+DockResults, -AggregatedSchedule, -TotalDelay, -AlgorithmSummary)
% Combines results from all docks
aggregate_dock_results(DockResults, AggregatedSchedule, TotalDelay, AlgorithmSummary) :-
    % Collect all schedules
    findall(Schedule, member(_{schedule: Schedule}, DockResults), AllSchedules),
    append(AllSchedules, AggregatedSchedule),
    
    % Sum all delays
    findall(Delay, member(_{delay: Delay}, DockResults), Delays),
    sum_list(Delays, TotalDelay),
    
    % Create algorithm summary
    findall(_{
        dock: Dock,
        algorithm: Algo,
        vessels: NumV,
        delay: D
    }, member(_{dock: Dock, algorithm: Algo, numVessels: NumV, delay: D}, DockResults), AlgorithmSummary).

