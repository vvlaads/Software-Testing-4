/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 0.0, "KoPercent": 100.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "HTTP Request"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 240, 240, 100.0, 984.1291666666667, 934, 1102, 980.0, 1010.0, 1019.95, 1044.9, 3.983865345351327, 0.8987039988048404, 0.6185884667098251], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["HTTP Request", 240, 240, 100.0, 984.1291666666667, 934, 1102, 980.0, 1010.0, 1019.95, 1044.9, 3.983865345351327, 0.8987039988048404, 0.6185884667098251], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 946 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,016 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 999 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 982 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 1,010 milliseconds, but should not have lasted longer than 890 milliseconds.", 4, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 961 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 988 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 967 milliseconds, but should not have lasted longer than 890 milliseconds.", 4, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 960 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 981 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 977 milliseconds, but should not have lasted longer than 890 milliseconds.", 11, 4.583333333333333, 4.583333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 1,102 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 987 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 956 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,026 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 992 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 966 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 1,020 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 998 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,015 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 971 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 976 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, 3.3333333333333335, 3.3333333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 934 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 973 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 1,004 milliseconds, but should not have lasted longer than 890 milliseconds.", 7, 2.9166666666666665, 2.9166666666666665], "isController": false}, {"data": ["The operation lasted too long: It took 1,011 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,014 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 1,007 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 970 milliseconds, but should not have lasted longer than 890 milliseconds.", 6, 2.5, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 1,001 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 979 milliseconds, but should not have lasted longer than 890 milliseconds.", 6, 2.5, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 1,049 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 989 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 947 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 954 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 951 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 957 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 983 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, 3.3333333333333335, 3.3333333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 980 milliseconds, but should not have lasted longer than 890 milliseconds.", 6, 2.5, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 986 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,027 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 985 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, 3.3333333333333335, 3.3333333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 964 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 1,002 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 1,019 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 996 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 990 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 959 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 984 milliseconds, but should not have lasted longer than 890 milliseconds.", 6, 2.5, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 1,033 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 963 milliseconds, but should not have lasted longer than 890 milliseconds.", 4, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 948 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 953 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 969 milliseconds, but should not have lasted longer than 890 milliseconds.", 4, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 974 milliseconds, but should not have lasted longer than 890 milliseconds.", 5, 2.0833333333333335, 2.0833333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 1,039 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 995 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 955 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 958 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 997 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 991 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 994 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 952 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,022 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,003 milliseconds, but should not have lasted longer than 890 milliseconds.", 3, 1.25, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 972 milliseconds, but should not have lasted longer than 890 milliseconds.", 6, 2.5, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 1,000 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 968 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 975 milliseconds, but should not have lasted longer than 890 milliseconds.", 9, 3.75, 3.75], "isController": false}, {"data": ["The operation lasted too long: It took 978 milliseconds, but should not have lasted longer than 890 milliseconds.", 4, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,035 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 962 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 965 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, 3.3333333333333335, 3.3333333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 1,009 milliseconds, but should not have lasted longer than 890 milliseconds.", 2, 0.8333333333333334, 0.8333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 1,032 milliseconds, but should not have lasted longer than 890 milliseconds.", 1, 0.4166666666666667, 0.4166666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 1,006 milliseconds, but should not have lasted longer than 890 milliseconds.", 4, 1.6666666666666667, 1.6666666666666667], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 240, 240, "The operation lasted too long: It took 977 milliseconds, but should not have lasted longer than 890 milliseconds.", 11, "The operation lasted too long: It took 975 milliseconds, but should not have lasted longer than 890 milliseconds.", 9, "The operation lasted too long: It took 976 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, "The operation lasted too long: It took 983 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, "The operation lasted too long: It took 985 milliseconds, but should not have lasted longer than 890 milliseconds.", 8], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["HTTP Request", 240, 240, "The operation lasted too long: It took 977 milliseconds, but should not have lasted longer than 890 milliseconds.", 11, "The operation lasted too long: It took 975 milliseconds, but should not have lasted longer than 890 milliseconds.", 9, "The operation lasted too long: It took 976 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, "The operation lasted too long: It took 983 milliseconds, but should not have lasted longer than 890 milliseconds.", 8, "The operation lasted too long: It took 985 milliseconds, but should not have lasted longer than 890 milliseconds.", 8], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
