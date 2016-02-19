(function ($, document, window, undefined) {

    $.fn.gooAutoComplete = function (opts) {

        var DATA_KEY = "gooAutoComplete_ac",
            DATA_ITEM_KEY = "gooAutoComplete_item",
            DATA_ITEM_LIST = "gooAutoComplete_list",
            DATA_ITEM_WIDTH = "gooAutoComplete_width",
            dopts = $.extend($.fn.gooAutoComplete.defaults, opts);

        function GetTemplateMethod(template) {
            if (!template || template == "") return function () { };
            var method = "(function(){ return function(template, data, highlight, subList) {\n",
                matches = template.match(/{([^}]*)}/g);
            if (matches) {
                for (var match = 0; match < matches.length; match++) {
                    var txt = matches[match];
                    if (txt.indexOf("highlight:") > -1) {
                        var part = txt.substr(11, txt.length - 12);
                        method += "template = template.replace('" + txt + "', highlight(data." + part + "));\n";
                    } else if (txt.indexOf("sub:") > -1) {
                        var key = txt.substr(5, txt.length - 6),
                            parts = key.split(",");
                        method += "template = template.replace('" + txt + "', subList('" + parts[0] + "', data." + parts[1] + "));\n";
                    } else if (txt == "{.}") {
                        method += "template = template.replace('" + txt + "', data);\n";
                    } else {
                        method += "template = template.replace('" + txt + "', data." + txt.substr(1, txt.length - 2) + ");\n";
                    }
                }
            }
            method += "return template;\n}})();";
            return eval(method);
        }

        dopts.List = GetTemplateMethod(dopts.listTemplate);
        dopts.ListItem = GetTemplateMethod(dopts.listItemTemplate);
        dopts.AltListItem = GetTemplateMethod(dopts.altListItemTemplate);
        dopts.MultiSelectItem = GetTemplateMethod(dopts.multiSelectTemplate);

        return $(this).each(function () {

            var t = $(this),
                ac = t.data(DATA_KEY);


            if (typeof ac == "undefined") {

                ac = {
                    Text: "",
                    Input: null,
                    Options: null,
                    Cache: {},
                    ActiveCache: 0,
                    Visible: false,
                    CurElement: null,
                    ActionKey: function (e) {

                        switch (e.which) {
                            case 13:
                                // enter button
                                ac.Go(e);
                                break;
                            case 38:
                                // up button
                                ac.Up(e);
                                break;
                            case 40:
                                // down key pressed
                                ac.Down(e);
                                break;
                            default:
                                return;
                        }

                        if (ac.Visible == true) e.preventDefault();

                    },
                    Up: function () {
                        if (ac.Visible) {
                            if (ac.CurElement == null) {
                                var popid = ac.Input.attr("id") + "_ac",
                                    pop = $("#" + popid);
                                ac.CurElement = $(".ac-list:last-child li:last-child", pop);
                            } else {
                                var old = ac.CurElement;
                                ac.CurElement.removeClass("ac-sel");
                                ac.CurElement = ac.CurElement.prev(".ac-item");
                                if (ac.CurElement.length == 0) {
                                    var prev = old.parent().prev().first();
                                    if (prev.length > 0) {
                                        ac.CurElement = prev.children().last();
                                    } else {
                                        var popid = ac.Input.attr("id") + "_ac",
                                            pop = $("#" + popid);
                                        ac.CurElement = $(".ac-list:last-child li:last-child", pop);
                                    }
                                }
                            }
                            ac.CurElement.addClass("ac-sel");
                        }
                    },
                    Down: function () {
                        if (ac.Visible) {
                            if (ac.CurElement == null) {
                                var popid = ac.Input.attr("id") + "_ac",
                                            pop = $("#" + popid);
                                ac.CurElement = $(".ac-list:first-child .ac-item", pop).first();
                            } else {
                                var old = ac.CurElement;
                                ac.CurElement.removeClass("ac-sel");
                                ac.CurElement = ac.CurElement.next();
                                if (ac.CurElement.length == 0) {
                                    var next = old.parent().next().first();
                                    if (next.length > 0) {
                                        ac.CurElement = next.children().first().next();
                                    } else {
                                        var popid = ac.Input.attr("id") + "_ac",
                                            pop = $("#" + popid);
                                        ac.CurElement = $(".ac-list:first-child .ac-item", pop).first();
                                    }
                                }
                            }
                            ac.CurElement.addClass("ac-sel");
                        }
                    },
                    Left: function () {
                        if (ac.Visible) {
                            if (ac.CurElement == null) {
                                var popid = ac.Input.attr("id") + "_ac",
                                            pop = $("#" + popid);
                                ac.CurElement = $(".ac-list:first-child .ac-item", pop).first();
                            } else {
                                var old = ac.CurElement,
                            pp = old.parent().prev();
                                ac.CurElement.removeClass("ac-sel");
                                if (pp.length == 0) {
                                    var popid = ac.Input.attr("id") + "_ac",
                                    pop = $("#" + popid);
                                    ac.CurElement = pop.children().last().children().first().next();
                                } else {
                                    ac.CurElement = pp.children().first().next();
                                }
                            }
                            ac.CurElement.addClass("ac-sel");
                        }
                    },
                    Right: function () {
                        if (ac.Visible) {
                            if (ac.CurElement == null) {
                                var popid = ac.Input.attr("id") + "_ac",
                                    pop = $("#" + popid);
                                ac.CurElement = $(".ac-list:last-child li:last-child", pop);
                            } else {
                                var old = ac.CurElement,
                                    nn = old.parent().next();
                                ac.CurElement.removeClass("ac-sel");
                                if (nn.length == 0) {
                                    var popid = ac.Input.attr("id") + "_ac",
                                pop = $("#" + popid);
                                    ac.CurElement = pop.children().first().children().first().next();
                                } else {
                                    ac.CurElement = nn.children().first().next();
                                }
                            }
                            ac.CurElement.addClass("ac-sel");
                        }
                    },
                    Go: function (e) {
                        if (ac.CurElement != null && typeof (ac.Input.val()) == "string" && ac.Input.val() != "") {
                            var item = ac.CurElement.data(DATA_ITEM_KEY),
                                listIndex = ac.CurElement.data(DATA_ITEM_LIST);

                            if (ac.Options.multiSelectInput) {

                            } else if (ac.Options.multiSelect) {
                                ac.AddMultiSelect(item);
                                ac.Input.val("");
                                ac.HideBox();
                                setTimeout(function () {
                                    ac.Input.focus();
                                }, 500);
                            } else {
                                if (!ac.Options.go(item, ac, e)) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }
                            }
                        } else {
                            
                            if (ac.Options.multiSelect) {

                                var multiId = "#" + ac.Input.attr("id") + "_selected",
                                    search = ((typeof (ac.Input.val()) == "string" && ac.Input.val() != "") ? [ac.Input.val()] : []),
                                    m = $(multiId).children().each(function () {
                                        var di = $(this).data(DATA_ITEM_KEY);
                                        if (di != null) {
                                            search.push(di);
                                        }
                                    }),
                                    url = ac.Options.encodeSearchUrl(search);

                                if (!ac.Options.go(url, ac, e)) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }

                            } else {

                                if (!ac.Options.go(ac.Input.val(), ac, e)) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }

                            }
                        }
                    },
                    EnsureInputEndsWith: function (dataItem) {

                        var all = ac.Input.val(),
                            lastS = all.lastIndexOf(" "),
                            val = lastS > -1 ? all.substr(lastS + 1) : all,
                            insert = ac.Options.getInsertText(dataItem),
                            newVal = all.substr(0, lastS) + insert,
                            endsWith = new RegExp(insert + "$");

                        if (!endsWith.test(val)) ac.Input.val(newVal);

                    },
                    AddMultiSelect: function (dataItem) {
                        var multiItem = $(ac.Options.MultiSelectItem(ac.Options.multiSelectTemplate, dataItem))
                                .appendTo("#" + ac.Input.attr("id") + "_selected")
                                .data(DATA_ITEM_KEY, dataItem);

                        $(".ac-multi-close", multiItem)
                            .click(function () {
                                var data = $(this).parent().data(DATA_ITEM_KEY);
                                $(this).parent().remove();
                            })
                            .fadeo();
                    },
                    RefreshData : function(e) {
                        ac.TextChanged({
                            which : 0
                        });
                    }, 
                    TextChanged: function (e) {

                        if (e.which == 13 || (e.which >= 37 && e.which <= 40)) return;

                        ac.Text = ac.Input.val();

                        if (typeof ac.Text != "undefined" && ac.Text.length >= ac.Options.minChars) {
                            var pre = ac.GetPreText(ac.Text);
                            //    pre = ac.Text.substr(0, ac.Options.minChars);
                            ac.ShowBox();
                            if (ac.Options.useCache == true && typeof ac.Cache[pre] != "undefined") {

                                ac.ActiveCache = pre;
                                ac.ShowLists(ac.Cache[pre]);

                            } else {

                                var popid = ac.Input.attr("id") + "_ac";
                                $("#" + popid).children(".ac-row").html("").append(ac.Options.loadTemplate);

                                ac.Options.getData(ac.Text,
                                    (function (prefix) {
                                        return function (lists) {
                                            ac.ActiveCache = prefix;
                                            ac.Cache[prefix] = lists;
                                            ac.ShowLists(lists);
                                        }
                                    })(pre),
                                    ac
                                );
                            }
                        } else {
                            ac.HideBox();
                        }
                    },
                    GetPreText: function (all) {
                        if (!all) return "";
                        if (ac.Options.multiSelectInput) {
                            var pos = all.lastIndexOf(" ");
                            return all.substr(pos + 1, pos + 1 + ac.Options.minChars);
                        } else {
                            return all.substr(0, ac.Options.minChars);
                        }
                    },
                    HideBox: function () {
                        var popid = ac.Input.attr("id") + "_ac";
                        $("#" + popid).fadeOut("fast");
                        ac.CurElement = null;
                        ac.Visible = false;

                        $(document).unbind("click", ac.HideBox);
                        if (document.removeEventListener) document.removeEventListener('touchend', ac.HideBox, false);

                    },
                    ShowBox: function () {
                        var popid = ac.Input.attr("id") + "_ac",
                                    pop = $("#" + popid);

                        if (pop.length == 0) {

                            pop = $(ac.Options.boxTemplate)
                                        .attr("id", popid)
                                        .appendTo("body");

                            pop
                                        .children(".ac-row")
                                        .append(ac.Options.loadTemplate);
                        }

                        if (!ac.PositionBox(pop).is(":visible")) {
                            pop.fadeIn("fast");
                        }

                        $(document).bind("click", ac.HideBox);
                        if (document.addEventListener) document.addEventListener('touchend', ac.HideBox, false);

                    },
                    HighlightText: function (find, text) {
                        if (text == null || text == "") return "";
                        var pattern = "/" + find + "/g",
                            re = new RegExp(find, "gi");
                        return text.replace(re, "<span class='ac-sel-text'>" + find + "</span>");
                    },
                    PositionBox: function (pop) {
                        var pos = ac.Input.offset();
                        switch (ac.Options.position) {
                            case "bottomleft":
                                pop.css({
                                    top: parseInt(pos.top) + ac.Input.outerHeight() + ac.Options.positionoffset.top + "px",
                                    left: parseInt(pos.left) + ac.Options.positionoffset.left + "px"
                                });
                                break;
                            case "bottomright":
                                pop.css({
                                    top: parseInt(pos.top) + ac.Input.outerHeight() + ac.Options.positionoffset.top + "px",
                                    right: $("body").outerWidth() - (parseInt(pos.left) + ac.Input.outerWidth() + ac.Options.positionoffset.left) + "px"
                                });
                                break;
                            case "belowscreenleft":
                                pop.css({
                                    top: parseInt(pos.top) + ac.Input.outerHeight() + ac.Options.positionoffset.top + "px",
                                    left: "0px"
                                });
                                break;
                            case "free":
                            default:
                                return pop;
                        }
                        return pop;
                    },
                    ShowListsCallback: function (prefix, lists) {
                        ac.ActiveCache = prefix;
                        ac.Cache[prefix] = lists;
                        ac.ShowLists(lists);
                    },
                    DynamicTemplate : function(templateId, enumerable) {
                        var tmpl = $(document.getElementById(templateId)).html(),
                            meth = tmpl ? GetTemplateMethod(tmpl) : "",
                            retVal = "";
                        $.each(enumerable, function(idx, val){
                            retVal += meth(tmpl, val, ac.Highlighter, ac.DynamicTemplate);
                        });
                        return retVal;
                    },
                    Highlighter : function(tmpl){
                        return ac.HighlightText(text, tmpl);
                    },
                    ShowLists: function (lists) {

                        var popid = ac.Input.attr("id") + "_ac",
                            pop = $("#" + popid),
                            acRow = pop.children(".ac-row").html(""),
                            alt = false, added = false, hasRes = false, addCnt = 0;

                        text = ac.Input.val();

                        $(".ac-help").hide();
                        $(".ac-no-results").remove();

                        ac.Options.beforeRender(pop, ac);

                        for (var list = 0; list < lists.length; list++) {

                            var tList = lists[list],
                                tmpl = {
                                    List: tList.listTemplate ? GetTemplateMethod(tList.listTemplate) : ac.Options.List,
                                    Item: tList.listItemTemplate ? GetTemplateMethod(tList.listItemTemplate) : ac.Options.ListItem,
                                    AltItem: tList.altListItemTemplate ? GetTemplateMethod(tList.altListItemTemplate) : ac.Options.AltListItem,
                                    ListTemplate: tList.listTemplate || ac.Options.listTemplate,
                                    ItemTemplate: tList.listItemTemplate || ac.Options.listItemTemplate,
                                    AltItemTemplate: tList.altListItemTemplate || ac.Options.altListItemTemplate
                                },
                                curAc = $(tmpl.List(tmpl.ListTemplate, lists[list], function (txt) { return txt; }, ac.DynamicTemplate))
                                            .css({ opacity: 0.01 });

                            added = false;

                            for (var listItem = 0; listItem < lists[list].length; listItem++) {

                                if (ac.Options.filter(lists[list][listItem], text, lists[list])) {
                                    if (addCnt == ac.Options.maxItems) break;
                                    addCnt++;
                                    added = true;
                                    var addItem = alt
                                                    ? $(tmpl.AltItem(tmpl.AltItemTemplate, lists[list][listItem], ac.Highlighter, ac.DynamicTemplate))
                                                    : $(tmpl.Item(tmpl.ItemTemplate, lists[list][listItem], ac.Highlighter, ac.DynamicTemplate));
                                    addItem
                                        .appendTo(curAc)
                                        .data(DATA_ITEM_KEY, lists[list][listItem])
                                        .data(DATA_ITEM_LIST, lists[list].Title)
                                        .mouseenter(function () {
                                            if (ac.CurElement != null) ac.CurElement.removeClass("ac-sel");
                                            ac.CurElement = $(this);
                                            $(this).addClass("ac-sel");
                                        });

                                    alt = !alt;
                                }
                            }
                            addCnt = 0;
                            if (added || tList.alwaysAdd == true) {
                                hasRes = true;
                                if (curAc.appendTo(acRow).animate({ opacity: 1 }).outerWidth() > ac.Options.maxColumnWidth) {
                                    curAc.css({ width: ac.Options.maxColumnWidth + "px" });
                                    curAc.data(DATA_ITEM_WIDTH, "fat");
                                }
                            }

                        }

                        if (!hasRes) {
                            ac.Visible = false;
                            pop.append(ac.Options.noResultsTemplate);
                        } else {
                            ac.Visible = true;
                        }

                        ac.Options.afterRender(pop, ac);
                    },
                    GotFocus: function () {
                        if (!ac.Visible && ac.Options.helpTemplate && ac.Options.showHelp) {
                            var helpMenu = $(ac.Options.helpTemplate).appendTo("body");
                            ac.PositionBox(helpMenu);
                            setTimeout(function () {
                                helpMenu.animate({ opacity: 0 }, 6000, function () { $(this).remove(); });
                            }, ac.Options.helpTimeout);
                        }
                    }
                }

                ac.Input = t;
                ac.Options = dopts;
                t.keydown(ac.ActionKey);
                t.keyup(ac.TextChanged);
                t.focus(ac.GotFocus);
                t.addClass("ac-input");

                if (dopts.showButton) {
                    t.after($(dopts.buttonTemplate)
                                    .attr("id", t.attr("id") + "_button")
                                    .mouseenter(function () {
                                        $(this).addClass("ac-button-hover");
                                    })
                                    .mouseleave(function () {
                                        $(this).removeClass("ac-button-hover");
                                    })
                                    .click(function (e) {
                                        ac.Go(e);
                                    }));
                }

                if (dopts.showSelected) {
                    t.before($(dopts.selectedTemplate).attr("id", t.attr("id") + "_selected"));
                }

                if (dopts.exitOnClick) {
                    $(document).on("click", ".ac.body", function (e) {
                        if (e.target.tagName != "A") {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                }

                ac.Input.focusin(function () {
                    $("body").removeClass("ac-not-searching").addClass("ac-searching");
                    $(this).removeClass("ac-not-focused").addClass("ac-focused");
                }).focusout(function () {
                    $("body").removeClass("ac-searching").addClass("ac-not-searching");
                    $(this).removeClass("ac-focused").addClass("ac-not-focused");                    
                });

                $("body").removeClass("ac-searching").addClass("ac-not-searching");
                $(this).removeClass("ac-focused").addClass("ac-not-focused");

            }

            ac.SearchConfig = dopts.searchConfig;

            t.data(DATA_KEY, ac);

        });
    }

    window.gooAutoCompleteInitElement = function (element, defaultOpts, cancelInit) {

        var opts = defaultOpts || {},
            t = $(element),
            is = checkType,
            val = null;

        val = t.attr("ac-maxitems");
        if (is.nbr(val)) opts.maxItems = val * 1;

        val = t.attr("ac-exitonclick");
        if (is.nbr(val)) opts.exitOnClick = (val == "true");

        val = t.attr("ac-helptimeout");
        if (is.bool(val)) opts.helpTimeout = val * 1;

        val = t.attr("ac-minchars");
        if (is.bool(val)) opts.minChars = val * 1;

        val = t.attr("ac-usecache");
        if (is.bool(val)) opts.useCache = (val == "true");

        val = t.attr("ac-position")
        if (is.str(val)) opts.position = val;

        val = t.attr("ac-multiselectinput");
        if(is.bool(val)) opts.multiSelectInput = (val == "true");

        val = t.attr("ac-multiselect");
        if(is.bool(val)) opts.multiSelect = (val == "true");

        val = t.attr("ac-maxcolumnwidth");
        if(is.nbr(val)) opts.maxColumnWidth = val * 1;

        val = t.attr("ac-showbutton");
        if(is.bool(val)) opts.showButton = (val == "true");
        
        val = t.attr("ac-showhelp");
        if(is.bool(val)) opts.showHelp = (val == "true");
        
        val = t.attr("ac-showselected");
        if(is.bool(val)) opts.showSelected == (val == "true");

        val = t.attr("ac-afterrender");
        if(is.str(val) && is.func(window[val])) opts.afterRender = window[val];

        val = t.attr("ac-beforerender");
        if(is.str(val) && is.func(window[val])) opts.beforeRender = window[val];

        val = t.attr("ac-filter");
        if(is.str(val) && is.func(window[val])) opts.filter = window[val];

        val = t.attr("ac-go");
        if(is.str(val) && is.func(window[val])) opts.go = window[val];
        
        val = t.attr("ac-encodesearchurl");
        if(is.str(val) && is.func(window[val])) opts.encodeSearchUrl = window[val];

        val = t.attr("ac-getdata");
        if(is.str(val) && is.func(window[val])) opts.getData = window[val];
        
        val = t.attr("ac-getinserttext");
        if (is.str(val) && is.func(window[val])) opts.getInsertText = window[val];
        
        val = t.attr("ac-multiselecttemplate");
        if (is.str(val)) { getTemplate("multiSelectTemplate"); }

        val = t.attr("ac-buttontemplate");
        if (is.str(val)) { getTemplate("buttonTemplate"); }

        val = t.attr("ac-selectedtemplate");
        if (is.str(val)) { getTemplate("selectedTemplate"); }

        val = t.attr("ac-helptemplate");
        if (is.str(val)) { getTemplate("helpTemplate"); }

        val = t.attr("ac-boxtemplate");
        if (is.str(val)) { getTemplate("boxTemplate"); }

        val = t.attr("ac-loadtemplate");
        if (is.str(val)) { getTemplate("loadTemplate"); }

        val = t.attr("ac-listtemplate");
        if (is.str(val)) { getTemplate("listTemplate"); }

        val = t.attr("ac-listitemtemplate");
        if (is.str(val)) { getTemplate("listItemTemplate"); }

        val = t.attr("ac-altlistitemtemplate");
        if (is.str(val)) { getTemplate("altListItemTemplate"); }

        val = t.attr("ac-noresultstemplate");
        if (is.str(val)) { getTemplate("noResultsTemplate"); }

        if (cancelInit !== true) {
            return $(t).gooAutoComplete(opts);
        }

        return opts;

        function getTemplate(name) {
            var el = $(document.getElementById(val));
            if (el.length > 0) {
                opts[name] = el.html();
            }
        }

    };

    window.checkType = {
        nbr: function (obj) {
            return typeof (obj) == "number" || $.isNumeric(obj);
        },
        bool: function (obj) {
            return typeof (obj) == "boolean" || (window.checkType.str(obj) ? (/true/i.test(obj) || /false/i.test(obj)) : false);
        },
        str: function (obj) {
            return typeof (obj) == "string";
        },
        func: function (obj) {
            return typeof (obj) == "function";
        },
        obj: function (obj) {
            return typeof (obj) == "object";
        },
        arr: function (obj) {
            return typeof(obj) == "array"
        },
        date: function (obj) {
            return typeof (obj) == "date";
        }
    };
    
    $.fn.gooAutoComplete.defaults = {
        maxItems: 10,
        exitOnClick: true,
        helpTimeout: 3000,
        minChars: 3,
        useCache: false,
        position: "bottomleft",
        multiSelectInput: false,
        multiSelect: false,
        maxColumnWidth: 5000,
        multiSelectTemplate: "<li class='ac-multi-item'><span>{Title}</span><div class='ac-multi-close'></div></li>",
        showButton: true,
        showHelp: true,
        buttonTemplate: "<div class='ac-button'></div>",
        showSelected: true,
        selectedTemplate: "<ul class='ac-selected'>&nbsp;</ul>",
        positionoffset: { top: 0, left: 0 },
        helpTemplate: "<div class='ac-help'><ul><li><span>Type three characters to see quick results.</span></li>" +
                    "<li><span>Use up/down arrow to navigate items.</span></li>" +
                    "<li><span>Click search button to search site.</span></li><li><span>Click item to search the term.</span></li>" +
                    "<li><input type='checkbox' name='chk-show-help' class='chk-show-help' /><label for='chk-show-help'>Don't show me this again.</label></li>" +
                    "</ul></div>",
        boxTemplate: "<ul class='ac body'><li class='ac-row row'></li></ul>",
        loadTemplate: "<div class='ac-load'><span>Loading...</span></div>",
        listTemplate: "<ul class='ac-list'><li class='ac-list-head'><h2>{Title}</h2></li></ul>",
        listItemTemplate: "<li class='ac-item'><a href='/{slug}' title='{title}'>{highlight:title}</a></li>",
        altListItemTemplate: "<li class='ac-item ac-item-alt'><a href='/{slug}' title='{title}'>{highlight:title}</a></li>",
        noResultsTemplate: "<li class='ac-no-results'><span>No results</span></li>",
        afterRender: function (menu, autoComplete) {
            return;
        },
        beforeRender: function (menu, autoComplete) {
            return;
        },
        filter: function (dataItem, text) {
            return dataItem.title.toLowerCase().indexOf(text.toLowerCase()) > -1;
        },
        go: function (dataItem) {
            if (typeof dataItem == "string") {
                window.location.href = dataItem;
            } else {
                window.location.href = "/" + dataItem.slug;
            }
        },
        encodeSearchUrl: function (arrParts) {
            var url = "/search/";
            for (var p = 0; p < arrParts.length; p++) {
                if (typeof (arrParts[p]) == "string") {
                    url += escape(arrParts[p].replace(/\s/g, "+")) + ",";
                } else {
                    url += escape(arrParts[p].title.replace(/\s/g, "+")) + ",";
                }
            }
            return url.substr(0, url.length - 1);
        },
        getData: function (text, callback) { },
        getInsertText: function (dataItem) {
            return dataItem.title;
        }

    };

    // jQuery directive for declarative auto complete creation.
    $(function () {

        $.each($("[goo-ac]"), function (idx, acInput) {

            var defaultText = $(acInput).attr("goo-ac"),
                defaultOpts = defaultText ? tryParse(defaultText) : null;

            gooAutoCompleteInitElement(acInput, defaultOpts);

        });

        function tryParse(obj) {
            var ret = null;
            try {
                ret = JSON.parse(obj);
            } finally { }
            return ret;
        }

    });

})(jQuery, document, window);