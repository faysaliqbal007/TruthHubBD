<?php
namespace App\Console\Commands;
use App\Models\Advertisement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
class UseReferenceAdvertisementCreatives extends Command {
 protected $signature='sample:advertisement-reference {--apply : Apply the supplied reference logos and text to untouched reserved local samples}';
 protected $description='Use three user-supplied example creatives without inventing real advertiser verification or overwriting admin edits';
 public function handle():int {
  if(!app()->environment(['local','testing'])){$this->error('Local/testing samples only.');return self::FAILURE;}
  $values=[
   'education'=>['Sample learning programme · explore before enrolling','Protiva Education — IELTS preparation & higher study guidance','প্রতিভা এডুকেশন — IELTS প্রস্তুতি ও উচ্চশিক্ষার গাইডলাইন','Supplied education advertising example. Compare course schedules, fees and support before enrolling. Advertiser and offer details have not been independently confirmed.','সরবরাহ করা শিক্ষা বিজ্ঞাপনের উদাহরণ। ভর্তির আগে সময়সূচি, ফি ও সহায়তার তথ্য তুলনা করুন। বিজ্ঞাপনদাতা ও অফারের তথ্য স্বাধীনভাবে নিশ্চিত করা হয়নি।'],
   'healthcare'=>['Sample care information · plan your visit','X Specialized Hospital — healthcare promotion','এক্স স্পেশালাইজড হসপিটাল — স্বাস্থ্যসেবার প্রচার','Supplied healthcare advertising example. Confirm service availability and consultation costs directly. The reference discount and licensing claims are not confirmed or offered here.','সরবরাহ করা স্বাস্থ্যসেবা বিজ্ঞাপনের উদাহরণ। সেবা ও পরামর্শের খরচ সরাসরি নিশ্চিত করুন। রেফারেন্সে থাকা ছাড় ও লাইসেন্সের দাবি এখানে নিশ্চিত বা অফার করা হচ্ছে না।'],
   'recruitment'=>['Sample career notice · understand the role','K-Tech Global Corporation — career information','কে-টেক গ্লোবাল কর্পোরেশন — ক্যারিয়ারের তথ্য','Supplied recruitment advertising example. Check role details, employer identity and contract terms. No actual vacancy, placement guarantee or application link is confirmed.','সরবরাহ করা নিয়োগ বিজ্ঞাপনের উদাহরণ। পদ, নিয়োগদাতার পরিচয় ও চুক্তির শর্ত যাচাই করুন। কোনো বাস্তব শূন্যপদ, চাকরির নিশ্চয়তা বা আবেদন লিংক নিশ্চিত করা হয়নি।']
  ];$eligible=[];
  foreach($values as $sector=>$copy){$ad=Advertisement::where('sample_key','sample-advertisement-v1-'.$sector)->first();if($ad&&$this->untouched($ad))$eligible[]=[$ad,$sector,$copy];}
  $this->line('Eligible untouched example advertisements: '.count($eligible).'. User-provided creatives, not verified advertisers or active offers.');
  if(!$this->option('apply')){$this->info('Dry run; nothing written.');return self::SUCCESS;}
  $updated=0;
  DB::transaction(function()use($eligible,&$updated){foreach($eligible as [$ad,$sector,$copy]){$ad=Advertisement::whereKey($ad->id)->lockForUpdate()->first();if(!$ad||!$this->untouched($ad))continue;$ad->update(['title_en'=>$copy[1],'title_bn'=>$copy[2],'body_en'=>$copy[3],'body_bn'=>$copy[4],'organization_id'=>null,'destination_url'=>null,'image_source'=>'creative_image','creative_image_path'=>'/advertisement-media/reference-'.$sector.'.jpg','decision_rationale'=>'Supplied example creative with locally stored source image. Advertiser identity, discounts, licensing and real offers are not confirmed. Destination remains blank for later admin configuration.']);DB::table('audit_logs')->insert(['actor_user_id'=>null,'action'=>'advertisement.reference_sample_updated','auditable_type'=>Advertisement::class,'auditable_id'=>$ad->id,'metadata'=>json_encode(['is_sample'=>true,'creative_image_path'=>$ad->creative_image_path,'source'=>'user_supplied_reference']),'created_at'=>now(),'updated_at'=>now()]);$updated++;}});
  $this->info('Updated '.$updated.' example creatives. Admin changes and other records preserved.');return self::SUCCESS;
 }
 private function untouched(Advertisement $ad):bool {
  if(!$ad->is_sample||$ad->updated_by_user_id||$ad->created_by_user_id||$ad->status!=='published'||$ad->destination_url||$ad->creative_image_path||$ad->starts_at||$ad->ends_at||$ad->image_source!=='illustration'||$ad->illustration_theme!==$ad->sector)return false;
  foreach(app(SeedSampleAdvertisements::class)->creatives() as $original){if($original['sector']!==$ad->sector)continue;unset($original['organization_slug']);foreach($original as $field=>$value)if($ad->getAttribute($field)!==$value)return false;return $ad->decision_rationale==='Fictional local interface example only. No actual offer, sponsor, payment, ownership approval, license, recruitment service or medical assurance is represented.';}
  return false;
 }
}
