@php
    $menu = config('menus.' . request()->route()->getName());
@endphp

@if ($menu)
<!--begin::Toolbar-->
<div class="toolbar mb-5 mb-lg-7" id="kt_toolbar">
    <!--begin::Page title-->
    <div class="page-title d-flex flex-column me-3">
        <!--begin::Title-->
        <h1 class="d-flex text-dark fw-bold my-1 fs-3">{!! $menu['title'] !!}</h1>
        <!--end::Title-->
        <!--begin::Breadcrumb-->
        <ul class="breadcrumb breadcrumb-dot fw-semibold text-gray-600 fs-7 my-1">
            <!--begin::Item-->
            <li class="breadcrumb-item text-gray-600">
                <a href="{{ url('/') }}" class="text-gray-600 text-hover-primary">Dashboard</a>
            </li>
            <!--end::Item-->
            @isset($menu['breadcrumbs'])
            @foreach ($menu['breadcrumbs'] as $i => $breadcrumb)
                <!--begin::Item-->
                <li class="breadcrumb-item {{ ($i+1) == count($menu['breadcrumbs']) ? 'text-gray-500' : 'text-gray-600' }}">
                    @if ($breadcrumb['route'] !== '#')
                        <a href="{{ route($breadcrumb['route']) }}" class="{{ ($i+1) == count($menu['breadcrumbs']) ? 'text-gray-500' : 'text-gray-600' }} text-hover-primary">{!! $breadcrumb['name'] !!}</a>
                    @else
                        {!! $breadcrumb['name'] !!}
                    @endif
                </li>
                <!--end::Item-->
            @endforeach
            @endisset
        </ul>
        <!--end::Breadcrumb-->
    </div>
    <!--end::Page title-->
</div>
<!--end::Toolbar-->
@endif
