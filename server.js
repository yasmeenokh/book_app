'use strict';

require( 'dotenv' ).config();
const express = require( 'express' );
const server = express();
// To tell the express that we are using the ejs
server.set( 'view engine', 'ejs' );

const PORT = process.env.PORT || 5000;
const pg = require( 'pg' );
const methodOverride = require( 'method-override' );


const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client( { connectionString: process.env.DATABASE_URL,
  // ssl:{rejectUnauthorized: false
  // }

} );
server.use( methodOverride( '_method' ) );
// const cors = require( 'cors' );
// server.use( cors() );

const superAgent = require( 'superagent' );
// const { response } = require( 'express' );
// const { request } = require('node:http');
server.use( express.static( 'public' ) );
server.use( express.urlencoded( { extended: true } ) );

server.get( '/', homePage );
server.get( '/searches/new', formPage );
server.post( '/searches', renderBooks );
server.post( '/book', saveBooks );
server.get( '/book/:id', showDetails );
server.put( '/book/:id',updateBooks );
server.delete( '/delete/:id',deleteBooks );
server.get( '*', handleErrors );



function homePage ( request, response ){
  let SQL = 'SELECT * FROM books_table ;';
  client.query( SQL )
    .then( results => response.render( 'pages/index', {books: results.rows, totalCount: results.rowCount} ) );
  // response.render( 'pages/index' );
}
function formPage ( request,response ){
  response.render( 'pages/searches/new' )
    .catch( err=>{
      response.render( 'error',{error:err} );
    } );
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

function saveBooks( request, response ) {
  let { title, author, isbn, image_url, description} = request.body;
  console.log( 'checking ggg', request.body );
  let SQL = `INSERT INTO books_table (title, author, isbn, image_url, description)
              VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
  let safeValues = [title, author, isbn, image_url, description];
  client.query( SQL, safeValues )
    .then( results =>
      response.redirect( `/book/${results.rows[0].id}` ) )
  // ${results.rows[0].id}
    .catch( err=>{
      response.render( 'error',{error:err} );
    } );
}

function showDetails( request, response ) {
  let SQL = 'SELECT * FROM books_table WHERE id = $1;';
  let values = [request.params.id];
  client.query( SQL, values )
    .then( results => {
      console.log( results.rows[0] );
      response.render( 'pages/book/detail', {book: results.rows[0]} ); } )
    .catch( err=>{
      response.render( 'error',{error:err} );
    } );
}
function updateBooks ( request,response ){
  let { title, author, isbn, image_url, description} = request.body;
  console.log("bbbbbbb",request.body)
  let SQL = 'UPDATE books_table SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6 ;';
  let safeValues = [title, author, isbn, image_url, description, request.params.id];
  console.log( 'aaaaaa',request.params.id );
  client.query( SQL, safeValues )
    .then( result=>{
      response.redirect( `/book/${request.params.id}` );
    } );

}
function deleteBooks( req,res ) {
  let SQL = 'DELETE FROM books_table WHERE id=$1;';
  let value = [req.params.id];
  client.query( SQL,value )
    .then( res.redirect( '/' ) );
}

function handleErrors ( request, response ) {
  response.status( 404 ).render( 'pages/error' );
}

function Book ( data ){
  this.image = ( data.volumeInfo.imageLinks ) ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = ( data.volumeInfo.title ) ? data.volumeInfo.title : 'Not Avialable';
  this.author = ( data.volumeInfo.authors ) ? data.volumeInfo.authors : 'Not Avialable' ;
  this.description = ( data.volumeInfo.description ) ? data.volumeInfo.description : 'Not Avialable';
  this.isbn = data.volumeInfo.industryIdentifiers ? `${data.volumeInfo.industryIdentifiers[0].type}: ${data.volumeInfo.industryIdentifiers[0].identifier}` : 'Unknown ISBN';

}



client.connect()
  .then( () => {
    server.listen( PORT, () =>
      console.log( `listening on ${PORT}` )
    );
  } );
