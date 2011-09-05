// todo list example from angular
var UI = require('./ui');
var dom = require('apollo:dom');

//----------------------------------------------------------------------
// helpers:

function map(arr, f) {
  var rv = [];
  for (var i=0; i<arr.length;++i)
    rv.push(f(arr[i]));
  return rv;
}

function count(arr, condition) {
  var rv = 0;
  for (var i=0; i<arr.length; ++i)
    if (condition(arr[i])) ++rv;
  return rv;
}

//----------------------------------------------------------------------

function todo(item, uiparent) {
  using (var ui = UI.show("
<li foo='1'><input type='checkbox' @checked='{done}' mid='cb'><span>{text}</span></li>", 
                          uiparent)) {
    UI.supplant(ui, item);
    while (1) {
      dom.waitforEvent(ui.elems.cb, 'change');
      item.done = ui.elems.cb.checked;
    }
  }
}

function todolist(todos) {
  using (var ui = UI.show("
<form mid='form'>
  <input type='text' mid='text' size='35' placeholder='enter your todo here'>
  <input type='submit' value='add'><br>
  <span>{remaining} remaining</span>
  <input type='button' value='clean up' mid='clean'>
</form>

<ul mid='todos'></ul>
")) {
    function show_todo(item) { item.stratum = spawn todo(item, ui.elems.todos); return item; }
    map(todos, show_todo);
    while (1) {
      UI.supplant(ui, { 
        remaining: count(todos, function(item) { return !item.done}) 
      });
      try {
        dom.waitforEvent(ui.elems.form, 'submit').preventDefault();
        todos.push(show_todo({text:ui.elems.text.value, done:false}));
        ui.elems.text.value = "";
      }
      or {
        dom.waitforEvent(ui.elems.clean, 'click');
        map(todos, function(item) { if (item.done) item.stratum.abort(); });
      }
      or {
        dom.waitforEvent(ui.elems.todos, 'click');
      }      
    }
  }
}

todolist([{text:'learn sjs', done:true},
          {text:'build an sjs app', done:false}]);
