/**
 * Service for handling the competition model
 */
angular.module('enduroApp').service('competition', function () {

    var comp = this;

    this.name = 'En tävling';
    this.startTime = new Date();
    this.ptId = 'ID';
    this.ptDesc = 'Desc';
    this.ptInfoArr = ['Club', 'Brand'];
    this.lapInfoArr = [];
    this.classes = [];
    this.startInterval = 10;
    this.compType = 'massStart';

    this.pts = [];

    this.newPt = function (id, desc, info) {
        return new Participant(id, desc, info, comp.pts.length);
    };

    /*
    this.pts.push(comp.newPt(1, 'Simon Bengtsson', ['Ryttarna', 'Honda']));
    this.pts.push(comp.newPt(12, 'Jarl Nic', ['Ryttarna', 'Honda']));
    this.pts.push(comp.newPt(5, 'Mark Smith', ['Sollentuna MC', 'Yamaha']));
    this.pts.push(comp.newPt(2, 'Susan Eade', ['Sollentuna MC', 'R11']));
    this.pts.push(comp.newPt(3, 'Simon Bengtsson', ['Ryttarna', 'Honda']));
    this.pts.push(comp.newPt(8, 'Jarl Nic', ['Ryttarna', 'Honda']));
    this.pts.push(comp.newPt(4, 'Mark Smith', ['Sollentuna MC', 'Yamaha']));
    this.pts.push(comp.newPt(6, 'Susan Eade', ['Sollentuna MC', 'R11']));
    */

    this._startGroupSize = 4;

    this.getStartGroupSize = function() {
        return comp.compType === 'massStart' ? comp.pts.length : comp._startGroupSize;
    };

    this.initialize = function (pts, ptId, ptDesc, ptInfoArr) {
        comp.pts = pts;
        comp.ptId = ptId;
        comp.ptDesc = ptDesc;
        comp.ptInfoArr = ptInfoArr;
    };

    this.saveToFile = function () {
        var json = JSON.stringify(comp);
        var blob = new Blob([json], {type: "application/json"});
        var url = URL.createObjectURL(blob);

        var a = document.getElementById('save-to-file');
        a.href = url;
    };

    this.loadFromFile = function () {
        var json = JSON.stringify(comp);
        var blob = new Blob([json], {type: "application/json"});
        var url = URL.createObjectURL(blob);

        var a = document.getElementById('save-to-file');
        a.href = url;
    };

    /**
     * Add a time to first empty lapInfo. If none exists, create new lapInfo
     * @param {Participant} pt
     * @param {Date} time
     */
    this.addLap = function (pt, time) {
        var lapInfo;
        for (var i = 0; i < comp.lapInfoArr.length; i++) {
            var alreadyExists = false;
            for (var j = 0; j < pt.laps.length; j++) {
                if (equalId(pt.laps[j].lapInfoKey, comp.lapInfoArr[i].key)) {
                    alreadyExists = true;
                    break;
                }
            }
            if (!alreadyExists) {
                lapInfo = comp.lapInfoArr[i];
                break;
            }
        }

        if (!lapInfo) lapInfo = comp.addLapInfo();
        pt.laps.push(new Lap(time, lapInfo.key));
    };

    this.addLapInfo = function () {
        var li = new LapInfo("Varv " + (comp.lapInfoArr.length + 1));
        this.lapInfoArr.push(li);
        return li;
    };

    function equalId(first, other) {
        return ('' + first).toLowerCase() === ('' + other).toLowerCase();
    }

    this.findPt = function (id) {
        for (var i = 0; i < comp.pts.length; i++) {
            if (equalId(comp.pts[i].id, id)) {
                return comp.pts[i];
            }
        }
        return false;
    };

    this.getStartTime = function (pt) {
        var offset = comp.startInterval * 1000 * Math.floor(comp.pts.indexOf(pt) / comp.getStartGroupSize());
        return new Date(comp.startTime.getTime() + offset);
    };

    function Participant(nr, desc, info) {
        var pt = this;

        this.id = nr;
        this.desc = desc;
        this.plac = '';
        this.info = info;
        this.laps = [];
        this.startMilliOffset = 0;

        this.importFrom = function (pt) {
            this.id = pt.id;
            this.desc = pt.desc;
            this.info = pt.info;
            this.laps = pt.laps;
            this.startMilliOffset = pt.startMilliOffset;
        };

        this.getLapTime = function (lapInfoIndex) {
            var prev = (lapInfoIndex === 0 ? {time: comp.getStartTime(pt)} : findLap(lapInfoIndex - 1));
            var curr = findLap(lapInfoIndex);
            if (prev && curr)
                var diff = Utils.timeDiff(prev.time, curr.time);
            return (diff && diff.milli > 0 ? diff.str : '');
        };

        this.getLapPlac = function (lapInfoId) {
            if (!pt.laps[lapInfoId])
                return '';
            var plac = 1;
            comp.pts.forEach(function (item) {
                if (item.laps[lapInfoId] && (item.laps[lapInfoId].time < pt.laps[lapInfoId].time))
                    plac++;
            });
            return '(' + plac + ')';
        };

        var findLap = function(lapInfoIndex) {
            var lapInfoId = comp.lapInfoArr[lapInfoIndex].key;
            for (var i = 0; i < pt.laps.length; i++) {
                if (('' + lapInfoId) === ('' + pt.laps[i].lapInfoKey))
                    return pt.laps[i];
            }
            return false;
        };

        this.getTotal = function () {
            if (this.laps.length === 0)
                return '';
            var lastLap = this.laps[this.laps.length - 1];
            var diff = Utils.timeDiff(comp.getStartTime(pt), lastLap.time);
            return diff.str;
        }
    }

    this.Participant = Participant;

    this.newLap = function (time, lapInfoKey) {
        return new Lap(time, lapInfoKey);
    };

    function Lap(time, lapInfoKey) {
        this.time = time;
        this.lapInfoKey = lapInfoKey;
    }

    this.newLapInfo = function () {
        return new LapInfo();
    };

    function LapInfo(title) {
        if (!LapInfo.id) LapInfo.id = 0;
        this.title = title;
        this.key = "" + LapInfo.id;
        LapInfo.id++;
    }

    this.LapInfo = LapInfo;

});