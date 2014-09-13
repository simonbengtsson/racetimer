var stApp = angular.module('enduroApp', ['ui.bootstrap', 'angularFileUpload', 'cfp.hotkeys']);

stApp.config(function (hotkeysProvider) {
    hotkeysProvider.includeCheatSheet = true;
    hotkeysProvider.cheatSheetDescription = 'Visa översikt för kortkommandon';
    hotkeysProvider.templateTitle = 'Kortkommandon';
});

stApp.controller('MainController', ['$scope', 'competition', '$modal', '$log', 'hotkeys', 'pdfgen', function ($scope, competition, $modal, $log, hotkeys, pdfgen) {

    var MAX_LATEST = 15;

    var comp = competition;
    $scope.comp = competition;

    $scope.reverse = false;
    $scope.sortColumn = 'plac';

    $scope.changeSort = function (sc) {
        $scope.reverse = !$scope.reverse;
        $scope.sortColumn = sc;
    };

    hotkeys.add({
        combo: ['ctrl+I', 'command+i'],
        description: 'Öppnar import dialog',
        callback: function () {
            $scope.openImport();
        }
    });

    hotkeys.add({
        combo: ['ctrl+B'],
        description: 'Säkerhetskopiera tävling',
        callback: function () {
            console.log('sdf');
            comp.saveToFile();
        }
    });

    $scope.reporting = {};
    $scope.orderAttribute = 'plac';

    $scope.latest = [];
    $scope.tableLapsCount = 0;

    $scope.calcPlac = function (pt) {
        if (pt.laps.length === 0)
            return '';
        var plac = 1;
        comp.pts.forEach(function (other) {
            if (pt.laps.length < other.laps.length) {
                plac++;
            } else if (pt.laps.length === other.laps.length) {
                var timeDiff = pt.laps[pt.laps.length - 1].time - other.laps[other.laps.length - 1].time;
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
            $scope.latest.unshift({lap: time, pt: data.pt});
            if ($scope.latest.length > MAX_LATEST) {
                $scope.latest.pop();
            }
        }
    };

    $scope.addWithoutPt = function () {
        $scope.latest.unshift({lap: new Date()});
        if ($scope.latest.length > MAX_LATEST) {
            $scope.latest.pop();
        }
    };

    $scope.removeLatest = function (index) {
        $scope.latest.splice(index, 1);
    };

    $scope.openImport = function () {
        $modal.open({
            templateUrl: 'partials/import-modal.html',
            controller: ['$scope', '$modalInstance', 'competition', ImportCtrl],
            size: 'lg'
        });
    };

    $scope.openLapInfoModal = function () {
        $modal.open({
            templateUrl: 'partials/lap-info-modal.html',
            controller: ['$scope', '$modalInstance', 'competition', function ($scope) {
                $scope.comp = comp;
            }]
        });
    };

    $scope.openPtModal = function (pt, newPt) {
        $modal.open({
            templateUrl: 'partials/pt-modal.html',
            controller: ['$scope', '$modalInstance', 'competition', function ($scope, $modalInstance, comp) {
                $scope.comp = comp;
                $scope.newPt = newPt;
                if (newPt) pt = new comp.Participant("", "", []);
                $scope.pt = pt;
                var startSecOffset = pt.startMilliOffset / 1000;

                $scope.times = {};
                pt.laps.forEach(function (lap) {
                    $scope.times[lap.lapInfoKey] = new Date(lap.time);
                });

                $scope.$watch('times', function () {
                    pt.laps = [];
                    angular.forEach($scope.times, function (time, key) {
                        if (time) {
                            var newTime = new Date(comp.startTime);
                            newTime.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
                            var lap = comp.newLap(newTime, key);
                            pt.laps.push(lap);
                        } else {
                            delete $scope.times[key];
                        }
                    });
                }, true);

                $scope.startSecOffset = function (newVal) {
                    if (arguments.length > 0) {
                        startSecOffset = (angular.isNumber(newVal) ? newVal : '');
                        pt.startMilliOffset = startSecOffset * 1000;
                    }
                    return startSecOffset;
                };

                $scope.addLapInfo = function () {
                    comp.addLapInfo();
                };

                $scope.saveNewPt = function () {
                    comp.pts.push(pt);
                    $modalInstance.close();
                };
            }]
        });
    };

    $scope.openCompModal = function (type) {
        $modal.open({
            templateUrl: 'partials/comp-modal.html',
            controller: ['$scope', 'competition', '$modalInstance', function ($scope, comp, $modalInstance) {
                $scope.type = type;
                $scope.info = {
                    name: comp.name,
                    date: comp.startTime,
                    time: comp.startTime
                };

                $scope.save = function () {
                    if ($scope.type === 'name') {
                        comp.name = $scope.info.name || "Namnlös";
                        $modalInstance.close();
                    } else if ($scope.type === 'startTime') {
                        var date = $scope.info.date || new Date();
                        var time = $scope.info.time || new Date();
                        date.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
                        comp.startTime = date;
                        $modalInstance.close();
                    } else {
                        console.log('Not valid type: ' + $scope.type);
                    }

                };
            }]
        });
    };

    $scope.createPdf = function (type) {
        switch (type) {
            case 'start-list':
                pdfgen.startList();
                break;
            case 'results':
                pdfgen.results();
                break;
            default:
                console.error('Not supported type: ' + type);
        }

    };

    $scope.openRegModal = function () {
        $modal.open({
            templateUrl: 'partials/reg-modal.html'
        });
    };

    $scope.openModal = function (partial) {
        $modal.open({
            templateUrl: 'partials/' + partial
        });
    };

    var ImportCtrl = function ($scope, $modalInstance, comp) {

        $scope.modal = {};

        window.addEventListener('message', function (e) {
            e.target.removeEventListener(e.type, arguments.callee);
            handleCsvData(e.data);
        });

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
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
                    $('#sandbox-frame')[0].contentWindow.postMessage(e.target.result, '*');
                };
                reader.readAsText(file);
                $scope.modal.fileInfo = file.name;
            } else {
                $scope.modal.fileInfo = "Filen kunde inte läsas";
            }
        }

        function handleCsvData(res) {
            if (!res) {
                $scope.modal.fileInfo = 'Oväntat fel';
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
                var id = data[idi];
                var desc = data[desci];
                data.splice(Math.max(idi, desci), 1);
                data.splice(Math.min(idi, desci), 1);
                pts.push(comp.newPt(id, desc, data));
            });
            var othersHeaders = $scope.modal.headers;
            othersHeaders.splice(Math.max(idi, desci), 1);
            othersHeaders.splice(Math.min(idi, desci), 1);
            comp.initialize(pts, $scope.modal.ptId, $scope.modal.ptDesc, othersHeaders);
            $modalInstance.close();
        };
    };

}])
;

