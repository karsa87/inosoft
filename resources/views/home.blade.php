@extends('layouts.admin')

@section('content')
    <!--begin::Card-->
    <div class="card card-flush">
        <!--begin::Card header-->
        <div class="card-header mt-6">
            <!--begin::Card title-->
            <div class="card-title">
                <!--begin::Search-->
                <div class="d-flex align-items-center position-relative my-1 me-5">
                    Laporan harian
                </div>
                <!--end::Search-->
            </div>
            <!--end::Card title--><!--begin::Card toolbar-->
            <div class="card-toolbar">
                <!--begin::Toolbar-->
                {{-- <div class="d-flex justify-content-end" data-kt-appointments-table-toolbar="base">
                    <!--begin::Add user-->
                    <a href="{{ route('admin.report.transaction.daily.export.excel') }}" class="btn btn-primary me-2">
                        <i class="ki-duotone ki-notepad-bookmark fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                            <span class="path3"></span>
                            <span class="path4"></span>
                            <span class="path5"></span>
                            <span class="path6"></span>
                        </i>Excel
                    </a>
                    <!--end::Add user-->
                    <!--begin::Add user-->
                    <a href="{{ route('admin.report.transaction.daily.export.csv') }}" class="btn btn-info me-2">
                        <i class="ki-duotone ki-document fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>CSV
                    </a>
                    <!--end::Add user-->
                    <!--begin::Add user-->
                    <a href="{{ route('admin.report.transaction.daily.export.pdf') }}" class="btn btn-warning">
                        <i class="ki-duotone ki-tablet-text-down fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                            <span class="path3"></span>
                            <span class="path4"></span>
                        </i>PDF
                    </a>
                    <!--end::Add user-->
                </div> --}}
                <!--end::Toolbar-->
            </div>
            <!--end::Card toolbar-->
        </div>
        <!--end::Card header-->
        <!--begin::Card body-->
        <div class="card-body pt-0">
            <!--begin::Table-->
            <table class="table table-striped align-middle table-row-dashed fs-6 gy-5 mb-0" id="kt_medical_orders_report_table">
                <thead class="bg-light-info">
                    <tr class="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                        <th class="min-w-75px">Sales</th>
                        @for ($i=1; $i <= $endDate->diffInDays($startDate); $i++)
                            @php
                                $date = \Carbon\Carbon::createFromDate($startDate->year, $startDate->month, $i);
                            @endphp
                            <th class="min-w-125px">{{ $date->format('d M Y') }}</th>
                        @endfor
                    </tr>
                </thead>
                <tbody class="fw-semibold text-gray-600">
                    @foreach ($salesStores->groupBy('sales') as $sales => $storeSales)
                        <tr>
                            <td valign="top">{{ $sales }}</td>
                            @foreach ($storeSales->sortBy('date')->groupBy('date') as $date => $storeDates)
                                @php
                                    $date = \Carbon\Carbon::parse($date);
                                @endphp
                                @if ($date->dayOfWeek == 0)
                                    <td class="bg-danger">Libur</td>
                                @else
                                <td valign="top">
                                    <ol>
                                    @foreach ($storeDates as $store)
                                        <li>{{ $store['name'] }}</li>
                                    @endforeach
                                    </ol>
                                </td>
                                @endif
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
            <!--end::Table-->
        </div>
        <!--end::Card body-->
    </div>
    <!--end::Card-->
@endsection

@push('css-plugin')
    <link href="{{ mix('admin/plugins/custom/datatables/datatables.bundle.css') }}" rel="stylesheet" type="text/css"/>
@endpush

@push('js-plugin')
    <script src="{{ mix('admin/plugins/custom/datatables/datatables.bundle.js') }}"></script>
@endpush

@push('js')
    <script src="{{ mix('admin/js/custom/report/home/list.js') }}"></script>
@endpush
