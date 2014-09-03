/**
 * Service for handling the competition model
 */
angular.module('enduroApp').service('pdfgen', ['competition', function (comp) {

    var doc = new jsPDF('p', 'pt', 'a4');

    this.create = function () {
        console.log('pdf create');
    };

}]);
