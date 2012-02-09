function example () {

  // Configuraiton
  var
    H = humblevis,
    E = Flotr.EventAdapter,

    container = document.getElementById('demo'),

    jsonData,

    priceOptions = {
      name    : 'price',
      flotr   : {
        lines : {
          fill : true,
          fillOpacity : .2
        },
        mouse : {
          track: true,
          trackY: false,
          sensibility: 1,
          trackDecimals: 4,
          trackFormatter: function (o) {
            var data = jsonData[o.index];//nearest.x];
            return data.date + " Price: " + data.close + " Vol: " + data.volume;
          },
          position: 'ne'
        },
        yaxis : { 
          noTicks : 3,
          showLabels : true,
          min : 0,
          tickFormatter : function (n) {
            return (n == this.max ? false : '$'+n);
          }
        }
      },
      skipPreprocess : true
    },

    volumeOptions = {
      name    : 'volume',
      flotr   : {
        bars : { show : true },
        mouse: {
          track: true,
          trackY: false,
          position: 'ne',
          trackDecimals: 0
        }
      },
      skipPreprocess : true
    },

    summaryOptions = {
      name    : 'summary',
      flotr   : {
        lines : {
          fill : true,
          fillOpacity : .2
        },
        xaxis : {
          noTicks: 5,
          showLabels : true
        },
        handles   : { show : true },
        selection : { mode : 'x'},
        grid : {
          verticalLines : false
        }
      },
      skipPreprocess : true
    },

    vis, price, volume, summary, selection, hit;

  // Data
  $.get('data/initial.json', function (data) {
    jsonData = data.data;
    priceOptions.data = data.price;
    volumeOptions.data = data.volume;
    summaryOptions.data = data.summary;
    summaryOptions.flotr.xaxis.ticks = data.summaryTicks;
    application();
  });

  // Application
  function application () {
    vis = new H.Visualization();
    price = new H.Child(priceOptions);
    volume = new H.Child(volumeOptions);
    summary = new H.Child(summaryOptions);
    selection = new H.Interaction({leader : summary});
    hit = new H.Interaction();

    vis
      .add(price)
      .add(volume)
      .add(summary)
      .render(container);

    selection.add(H.action.selection, {
      callback : (function () {
        var data = {
          original : {
            price : priceOptions.data,
            volume : volumeOptions.data
          },
          fetched : {
            price : null,
            volume : null
          }
        };
        function fetchData (o) {
          $.get('data/ajax.json', function (d) {
            data.fetched.price = d.price;
            data.fetched.volume = d.volume;
            priceOptions.data = d.price;
            volumeOptions.data = d.volume;
            jsonData = d.data;
            _.each(selection.followers, function (follower) {
              follower.draw(null, o);
            }, this);
          });
        }
        return function (o) {

          var
            x = o.data.x;

          if (x.max !== null && Math.abs(x.max - x.min) < 250) {
            if (data.fetched.price && data.fetched.volume) {
              priceOptions.data = data.fetched.price;
              volumeOptions.data = data.fetched.volume;
            } else {
              fetchData(o);
            }
          } else {
            priceOptions.data = data.original.price;
            volumeOptions.data = data.original.volume;
          }
        }
      })()
    });

    selection
      .follower(price)
      .follower(volume);

    hit.add(H.action.hit);
    hit.group([price, volume]);
  }
}