stApp.directive('esTime', ['$interval', '$filter', function ($interval, $filter) {

        function link(scope, element, attrs) {
            var format, timeoutId;

            function updateTime() {
                var format = attrs.format || 'HH:mm:ss';
                element.text($filter('date')(new Date(), format));
            }

            updateTime();
            timeoutId = $interval(function () {
                updateTime();
            }, 1000);

            element.on('$destroy', function () {
                $interval.cancel(timeoutId);
            });

        }

        return {
            restrict: 'E',
            link: link
        }
    }]
);

stApp.directive('stRepInput', ['$filter', 'competition', function ($filter, competition) {

        function link(scope, element, attrs, ctrl) {
            scope.reporting = {searchTerm: ''};
            var comp = competition;
            scope.comp = competition;
            scope.showButton = !!attrs.button;
            scope.$watch('reporting.searchTerm', function (newValue) {
                var valid = !newValue || !!competition.findPt(newValue);
                element.find('input').toggleClass('invalid', !valid);
            });

            scope.localSubmit = function () {
                if (!scope.reporting.searchTerm) {
                    scope.submitWithoutPt();
                } else {
                    var pt = comp.findPt(scope.reporting.searchTerm);
                    if (pt) {
                        scope.submit({data: {pt: pt, latestIndex: scope.latestIndex} });
                        scope.reporting.searchTerm = '';
                    }
                }
            };
        }

        var template = '<form novalidate ng-submit="localSubmit()" class="st-rep-form">' +
            '<input ng-model="reporting.searchTerm" class="search" placeholder="{{ comp.ptId }}">' +
            '<button ng-if="showButton" type="submit" class="btn btn-primary btn-search">' +
            '<span class="glyphicon glyphicon-plus"></span>' +
            '</button>' +
            '</form>';

        return {
            restrict: 'E',
            replace: true,
            template: template,
            scope: {
                submit: '&',
                submitWithoutPt: '&',
                latestIndex: '='
            },
            link: link
        }
    }]
);

stApp.directive('focusMe', function ($timeout) {
    return {
        link: function (scope, element, attrs, model) {
            $timeout(function () {
                element[0].focus();
            });
        }
    };
});