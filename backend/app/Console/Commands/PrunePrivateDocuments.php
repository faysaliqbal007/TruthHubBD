<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\{DB,Storage};
use App\Models\{BusinessClaim,ScamCase};
class PrunePrivateDocuments extends Command {
 protected $signature='documents:prune {--apply : Permanently remove eligible files after reviewing the dry run}';
 protected $description='Dry-run private document retention: rejected claims 90 days, resolved cases 180 days; holds and open appeals preserved';
 public function handle():int {
  $claims=BusinessClaim::where('status','rejected')->where('legal_hold',false)->where('updated_at','<',now()->subDays(config('document_security.claim_retention_days')))->get();
  $cases=ScamCase::where('status','resolved')->where('legal_hold',false)->where('resolved_at','<',now()->subDays(config('document_security.case_retention_days')))->whereNotIn('id',DB::table('appeals')->where('status','submitted')->pluck('scam_case_id'))->get();$count=0;
  foreach($claims as $candidate){DB::transaction(function()use($candidate,&$count){
   $claim=BusinessClaim::whereKey($candidate->id)->lockForUpdate()->first();
   if(!$claim||$claim->legal_hold||$claim->status!=='rejected'||$claim->updated_at>=now()->subDays(config('document_security.claim_retention_days')))return;
   $removed=0;foreach(['evidence_path','business_photo_path'] as $field){if(!$claim->$field)continue;$count++;if($this->option('apply')){$this->remove($claim->$field);$claim->$field=null;$removed++;}}
   if($removed){$claim->save();$this->audit('claim',$claim->id);}
  });}
  foreach($cases as $candidate){DB::transaction(function()use($candidate,&$count){
   $case=ScamCase::whereKey($candidate->id)->lockForUpdate()->first();
   if(!$case||$case->legal_hold||$case->status!=='resolved'||!$case->resolved_at||$case->resolved_at>=now()->subDays(config('document_security.case_retention_days'))||DB::table('appeals')->where('scam_case_id',$case->id)->where('status','submitted')->exists())return;
   $removed=0;foreach($case->evidence as $e){$count++;if($this->option('apply')){$this->remove($e->storage_path);$e->delete();$removed++;}}
   if($removed)$this->audit('scam_case',$case->id);
  });}
  $this->info(($this->option('apply')?'Deleted ':'Would delete ').$count.' document files. Decisions and public history are retained.');return self::SUCCESS;
 }
 private function remove(string $path):void {if(Storage::disk('private')->exists($path)&&!Storage::disk('private')->delete($path))throw new \RuntimeException('Private document deletion failed; metadata retained.');}
 private function audit(string $type,int $id):void {DB::table('audit_logs')->insert(['action'=>'retention.documents_deleted','auditable_type'=>$type,'auditable_id'=>$id,'metadata'=>json_encode(['policy'=>'claims-90/cases-180','operator'=>'console']),'created_at'=>now(),'updated_at'=>now()]);}
}
