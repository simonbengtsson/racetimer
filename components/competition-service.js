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

    this.getStartGroups = function () {
        return 'Masstart';
    };

    this.pts = [
        new Participant(1, 'Simon Bengtsson', ['Ryttarna', 'Honda']),
        new Participant(12, 'Jarl Nic', ['Ryttarna', 'Honda']),
        new Participant(5, 'Mark Smith', ['Sollentuna MC', 'Yamaha']),
        new Participant(2, 'Susan Eade', ['Sollentuna MC', 'R11'])
    ];

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
     *
     * @param {Participant} pt
     * @param {Date} time
     */
    this.addLap = function (pt, time) {
        var lapInfo;
        for (var i = 0; i < comp.lapInfoArr.length; i++) {
            var alreadyExists = false;
            for (var j = 0; j < pt.laps.length; j++) {
                if (pt.laps[j].lapInfoKey === comp.lapInfoArr[i].key) {
                    alreadyExists = true;
                    break;
                }
            }
            if (!alreadyExists) {
                lapInfo = comp.lapInfoArr[i];
                break;
            }
        }

        if (!lapInfo)
            lapInfo = comp.addLapInfo();
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

    this.newPt = function (id, desc, info) {
        return new Participant(id, desc, info);
    };

    function Participant(nr, desc, info) {
        var pt = this;

        this.id = nr;
        this.desc = desc;
        this.plac = '';
        this.info = info;
        this.laps = [];
        this.startMilliOffset = 0;

        this.getStartTime = function () {
            return new Date(comp.startTime.getTime() + this.startMilliOffset);
        };

        this.importFrom = function (pt) {
            this.id = pt.id;
            this.desc = pt.desc;
            this.info = pt.info;
            this.laps = pt.laps;
            this.startMilliOffset = pt.startMilliOffset;
        };

        this.getLapTime = function (index, lapInfoId) {
            var prev = (index === 0 ? {time: pt.getStartTime()} : findLap(index - 1));
            var curr = findLap(index);
            if (prev && curr)
                var diff = Utils.timeDiff(prev.time, curr.time);
            return (diff && diff.milli > 0 ? diff.str : '');
        };

        function findLap(lapInfoIndex) {
            var lapInfoId = comp.lapInfoArr[lapInfoIndex].key;
            for (var i = 0; i < pt.laps.length; i++) {
                if (('' + lapInfoId) === ('' + pt.laps[i].lapInfoKey))
                    return pt.laps[i];
            }
            return false;
        }

        this.getTotal = function () {
            if (this.laps.length === 0)
                return '';
            var lastLap = this.laps[this.laps.length - 1];
            var diff = Utils.timeDiff(pt.getStartTime(), lastLap.time);
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
        this.key = LapInfo.id;
        LapInfo.id++;
    }

    this.LapInfo = LapInfo;

});