<?php

namespace App\Http\Controllers;

use App\Services\GeolocationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HomeController extends Controller
{
    private $geolocationService;

    public function __construct(GeolocationService $geolocationService){
        $this->geolocationService = $geolocationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $officeLatitude = -7.9826;
        $officeLongitude = 112.6308;
        $totalSales = 10;

        $lines = explode(PHP_EOL, Storage::get("stores.csv"));
        $header = collect(str_getcsv(array_shift($lines)));
        $header->push('distance');
        $header = $header->map(fn($headerName) => Str::slug($headerName, '_'));
        $rows = collect($lines);
        $stores = $rows->map(function ($row) use ($header, $officeLatitude, $officeLongitude) {
            $row = str_getcsv($row);
            $latitude = $row[3];
            $longitude = $row[2];
            $row['distance'] = $this->geolocationService->distanceInMeter($officeLatitude, $officeLongitude, $latitude, $longitude);
            return $header->combine($row);
        });

        $stores = $stores->sortBy('distance')->groupBy("final_cycle");
        $startDate = Carbon::createFromDate(2024, 10, 1);
        $endDate = (clone $startDate)->endOfMonth();

        $sales = collect();
        $totalDailyPerSales = (int) floor(count($stores['Weekly'])/ 6 / $totalSales);
        $totalBiWeeklyPerSales = (int) ceil(count($stores['Biweekly']) / 12 / $totalSales);
        $totalMonthlyPerSales = (int) ceil(count($stores['Monthly']) / 24 / $totalSales);

        $storesWeeklyTmp = collect($stores['Weekly']);
        $storesBiweeklyTmp = collect($stores['Biweekly']);
        $storesMonthlyTmp = collect($stores['Monthly']);
        for ($i=1; $i <= $endDate->diffInDays($startDate); $i++) {
            $date = Carbon::createFromDate($startDate->year, $startDate->month, $i);
            if ($date->dayOfWeek == 0) {
                for ($j=1; $j <= $totalSales; $j++) {
                    $sales->push([
                        'sales' => "Sales $j",
                        'date' => $date->format('Y-m-d'),
                    ]);
                }

                continue;
            }

            if ($date->day % 8 == 0) {
                $storesWeeklyTmp = collect($stores['Weekly']);
            }

            if ($date->day % 16 == 0) {
                $storesBiweeklyTmp = collect($stores['Biweekly']);
            }

            if ($date->day % 24 == 0) {
                $storesMonthlyTmp = collect($stores['Monthly']);
            }

            for ($j=1; $j <= $totalSales; $j++) {
                foreach ($storesWeeklyTmp->pop($totalDailyPerSales) as $store) {
                    $storeTmpJ = clone $store;
                    $storeTmpJ['sales'] = "Sales $j";
                    $storeTmpJ['date'] = $date->format('Y-m-d');

                    $sales->push($storeTmpJ);
                }
                foreach ($storesBiweeklyTmp->pop($totalBiWeeklyPerSales) as $store) {
                    $storeTmpJ = clone $store;
                    $storeTmpJ['sales'] = "Sales $j";
                    $storeTmpJ['date'] = $date->format('Y-m-d');

                    $sales->push($storeTmpJ);
                }
                foreach ($storesMonthlyTmp->pop($totalMonthlyPerSales) as $store) {
                    $storeTmpJ = clone $store;
                    $storeTmpJ['sales'] = "Sales $j";
                    $storeTmpJ['date'] = $date->format('Y-m-d');

                    $sales->push($storeTmpJ);
                }
            }
        }

        return view('home', [
            'salesStores' => $sales,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

}
