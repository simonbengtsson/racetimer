/**
 * Service for handling the competition model
 */
angular.module('enduroApp').service('competition', function () {

    var self = this;

    this.ptId = 'ID';
    this.ptDesc = 'Desc';
    this.ptInfoArr = ['Klubb', 'Märke'];
    this.lapInfoArr = [
        {title: 'Varv 1'}
    ];

    this.drivers = [
        new Driver(1, 'Simon Bengtsson', ['Ryttarna', 'Honda']),
        new Driver(12, 'Jarl Nic', ['Ryttarna', 'Honda']),
        new Driver(5, 'Mark Smith', ['Sollentuna MC', 'Yamaha']),
        new Driver(2, 'Susan Eade', ['Sollentuna MC', 'R11'])
    ];

    this.pts = this.drivers;

    this.initialize = function(pts, ptId, ptDesc, ptInfoArr) {
        self.drivers = pts;
        self.pts = pts;
        self.ptId = ptId;
        self.ptDesc = ptDesc;
        self.ptInfoArr = ptInfoArr;
    };

    /**
     * @param {Driver} pt
     * @param {Date} time
     */
    this.addLap = function (pt, time) {
        pt.laps.push(time);
        if (pt.laps.length > this.lapInfoArr.length) {
            this.lapInfoArr.push({title: "Varv " + this.lapInfoArr.length});
        }
    };

    this.findPt = function (id) {
        for (var i = 0; i < self.pts.length; i++) {
            if (('' + self.pts[i].id).toLowerCase() == ('' + id).toLowerCase()) {
                return self.pts[i];
            }
        }
        return false;
    };

    this.newPt = function (id, desc, info) {
        return new Driver(id, desc, info);
    };

    function Driver(nr, desc, info) {
        this.id = nr;
        this.desc = desc;
        this.plac = '';
        this.info = info;
        this.laps = [];
        this.startTime = new Date();

        this.getLapTime = function (index) {
            var prev = (index === 0 ? this.startTime : this.laps[index - 1]);
            var curr = this.laps[index];
            return (prev && curr) ? Utils.timeDiff(prev, curr).str : '';
        };

        this.getTotal = function () {
            if (this.laps.length === 0)
                return '';
            var lastLap = this.laps[this.laps.length - 1];
            var diff = Utils.timeDiff(this.startTime, lastLap);
            return diff.str;
        }
    }

});
