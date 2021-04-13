'use strict';

require( 'dotenv' ).config();
const express = require( 'express' );
const server = express();
// To tell the express that we are using the ejs
server.set( 'view engine', 'ejs' );

const PORT = process.env.PORT || 5000;

// const cors = require( 'cors' );
// server.use( cors() );

const superAgent = require( 'superagent' );
const pg = require( 'pg' );
// const { response } = require( 'express' );
// const { request } = require('node:http');
server.use( express.static( 'public' ) );
server.use( express.urlencoded( { extended: true } ) );

server.get( '/', homePage );
server.get( '/searches/new', formPage );
server.post( '/searches', renderBooks );
server.get( '*', ( request, response ) => response.status( 404 ).render( 'pages/error' ) );


function homePage ( request, response ){
  response.render( 'pages/index' );
}
function formPage ( request,response ){
  response.render( 'pages/searches/new' );
}

function renderBooks( request,response ){
  let requested = request.body.searchFor;
  let requestedBy = request.body.searchIn;
  console.log( request.body );
  let url = `https://www.googleapis.com/books/v1/volumes?q=${requested}+${requestedBy}`;
  superAgent.get( url )
    .then( booksData=>{
      console.log( booksData.body.items );
      let results = booksData.body.items.map( element => new Book( element ) );
      response.render( 'pages/searches/show', {'booksArray' : results} );

    } ).catch( error => {
      response.send( error );
    } );
}

function Book ( data ){
  this.image = ( data.volumeInfo.imageLinks ) ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = ( data.volumeInfo.title ) ? data.volumeInfo.title : 'Not Avialable';
  this.author = ( data.volumeInfo.authors ) ? data.volumeInfo.authors : 'Not Avialable' ;
  this.description = ( data.volumeInfo.description ) ? data.volumeInfo.description : 'Not Avialable';
}


server.listen( PORT, ()=>{
  console.log( `Listening on PORT ${PORT}` );
} );
