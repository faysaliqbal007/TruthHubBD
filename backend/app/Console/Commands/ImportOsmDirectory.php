<?php
namespace App\Console\Commands;
use App\Models\Business;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Support\OsmDirectoryFacts;

class ImportOsmDirectory extends Command {
 protected $signature='directory:import-osm {--limit=5000} {--sector=all : all or retail-services} {--mirror : Use the OSM-listed private.coffee public endpoint} {--apply : Persist unclaimed listings; otherwise dry run}';
 protected $description='Import named Bangladesh establishments from OpenStreetMap (ODbL), without owners or reviews';
 public function handle():int {
  $limit=max(1,min(10000,(int)$this->option('limit')));
  if(!in_array($this->option('sector'),['all','retail-services'])){$this->error('Unknown sector.');return self::FAILURE;}
  $query='[out:json][timeout:120];area["ISO3166-1"="BD"]["admin_level"="2"]->.bd;(nwr(area.bd)["shop"]["name"];nwr(area.bd)["amenity"~"^(restaurant|cafe|hospital|clinic|pharmacy|bank|university|college|school)$"]["name"];nwr(area.bd)["tourism"="hotel"]["name"];);out center tags '.$limit.';';
  if($this->option('sector')==='retail-services')$query='[out:json][timeout:120];area["ISO3166-1"="BD"]["admin_level"="2"]->.bd;(nwr(area.bd)["shop"~"^(mall|department_store|supermarket|electronics|furniture|clothes|shoes|hardware)$"]["name"];nwr(area.bd)["amenity"~"^(bank|restaurant|cafe|car_rental)$"]["name"];nwr(area.bd)["craft"]["name"];);out center tags '.$limit.';';
  $this->info('Fetching a bounded Bangladesh extract; attribution: © OpenStreetMap contributors, ODbL 1.0.');
  $endpoint=$this->option('mirror')?'https://overpass.private.coffee/api/interpreter':'https://overpass-api.de/api/interpreter';
  try{$response=Http::withHeaders(['User-Agent'=>'TruthHubBD-LocalDirectoryImport/1.0'])->asForm()->timeout(150)->post($endpoint,['data'=>$query])->throw()->json();}
  catch(\Throwable $e){$this->error('Source unavailable; no records imported. '.$e->getMessage());return self::FAILURE;}
  if(!isset($response['elements'])||isset($response['remark'])){$this->error('Incomplete source response; import cancelled.');return self::FAILURE;}
  $created=0;$skipped=0;$seen=[];
  foreach($response['elements'] as $element){
   $tags=$element['tags']??[];$name=trim($tags['name:en']??$tags['name']??'');$coordinates=OsmDirectoryFacts::coordinates($element);$ref=OsmDirectoryFacts::sourceReference($element);
   if(!$name||mb_strlen($name)>255||!$coordinates||!$ref){$skipped++;continue;}
   [$lat,$lon]=$coordinates;
   $fingerprint=mb_strtolower($name).'|'.round($lat,3).'|'.round($lon,3);
   if(isset($seen[$fingerprint])||Business::where('source_ref',$ref)->exists()||Business::whereRaw('LOWER(name) = ?',[mb_strtolower($name)])->whereBetween('latitude',[$lat-.001,$lat+.001])->whereBetween('longitude',[$lon-.001,$lon+.001])->exists()){$skipped++;continue;}
   $seen[$fingerprint]=true;
   $amenity=$tags['amenity']??'';
   $category=isset($tags['shop'])||$amenity==='pharmacy'?'Products':(in_array($amenity,['hospital','clinic'])?'Hospitals & Clinics':(in_array($amenity,['university','college','school'])?'Universities & Education':'Businesses & Services'));
   $address=OsmDirectoryFacts::address($tags);
   $website=$tags['website']??$tags['contact:website']??null;
   if($website&&(!filter_var($website,FILTER_VALIDATE_URL)||!in_array(parse_url($website,PHP_URL_SCHEME),['https','http'])))$website=null;
   if($this->option('apply'))Business::create(['name'=>$name,'bengali_name'=>mb_substr($tags['name:bn']??'',0,255)?:null,'slug'=>mb_substr(Str::slug($name)?:'entity',0,180).'-osm-'.$element['type'].'-'.$element['id'],'category'=>$category,'location'=>mb_substr($address,0,255),'presence'=>'physical','website'=>$website?mb_substr($website,0,255):null,'description'=>'Community-mapped listing from OpenStreetMap. Details may be incomplete or outdated; ownership has not been verified.','source_ref'=>$ref,'source_url'=>'https://www.openstreetmap.org/'.$element['type'].'/'.$element['id'],'source_fetched_at'=>now(),'latitude'=>$lat,'longitude'=>$lon,'status'=>'approved','user_id'=>null,'verified'=>false,'rating'=>0,'review_count'=>0,'color'=>'#0f766e']);
   $created++;
  }
  $this->info(($this->option('apply')?'Imported ':'Would import ').$created.' unclaimed listings; skipped '.$skipped.'. Existing listings were not overwritten.');return self::SUCCESS;
 }
}
