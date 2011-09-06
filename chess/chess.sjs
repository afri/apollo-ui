var dom = require('apollo:dom');
var common = require('apollo:common');
var UI = require('../ui');

// XXX convert chess.js to a module; it pollutes the global namespace
eval(require('apollo:http').get(
  'http://code.onilabs.com/external/alex/chess.js/chess.js')); 
// -> exports Chess, rank(), file(), and others to global namespace

//----------------------------------------------------------------------

// css for chessboard:
dom.addCSS("
.chess-board {    
  position: relative;
  width: 344px; height: 344px;
  cursor: pointer;
  background: transparent url(http://code.onilabs.com/external/alex/jchess/images/bw-board.gif) no-repeat 0 0;
}

.chess-board div { position: absolute; width: 43px; height: 43px; padding: 0; margin: 0; } 
");

// css for pieces:
var piecesCssTemplate = "
.chess-board .w{piece} { 
  background: transparent url(http://code.onilabs.com/external/alex/jchess/images/chess-sets/acmaster.gif) -{x}px -{wy}px;
}
.chess-board .b{piece} { 
  background: transparent url(http://code.onilabs.com/external/alex/jchess/images/chess-sets/acmaster.gif) -{x}px -{by}px;
}
";

dom.addCSS(map("pnbrqk", function(piece,i) { 
  return common.supplant(piecesCssTemplate, 
                         { piece: piece, x:i*45+1, wy:1, by:46 });
}).join(" "));


//----------------------------------------------------------------------
// helpers

function showPiece(type, square, parent) {
  var piece = UI.show(
    "<div mid='piece' class='{type}' style='top:{y}px; left:{x}px'></div>",
    parent);
  UI.supplant(piece, {type:type, y:43*rank(square), x:43*file(square)});
  return piece;
}

function movePiece(piece, square) {
  UI.supplant(piece, {y:43*rank(square), x:43*file(square)});
}

function getSquare(piece) {
  var rank = parseInt((43/2+piece.elem.piece.offsetTop)/43);
  var file = parseInt((43/2+piece.elem.piece.offsetLeft)/43);
  return rank*16 + file;
}


//----------------------------------------------------------------------
// exports

exports.showBoard = function(parent) {
  var ui = UI.show("<div class='chess-board' mid='board'></div>", parent);
  var chess = new Chess;
  for (var square in chess.board) {
    var descr = chess.board[square];
    if (!descr) continue;
    showPiece(descr.color + descr.type, square, ui.elems.board);
  }

//  ui.
  return ui;
};


//----------------------------------------------------------------------
// backfill

function map(arr, f) {
  var rv = [];
  for (var i=0; i<arr.length; ++i)
    rv.push(f(arr[i], i));
  return rv;
}
