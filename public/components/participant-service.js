/**
 * Service for handling the competition model
 */
angular.module('enduroApp').service('participant', function () {

    function Participant(nr, desc, info) {
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
