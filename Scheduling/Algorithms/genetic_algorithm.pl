:-dynamic generations/1.
:-dynamic population/1.
:-dynamic prob_crossover/1.
:-dynamic prob_mutation/1.
:- dynamic stable_limit/1.
:- dynamic time_limit/1.
:- dynamic start_time/1.

% vessel(Id,ProcessTime,ETA,ETD).
% vessel(va,26, 6, 63 ). 
% vessel(vb,16, 23, 50 ). 
% vessel(vc,17, 8, 40 ).
% vessel(vd,8, 27, 40 ). 
% vessel(ve,12, 36, 70). 
% vessel(vf,14, 40, 60 ). 
% vessel(vg,19, 52, 80 ). 
% vessel(vi,21, 61, 90 ). 
% vessel(vj,14, 74, 100 ). 
% vessel(vk,14, 81, 110). 
% vessel(vl,40, 90, 140). 
% vessel(vm,15, 112, 140). 
% vessel(vn,25, 82, 135). 

% vessel(NVessels).
% vessels(13).


% parameters initialization
initialize_params(NG, PS, PCPercent, PMPercent, StableLimit, TimeLimit) :-
    (retract(generations(_));true), asserta(generations(NG)),
    (retract(population(_));true), asserta(population(PS)),
    PC is PCPercent / 100,
    PM is PMPercent / 100,
    (retract(prob_crossover(_));true), asserta(prob_crossover(PC)),
    (retract(prob_mutation(_));true), asserta(prob_mutation(PM)),
    (retract(stable_limit(_));true), asserta(stable_limit(StableLimit)),
    (retract(time_limit(_));true), assert(time_limit(TimeLimit)).

generate(Result):-
    get_time(Start),
    asserta(start_time(Start)),
    generate_population(Pop),
    % write('Pop='),write(Pop),nl,
    evaluate_population(Pop,PopValue),
    % write('PopValue='),write(PopValue),nl,
    order_population(PopValue,PopOrd),
    generations(NG),
    generate_generation(0,NG,PopOrd,0,none,Best),
    return_best_solution(Best, Result).

generate_population(Pop):-
    population(PopSize),
    vessels(NumV),
    findall(Vessel,vessel(Vessel,_,_,_),VesselsList),
    generate_population(PopSize,VesselsList,NumV,Pop).


generate_population(0,_,_,[]):-!.
generate_population(PopSize,VesselsList,NumV,[Ind|Rest]):-
    PopSize1 is PopSize-1,
    generate_population(PopSize1,VesselsList,NumV,Rest),
    generate_individual(VesselsList,NumV,Ind),
    not(member(Ind,Rest)).    
generate_population(PopSize,VesselsList,NumV,L):-
    generate_population(PopSize,VesselsList,NumV,L).


generate_individual([G],1,[G]):-!.

generate_individual(VesselsList,NumV,[G|Rest]):-
    NumTemp is NumV + 1, % to use with random
    random(1,NumTemp,N),
    remove(N,VesselsList,G,NewList),
    NumV1 is NumV-1,
    generate_individual(NewList,NumV1,Rest).

remove(1,[G|Rest],G,Rest).
remove(N,[G1|Rest],G,[G1|Rest1]):- N1 is N-1,
            remove(N1,Rest,G,Rest1).

evaluate_population([],[]).
evaluate_population([Ind|Rest],[Ind*V|Rest1]):-
    evaluate(Ind,V),
    evaluate_population(Rest,Rest1).

evaluate(Seq,DelayTotal):-
    sequence_temporization(Seq,Triplets),
    sum_delays(Triplets,DelayTotal).

sequence_temporization(LV,SeqTriplets):-
	sequence_temporization1(0,LV,SeqTriplets).


sequence_temporization1(EndPrevSeq,[V|LV],[(V,Start,End)|SeqTriplets]):-
    vessel(V, ProcTime, ETA, _),
	(ETA > EndPrevSeq -> Start = ETA ; Start = EndPrevSeq),
	End is Start + ProcTime,
	sequence_temporization1(End,LV,SeqTriplets).

sequence_temporization1(_,[],[]).


sum_delays([],0).

sum_delays([(V,_,End)|LV],S):-
	vessel(V,_,_,ETD),
    TPossibleDep is End + 1,
	(TPossibleDep > ETD -> Delay is TPossibleDep - ETD ; Delay is 0),
	sum_delays(LV,SLV),
	S is Delay + SLV.



order_population(PopValue,PopValueOrd):-
    bsort(PopValue,PopValueOrd).

bsort([X],[X]):-!.
bsort([X|Xs],Ys):-
    bsort(Xs,Zs),
    bchange([X|Zs],Ys).


bchange([X],[X]):-!.

