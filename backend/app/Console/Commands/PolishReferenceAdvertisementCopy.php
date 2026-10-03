<?php

namespace App\Console\Commands;

use App\Models\Advertisement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PolishReferenceAdvertisementCopy extends Command
{
    protected $signature='sample:advertisement-copy {--apply : Simplify untouched local reference copy while retaining example labels}';
    protected $description='Polish the three reserved reference advertisements without inventing licence, discount, or verification claims';

    public function handle(): int
    {
        if (!app()->environment(['local','testing'])) {
            $this->error('Local/testing examples only.');
            return self::FAILURE;
        }
        $copy=[
            'education'=>[
                'Supplied education advertising example. Compare course schedules, fees and support before enrolling. Advertiser and offer details have not been independently confirmed.',
                'IELTS preparation and higher-study planning information. Compare schedules, fees, learning materials and admission support before choosing a programme.',
                'IELTS প্রস্তুতি ও উচ্চশিক্ষা পরিকল্পনার তথ্য। কোর্স বেছে নেওয়ার আগে সময়সূচি, ফি, শিক্ষা উপকরণ ও ভর্তি-সংক্রান্ত সহায়তার বিবরণ তুলনা করুন।',
            ],
            'healthcare'=>[
                'Supplied healthcare advertising example. Confirm service availability and consultation costs directly. The reference discount and licensing claims are not confirmed or offered here.',
                'Healthcare and appointment information. Confirm available consultations, tests, appointment arrangements and written fees before planning your visit.',
                'স্বাস্থ্যসেবা ও অ্যাপয়েন্টমেন্টের তথ্য। যাওয়ার আগে পরামর্শ, পরীক্ষা, অ্যাপয়েন্টমেন্টের ব্যবস্থা ও লিখিত ফি সরাসরি নিশ্চিত করুন।',
            ],
            'recruitment'=>[
                'Supplied recruitment advertising example. Check role details, employer identity and contract terms. No actual vacancy, placement guarantee or application link is confirmed.',
                'Career and role information. Read the requirements, work location, pay and contract terms, and check the employer before applying.',
                'ক্যারিয়ার ও কাজের বিবরণ। আবেদনের আগে যোগ্যতা, কর্মস্থল, বেতন ও চুক্তির শর্ত পড়ুন এবং নিয়োগদাতার পরিচয় যাচাই করুন।',
            ],
        ];
        $updated=0;
        DB::transaction(function () use ($copy,&$updated) {
            foreach ($copy as $sector=>$text) {
                $ad=Advertisement::where('sample_key','sample-advertisement-v1-'.$sector)->lockForUpdate()->first();
                if (!$ad || !$ad->is_sample || $ad->updated_by_user_id || $ad->body_en!==$text[0]
                    || $ad->image_source!=='creative_image' || $ad->creative_image_path!=='/advertisement-media/reference-'.$sector.'.jpg'
                    || $ad->status!=='published' || $ad->destination_url || $ad->organization_id) continue;
                $this->line('Untouched example creative: '.$sector);
                if (!$this->option('apply')) continue;
                $ad->update(['body_en'=>$text[1],'body_bn'=>$text[2]]);
                DB::table('audit_logs')->insert([
                    'actor_user_id'=>null,'action'=>'advertisement.reference_copy_polished',
                    'auditable_type'=>Advertisement::class,'auditable_id'=>$ad->id,
                    'metadata'=>json_encode(['is_sample'=>true,'source'=>'user_supplied_reference','reason'=>'Readable example copy; no licences, actual vacancies, discounts or verification are asserted.']),
                    'created_at'=>now(),'updated_at'=>now(),
                ]);
                $updated++;
            }
        });
        $this->info($this->option('apply')?'Polished '.$updated.' example creatives. Admin edits and example labels preserved.':'Dry run; nothing written.');
        return self::SUCCESS;
    }
}
