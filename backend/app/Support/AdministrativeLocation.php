<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class AdministrativeLocation
{
    public static function rules(): array
    {
        return [
            'division_id' => 'nullable|string|max:80',
            'district_id' => 'nullable|string|max:80',
            'upazila_id' => 'nullable|string|max:80',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'road' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'postcode' => 'nullable|string|max:32',
            'detected_address' => 'nullable|string|max:500',
        ];
    }

    /** IDs validate parentage; the existing address column remains the source of display text. */
    public static function normalize(Request $request, ?string $address, ?string $presence): ?string
    {
        if (!$request->hasAny(['division_id','district_id','upazila_id'])) return $address;
        $data=json_decode(file_get_contents(resource_path('data/bd-locations.json')),true,512,JSON_THROW_ON_ERROR);
        $division=collect($data['divisions'])->firstWhere('id',$request->input('division_id'));
        $district=collect($data['districts'])->firstWhere('id',$request->input('district_id'));
        if (!$division) throw ValidationException::withMessages(['division_id'=>'Select a known Bangladesh division.']);
        if (!$district || $district['divisionId']!==$division['id']) throw ValidationException::withMessages(['district_id'=>'Select a district belonging to the selected division.']);
        $area=null;
        if ($request->filled('upazila_id')) {
            $area=collect($data['upazilas'])->firstWhere('id',$request->input('upazila_id'));
            if (!$area || $area['districtId']!==$district['id']) throw ValidationException::withMessages(['upazila_id'=>'Select an area belonging to the selected district.']);
        }
        if ($presence==='online') throw ValidationException::withMessages(['division_id'=>'An online-only organization cannot submit a physical location selection.']);
        $parts=array_values(array_filter([$area,$district,$division]));
        $canonical=implode(', ',array_column($parts,'name'));
        if (!trim($address??'')) return $canonical;
        // Street/locality text may precede the selector's suffix. The suffix must
        // match the selected hierarchy, including accepted aliases or Bangla names.
        $addressParts=array_map('trim',explode(',',$address));
        if (count($addressParts)<count($parts)) throw ValidationException::withMessages(['location'=>'The address must end with the selected area, district and division.']);
        $suffix=array_slice($addressParts,-count($parts));
        foreach ($parts as $index=>$part) {
            $names=array_map(fn($name)=>mb_strtolower(trim($name)),array_merge([$part['name'],$part['nameBn']],$part['aliases']??[]));
            if (!in_array(mb_strtolower($suffix[$index]),$names,true)) throw ValidationException::withMessages(['location'=>'The address does not match the selected area, district and division.']);
        }
        $prefix=array_filter(array_slice($addressParts,0,-count($parts)),fn($part)=>$part!=='');
        $normalized=implode(', ',array_merge($prefix,[$canonical]));
        if (mb_strlen($normalized)>255) throw ValidationException::withMessages(['location'=>'The normalized address may not exceed 255 characters.']);
        return $normalized;
    }
}
