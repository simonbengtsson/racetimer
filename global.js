var Utils = new function () {

    /**
     * Modernizr's implementation of local storage test.
     * @returns {boolean}
     */
    this.lsTest = function () {
        var mod = 'test';
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch (e) {
            return false;
        }
    };

    /**
     * Calculates time difference between two objects
     *
     * @param {Date} first
     * @param {Date} second
     * @returns {{milli: number, hours: number, minutes: number, seconds: number, str: string}}
     */
    this.timeDiff = function (first, second) {
        var diff = second - first;
        var hours = Math.floor(diff / 36e5),
            minutes = Math.floor(diff % 36e5 / 60000),
            seconds = Math.floor(diff % 60000 / 1000);

        return {
            milli: diff,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            str: this.pad(hours, 2) + ':' + this.pad(minutes, 2) + ':' + this.pad(seconds, 2)
        }
    };

    /**
     * Pad number with characters
     * @param number
     * @param width
     * @param char
     * @returns {string}
     */
    this.pad = function (number, width, char) {
        char = char || '0';
        number = number + '';
        return number.length >= width ? number : new Array(width - number.length + 1).join(char) + number;
    };

    this.shortcutChar = function(append) {
        append = append || '';
        var pf = window.navigator.platform.toLowerCase();
        if(pf.indexOf('mac')) {
            return '&#8984;' + append;
        } else if(pf.indexOf('linux') || pf.indexOf('win')) {
            return 'Ctrl' + append;
        }
        return '';
    };

    /**
     * Function count the occurrences of substring in a string;
     */
    this.strCount = function (needle, haystack) {
        return (haystack.match(new RegExp(needle, 'g')) || []).length
    }

};

// Unload and beforeunload is not allowed in chrome apps (used by jsPDF)
(function () {
    var windowAddEventListener = Window.prototype.addEventListener;
    Window.prototype.addEventListener = function (type) {
        if (type !== 'unload' && type !== 'beforeunload') {
            return windowAddEventListener.apply(window, arguments);
        }
    };
})();