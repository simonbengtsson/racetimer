/**
 * Service for handling the competition model
 */
angular.module('enduroApp').service('pdfgen', ['competition', '$filter', function (comp, $filter) {

    var self = this;
    this.START_TYPE = 'start-list';
    this.RESULT_TYPE = 'results';

    this.create = function (type) {
        self.type = type;
        var title = (type === self.RESULT_TYPE ? 'Resultat ' : 'Startlista ') + comp.name;
        var def = {
            footer: footer(),
            content: [
                { text: title, style: 'mainHeader' },
                {
                    table: table(headers(), data(), widths()),
                    layout: layout()
                }
            ],
            styles: {
                tableHeader: {
                    bold: true,
                    fontSize: 11
                },
                mainHeader: {
                    fontSize: 20,
                    lineHeight: 50,
                    alignment: 'center',
                    color: '#555',
                    bold: true,
                    margin: [0, 0, 0, 5]
                }
            },
            defaultStyle: {
                fontSize: 9,
                color: '#333'
            }
        };

        if (comp.lapInfoArr.length > 2 && self.RESULT_TYPE === self.type) {
            def.pageOrientation = 'landscape';
            def.pageMargins = [40, 30, 40, 50];
        }

        pdfMake.createPdf(def).open();
    };

    function headers() {
        var lapTitles = [];
        if (self.type === self.RESULT_TYPE) {
            comp.lapInfoArr.forEach(function (info) {
                lapTitles.push(info.title);
            });
        }

        var columns = [comp.ptId, comp.ptDesc, 'Start'].concat(comp.ptInfoArr).concat(lapTitles);
        if (self.type === self.RESULT_TYPE) {
            columns.unshift('Plac');
            columns.push('Total');
        }
        var headers = [];
        for (var i = 0; i < columns.length; i++) {
            headers[i] = { text: columns[i], style: 'tableHeader' };
        }
        return headers;
    }

    function data() {
        var data = [];
        var pts = $filter('orderBy')(comp.pts, 'plac');
        pts.forEach(function (pt) {
            var times = [];
            if (self.type === self.RESULT_TYPE) {
                comp.lapInfoArr.forEach(function (info, i) {
                    times.push(pt.getLapTime(i, info.key) + ' ' + pt.getLapPlac(info.key));
                });
            }
            var start = $filter('date')(comp.getStartTime(pt), 'HH:mm:ss');

            var row = ["" + pt.id, pt.desc, start].concat(pt.info).concat(times);
            if (self.type === self.RESULT_TYPE) {
                row.unshift("" + pt.plac);
                row.push(pt.getTotal());
            }
            data.push(row);
        });
        return data;
    }

    function widths() {
        var lapsWidths = [];
        if (self.type === self.RESULT_TYPE) {
            comp.lapInfoArr.forEach(function () {
                lapsWidths.push('auto');
            });
        }
        var infoWidths = [];
        comp.ptInfoArr.forEach(function () {
            infoWidths.push('*');
        });
        var widths = ['auto', 'auto', 'auto'].concat(infoWidths).concat(lapsWidths);
        if (self.type === self.RESULT_TYPE) {
            widths.unshift('auto');
            widths.push('auto');
        }
        return widths;
    }

    function footer() {
        return function (currentPage, pageCount) {
            return {
                columns: [
                    { text: $filter('date')(new Date(), 'yyyy-MM-dd HH:mm'), margin: [50, 10] },
                    { text: 'Sida ' + currentPage + ' av ' + pageCount, alignment: 'right', margin: [50, 10]}
                ]
            };
        };
    }

    function layout() {
        return {
            hLineWidth: function (i, node) {
                if (i === 0 || i === node.table.body.length) return 0;
                return 1;
            },
            vLineWidth: function (i) {
                return 0;
            },
            hLineColor: function (i) {
                return i === 1 ? 'black' : '#aaa';
            },
            paddingTop: function (i) {
                return 2;
            },
            paddingBottom: function (i) {
                return 2;
            },
            paddingLeft: function (i) {
                return i === 0 ? 0 : 6;
            },
            paddingRight: function (i, node) {
                return (i === node.table.widths.length - 1) ? 0 : 6;
            }
        };
    }

    function table(headers, data, widths) {
        data.unshift(headers);
        return {
            headerRows: 1,
            widths: widths,
            body: data
        };
    }

}]);