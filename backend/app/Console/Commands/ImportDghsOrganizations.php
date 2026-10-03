<?php

namespace App\Console\Commands;

use App\Models\Business;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportDghsOrganizations extends Command
{
    protected $signature = 'directory:import-dghs {--per-division=25 : Maximum new unclaimed institutions per division} {--pages=3 : Bounded 100-row pages per division} {--apply : Save verified source facts, otherwise dry run}';
    protected $description = 'Import a balanced, bounded public DGHS institutional directory, without owners, reviews or precise address guesses';

    // Values from the public registry division selector, not Bangladesh statistical codes.
    private const DIVISIONS = [1=>'Dhaka', 2=>'Chattogram', 3=>'Rajshahi', 4=>'Rangpur', 5=>'Khulna', 6=>'Barishal', 7=>'Sylhet', 8=>'Mymensingh'];
    private const ENDPOINT = 'https://hris.mohfw.gov.bd/public/facility-registry/facilities/datatable/json';

    public function handle(): int
    {
        $maximum = max(1, min(100, (int) $this->option('per-division')));
        $pages = max(1, min(5, (int) $this->option('pages')));
        $total = 0;
        $unavailable = 0;
        foreach (self::DIVISIONS as $id=>$division) {
            $count = 0;
            $seen = [];
            for ($page=0; $page<$pages && $count<$maximum; $page++) {
                try {
                    $response = Http::withHeaders(['User-Agent'=>'TruthHubBD-PublicInstitutionDirectory/1.0'])
                        ->timeout(25)->get(self::ENDPOINT, ['draw'=>1, 'start'=>$page*100, 'length'=>100, 'division_id'=>[$id]])->throw()->json();
                    if (!is_array($response['data']??null)) throw new \RuntimeException('Unexpected public list schema.');
                } catch (\Throwable $error) {
                    $this->warn($division.': source unavailable; existing records unchanged.');
                    $unavailable++;
                    break;
                }
                foreach ($response['data'] as $row) {
                    $facts = self::facts($row, $division);
                    if (!$facts || isset($seen[$facts['source_ref']])) continue;
                    $seen[$facts['source_ref']] = true;
                    if (Business::where('source_ref',$facts['source_ref'])->exists() || Business::whereRaw('LOWER(name) = ?', [mb_strtolower($facts['name'])])->where('location',$facts['location'])->exists()) continue;
                    if ($this->option('apply')) Business::create($facts + [
                        'source_fetched_at'=>now(), 'status'=>'approved', 'presence'=>'physical',
                        'user_id'=>null, 'created_by_user_id'=>null, 'verified'=>false, 'is_demo'=>false,
                        'rating'=>0, 'review_count'=>0, 'color'=>'#18243e',
                    ]);
                    $count++;
                    if ($count >= $maximum) break;
                }
                if (count($response['data'])<100) break;
            }
            $this->line($division.': '.($this->option('apply')?'added ':'would add ').$count.' unclaimed institutions.');
            $total += $count;
        }
        $this->info('Total '.($this->option('apply')?'added ':'eligible ').$total.'. Source: public Ministry/DGHS facility registry. No owners, reviews, contacts, images or coordinates fabricated.');
        return $unavailable === 8 ? self::FAILURE : self::SUCCESS;
    }

    public static function facts(array $row, string $expectedDivision): ?array
    {
        $text = fn ($value) => trim(html_entity_decode(strip_tags(is_scalar($value)?(string)$value:''), ENT_QUOTES|ENT_HTML5, 'UTF-8'));
        $id = $text($row['id']??'');
        $name = $text($row['name']??'');
        $division = $text($row['division_name']??'');
        $district = $text($row['district_name']??'');
        $type = $text($row['facility_type_name']??'');
        if (!preg_match('/\A[1-9][0-9]*\z/', $id) || !$name || mb_strlen($name)>255 || $division!==$expectedDivision || !$district || $text($row['is_active']??'')!=='Yes') return null;
        $parts = array_filter([$text($row['upazila_name']??''),$district,$division.' Division','Bangladesh']);
        $category = preg_match('/hospital|clinic|health complex|health center|health centre|sub center|sub centre|dispensary|diagnostic/i',$type) ? 'Hospitals & Clinics' : (preg_match('/medical college|nursing|training|institute of health technology/i',$type)?'Universities & Education':'Businesses & Services');
        return [
            'name'=>$name, 'bengali_name'=>mb_substr($text($row['name_bn']??''),0,255)?:null,
            'slug'=>mb_substr(Str::slug($name)?:'organization',0,180).'-dghs-'.$id,
            'category'=>$category, 'location'=>mb_substr(implode(', ',array_unique($parts)),0,255),
            'source_ref'=>'dghs:facility:'.$id,
            'source_url'=>'https://hris.mohfw.gov.bd/public/facility-registry/facilities/'.$id.'/profile',
            'description'=>'Institution listed in the public Ministry of Health/DGHS facility registry'.($type?' ('.$type.')':'').'. Listed administrative area only; confirm the precise entrance with the institution. Ownership on TruthHubBD has not been claimed.',
        ];
    }
}
