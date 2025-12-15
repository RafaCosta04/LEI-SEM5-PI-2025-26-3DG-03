:- use_module(library(http/thread_httpd)).    
:- use_module(library(http/http_dispatch)).    
:- use_module(library(http/http_json)).
:- consult('http_handler.pl').

:- initialization(start).

start :-
    start_server,
    wait_forever.

start_server :-
    http_server(http_dispatch, [
        port(6000), 
        reuse_addr(true),
        timeout(300),           % Worker timeout em segundos (5 minutos)
        workers(10)             % Número de workers
    ]).

wait_forever :-
    thread_get_message(_).
