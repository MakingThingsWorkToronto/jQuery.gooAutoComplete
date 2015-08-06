# jQuery.gooAutoComplete
jQuery Plugin: Auto Complete / Type Forward, Responsive, Multi Column, Micro Templates, Multi Browser with example adapters for Azure &amp; SharePoint Search

## General Supported Options:

**maxItems:** Number (Default: 10), The maximum number of matched items to appear in the pop-up.

**exitOnClick:** Boolean (Default: false), A flag inidicating if the auto complete should be closed when the user clicks within the pop-up region.

**helpTimeout:** Number (Default: 3000), The number of milliseconds to display the help pop-up before fading out.

**minChars:** Number (Default: 3), The minimum number of characters typed before auto complete performs a lookup.

**useCache:** Boolean (Default: false), A flag indicating if the auto complete should cache lookup results into a search text based hash.  If true the getData method will only be triggered once per unique text phrase entered.  If false getData method will fire with every keystroke entered into the auto complete.

**position:** String (Default: "bottomleft"), A string indicating how to position the auto complete pop-up.  Options include: "bottomleft" - below the input field anchored left, "bottomright" - below the input field anchored right, "belowscreenleft" - below the input field at left:0px, "free" - positioning should be performed directly in CSS.

**multiSelectInput:** Boolean (Default: false),

**multiSelect:** Boolean (Default: false),

**maxColumnWidth:** Number (Default: 5000), The maximum number of pixels a column in the auto complete may span.

**showButton:** Boolean (Default: true), Determines if the plugin should add the search button to the right of the input text field.

**showHelp:** Boolean (Default: true), Determines if the plugin should display the help template when the user first puts their cursor into the text field.

**showSelected:** Boolean (Default: true)

**positionoffset:** Object (Default: { top: 0, left: 0 }), Coordinates to offset the position of the auto complete pop-up.


##HTML Template Options:

**multiSelectTemplate:** HTML Template (Default: below), The template to use for multi select items.
```html
<li class='ac-multi-item'><span>{Title}</span><div class='ac-multi-close'></div></li>
```

**buttonTemplate:** HTML Template (Default: below), The template to use for the search button.
```html
<div class='ac-button'></div>
```

**selectedTemplate:** HTML Template (Default: below), The template to use for the selected items.
```html
<ul class='ac-selected'>&nbsp;</ul>
```

**helpTemplate:** HTML Template (Default: below), the template to use for the help pop-up.
```html
<div class='ac-help'>
  <ul>
    <li><span>Type three characters to see quick results.</span></li>
    <li><span>Use up/down arrow to navigate items.</span></li>
    <li><span>Click search button to search site.</span></li>
    <li><span>Click item to search the term.</span></li>
    <li><input type='checkbox' name='chk-show-help' class='chk-show-help' /><label for='chk-show-help'>Don't show me this again.</label></li>
  </ul>
</div>
```

**boxTemplate:** HTML Template (Default: below), the template to use for the pop-up container.
```html
<ul class='ac body'><li class='ac-row row'></li></ul>
```

**loadTemplate:** HTML Template (Default: below), the template to use for the loading status message.
```html
<div class='ac-load'><span>Loading...</span></div>
```

**listTemplate:** HTML Template (Default: below), the template to use for the list container HTML Element.
```html
<ul class='ac-list page-width large-6 small-12 columns'><li class='ac-list-head'><h2>{Title}</h2></li></ul>
```

**listItemTemplate:** HTML Template (Default: below), the template to use for the list item HTML Element.
```html
<li class='ac-item'><a href='/{slug}' title='{title}'>{highlight:title}</a></li>
```

**altListItemTemplate:** HTML Template (Default: below), the template to use for the alternate list item HTML Element.
```html
<li class='ac-item ac-item-alt'><a href='/{slug}' title='{title}'>{highlight:title}</a></li>
```

**noResultsTemplate:** HTML Template (Default: below), the template to use when there are no results to display in the auto complete.
```html
<li class='ac-no-results'><span>No results</span></li>
```

##Functional Options

**afterRender:** Function (Default: below), an event handler executed after the auto complete pop up has rendered.
```javascript
function (menu, autoComplete) {
  // menu: pop-up menu HTML Element
  // autoComplete: the auto complete plugin object
  return;
}
```

**beforeRender:** Function (Default: below), an event handler executed before the auto complete pop up is rendered.
```javascript
function (menu, autoComplete) {
  // menu: pop-up menu HTML Element
  // autoComplete: the auto complete plugin object
  return;
}
```

**filter:** Function (Default: below), a custom filter override method.  This allows the user to customize filtering behaviour of items displayed within the pop-up list.
```javascript
function (dataItem, text) {
  // dataItem: the row level data item for comparison
  // text: the current auto complete text entered by the user
  // @returns Boolean, true to include item, false to omit item.
  return dataItem.title.toLowerCase().indexOf(text.toLowerCase()) > -1;
}
```

**go:** Function (Default: below), an event handler executed when the user selects an item in the pop-up list using the keyboard or invokes the search behaviour passing custom text.  Should be used for navigation.
```javascript
function (dataItem) {
  // dataItem: the row level data item selected by the user | the text entered into the auto complete input text field.
  if (typeof dataItem == "string") {
    window.location.href = dataItem;
  } else {
    window.location.href = "/" + dataItem.slug;
  }
}
```

**encodeSearchUrl:** Function (Default: below), a custom url processor override method.  This allows the user to encode a custom search route for the search query.
```javascript
function (arrParts) {
  // arrParts: array of selected row level data items, if multiSelect is enabled length may be > 1.
  // @return: String, url of search query.
  var url = "/search/";
  for (var p = 0; p < arrParts.length; p++) {
    if (typeof (arrParts[p]) == "string") {
      url += escape(arrParts[p].replace(/\s/g, "+")) + ",";
    } else {
      url += escape(arrParts[p].title.replace(/\s/g, "+")) + ",";
    }
  }
  return url.substr(0, url.length - 1);
}
```

**getData:** Function (Default: below), the primary data processor override method.  This allows the user to obtain list data via ajax or other custom methodology.
```javascript
function (text, callback) { 
  // text: String, the text entered into the auto complete search box
  // callback: Function, the method to call once data is ready to inject into the auto complete pop-up.  
  //           This method accepts one argument of an array of arrays or:
  //          [ [ { title:"item 1", slug:"/url1"}, { title:"item 2", slug:"/url2"} ] ].
}
```

**getInsertText:** Function (Default: below)
```javascript
function (dataItem) {
  // dataItem: Object, the row level data item selected.
  // @return: String, the title of the item.
  return dataItem.title;
}
```

