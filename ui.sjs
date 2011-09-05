var common = require('apollo:common');

/*

ui object:

{ 
  top :     array of top-level elements in this ui,
  elems :   hash of elements indexed by 'mid' attrib,
  templates: array of {elem, attrib, template, vars} objects
  }

*/

/**
   @function create
*/
var create = exports.create = function(html_str) {
  var holder = document.createElement("div");
  holder.innerHTML = html_str;

  // collect all children (holder.childNodes is fragile for some reason):
  var children = [], elem = holder.firstChild;
  while (elem) {
    children.push(elem);
    elem = elem.nextSibling;
  }

  // collect all elements with 'mid' attributes and index by mid:
  var mapped_elems = holder.querySelectorAll("[mid]");
  var elems = {};
  for (var i=0; i<mapped_elems.length; ++i)
    elems[mapped_elems[i].getAttribute('mid')] = mapped_elems[i];

  // collect all templates (potentially slow)
  var templates = [];
  var iter = document.createNodeIterator(holder, 
                                         NodeFilter.SHOW_ELEMENT|
                                         NodeFilter.SHOW_TEXT, null);
  var node, matches;
  while ((node=iter.nextNode())) {
    if (node.attributes) {
      for (var i=0; i<node.attributes.length; ++i) {
        if ((matches = node.attributes[i].value.match(/{[^\}]*}/g))) {
          templates.push({elem:   node, 
                          attrib: node.attributes[i].name,
                          template: node.attributes[i].value,
                          vars: map(matches, stripFirstLast)
                         });
        }
      }
    }
    else if (node.data && 
             ((matches = node.data.match(/{[^\}]*}/g)))) {
      templates.push({elem: node,
                      template: node.data,
                      vars: map(matches, stripFirstLast)
                     });
    }
  }

  return { 
    top : children,
    elems : elems,
    templates: templates
  };
};

/**
   @function append
*/
var append = exports.append = function(ui, dom_parent) {
  if (!dom_parent) dom_parent = document.body;
  for (var i=0; i<ui.top.length; ++i) {
//    console.log('appending '+ui.top[i]);
    dom_parent.appendChild(ui.top[i]);
  }
}

/**
   @function remove
*/
var remove = exports.remove = function(ui) {
  for (var i=0; i<ui.top.length; ++i) {
    if (ui.top[i].parentNode) 
      ui.top[i].parentNode.removeChild(ui.top[i]);
  }
}

/**
   @function supplant
*/
var supplant = exports.supplant = function(ui, replacements) {
  // we memoize replacements to allow for partial re-substitution:
  // e.g. in a template "{foo} {bar}", we might replace both foo and bar
  // and then at a later stage only bar.
  replacements = ui.replacements = 
    common.mergeSettings(ui.replacements, replacements);

  map(ui.templates, function(t) {    
    if (!any(t.vars, function(x) { return replacements[x]!==undefined; })) return;
    var s = common.supplant(t.template, replacements);
    if (t.attrib) {
      if (t.attrib.charAt(0) == '@') { 
        // a mapped property rather than an attrib
        if (t.template.length == t.vars[0].length+2) {
          // special case; template is of simple type '{foo}'
          // instead of supplanting strings, we allow supplanting of any value here
          // so that we can do things like checkbox.checked=true
          t.elem[t.attrib.substr(1)] = replacements[t.vars[0]];
        }
        else
          t.elem[t.attrib.substr(1)] = s;
      }
      else
        t.elem.setAttribute(t.attrib, s);
    }
    else {
      s = document.createTextNode(s);
      t.elem.parentNode.replaceChild(s, t.elem);
      t.elem = s;
    }
  });
};

/**
  @function show
  @summary = create + append + remove for use in 'using'
*/
var show = exports.show = function(html_str, parent) {
  var ui = create(html_str);
  ui.__finally__ = function() { remove(ui); };
  append(ui, parent);
  return ui;
};

//----------------------------------------------------------------------
// helpers

function map(arr, f) {
  var rv = [];
  for (var i=0; i<arr.length;++i)
    rv.push(f(arr[i]));
  return rv;
}

function any(arr, f) {
  var rv = [];
  for (var i=0; i<arr.length;++i)
    if (f(arr[i])) return true;
  return false;
}

function stripFirstLast(x) { return x.substr(1,x.length-2) }
