:- use_module(library(http/thread_httpd)).    
:- use_module(library(http/http_dispatch)).    
:- use_module(library(http/http_json)).
:- consult('http_handler.pl').

:- initialization(start_server).


start_server :-
    http_server(http_dispatch, [port(6000), reuse_addr(true)] ).
