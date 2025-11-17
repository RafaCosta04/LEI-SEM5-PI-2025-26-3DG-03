:- dynamic shortest_delay/2.

% Safe logging helper: avoid exceptions if user_error/CGI stream is unavailable
safe_log(Format, Args) :-
    catch(with_output_to(user_error, format(Format, Args)), _, true).

sequence_temporization(LV,SeqTriplets):-
		sequence_temporization1(0,LV,SeqTriplets).


sequence_temporization1(EndPrevSeq,[V|LV],[(V,TInUnload,TEndLoad)|SeqTriplets]):-
			vessel(V,TIn,_,TUnload,TLoad),
			 ( (TIn> EndPrevSeq,!, TInUnload is TIn); TInUnload is EndPrevSeq+1),
		TEndLoad is TInUnload + TUnload+TLoad -1,
		sequence_temporization1(TEndLoad,LV,SeqTriplets).

sequence_temporization1(_,[],[]).


sum_delays([],0).

sum_delays([(V,_,TEndLoad)|LV],S):-
		vessel(V,_,TDep,_,_),TPossibleDep is TEndLoad+1,
		( (TPossibleDep>TDep,!,SV is TPossibleDep-TDep);SV is 0),
		sum_delays(LV,SLV),
		S is SV+SLV.


obtain_seq_shortest_delay(SeqBetterTriplets, SShortestDelay, ExecutionTime):-
    get_time(Ti),
    (obtain_seq_shortest_delay1;true),retract(shortest_delay(SeqBetterTriplets, SShortestDelay)),!,
    get_time(Tf),
    TimeSecs is Tf - Ti,
    ExecutionTime = TimeSecs,
    safe_log('Time to generate the shortest delay solution (secs): ~w~n', [TimeSecs]).

obtain_seq_shortest_delay1:-
    asserta(shortest_delay(_,100000)),
    findall(V,vessel(V,_,_,_,_),LV),
    permutation(LV,SeqV),
    sequence_temporization(SeqV,SeqTriplets),
    sum_delays(SeqTriplets,S),
    compare_shortest_delay(SeqTriplets,S),
    fail.

compare_shortest_delay(SeqTriplets,S):-
 shortest_delay(_,SLower),
    ((S<SLower,!,retract(shortest_delay(_,_)),asserta(shortest_delay(SeqTriplets,S)));true).



% ---------- Predicado de teste ----------
run_test :-
    obtain_seq_shortest_delay(Seq, Delay),
    safe_log('Melhor sequência: ~w~n', [Seq]),
    safe_log('Atraso total: ~w horas~n', [Delay]).