<?php
namespace App\Console\Commands;
use App\Models\Business;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\{Http,DB,Storage};
class AuditOsmDirectory extends Command {
 protected $signature='directory:audit {--apply : Correct source-confirmed categories on unclaimed sample records}';
 protected $description='Audit a stratified sample of OSM directory entries and flag nearby OSM duplicate candidates';
 public function handle():int {
  $sample=collect();
  foreach(Business::where('source_ref','like','osm:%')->distinct()->pluck('category') as $category){$rows=Business::where('source_ref','like','osm:%')->where('category',$category)->orderBy('id')->get();$sampleSize=min(6,$rows->count());for($i=0;$i<$sampleSize;$i++)$sample->push($rows[(int)floor($i*$rows->count()/$sampleSize)]);}
  if($sample->isEmpty()){$this->warn('No OSM imported data found.');return self::SUCCESS;}
  $parts=$sample->map(function($b){[, $type,$id]=explode(':',$b->source_ref);return $type.'('.(int)$id.');';})->implode('');
  try{$data=Http::asForm()->withHeaders(['User-Agent'=>'TruthHubBD-DirectoryAudit/1.0'])->timeout(90)->post('https://overpass-api.de/api/interpreter',['data'=>'[out:json][timeout:60];('.$parts.');out tags;'])->throw()->json();}catch(\Throwable $e){$this->error('Source audit unavailable: '.$e->getMessage());return self::FAILURE;}
  if(isset($data['remark'])||!isset($data['elements'])){$this->error('Incomplete source response.');return self::FAILURE;}
  $elements=collect($data['elements'])->keyBy(fn($e)=>'osm:'.$e['type'].':'.$e['id']);$report=[];$fixed=0;
  foreach($sample as $b){$e=$elements->get($b->source_ref);$tags=$e['tags']??[];$amenity=$tags['amenity']??'';$expected=isset($tags['shop'])||$amenity==='pharmacy'?'Products':(in_array($amenity,['hospital','clinic'])?'Hospitals & Clinics':(in_array($amenity,['university','school','college'])?'Universities & Education':'Businesses & Services'));
   $entry=['id'=>$b->id,'name'=>$b->name,'source'=>$b->source_url,'source_found'=>(bool)$e,'category'=>$b->category,'source_category'=>$e?$expected:null,'address_incomplete'=>$b->location==='Bangladesh','name_matches_source'=>in_array($b->name,[$tags['name']??'',$tags['name:en']??''],true)];
   if($e&&$b->category!==$expected&&$this->option('apply')&&!$b->user_id){DB::transaction(function()use($b,$expected){$locked=Business::whereKey($b->id)->lockForUpdate()->firstOrFail();if($locked->user_id||!str_starts_with($locked->source_ref??'','osm:'))return;DB::table('audit_logs')->insert(['action'=>'directory.category_corrected','auditable_type'=>'business','auditable_id'=>$b->id,'metadata'=>json_encode(['before'=>$locked->category,'after'=>$expected,'source'=>$locked->source_url]),'created_at'=>now(),'updated_at'=>now()]);$locked->update(['category'=>$expected]);});$fixed++;}
   $report[]=$entry;
  }
  $duplicates=DB::table('businesses as a')->join('businesses as b',function($join){$join->on('a.id','<','b.id')->on('a.name','=','b.name');})->where('a.source_ref','like','osm:%')->where('b.source_ref','like','osm:%')->whereRaw('ABS(a.latitude-b.latitude)<0.0005 AND ABS(a.longitude-b.longitude)<0.0005')->select('a.id as first_id','b.id as second_id','a.name')->limit(100)->get();
  $output=['checked_at'=>now()->toIso8601String(),'sample_method'=>'six evenly spaced IDs per OSM category','records'=>$report,'category_corrections'=>$fixed,'duplicate_candidates'=>$duplicates,'note'=>'OSM source consistency audit only; not independent business or ownership verification. Ambiguous duplicates require human review.'];
  Storage::disk('private')->put('directory-audit.json',json_encode($output,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));$this->info('Audited '.count($report).' source records; corrected '.$fixed.' categories; flagged '.$duplicates->count().' duplicate candidates. Report: storage/app/private/directory-audit.json');return self::SUCCESS;
 }
}
