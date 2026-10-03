<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\ScamCase;
use App\Support\BangladeshDivisions;

class CommunityOverviewController extends Controller
{
    public function __invoke()
    {
        $empty = ['directory_listings' => 0, 'imported_listings' => 0, 'community_listings' => 0, 'demo_listings' => 0, 'public_cases' => 0, 'demo_cases' => 0];
        $divisions = [];
        foreach (BangladeshDivisions::ALL as $key => [$name, $nameBn]) {
            $divisions[$key] = ['key' => $key, 'name' => $name, 'name_bn' => $nameBn, 'location_filter' => $name.' Division'] + $empty;
        }
        $totals = $unknown = $empty;
        // Aggregate recorded address/source combinations rather than sending directory rows or case details.
        $listings = Business::publicDirectory()->select('location', 'is_demo')
            ->selectRaw('CASE WHEN source_ref IS NOT NULL THEN 1 ELSE 0 END AS is_imported, COUNT(*) AS aggregate_count')
            ->groupBy('location', 'is_demo', 'is_imported')->get();
        foreach ($listings as $listing) {
            $key = BangladeshDivisions::fromLocation($listing->location);
            $count = (int) $listing->aggregate_count;
            $source = $listing->is_demo ? 'demo_listings' : ($listing->is_imported ? 'imported_listings' : 'community_listings');
            foreach (['directory_listings', $source] as $metric) {
                $totals[$metric] += $count;
                if ($key) $divisions[$key][$metric] += $count;
                else $unknown[$metric] += $count;
            }
        }
        $cases = ScamCase::publiclyVisible()->join('businesses', 'businesses.id', '=', 'scam_cases.business_id')
            ->select('businesses.location')->selectRaw('CASE WHEN scam_cases.is_demo = 1 OR businesses.is_demo = 1 THEN 1 ELSE 0 END AS demo, COUNT(*) AS aggregate_count')
            ->groupBy('businesses.location', 'demo')->get();
        foreach ($cases as $case) {
            $key = BangladeshDivisions::fromLocation($case->location);
            $metric = $case->demo ? 'demo_cases' : 'public_cases';
            $count = (int) $case->aggregate_count;
            $totals[$metric] += $count;
            if ($key) $divisions[$key][$metric] += $count;
            else $unknown[$metric] += $count;
        }
        return response()->json(['success' => true, 'data' => ['divisions' => array_values($divisions), 'totals' => $totals, 'unknown_location' => $unknown, 'updated_at' => now()->toIso8601String()]]);
    }

