(function ($) {
  /***
   * A sample AJAX data store implementation.
   * Right now, it's hooked up to load Hackernews stories, but can
   * easily be extended to support any JSONP-compatible backend that accepts paging parameters.
   */
  function RemoteModel() {
    // private
    var PAGESIZE = 50;
    var data = {length: 0};
    var searchstr = "";
    var sortcol = null;
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();


    function init() {
    }


    function isDataLoaded(from, to) {
      for (var i = from; i <= to; i++) {
        if (data[i] == undefined || data[i] == null) {
          return false;
        }
      }

      return true;
    }


    function clear() {
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }


    function ensureData(from, to) {
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * PAGESIZE] = undefined;
      }

      if (from < 0) {
        from = 0;
      }

      if (data.length > 0) {
        to = Math.min(to, data.length - 1);
      }

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined)) {
        // TODO:  look-ahead
        onDataLoaded.notify({from: from, to: to});
        return;
      }

      var url = "http://10.30.33.228:8090/dmp/objects/_search?q=" + searchstr + "&from=" + (fromPage * PAGESIZE) + "&size=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);

      if (sortcol != null) {
          url += ("&sort=" + sortcol + ((sortdir > 0) ? ":asc" : ":desc"));
      }

      if (h_request != null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function () {
        for (var i = fromPage; i <= toPage; i++)
          data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'

        onDataLoading.notify({from: from, to: to});

        req = $.jsonp({
          url: url,
          callbackParameter: "callback",
          cache: true,
          success: onSuccess,
          error: function () {
            onError(fromPage, toPage)
          }
        });
        req.fromPage = fromPage;
        req.toPage = toPage;
        req.from = (fromPage * PAGESIZE);
        req.to = (((toPage - fromPage) * PAGESIZE) + PAGESIZE);
      }, 50);
    }


    function onError(fromPage, toPage) {
      alert("error loading pages " + fromPage + " to " + toPage);
    }

    function onSuccess(resp) {
      var from = req.from, to = from + resp.hits.hits.length;
      data.length = parseInt(resp.hits.total);
      
      for (var i = 0; i < resp.hits.hits.length; i++) {
        var item = resp.hits.hits[i]._source;
        item.id = resp.hits.hits[i]._id;
        item._ = JSON.stringify(item);

        data[from + i] = item;
        data[from + i].index = from + i;
      }

      req = null;

      onDataLoaded.notify({from: from, to: to});
    }


    function reloadData(from, to) {
      for (var i = from; i <= to; i++)
        delete data[i];

      ensureData(from, to);
    }


    function setSort(column, dir) {
      sortcol = column;
      sortdir = dir;
      clear();
    }

    function setSearch(str) {
      searchstr = str;
      clear();
    }


    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, { Slick: { Data: { RemoteModel: RemoteModel }}});
})(jQuery);