bchange([X*VX,Y*VY|L1],[Y*VY|L2]):-
    VX>VY,!,
    bchange([X*VX|L1],L2).
bchange([X|L1],[X|L2]):-bchange(L1,L2).


next_population(Pop, Children, NextPop):-
    append(Pop, Children, Combined0),
    remove_duplicates(Combined0, Combined1),
    order_population(Combined1, Sorted),
    population(N),
    EliteFraction = 0.3,
    EliteCount0 is round(N * EliteFraction),
    (EliteCount0 < 1 -> EliteCount = 1 ; EliteCount = EliteCount0),
    split_elite(Sorted, EliteCount, Elite, Rest),
    roulette_select(Rest, N, EliteCount, SelectedRest),                  % seleção não elitista no resto
    append(Elite, SelectedRest, NextPop).                                % juntar elite + seleção


remove_duplicates(List, NoDup) :-
    remove_duplicates(List, [], NoDup).

remove_duplicates([], _, []).
remove_duplicates([Ind*V | R], Seen, Out) :-
    ( member(Ind, Seen) -> remove_duplicates(R, Seen, Out); Out = [Ind*V | R2], remove_duplicates(R, [Ind|Seen], R2)).


split_elite(List, N, Elite, Rest) :-
    length(Elite, N),
    append(Elite, Rest, List).


roulette_select(Rest, PopSize, EliteCount, Selected) :-
    Remaining is PopSize - EliteCount,
    (Remaining =< 0 -> Selected = [] ;
        weight_random(Rest, Weighted),
        sort(Weighted, Sorted),              % ordena por (V*Rnd)
        take_first(Remaining, Sorted, FirstK),
        strip_pairs(FirstK, Selected)
    ).

take_first(0, _, []) :- !.
take_first(_, [], []) :- !.
take_first(N, [X|R], [X|R2]) :-
    N1 is N - 1,
    take_first(N1, R, R2).

strip_pairs([], []).
strip_pairs([_-(Ind*V) | R], [Ind*V | R2]) :-
    strip_pairs(R, R2).

weight_random([], []).
weight_random([Ind*V | R], [Prod-(Ind*V) | R2]) :-
    random(0.0,1.0,Rnd),
    Prod is V * Rnd,
    weight_random(R, R2).

generate_generation(_,_,[],_,_,_) :-
    % write('Stopping: empty population (no solution).'), nl,
    fail.


generate_generation(G,G,[Best|_],_,_,Best):-!,
	% write('Stopping: reached max generations.'), nl,
    true. % print_best_solution(Best).

% STOP 2: time limit
generate_generation(_,_,[Best|_],_,_,Best) :-
    start_time(Start),
    get_time(Now),
    time_limit(TL),
    TL > -1,
    Now - Start >= TL, !,
    % write('Stopping: time limit reached.'), nl,
    true. % print_best_solution(Best).

% STOP 3: stabilization
generate_generation(_,_,Pop,StableCount,PrevBest,Best) :-
    Pop = [Best|_],
    Best = _*BestVal,
    stable_limit(SL),
    SL > 0,
    (PrevBest == none -> NewStable = 0;BestVal =:= PrevBest -> NewStable is StableCount + 1; NewStable = 0),
    NewStable >= SL, !,
    % write('Stopping: population stabilized.'), nl,
    true. % print_best_solution(Best).


generate_generation(N,G,Pop,StableCount,PrevBest,BestOut):-
	% write('Generation '), write(N), write(':'), nl, write(Pop), nl,

    Pop = [_*BestVal | _],
    (PrevBest == none -> NewStable = 0;BestVal =:= PrevBest -> NewStable is StableCount + 1; NewStable = 0),
    random_permutation(Pop, ShuffledPop),                                 % Evitar cruzar sempre (1,2), (3,4), ...
	crossover(ShuffledPop,NPop1),
	mutation(NPop1,NPop),
	evaluate_population(NPop,NPopValue),
    next_population(Pop,NPopValue, NextPop),
    order_population(NextPop, OrderedNext),
	N1 is N+1,
	generate_generation(N1,G,OrderedNext, NewStable, BestVal, BestOut).

generate_crossover_points(P1,P2):- generate_crossover_points1(P1,P2).

generate_crossover_points1(P1,P2):-
	vessels(N),
	NTemp is N+1,
	random(1,NTemp,P11),
	random(1,NTemp,P21),
	P11\==P21,!,
	((P11<P21,!,P1=P11,P2=P21);P1=P21,P2=P11).
generate_crossover_points1(P1,P2):-
	generate_crossover_points1(P1,P2).