    public function scamNationalTally()
    {
        // Real calculated scam financial loss tally across all published citizen reports
        $cases = ScamCase::publiclyVisible()
            ->whereNotNull('scam_cases.published_at')
            ->where('scam_cases.created_at', '>=', now()->subDays(30))
            ->where('scam_cases.is_demo', false)
            ->whereHas('business', fn ($query) => $query->where('is_demo', false));
        $totalBdt = (float) (clone $cases)->whereNotNull('scam_cases.amount')->sum('scam_cases.amount');

        // Dynamic unit formatting based on actual BDT amount
        if ($totalBdt >= 10000000) {
            $croreVal = round($totalBdt / 10000000, 2);
            $totalMoneyFormatted = '৳' . number_format($croreVal, 2) . ' crore';
            $totalMoneyFormattedBn = '৳' . number_format($croreVal, 2) . ' কোটি';
            $unitLabel = 'crore';
            $unitLabelBn = 'কোটি';
            $displayNumber = $croreVal;
        } elseif ($totalBdt >= 100000) {
            $lakhVal = round($totalBdt / 100000, 2);
            $totalMoneyFormatted = '৳' . number_format($lakhVal, 2) . ' lakh';
            $totalMoneyFormattedBn = '৳' . number_format($lakhVal, 2) . ' লাখ';
            $unitLabel = 'lakh';
            $unitLabelBn = 'লাখ';
            $displayNumber = $lakhVal;
        } else {
            $totalMoneyFormatted = '৳' . number_format($totalBdt, 0);
            $totalMoneyFormattedBn = '৳' . number_format($totalBdt, 0);
            $unitLabel = 'BDT';
            $unitLabelBn = 'টাকা';
            $displayNumber = $totalBdt;
        }

        // Real-time disputed percentage — only count cases that were publicly published
        $disputedCount = (clone $cases)->where('scam_cases.status', 'disputed')->count();
        $resolvedCount = (clone $cases)->whereIn('scam_cases.status', ['resolved', 'disputed'])->count();
        $disputedPct = $resolvedCount > 0 ? round(($disputedCount / $resolvedCount) * 100) : 0;

        // All 8 Bangladesh Divisions
        $allDivisions = [
            'dhaka' => ['name' => 'Dhaka', 'name_bn' => 'ঢাকা'],
            'chattogram' => ['name' => 'Chattogram', 'name_bn' => 'চট্টগ্রাম'],
            'rajshahi' => ['name' => 'Rajshahi', 'name_bn' => 'রাজশাহী'],
            'khulna' => ['name' => 'Khulna', 'name_bn' => 'খুলনা'],
            'sylhet' => ['name' => 'Sylhet', 'name_bn' => 'সিলেট'],
            'barishal' => ['name' => 'Barishal', 'name_bn' => 'বরিশাল'],
            'rangpur' => ['name' => 'Rangpur', 'name_bn' => 'রংপুর'],
            'mymensingh' => ['name' => 'Mymensingh', 'name_bn' => 'ময়মনসিংহ'],
        ];

        // Query all DB cases and aggregate per division
        $dbCases = (clone $cases)->join('businesses', 'businesses.id', '=', 'scam_cases.business_id')
            ->select('businesses.location', 'scam_cases.amount')
            ->get();

        $divStats = [];
        foreach ($allDivisions as $key => $d) {
            $divStats[$key] = [
                'name' => $d['name'],
                'name_bn' => $d['name_bn'],
                'alerts' => 0,
                'bdt' => 0.0,
            ];
        }

        foreach ($dbCases as $c) {
            $key = BangladeshDivisions::fromLocation($c->location);
            if (!$key) continue;
            if (!isset($divStats[$key])) {
                $divStats[$key] = [
                    'name' => ucfirst($key),
                    'name_bn' => $key,
                    'alerts' => 0,
                    'bdt' => 0.0,
                ];
            }
            $divStats[$key]['alerts'] += 1;
            if ($c->amount > 0) {
                $divStats[$key]['bdt'] += (float) $c->amount;
            }
        }

        $maxAlerts = max(1, max(array_column($divStats, 'alerts')));

        $divisionList = [];
        foreach ($divStats as $key => $d) {
            $bdt = $d['bdt'];
            $formattedMoney = $bdt >= 10000000
                ? '৳' . round($bdt / 10000000, 1) . ' cr'
                : ($bdt >= 100000 ? '৳' . round($bdt / 100000, 1) . ' lakh' : '৳' . number_format($bdt));

            $divisionList[] = [
                'key' => $key,
                'name' => $d['name'],
                'name_bn' => $d['name_bn'],
                'alerts' => $d['alerts'],
                'bdt' => $bdt,
                'money_crore' => round($bdt / 10000000, 4),
                'money_formatted' => $formattedMoney,
                'bar_percentage' => round(($d['alerts'] / $maxAlerts) * 100),
            ];
        }

        // Sort by alert count descending
        usort($divisionList, fn ($a, $b) => $b['alerts'] <=> $a['alerts']);

        // Return ONLY top 4 divisions for the UI card
        $top4Divisions = array_slice($divisionList, 0, 4);

        return response()->json([
            'success' => true,
            'data' => [
                'total_money_crore' => $displayNumber,
                'unit_label' => $unitLabel,
                'unit_label_bn' => $unitLabelBn,
                'total_money_formatted' => $totalMoneyFormatted,
                'total_money_formatted_bn' => $totalMoneyFormattedBn,
                'live_sum_bdt' => $totalBdt,
                'disputed_percentage' => $disputedPct,
                'days' => 30,
                'divisions' => $top4Divisions,
            ]
        ]);
    }
}
