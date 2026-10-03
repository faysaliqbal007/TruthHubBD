<?php

namespace App\Console\Commands;

use App\Models\Advertisement;
use App\Models\Business;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedSampleAdvertisements extends Command
{
    protected $signature = 'sample:advertisements {--apply : Create exactly three missing fictional advertisement examples in a local/testing database}';
    protected $description = 'Preview optional education, healthcare and recruitment example creatives; does not change existing records';

    public function handle(): int
    {
        $this->line('Three fictional advertisement examples: education, healthcare and recruitment. No genuine offers, sponsors, payments, licenses or service guarantees are represented.');
        if (!$this->option('apply')) {
            $this->info('Dry run: nothing written. Use --apply in local/testing to create missing examples.');
            return self::SUCCESS;
        }
        if (!app()->environment(['local','testing'])) {
            $this->error('Sample advertisements are restricted to local/testing environments. Nothing written.');
            return self::FAILURE;
        }
        $created = 0;
        try {
            DB::transaction(function () use (&$created): void {
                foreach ($this->creatives() as $creative) {
                    $slug = $creative['organization_slug']; unset($creative['organization_slug']);
                    $organization = Business::where('slug',$slug)->where('is_demo',true)->where('status','approved')->whereNull('merged_into_id')
                        ->whereNull('user_id')->whereNull('source_ref')->whereNull('source_url')->where('verified',false)->first();
                    $ad = Advertisement::firstOrCreate(['sample_key'=>'sample-advertisement-v1-'.$creative['sector']],$creative+[
                        'organization_id'=>$organization?->id,'destination_url'=>null,'image_source'=>'illustration','illustration_theme'=>$creative['sector'],
                        'status'=>'published','starts_at'=>null,'ends_at'=>null,'is_sample'=>true,
                        'decision_rationale'=>'Fictional local interface example only. No actual offer, sponsor, payment, ownership approval, license, recruitment service or medical assurance is represented.',
                    ]);
                    if (!$ad->is_sample) throw new \RuntimeException('A reserved advertisement sample key belongs to a non-sample record. Nothing written.');
                    if ($ad->wasRecentlyCreated) {
                        $created++;
                        DB::table('audit_logs')->insert(['actor_user_id'=>null,'action'=>'advertisement.sample_created','auditable_type'=>Advertisement::class,'auditable_id'=>$ad->id,
                            'metadata'=>json_encode(['is_sample'=>true,'sector'=>$ad->sector,'source'=>'local_sample_command']), 'created_at'=>now(),'updated_at'=>now()]);
                    }
                }
            });
        } catch (\Throwable $error) {
            $this->error($error->getMessage());
            return self::FAILURE;
        }
        $this->info('Created '.$created.' fictional advertisement examples. Existing creatives, statuses and schedules preserved.');
        return self::SUCCESS;
    }

    public function creatives(): array
    {
        return [
            ['sector'=>'education','organization_slug'=>'sample-community-v1-rajshahi','display_order'=>10,
                'title_en'=>'Sample learning programme · explore before enrolling','title_bn'=>'নমুনা শিক্ষা কার্যক্রম · ভর্তির আগে জেনে নিন',
                'body_en'=>'A fictional education creative showing how clear course information can be presented. This is an interface example, not an active admission offer.',
                'body_bn'=>'কোর্সের তথ্য স্পষ্টভাবে উপস্থাপনের কাল্পনিক শিক্ষা বিজ্ঞাপন। এটি ইন্টারফেসের উদাহরণ, কোনো চলমান ভর্তি প্রস্তাব নয়।',
                'bullets_en'=>['Compare schedules and the full fee breakdown','Ask how learning materials and support are provided','Read cancellation and refund terms before deciding'],
                'bullets_bn'=>['সময়সূচি ও ফি-এর পূর্ণ বিবরণ তুলনা করুন','শিক্ষা উপকরণ ও সহায়তা কীভাবে পাওয়া যায় জিজ্ঞেস করুন','সিদ্ধান্তের আগে বাতিল ও ফেরতের শর্ত পড়ুন']],
            ['sector'=>'healthcare','organization_slug'=>'sample-community-v1-chattogram','display_order'=>20,
                'title_en'=>'Sample care information · plan your visit','title_bn'=>'নমুনা সেবার তথ্য · যাওয়ার আগে পরিকল্পনা করুন',
                'body_en'=>'A fictional healthcare creative demonstrating appointment information. It offers no diagnosis, treatment promise or claim about professional licensing.',
                'body_bn'=>'অ্যাপয়েন্টমেন্টের তথ্য দেখানোর কাল্পনিক স্বাস্থ্যসেবা বিজ্ঞাপন। এতে রোগ নির্ণয়, চিকিৎসার নিশ্চয়তা বা পেশাগত লাইসেন্সের দাবি নেই।',
                'bullets_en'=>['Confirm opening times and appointment arrangements','Ask for a written outline of consultation costs','Check relevant practitioner details independently'],
                'bullets_bn'=>['খোলার সময় ও অ্যাপয়েন্টমেন্টের ব্যবস্থা নিশ্চিত করুন','পরামর্শের খরচের লিখিত বিবরণ চান','সংশ্লিষ্ট পেশাজীবীর তথ্য আলাদাভাবে যাচাই করুন']],
            ['sector'=>'recruitment','organization_slug'=>'sample-community-v1-khulna','display_order'=>30,
                'title_en'=>'Sample career notice · understand the role','title_bn'=>'নমুনা চাকরির বিজ্ঞপ্তি · কাজের বিবরণ বুঝুন',
                'body_en'=>'A fictional recruitment creative showing useful role information. No actual vacancy, employer endorsement, placement guarantee or application service is offered.',
                'body_bn'=>'কাজের প্রয়োজনীয় তথ্য দেখানোর কাল্পনিক নিয়োগ বিজ্ঞাপন। কোনো বাস্তব শূন্যপদ, নিয়োগদাতার অনুমোদন, চাকরির নিশ্চয়তা বা আবেদন সেবা দেওয়া হচ্ছে না।',
                'bullets_en'=>['Read the role, location and working-time details','Request clear pay and contract information','Check the employer and any requested fees independently'],
                'bullets_bn'=>['পদ, কাজের স্থান ও সময়ের বিবরণ পড়ুন','বেতন ও চুক্তির স্পষ্ট তথ্য চান','নিয়োগদাতা ও চাওয়া ফি আলাদাভাবে যাচাই করুন']],
        ];
    }
}
