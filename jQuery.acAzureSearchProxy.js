(function($, document, window, undefined) {

    var acAzureSearchProxy = function (obj, opts) {
        var t = this;
        t.init(obj, opts);
    };

    acAzureSearchProxy.prototype.init = function (obj, opts) {
        var t = this;
        t.element = obj;
        t.$element = $(obj);
        t.opts = $.extend($.fn.gooAutoComplete.defaults, $.fn.acAzureSearchProxy.defaults, opts);
        t.cache = {};

        t.opts.getData = function (text, callback, ac) {
            return t.getData(text, callback, ac);
        };

        t.opts.go = function (dataItem, ac) {
            return t.go(dataItem, ac);
        }

        var ac = t.$element.gooAutoComplete(t.opts).data("gooAutoComplete_ac");
        ac.startRow = 0;

    };

    acAzureSearchProxy.prototype.processHighlights = function (values) {

        $.each(values, function (idx, val) {

            var h = val["@search.highlights"],
                highTxt = "";

            if (h != undefined) {
                $.each(h, function (key, val) {
                    if (val && typeof (val) == "object" && typeof (val[0]) == "string" && typeof(val.join) == "function") {

                        highTxt += val.join("...") + "..."

                    }
                });

                if (highTxt.length > 0) {
                    highTxt = highTxt.sub(0, highTxt.length - 3);
                }
            }

            val.highlightHTML = highTxt;

        });

    };

    acAzureSearchProxy.prototype.packData = function (data, searchText, t, ac) {

        var lists = [],
            values = data["value"] || [],
            facets = data["@search.facets"] || [],
            count = data["@odata.count"] || 0,
            facetFields = (t.opts.facet && t.opts.facet.toString().length > 0) ? t.opts.facet.split(";") : [],
            pages = [];

        values.Title = t.opts.searchResultsTitle.replace("{keywords}", searchText);
        values.Count = count;

        facets.Title = t.opts.facetsTitle;
        facets.listTemplate = $("#facets").html();
        facets.altListItemTemplate = facets.listItemTemplate = "";
        facets.alwaysAdd = true;

        $.each(facetFields, function (idx, val) {
            var field = val.split(",")[0];
            if (!facets[field]) {
                facets[field] = [{ value: "No Results", count: 0 }];
            }
        });


        if (count > t.opts.top) {
            
            pages.Title = t.opts.pagesTitle;
            pages.listTemplate = $("#paging").html();
            pages.altListItemTemplate = pages.listItemTemplate = $("#pagingpage").html();
            
            var curPage = ac.startRow / t.opts.top;
            pages.CurrentPage = curPage;
            pages.TotalPages = Math.ceil(count / t.opts.top);

            if (ac.startRow > 0) {
                pages.push({
                    start: (curPage-1)*t.opts.top,
                    text: t.opts.prevPageText,
                    cssClass: "prev-but"
                });
            }

            var p = 0;
            for (var c = 0; c < count; (c = c + t.opts.top)) {
                var start = p * t.opts.top;
                pages.push({
                    start: start,
                    text: (p + 1),
                    cssClass: p == curPage ? "page current-page" : "page"
                });
                p++;
            }

            if (ac.startRow < (count - t.opts.top)) {
                pages.push({
                    start: (curPage + 1) * t.opts.top,
                    text: t.opts.nextPageText,
                    cssClass: "next-page"
                })
            }

        }

        (typeof (t.opts.processHighlights) == "function"
            ? t.opts.processHighlights(values)
            : t.processHighlights(values));

        lists.push(values);

        lists.push(facets);

        if (pages.length > 0) lists.push(pages);

        return lists;

    };

    acAzureSearchProxy.prototype.getData = function (text, callback, ac) {
        
        // check cache first
        var t = this,
            url = t.processUrl(text, ac);

        if (t.cache[url]) {
            callback(t.cache[url]);
            return;
        };

        var headers = $.extend(t.opts.headers, {
                            "host": t.opts.host,
                            "content-type": t.opts.contentType,
                            "api-key": t.opts.apiKey
                        });

        return (function (t, url, headers, text) {

            ac.searchQuery = url;

            return $.ajax({
                url: url,
                headers: headers,
                success: function (data) {
                    t.cache[url] = t.packData(data, text, t, ac);
                    callback(t.cache[url]);
                },
                error: function (a,b) {
                    t.failure(a,b);
                }
            });

        })(t, url, headers, text);

    };

    acAzureSearchProxy.prototype.failure = function (a,b) {
        console.log("Failure connecting to Azure Search Proxy.  Please retry.", { a: a, b: b });
    };

    acAzureSearchProxy.prototype.go = function (dataItem, ac) {

        if (typeof (dataItem) == "object") {

            window.location.href = dataItem.url;

        } else {

            window.location.href = dataItem;
        }

    };

    acAzureSearchProxy.prototype.processUrl = function (searchText, ac) {

        var t = this,
            o = t.opts,
            r = [
                { k: "searchMode", v: o.searchMode },
                { k: "searchFields", v: o.searchFields },
                { k: "$skip", v: ac.startRow },
                { k: "$top", v: o.top },
                { k: "$count", v: o.count },
                { k: "$orderby", v: o.orderby },
                { k: "$select", v: o.select },
                { k: "highlight", v: o.highlight },
                { k: "highlightPreTag", v: o.highlightPreTag },
                { k: "highlightPostTag", v: o.highlightPostTag },
                { k: "scoringProfile", v: o.scoringProfile },
                { k: "scoringParameter", v: o.scoringParameter },
                { k: "minimumCoverage", v: o.minimumCoverage },
                { k: "api-version", v: o.apiVersion },
            ];

        url = o.url.replace("{searchtext}", window.escape(searchText))
                .replace("{host}", o.host)
                .replace("{index}", o.index);
        
        $.each(r, function (i, part) {
            url = procPart(part.k, part.v, url);
        })

        var facets = o.facet.split(";");

        $.each(facets, function (idx, facet) {
            var field = facet.split(",")[0];
            url += "&facet=" + facet;
        });

        if (typeof (o.processUrl) == "function") {
            o.processUrl(url, searchText);
        }
        
        if (ac.filters && ac.filters.length > 0) {
            url += "&$filter=";
            $.each(ac.filters, function (idx, filter) {
                if (idx > 0) url += " and ";
                url += filter.odata.replace(/\s/g, "+");
            });
        }

        return url;

        function procPart(pre, val, appendToUrl) {
            if (val != null) {
                
                var strVal = typeof(val) == "boolean" 
                                ? (val ? "true" : "false") 
                                : val + "";

                if (strVal != "") {
                    return appendToUrl + "&" + pre + "=" + window.escape(val);
                }
            }
            return appendToUrl;
        }

    };
    
    acAzureSearchProxy.prototype.afterRender = function (menu, autoComplete) {
        
    };

	$.fn.acAzureSearchProxy = function(opts) {
        
	    return $(this).each(function () {

	        var t = $(this),
                ac = t.data("goo-azure-ac");

	        if (!ac) {
	            ac = new acAzureSearchProxy(this, opts);
	            t.data("goo-azure-ac", ac);
	        } else {
	            ac.init(this, opts);
	        }

	        return ac;

	    });

	};	

	$.fn.acAzureSearchProxy.defaults = {
	    url: "https://{host}/indexes/{index}/docs?search={searchtext}*",
	    count: "false",
	    top: 5,
	    pagesTitle: "Page",
	    prevPageText: "&laquo; Previous",
	    nextPageText: "Next &raquo;",
	    highlight: "",
	    apiVersion: "2015-02-28",
	    host: "",
        index: "",
	    contentType: "application/json",
	    apiKey: "",
	    searchMode: "any", // "any" or "all"
	    searchFields: null,
	    skip: null,
	    orderby: null,
        useCache: false,
	    select: null,
	    facet: null,
	    searchFilter: null,
	    highlightPreTag: null,
	    highlightPostTag: null,
	    scoringProfile: null,
	    scoringParameter: null,
	    minimumCoverage: null,
	    searchResultsTitle: "Search for {keywords}",
	    facetsTitle: "Refine Results",
	    headers: {}
	};

	window.acAzureProxyInitElement = function (element, defaultOpts) {

	    var opts = defaultOpts || {},
            t = $(element),
            is = checkType,
            val = null;

	    val = t.attr("ac-prevpagetext");
	    if (is.str(val)) opts.prevPageText = val;

	    val = t.attr("ac-nextpagetext");
	    if (is.str(val)) opts.nextPageText = val;

	    val = t.attr("ac-index");
	    if (is.str(val)) opts.index = val;

	    val = t.attr("ac-url");
	    if (is.str(val)) opts.url = val;

	    val = t.attr("ac-count");
	    if (is.bool(val)) opts.count = (val == "true");

	    val = t.attr("ac-top");
	    if (is.nbr(val)) opts.top = val * 1;

	    val = t.attr("ac-highlight");
	    if (is.str(val)) opts.highlight = val;

	    val = t.attr("ac-apiversion");
	    if (is.str(val)) opts.apiVersion = val;

	    val = t.attr("ac-host");
	    if (is.str(val)) opts.host = val;

	    val = t.attr("ac-contenttype");
	    if (is.str(val)) opts.contentType = val;

	    val = t.attr("ac-apikey");
	    if (is.str(val)) opts.apiKey = val;

	    val = t.attr("ac-searchmode");
	    if (is.str(val)) opts.searchMode = val;

	    val = t.attr("ac-searchfields");
	    if (is.str(val)) opts.searchFields = val;

	    val = t.attr("ac-skip");
	    if (is.nbr(val)) opts.skip = val;

	    val = t.attr("ac-orderby");
	    if (is.str(val)) opts.orderby = val;

	    val = t.attr("ac-select");
	    if (is.str(val)) opts.select = val;

	    val = t.attr("ac-facet");
	    if (is.str(val)) opts.facet = val;

	    val = t.attr("ac-searchFilter");
	    if (is.str(val)) opts.searchFilter = val;

	    val = t.attr("ac-highlightpretag");
	    if (is.str(val)) opts.highlightPreTag = val;

	    val = t.attr("ac-highlightposttag");
	    if (is.str(val)) opts.highlightPostTag = val;

	    val = t.attr("ac-scoringprofile");
	    if (is.str(val)) opts.scoringProfile = val;

	    val = t.attr("ac-scoringparameter");
	    if (is.str(val)) opts.scoringProfile = val;

	    val = t.attr("ac-minimumcoverage");
	    if (is.str(val)) opts.scoringProfile = val;

	    val = t.attr("ac-searchresultstitle");
	    if (is.str(val)) opts.searchResultsTitle = val;

	    val = t.attr("ac-facetstitle");
	    if (is.str(val)) opts.facetsTitle = val;

	    val = t.attr("ac-headers");
	    if (is.str(val)) {
	        try {
	            val = JSON.parse(val);
	            opts.headers = val;
	        } finally{}
	    }

	    opts = gooAutoCompleteInitElement(element, opts, true);

	    t.acAzureSearchProxy(opts);
	}

    // jQuery directive for declarative auto complete creation.
	$(function () {

	    $.each($("[goo-azure-ac]"), function (idx, acInput) {

	        var defaultText = $(acInput).attr("goo-azure-ac"),
                defaultOpts = defaultText ? tryParse(defaultText) : null;

	        acAzureProxyInitElement(acInput, defaultOpts);

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

(function ($, document, window, undefined) {
    
    var textRefiner = {
        init: function (filters, ui, ac, config) {
            $("a", ui).each(function () {
                var t = $(this);
                t.attr("data-odata-filter", config.fieldName + " eq '" + t.attr("data-refiner").replace(/'/g,"\'") + "'");
            });

            $.each(filters, function (idx, filter) {
                var opt = $("a[data-refiner='" + filter.value + "']", ui);
                opt.addClass("is-selected");
            });

        }
    };

    var tagRefiner = {
        init: function (filters, ui, ac, config) {
            $("a", ui).each(function () {
                var t = $(this);
                t.attr("data-odata-filter", config.fieldName + "/any(t: t eq '" + t.attr("data-refiner").replace(/'/g, "\'") + "')");
            });

            $.each(filters, function (idx, filter) {
                var opt = $("a[data-refiner='" + filter.value + "']", ui);
                opt.addClass("is-selected");
            });

        }
    };


    var monthRefiner = {
        months: "January,February,March,April,May,June,July,August,September,October,November,December",
        init: function (filters, ui, ac, config) {

            $("a", ui).each(function () {
                var t = $(this),
                    vspan = $(".facet-value", t),
                    val = new Date(t.attr("data-refiner")),
                    last = new Date(val.getFullYear(), val.getMonth() + 1, 0),
                    m = monthRefiner.months.split(",");

                vspan.text(m[val.getMonth()] + " " + val.getFullYear());

                t.attr("data-odata-filter",
                    config.fieldName + " ge datetime'" + val.getFullYear() + "/" + (val.getMonth() + 1) + "/" + val.getDate() + "' and "
                  + config.fieldName + " le datetime'" + last.getFullYear() + "/" + (last.getMonth() + 1) + "/" + last.getDate() + "'"
                    );

            });

            $.each(filters, function (idx, filter) {
                if (idx % 2 == 0) {
                    var opt = $("a[data-refiner='" + filter.value + "']", ui);
                    opt.addClass("is-selected");
                }
            });

        }
    };

    $.fn.acAzureSearchProxy.refiners = {
        parse: function (text) {

            var parter = /and|or/,
                str = text.replace(/\+/g, " "),
                match,
                lastPos = 0,
                filters = [], found = false;

            while ((match = parter.exec(str)) !== null) {

                found = true;
                var filter = {
                    operator: match[0],
                    query: str.substr(lastPos, match.index)
                };
                filter.field = filter.query.substr(0, /\s|\//.exec(filter.query).index);
                filters.push(filter);

            }

            if (!found && text && text.length > 0) {

                filters.push({
                    operator: "and",
                    query: str,
                    field: str.substr(0, /\s|\//.exec(str).index)
                });

            }

            return filters;

        },
        text    :   textRefiner,
        tag     :   tagRefiner,
        month   :   monthRefiner
    };

})(jQuery, document, window);
