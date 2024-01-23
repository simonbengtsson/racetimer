var rwApp = angular.module('enduroApp');

rwApp.directive('esTime', ['$interval', '$filter', function ($interval, $filter) {

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

rwApp.directive('stRepInput', ['$filter', 'competition', function ($filter, competition) {

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

rwApp.directive('focusMe', function ($timeout) {
    return {
        link: function (scope, element, attrs, model) {
            $timeout(function () {
                element[0].focus();
            });
        }
    };
});