crossover([ ],[ ]).
crossover([Ind*_],[Ind]).
crossover([Ind1*_,Ind2*_|Rest],[NInd1,NInd2|Rest1]):-
	generate_crossover_points(P1,P2),
	prob_crossover(Pcruz),random(0.0,1.0,Pc),
	((Pc =< Pcruz,!,
        cross(Ind1,Ind2,P1,P2,NInd1),
	  cross(Ind2,Ind1,P1,P2,NInd2))
	;
	(NInd1=Ind1,NInd2=Ind2)),
	crossover(Rest,Rest1).

fillh([ ],[ ]).

fillh([_|R1],[h|R2]):-
	fillh(R1,R2).

sublist(L1,I1,I2,L):-I1 < I2,!,
    sublist1(L1,I1,I2,L).

sublist(L1,I1,I2,L):-sublist1(L1,I2,I1,L).

sublist1([X|R1],1,1,[X|H]):-!, fillh(R1,H).

sublist1([X|R1],1,N2,[X|R2]):-!,N3 is N2 - 1,
	sublist1(R1,1,N3,R2).

sublist1([_|R1],N1,N2,[h|R2]):-N3 is N1 - 1,
		N4 is N2 - 1,
		sublist1(R1,N3,N4,R2).

rotate_right(L,K,L1):- vessels(N),
	T is N - K,
	rr(T,L,L1).

rr(0,L,L):-!.

rr(N,[X|R],R2):- N1 is N - 1,
	append(R,[X],R1),
	rr(N1,R1,R2).

remove([],_,[]):-!.

remove([X|R1],L,[X|R2]):- not(member(X,L)),!,
        remove(R1,L,R2).

remove([_|R1],L,R2):-
    remove(R1,L,R2).

insert([],L,_,L):-!.
insert([X|R],L,N,L2):-
    vessels(T),
    ((N>T,!,N1 is N mod T);N1 = N),
    insert1(X,N1,L,L1),
    N2 is N + 1,
    insert(R,L1,N2,L2).


insert1(X,1,L,[X|L]):-!.
insert1(X,N,[Y|L],[Y|L1]):-
    N1 is N-1,
    insert1(X,N1,L,L1).

cross(Ind1,Ind2,P1,P2,NInd11):-
    sublist(Ind1,P1,P2,Sub1),
    vessels(NumT),
    R is NumT-P2,
    rotate_right(Ind2,R,Ind21),
    remove(Ind21,Sub1,Sub2),
    P3 is P2 + 1,
    insert(Sub2,Sub1,P3,NInd1),
    removeh(NInd1,NInd11).


removeh([],[]).

removeh([h|R1],R2):-!,
    removeh(R1,R2).

removeh([X|R1],[X|R2]):-
    removeh(R1,R2).

mutation([],[]).
mutation([Ind|Rest],[NInd|Rest1]):-
	prob_mutation(Pmut),
	random(0.0,1.0,Pm),
	((Pm < Pmut,!,mutacao1(Ind,NInd));NInd = Ind),
	mutation(Rest,Rest1).

mutacao1(Ind,NInd):-
	generate_crossover_points(P1,P2),
	mutacao22(Ind,P1,P2,NInd).

mutacao22([G1|Ind],1,P2,[G2|NInd]):-
	!, P21 is P2-1,
	mutacao23(G1,P21,Ind,G2,NInd).
mutacao22([G|Ind],P1,P2,[G|NInd]):-
	P11 is P1-1, P21 is P2-1,
	mutacao22(Ind,P11,P21,NInd).

mutacao23(G1,1,[G2|Ind],G2,[G1|Ind]):-!.
mutacao23(G1,P,[G|Ind],G2,[G|NInd]):-
	P1 is P-1,
	mutacao23(G1,P1,Ind,G2,NInd).


% FUNÇOES AUXILIARES COMO PRINTS

print_best_solution(Seq*Delay):-
    write('\n=== Best Solution Found ===\n'),
    write('Sequence: '), write(Seq), nl,
    sequence_temporization(Seq, Triplets),
    write('Schedule:'), nl,
    print_triplets(Triplets),
    write('Total Delay: '), write(Delay), nl,
    start_time(Ti), get_time(Tf),
    ExecTime is Tf - Ti,
    write('Execution Time: '), write(ExecTime), nl,
    write('===========================\n').

print_triplets([]).
print_triplets([(V,Start,End)|R]):-
    write(V), write(': start='), write(Start),
    write(', end='), write(End), nl,
    print_triplets(R).

return_best_solution(Seq*Delay, Result) :-
    sequence_temporization(Seq, Triplets),
    start_time(Ti), get_time(Tf),
    ExecTime is Tf - Ti,
    Result = result{
        best_sequence: Seq,
        best_delay: Delay,
        triplets: Triplets,
        execution_time: ExecTime
    }.