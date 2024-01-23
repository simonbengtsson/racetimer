/**
 * Filter for the participant table
 */
var app = angular.module('enduroApp');

app.filter('slug', function () {
    return function (input) {
        if (input) {
            return input.toLowerCase().replace(/ /g, '_').replace(/(ä|å)/g, 'a').replace(/ö/g, 'o').replace(/[^a-z_0-9]/g, '');
        }
    };
});