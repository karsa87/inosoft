"use strict";

// Class definition
window.KTHomeReportList = function () {
    // Shared variables
    var datatable;
    var table;

    // Init add schedule modal
    var initHomeReportList = () => {
        // Init datatable --- more info on datatables: https://datatables.net/manual/
        datatable = $(table).DataTable({});

        // Re-init functions on every table re-draw -- more info: https://datatables.net/reference/event/draw
        datatable.on('draw', function () {
            KTMenu.createInstances();
        });
    }

    return {
        // Public functions
        init: function () {
            table = document.querySelector('#kt_medical_orders_report_table');

            if (!table) {
                return;
            }

            initHomeReportList();
        }
    };
}();

// On document ready
KTUtil.onDOMContentLoaded(function () {
    KTHomeReportList.init();
});
