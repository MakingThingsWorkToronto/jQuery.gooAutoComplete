# jQuery.gooAutoComplete
jQuery Plugin: Auto Complete / Type Forward, Responsive, Multi Column, Micro Templates, Multi Browser with example adapters for Azure &amp; SharePoint Search

Supported Options:

**maxItems:** Number (Default: 10), The maximum number of matched items to appear in the pop-up.

**exitOnClick:** Boolean (Default: false), A flag inidicating if the auto complete should be closed when the user clicks within the pop-up region.

**helpTimeout:** Number (Default: 3000), The number of milliseconds to display the help pop-up before fading out.

**minChars:** Number (Default: 3), The minimum number of characters typed before auto complete performs a lookup.

**useCache:** Boolean (Default: false), A flag indicating if the auto complete should cache lookup results into a search text based hash.  If true the getData method will only be triggered once per unique text phrase entered.  If false getData method will fire with every keystroke entered into the auto complete.

**position:** String (Default: "bottomleft"), A string indicating how to position the auto complete pop-up.  Options include: "bottomleft" - below the input field anchored left, "bottomright" - below the input field anchored right, "belowscreenleft" - below the input field at left:0px, "free" - positioning should be performed directly in CSS.

**multiSelectInput:** Boolean (Default: false),

**multiSelect:** Boolean (Default: false),

**maxColumnWidth:** Number (Default: 5000), The maximum number of pixels a column in the auto complete may span.

**multiSelectTemplate:** HTML Template (Default: below), The template to use for multi select items.
```html
<li class='ac-multi-item'><span>{Title}</span><div class='ac-multi-close'></div></li>
```

**showButton:** Boolean (Default: true), Determines if the plugin should add the search button to the right of the input text field.

**showHelp:** Boolean (Default: true), Determines if the plugin should display the help template when the user first puts their cursor into the text field.


