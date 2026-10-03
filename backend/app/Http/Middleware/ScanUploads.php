<?php
namespace App\Http\Middleware;
use App\Services\MalwareScanner;
use Closure;
use Illuminate\Http\Request;
class ScanUploads {
 public function handle(Request $request,Closure $next) {
  $files=\Illuminate\Support\Arr::flatten($request->allFiles());
  abort_if(count($files)>20,422,'Upload no more than 20 files per request.');
  $combinedBytes=array_sum(array_map(fn($file)=>$file->getSize()?:0,$files));
  abort_if($combinedBytes>35*1024*1024,422,'Attach no more than 35 MB of files in total per request.');
  foreach($files as $file){
   abort_unless($file->isValid()&&$file->getSize()>0&&$file->getSize()<=10*1024*1024,422,'Each upload must be a valid file no larger than 10 MB.');
  }
  // Load the signature database once for the complete request. Reject the whole batch if any file fails.
  if ($files !== []) app(MalwareScanner::class)->scan(array_map(fn($file)=>$file->getRealPath(),$files));
  foreach($files as $file){
   \DB::table('audit_logs')->insert(['actor_user_id'=>$request->user()->id,'action'=>'upload.scan_passed','auditable_type'=>'upload','auditable_id'=>0,'metadata'=>json_encode(['sha256'=>hash_file('sha256',$file->getRealPath())]),'created_at'=>now(),'updated_at'=>now()]);
  }
  return $next($request);
 }
}
