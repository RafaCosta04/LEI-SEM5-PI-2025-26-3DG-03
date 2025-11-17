% Vessel facts: (Name, TIn, TDep, TUnload, TLoad)
%vessel(va, 6, 63, 10, 16).
%vessel(vb, 23, 50, 9, 7).
%vessel(vc, 8, 40, 5, 12).
%vessel(vd, 27, 40, 0, 8).
%vessel(ve, 36, 70, 12, 0).
%vessel(vf, 40, 60, 8, 6).
%vessel(vg, 52, 80, 9, 10).
%vessel(vi, 61, 90, 13, 8).
%vessel(vj, 74, 100, 7, 7).
%vessel(vk, 81, 110, 6, 8).
%vessel(vl, 90, 140, 22, 18).
%vessel(vm, 112, 140, 8, 7).
%vessel(vn, 82, 135, 13, 12).

% Safe logging helper: avoid exceptions if user_error/CGI stream is unavailable
safe_log_improved(Format, Args) :-
    catch(with_output_to(user_error, format(Format, Args)), _, true).

% Convert an ordered list of vessels into triplets of (V, TInUnload, TEndLoad)
sequence_temporization_improved(LV,SeqTriplets):-
    sequence_temporization1_improved(0,LV,SeqTriplets).

sequence_temporization1_improved(EndPrevSeq,[V|LV],[(V,TInUnload,TEndLoad)|SeqTriplets]):-
    vessel(V,TIn,_,TUnload,TLoad),
    ( (TIn> EndPrevSeq,!, TInUnload is TIn); TInUnload is EndPrevSeq+1),
    TEndLoad is TInUnload + TUnload+TLoad -1,
    sequence_temporization1_improved(TEndLoad,LV,SeqTriplets).

sequence_temporization1_improved(_,[],[]).


% Sum delays from a sequence of triplets
sum_delays_improved([],0).
sum_delays_improved([(V,_,TEndLoad)|LV],S):-
    vessel(V,_,TDep,_,_), TPossibleDep is TEndLoad+1,
    ( (TPossibleDep>TDep,!,SV is TPossibleDep-TDep); SV is 0),
    sum_delays_improved(LV,SLV),
    S is SV+SLV.


% -------------------------
% Greedy scheduler by slackRel
% (SLACK-REL ALGORITHM REMOVED)


% -------------------------
% Improved heuristics
% 1) Greedy insertion: build sequence incrementally choosing the vessel
%    whose append causes the smallest increase in total delay.
% 2) Local improvement: try pairwise swaps (hill-climb) to reduce delay.
% These keep low complexity but usually give much better results than
% the simple slackRel ordering.
% -------------------------

% Greedy insertion order
greedy_order_by_insertion(LV, OrderedLV) :-
    greedy_insertion_build(LV, [], OrderedLV).

greedy_insertion_build([], Acc, Acc).
greedy_insertion_build(Rem, Acc, Ordered) :-
    (Acc = [] -> CurrD = 0; (sequence_temporization_improved(Acc,AccTrip), sum_delays_improved(AccTrip,CurrD))),
    findall(Inc-V, (
        member(V, Rem),
        append(Acc, [V], NewSeqV),
        sequence_temporization_improved(NewSeqV, Trip),
        sum_delays_improved(Trip, D),
        Inc is D - CurrD
    ), Pairs),
    keysort(Pairs, Sorted),
    Sorted = [ _-BestV | _ ],
    select(BestV, Rem, Rem2),
    append(Acc, [BestV], Acc2),
    greedy_insertion_build(Rem2, Acc2, Ordered).


% Local improvement by pairwise swaps (hill-climbing)
local_improvement(SeqV, BestSeqV, BestDelay) :-
    sequence_temporization_improved(SeqV, Trip),
    sum_delays_improved(Trip, Delay),
    local_swap_optimize(SeqV, Delay, BestSeqV, BestDelay).

local_swap_optimize(Seq, Delay, BestSeq, BestDelay) :-
    length(Seq, N),
    findall(D2-Swapped, (
        between(1, N, I), Jstart is I+1, between(Jstart, N, J),
        swap_positions(Seq, I, J, Swapped),
        sequence_temporization_improved(Swapped, T2),
        sum_delays_improved(T2, D2)
    ), Results),
    ( Results = [] -> BestSeq = Seq, BestDelay = Delay
    ; keysort(Results, Sorted), Sorted = [MinD-BestCandidate|_],
        (MinD < Delay -> local_swap_optimize(BestCandidate, MinD, BestSeq, BestDelay)
        ; BestSeq = Seq, BestDelay = Delay)
    ).

% swap_positions: swap elements at positions I and J (1-based)
swap_positions(Seq, I, J, SeqOut) :-
    nth1(I, Seq, ElemI), nth1(J, Seq, ElemJ),
    set_nth1(Seq, I, ElemJ, Temp),
    set_nth1(Temp, J, ElemI, SeqOut).

set_nth1([_|T], 1, Elem, [Elem|T]).
set_nth1([H|T], N, Elem, [H|R]) :- N>1, N1 is N-1, set_nth1(T, N1, Elem, R).


% Improved scheduler wrapper: insertion + local improvement
schedule_greedy_improved(LV, FinalSeqTriplets, FinalDelay, TimeSecs) :-
    get_time(T0),
    greedy_order_by_insertion(LV, OrdLV),
    sequence_temporization_improved(OrdLV, OrdTrip), sum_delays_improved(OrdTrip, _OrdDelay),
    local_improvement(OrdLV, BestSeqV, BestDelay),
    sequence_temporization_improved(BestSeqV, FinalSeqTriplets),
    FinalDelay = BestDelay,
    get_time(T1), TimeSecs is T1 - T0.


obtain_seq_shortest_delay_improved(SeqTriplets, DelayHours, ExecutionTime) :-
    findall(V, vessel(V,_,_,_,_), LV),
    schedule_greedy_improved(LV, SeqTriplets, DelayHours, TimeSecs),
    ExecutionTime = TimeSecs,
    safe_log_improved('Time to generate the improved schedule (secs): ~w~n', [TimeSecs]).
    







