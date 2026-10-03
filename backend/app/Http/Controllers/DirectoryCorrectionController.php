<?php
namespace App\Http\Controllers;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class DirectoryCorrectionController extends Controller {
 public function update(Request $r,Business $business){
  abort_unless($r->user()->role==='admin',403);
  $data=$r->validate(['name'=>'nullable|string|max:255','category'=>'nullable|in:Products,Businesses & Services,Doctors & Professionals,Hospitals & Clinics,Universities & Education,Courier & Digital Services','location'=>'nullable|string|max:255','operating_status'=>'required|in:unknown,open,closed','report_id'=>'required|integer','reason'=>'required|string|max:2000']);
  DB::transaction(function()use($r,$business,$data){
   $report=DB::table('content_reports')->where('id',$data['report_id'])->lockForUpdate()->first();
   abort_unless($report&&$report->reportable_type==='business'&&(int)$report->reportable_id===$business->id&&$report->status==='open',422,'Choose an open report for this exact business.');
   $locked=Business::whereKey($business->id)->lockForUpdate()->firstOrFail();$before=$locked->only(['name','category','location','operating_status']);
   foreach(['name','category','location'] as $field)if(!empty($data[$field]))$locked->$field=$data[$field];
   $locked->operating_status=$data['operating_status'];
   if($locked->isDirty('location')){$locked->google_place_id=null;$locked->latitude=null;$locked->longitude=null;}
   $locked->save();DB::table('content_reports')->where('id',$report->id)->update(['status'=>'resolved','handled_by_user_id'=>$r->user()->id,'updated_at'=>now()]);
   DB::table('audit_logs')->insert(['actor_user_id'=>$r->user()->id,'action'=>'directory.corrected','auditable_type'=>'business','auditable_id'=>$locked->id,'metadata'=>json_encode(['before'=>$before,'after'=>$locked->only(array_keys($before)),'reason'=>$data['reason'],'report_id'=>$report->id]),'created_at'=>now(),'updated_at'=>now()]);
  });return response()->json(['message'=>'Correction recorded. Reviews and ownership history were preserved.']);
 }
}
