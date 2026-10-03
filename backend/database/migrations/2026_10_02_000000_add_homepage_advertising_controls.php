<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::table('advertisements',function(Blueprint $table){$table->boolean('show_in_ticker')->default(true);$table->string('ticker_text_en',500)->nullable();$table->string('ticker_text_bn',500)->nullable();});
  Schema::create('advertisement_ticker_settings',function(Blueprint $table){$table->id();$table->boolean('enabled')->default(true);$table->text('policy_en');$table->text('policy_bn');$table->timestamps();});
  DB::table('advertisement_ticker_settings')->insert(['id'=>1,'enabled'=>true,'policy_en'=>'TruthHubBD commitment: clearly labelled, reviewed advertising. Payment does not change reviews or case decisions. Report misleading advertisements to our team.','policy_bn'=>'TruthHubBD-এর প্রতিশ্রুতি: বিজ্ঞাপন স্পষ্টভাবে চিহ্নিত এবং প্রকাশের আগে পর্যালোচনা করা হয়। অর্থপ্রদান রিভিউ বা কেসের সিদ্ধান্ত বদলায় না। বিভ্রান্তিকর বিজ্ঞাপন দেখলে আমাদের জানান।','created_at'=>now(),'updated_at'=>now()]);
 }
 public function down(): void {Schema::dropIfExists('advertisement_ticker_settings');Schema::table('advertisements',fn(Blueprint $table)=>$table->dropColumn(['show_in_ticker','ticker_text_en','ticker_text_bn']));}
};
