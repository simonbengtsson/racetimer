if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("Service Worker registration failed: ", registrationError);
      });
  });
}

var stApp = angular.module("enduroApp", [
  "ui.bootstrap",
  "angularFileUpload",
  "cfp.hotkeys",
  "de.ng-sortable",
]);

stApp.config(function (hotkeysProvider) {
  hotkeysProvider.includeCheatSheet = true;
  hotkeysProvider.cheatSheetDescription = "Visa översikt för kortkommandon";
  hotkeysProvider.templateTitle = "Kortkommandon";
});

stApp.controller("MainController", [
  "$scope",
  "competition",
  "$modal",
  "$log",
  "hotkeys",
  "pdfgen",
  function ($scope, competition, $modal, $log, hotkeys, pdfgen) {
    var MAX_LATEST = 15;

    var comp = competition;
    $scope.comp = competition;

    $scope.reverse = false;
    $scope.sortColumn = [comp.getStartTime, "id"];

    $scope.changeSort = function (sc) {
      $scope.reverse = sc === $scope.sortColumn[0] ? !$scope.reverse : false;
      $scope.sortColumn = [sc, "id"];
    };

    hotkeys.add({
      combo: ["ctrl+I", "command+i"],
      description: "Öppnar import dialog",
      callback: function () {
        $scope.openImport();
      },
    });

    hotkeys.add({
      combo: ["ctrl+B"],
      description: "Säkerhetskopiera tävling",
      callback: function () {
        comp.saveToFile();
      },
    });

    $scope.reporting = {};
    $scope.orderAttribute = "plac";

    $scope.latest = [];
    $scope.tableLapsCount = 0;

    $scope.calcPlac = function (pt) {
      if (pt.laps.length === 0) return "";
      var plac = 1;
      comp.pts.forEach(function (other) {
        if (pt.laps.length < other.laps.length) {
          plac++;
        } else if (pt.laps.length === other.laps.length) {
          var timeDiff =
            pt.laps[pt.laps.length - 1].time -
            other.laps[other.laps.length - 1].time;
          if (timeDiff > 0) {
            plac++;
          }
        }
      });
      pt.plac = plac;
      return plac;
    };

    /**
     * @param {Object} data Format is {pt: pt, latestIndex: int}
     */
    $scope.addResult = function (data) {
      var time = new Date();

      if (data.latestIndex !== undefined) {
        time = $scope.latest[data.latestIndex].lap;
        $scope.latest[data.latestIndex].pt = data.pt;
        comp.addLap(data.pt, time);
      } else {
        comp.addLap(data.pt, time);
        $scope.latest.unshift({ lap: time, pt: data.pt });
      }
    };

    $scope.addWithoutPt = function () {
      $scope.latest.unshift({ lap: new Date() });
    };

    $scope.removeLatest = function (index) {
      $scope.latest.splice(index, 1);
    };

    $scope.openImport = function () {
      $modal.open({
        templateUrl: "partials/import-modal.html",
        controller: [
          "$scope",
          "$modalInstance",
          "competition",
          "$filter",
          ImportCtrl,
        ],
        size: "lg",
      });
    };

    $scope.openLoad = function () {
      $modal.open({
        templateUrl: "partials/load-modal.html",
        controller: [
          "$scope",
          "$modalInstance",
          "competition",
          function () {
            $scope.modal = {};
            $scope.modal.comp = {};

            $scope.onFileSelect = function ($files) {
              console.log("sdf");
              readFile($files[0]);
            };

            /**
             * @param {File} file
             */
            function readFile(file) {
              var textType = /text.*/;

              console.log("sdf");

              if (file.type.match(textType) || (!file.type && file)) {
                var reader = new FileReader();
                reader.onload = function (e) {
                  $scope.comp = JSON.parse(e.target.result);
                  console.log(e.target.result);
                };
                reader.readAsText(file);
                $scope.modal.fileInfo = file.name;
              } else {
                $scope.modal.fileInfo = "Filen kunde inte läsas";
              }
            }
          },
        ],
      });
    };

    $scope.openLapInfoModal = function () {
      $modal.open({
        templateUrl: "partials/lap-info-modal.html",
        controller: [
          "$scope",
          "$modalInstance",
          "competition",
          function ($scope) {
            $scope.comp = comp;
          },
        ],
      });
    };

    $scope.openEditModal = function () {
      $modal.open({
        templateUrl: "partials/edit-modal.html",
        controller: [
          "$scope",
          "$modalInstance",
          "competition",
          function ($scope) {
            $scope.comp = comp;

            $scope.sortableOptions = {
              handle: ".sortable-handle",
              onUpdate: function () {},
            };
          },
        ],
      });
    };

    $scope.openPtModal = function (pt, newPt) {
      $modal.open({
        templateUrl: "partials/pt-modal.html",
        controller: [
          "$scope",
          "$modalInstance",
          "competition",
          function ($scope, $modalInstance, comp) {
            $scope.comp = comp;
            $scope.modal = {};
            $scope.newPt = newPt;
            if (newPt) pt = new comp.Participant("", "", []);
            $scope.pt = pt;

            $scope.modal.startGroup = Math.floor(
              comp.pts.indexOf(pt) / comp.getStartGroupSize()
            );

            $scope.startGroupChange = function () {
              var pos = $scope.modal.startGroup * comp.getStartGroupSize();
              var index = comp.pts.indexOf(pt);
              Utils.arrMove(comp.pts, index, pos);
            };

            $scope.times = {};
            pt.laps.forEach(function (lap) {
              $scope.times[lap.lapInfoKey] = new Date(lap.time);
            });

            $scope.$watch(
              "times",
              function () {
                pt.laps = [];
                angular.forEach($scope.times, function (time, key) {
                  if (time) {
                    var newTime = new Date(comp.startTime);
                    newTime.setHours(
                      time.getHours(),
                      time.getMinutes(),
                      time.getSeconds()
                    );
                    var lap = comp.newLap(newTime, "" + key);
                    pt.laps.push(lap);
                  } else {
                    delete $scope.times[key];
                  }
                });
              },
              true
            );

            function getStartGroups() {
              var startGroups = [];
              var size = Math.ceil(comp.pts.length / comp.getStartGroupSize());
              for (var i = 0; i < size; i++) {
                var d = new Date(comp.startTime);
                var offset = i * comp.startInterval;
                d.setSeconds(d.getSeconds() + offset);
                startGroups.push({
                  index: i,
                  startTime: d,
                  offset: offset,
                  title: i + 1 + " (+" + offset + " sek)",
                });

                for (var j = 0; j < comp.getStartGroupSize(); j++) {
                  comp.pts[i + j].startMilliOffset = offset * 1000;
                }
              }
              return startGroups;
            }

            $scope.startGroups = getStartGroups();

            $scope.addLapInfo = function () {
              comp.addLapInfo();
            };

            $scope.saveNewPt = function () {
              comp.pts.push(pt);
              $modalInstance.close();
            };
          },
        ],
      });
    };

    $scope.openCompModal = function (type) {
      $modal.open({
        templateUrl: "partials/comp-modal.html",
        controller: [
          "$scope",
          "competition",
          "$modalInstance",
          function ($scope, comp, $modalInstance) {
            $scope.type = type;
            $scope.info = {
              name: comp.name,
              date: comp.startTime,
              time: comp.startTime,
            };

            $scope.save = function () {
              if ($scope.type === "name") {
                comp.name = $scope.info.name || "Namnlös";
                $modalInstance.close();
              } else if ($scope.type === "startTime") {
                var date = $scope.info.date || new Date();
                var time = $scope.info.time || new Date();
                date.setHours(
                  time.getHours(),
                  time.getMinutes(),
                  time.getSeconds()
                );
                comp.startTime = date;
                $modalInstance.close();
              } else {
                console.error("Not valid type: " + $scope.type);
              }
            };
          },
        ],
      });
    };

    $scope.createPdf = function (type) {
      pdfgen.create(type);
    };

    $scope.openModal = function (partial) {
      $modal.open({
        templateUrl: "partials/" + partial,
        controller: [
          "$scope",
          "$modalInstance",
          "competition",
          function ($scope) {
            $scope.comp = comp;
          },
        ],
      });
    };

    var ImportCtrl = function ($scope, $modalInstance, comp, $filter) {
      $scope.modal = {};

      window.addEventListener("message", function (e) {
        e.target.removeEventListener(e.type, arguments.callee);
        handleCsvData(e.data);
      });

      $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
      };

      $scope.onFileSelect = function ($files) {
        readFile($files[0]);
      };

      /**
       * @param {File} file
       */
      function readFile(file) {
        var textType = /text.*/;

        if (file.type.match(textType) || (!file.type && file)) {
          var reader = new FileReader();
          reader.onload = function (e) {
            // CSV library must be executed in sandbox
            $("#sandbox-frame")[0].contentWindow.postMessage(
              e.target.result,
              "*"
            );
          };
          reader.readAsText(file);
          $scope.modal.fileInfo = file.name;
        } else {
          $scope.modal.fileInfo = "Filen kunde inte läsas";
        }
      }

      function handleCsvData(res) {
        if (!res) {
          $scope.modal.fileInfo = "Oväntat fel";
          return;
        } else if (!res.success) {
          $scope.modal.fileInfo = res.message;
          return;
        }

        var headers = res.data.shift();
        $scope.modal.headers = headers; // Copy
        $scope.modal.pts = res.data;

        $scope.modal.ptId = headers[0];
        $scope.modal.ptDesc = headers[1];
      }

      $scope.makeImport = function () {
        var idi = $scope.modal.headers.indexOf($scope.modal.ptId);
        var desci = $scope.modal.headers.indexOf($scope.modal.ptDesc);
        var pts = [];
        $scope.modal.pts.forEach(function (data) {
          var id = !isNaN(data[idi]) ? parseInt(data[idi]) : data[idi];
          var desc = data[desci];
          data.splice(Math.max(idi, desci), 1);
          data.splice(Math.min(idi, desci), 1);
          pts.push(comp.newPt(id, desc, data));
        });

        pts = $filter("orderBy")(pts, "id");

        var othersHeaders = $scope.modal.headers;
        othersHeaders.splice(Math.max(idi, desci), 1);
        othersHeaders.splice(Math.min(idi, desci), 1);
        comp.initialize(
          pts,
          $scope.modal.ptId,
          $scope.modal.ptDesc,
          othersHeaders
        );
        $modalInstance.close();
      };
    };
  },
]);
