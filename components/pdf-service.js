/**
 * Service for handling the competition model
 */
angular.module('enduroApp').service('pdfgen', ['competition', '$filter', function (comp, $filter) {

    var DEFAULT_MARGIN = 40;
    var doc = new jsPDF('p', 'pt');

    var columns;
    var data;

    this.results = function () {
        columns = ['Plac', comp.ptId, comp.ptDesc].concat(comp.ptInfoArr).concat(['Varv 1', 'Total']);
        data = [];
        comp.pts.forEach(function (pt) {
            data.push([pt.plac, pt.id, pt.desc].concat(pt.info).concat(['', '']));
        });
        create('Resultat ' + comp.name, columns, data);
    };

    this.startList = function () {
        columns = [comp.ptId, comp.ptDesc].concat(comp.ptInfoArr);
        data = [];
        comp.pts.forEach(function (pt) {
            data.push([pt.id, pt.desc].concat(pt.info));
        });
        create('Startlista ' + comp.name, columns, data);
    };

    function create(title, columns, data) {
        var size = doc.internal.pageSize;
        doc.setFontSize(20).setTextColor(100).setFontStyle('bold');
        doc.text(title, DEFAULT_MARGIN, DEFAULT_MARGIN + 8);
        doc.setFontStyle('normal').setFontSize(10);
        doc.autoTable(columns, data, {margins: {horizontal: DEFAULT_MARGIN, top: 60, bottom: DEFAULT_MARGIN}});
        doc.output('dataurlnewwindow');
    }

    function rightText(txt) {

    }

    this.sample = function () {
        columns = [
            {title: "ID", key: "id"},
            {title: "Name", key: "name"},
            {title: "Country", key: "country"},
            {title: "IP-address", key: "ip_address"},
            {title: "Email", key: "email"}
        ];
        data = [
            {"id": 1, "name": "Shaw", "country": "Tanzania", "ip_address": "92.44.246.31", "email": "abrown@avamba.info"},
            {"id": 2, "name": "Nelson", "country": "Kazakhstan", "ip_address": "112.238.42.121", "email": "jjordan@agivu.com"},
            {"id": 3, "name": "Garcia", "country": "Madagascar", "ip_address": "39.211.252.103", "email": "jdean@skinte.biz"},
            {"id": 4, "name": "Richardson", "country": "Somalia", "ip_address": "27.214.238.100", "email": "nblack@midel.gov"},
            {"id": 5, "name": "Kennedy", "country": "Libya", "ip_address": "82.148.96.120", "email": "charrison@tambee.name"},
            {"id": 6, "name": "Kennedy", "country": "Wallis and Futuna Islands", "ip_address": "127.253.48.108", "email": "cward@meevee.info"},
            {"id": 7, "name": "Mills", "country": "Northern Mariana Islands", "ip_address": "173.172.137.141", "email": "gwebb@skimia.org"},
            {"id": 8, "name": "Miller", "country": "Nauru", "ip_address": "108.91.41.115", "email": "rsanders@zoovu.edu"},
            {"id": 9, "name": "Simmons", "country": "Papua New Guinea", "ip_address": "210.21.169.1", "email": "pevans@abata.com"},
            {"id": 10, "name": "Mccoy", "country": "Mali", "ip_address": "90.184.77.113", "email": "ahughes@mybuzz.gov"}
        ];

        create('Sample', columns, data);
    };

}]);