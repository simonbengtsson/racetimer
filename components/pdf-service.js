/**
 * Service for handling the competition model
 */
angular.module("enduroApp").service("pdfgen", [
  "competition",
  "$filter",
  function (comp, $filter) {
    var self = this;
    this.START_TYPE = "start-list";
    this.RESULT_TYPE = "results";

    this.create = function (type) {
      console.log("Hello!");
      self.type = type;
      var title =
        (type === self.RESULT_TYPE ? "Resultat " : "Startlista ") + comp.name;

      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF("l");
      var totalPagesExp = "{total_pages_count_string}";
      doc.autoTable({
        margin: { top: 25, bottom: 25 },
        didDrawPage: function (data) {
          doc.text(title, 15, 18);

          var str =
            "Sida " +
            doc.internal.getNumberOfPages() +
            " av " +
            totalPagesExp +
            " · " +
            new Date().toLocaleString();
          doc.setFontSize(10);

          // jsPDF 1.4+ uses getHeight, <1.4 uses .height
          var pageSize = doc.internal.pageSize;
          var pageHeight = pageSize.getHeight();
          doc.text(str, data.settings.margin.left, pageHeight - 10);
        },
        head: headers(),
        body: data(),
      });
      doc.putTotalPages(totalPagesExp);
      doc.output("dataurlnewwindow");
      console.log("Hello2");
    };

    function headers() {
      var lapTitles = [];
      if (self.type === self.RESULT_TYPE) {
        comp.lapInfoArr.forEach(function (info) {
          lapTitles.push(info.title);
        });
      }

      var columns = [comp.ptId, comp.ptDesc, "Start"]
        .concat(comp.ptInfoArr)
        .concat(lapTitles);
      if (self.type === self.RESULT_TYPE) {
        columns.unshift("Plac");
        columns.push("Total");
      }
      return [columns];
    }

    function data() {
      var data = [];
      var pts = $filter("orderBy")(comp.pts, "plac");
      pts.forEach(function (pt) {
        var times = [];
        if (self.type === self.RESULT_TYPE) {
          comp.lapInfoArr.forEach(function (info, i) {
            times.push(
              pt.getLapTime(i, info.key) + " " + pt.getLapPlac(info.key)
            );
          });
        }
        var start = $filter("date")(comp.getStartTime(pt), "HH:mm:ss");

        var row = ["" + pt.id, pt.desc, start].concat(pt.info).concat(times);
        if (self.type === self.RESULT_TYPE) {
          row.unshift("" + pt.plac);
          row.push(pt.getTotal());
        }
        data.push(row);
      });
      return data;
    }
  },
]);
