<?php

namespace App\Console\Commands;

use App\Models\AdminBoundary;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportBoundariesCommand extends Command
{
    protected $signature = 'locations:import-boundaries';
    protected $description = 'Import and seed Bangladesh administrative boundaries (Divisions, Districts, Upazilas) into spatial database';

    public function handle(): int
    {
        $this->info('Starting administrative boundary import for Bangladesh...');

        // 1. Division definitions with accurate bounding boxes
        $divisions = [
            'dhaka' => [
                'name_en' => 'Dhaka', 'name_bn' => 'ঢাকা',
                'min_lat' => 23.2, 'max_lat' => 24.5, 'min_lng' => 89.8, 'max_lng' => 90.8
            ],
            'chittagong' => [
                'name_en' => 'Chittagong', 'name_bn' => 'চট্টগ্রাম',
                'min_lat' => 20.5, 'max_lat' => 24.3, 'min_lng' => 90.7, 'max_lng' => 92.8
            ],
            'rajshahi' => [
                'name_en' => 'Rajshahi', 'name_bn' => 'রাজশাহী',
                'min_lat' => 23.8, 'max_lat' => 25.2, 'min_lng' => 88.0, 'max_lng' => 89.8
            ],
            'khulna' => [
                'name_en' => 'Khulna', 'name_bn' => 'খুলনা',
                'min_lat' => 21.6, 'max_lat' => 24.1, 'min_lng' => 88.5, 'max_lng' => 89.9
            ],
            'barisal' => [
                'name_en' => 'Barisal', 'name_bn' => 'বরিশাল',
                'min_lat' => 21.8, 'max_lat' => 23.1, 'min_lng' => 89.9, 'max_lng' => 90.9
            ],
            'sylhet' => [
                'name_en' => 'Sylhet', 'name_bn' => 'সিলেট',
                'min_lat' => 23.9, 'max_lat' => 25.2, 'min_lng' => 90.9, 'max_lng' => 92.6
            ],
            'rangpur' => [
                'name_en' => 'Rangpur', 'name_bn' => 'রংপুর',
                'min_lat' => 25.2, 'max_lat' => 26.6, 'min_lng' => 88.1, 'max_lng' => 89.9
            ],
            'mymensingh' => [
                'name_en' => 'Mymensingh', 'name_bn' => 'ময়মনসিংহ',
                'min_lat' => 24.2, 'max_lat' => 25.2, 'min_lng' => 89.6, 'max_lng' => 91.0
            ],
        ];

        $divisionModels = [];
        foreach ($divisions as $key => $d) {
            $poly = sprintf(
                'MULTIPOLYGON(((%F %F, %F %F, %F %F, %F %F, %F %F)))',
                $d['min_lng'], $d['min_lat'],
                $d['max_lng'], $d['min_lat'],
                $d['max_lng'], $d['max_lat'],
                $d['min_lng'], $d['max_lat'],
                $d['min_lng'], $d['min_lat']
            );

            $model = AdminBoundary::updateOrCreate(
                ['code' => $key, 'admin_level' => 1],
                [
                    'parent_id' => null,
                    'admin_type' => 'division',
                    'name_en' => $d['name_en'],
                    'name_bn' => $d['name_bn'],
                    'min_lat' => $d['min_lat'],
                    'max_lat' => $d['max_lat'],
                    'min_lng' => $d['min_lng'],
                    'max_lng' => $d['max_lng'],
                ]
            );

            DB::statement(
                'UPDATE admin_boundaries SET boundary = ST_SRID(ST_GeomFromText(?), 4326) WHERE id = ?',
                [$poly, $model->id]
            );

            $divisionModels[$key] = $model;
        }
        $this->info('Seeded 8 Divisions.');

        // 2. Read districts and upazilas from bd-boundaries.json
        $boundariesJsonPath = database_path('data/bd-boundaries.json');
        $districtsData = [];
        $upazilasData = [];

        if (file_exists($boundariesJsonPath)) {
            $parsed = json_decode(file_get_contents($boundariesJsonPath), true) ?: [];
            $districtsData = $parsed['districts'] ?? [];
            $upazilasData = array_merge(
                $parsed['urbanAreas'] ?? [],
                $parsed['administrativeUpazilas'] ?? []
            );
        }

        $districtModels = [];
        foreach ($districtsData as $dist) {
            $divKey = $dist['divisionId'] ?? 'dhaka';
            $parentDiv = $divisionModels[$divKey] ?? null;

            // Approximate district bbox based on parent division
            $minLat = $parentDiv ? $parentDiv->min_lat : 23.0;
            $maxLat = $parentDiv ? $parentDiv->max_lat : 24.0;
            $minLng = $parentDiv ? $parentDiv->min_lng : 90.0;
            $maxLng = $parentDiv ? $parentDiv->max_lng : 91.0;

            $poly = sprintf(
                'MULTIPOLYGON(((%F %F, %F %F, %F %F, %F %F, %F %F)))',
                $minLng, $minLat,
                $maxLng, $minLat,
                $maxLng, $maxLat,
                $minLng, $maxLat,
                $minLng, $minLat
            );

            $dModel = AdminBoundary::updateOrCreate(
                ['code' => $dist['id'], 'admin_level' => 2],
                [
                    'parent_id' => $parentDiv ? $parentDiv->id : null,
                    'admin_type' => 'district',
                    'name_en' => $dist['name'],
                    'name_bn' => $dist['nameBn'],
                    'min_lat' => $minLat,
                    'max_lat' => $maxLat,
                    'min_lng' => $minLng,
                    'max_lng' => $maxLng,
                ]
            );

            DB::statement(
                'UPDATE admin_boundaries SET boundary = ST_SRID(ST_GeomFromText(?), 4326) WHERE id = ?',
                [$poly, $dModel->id]
            );

            $districtModels[$dist['id']] = $dModel;
        }
        $this->info('Seeded ' . count($districtModels) . ' Districts.');

        $upazilaCount = 0;
        foreach ($upazilasData as $up) {
            $distId = $up['districtId'] ?? '';
            $parentDist = $districtModels[$distId] ?? null;

            $minLat = $parentDist ? $parentDist->min_lat : 23.0;
            $maxLat = $parentDist ? $parentDist->max_lat : 24.0;
            $minLng = $parentDist ? $parentDist->min_lng : 90.0;
            $maxLng = $parentDist ? $parentDist->max_lng : 91.0;

            $poly = sprintf(
                'MULTIPOLYGON(((%F %F, %F %F, %F %F, %F %F, %F %F)))',
                $minLng, $minLat,
                $maxLng, $minLat,
                $maxLng, $maxLat,
                $minLng, $maxLat,
                $minLng, $minLat
            );

            $uModel = AdminBoundary::updateOrCreate(
                ['code' => $up['id'], 'admin_level' => 3],
                [
                    'parent_id' => $parentDist ? $parentDist->id : null,
                    'admin_type' => $up['kind'] ?? 'upazila',
                    'name_en' => $up['name'],
                    'name_bn' => $up['nameBn'],
                    'min_lat' => $minLat,
                    'max_lat' => $maxLat,
                    'min_lng' => $minLng,
                    'max_lng' => $maxLng,
                ]
            );

            DB::statement(
                'UPDATE admin_boundaries SET boundary = ST_SRID(ST_GeomFromText(?), 4326) WHERE id = ?',
                [$poly, $uModel->id]
            );

            $upazilaCount++;
        }
        $this->info("Seeded {$upazilaCount} Upazilas & Urban Areas.");
        $this->info('Boundary import complete!');

        return self::SUCCESS;
    }
}
