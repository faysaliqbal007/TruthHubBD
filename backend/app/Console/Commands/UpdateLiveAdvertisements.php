<?php

namespace App\Console\Commands;

use App\Models\Advertisement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateLiveAdvertisements extends Command
{
    protected $signature = 'ads:update-live';
    protected $description = 'Update running advertisements with realistic Bangladeshi advertisement copy, distinct top-bar ticker copy and detailed ad page descriptions';

    public function handle(): int
    {
        $ads = [
            'education' => [
                'title_en' => 'Protiva Institute of Tech & IELTS Academy — Autumn 2026 Admissions Open',
                'title_bn' => 'প্রতিভা ইনস্টিটিউট অব টেক ও আইইএলটিএস একাডেমি — অটাম ২০২৬ সেশনে ভর্তি চলছে',
                'ticker_text_en' => '🎓 Admissions Open: Full-Stack Web Development & IELTS Masterclass at Protiva Academy — 40% Merit Scholarship available this week!',
                'ticker_text_bn' => '🎓 ভর্তি চলছে: প্রতিভা একাডেমিতে ফুল-স্ট্যাক সফটওয়্যার ডেভেলপমেন্ট ও IELTS মাস্টারকোর্স — চলতি সপ্তাহে ৪০% মেধা স্কলারশিপ!',
                'body_en' => "Protiva Institute of Tech & IELTS Academy is a premier skill development centre in Dhaka, offering career-oriented training in modern software engineering and overseas higher-study preparation.\n\nOur Autumn 2026 Session features intensive hands-on bootcamps in Full-Stack Web Development (React, Next.js, Node.js & Cloud Deployment) along with Cambridge & IDP curriculum-aligned IELTS Preparation courses with 1-on-1 speaking evaluations.\n\nStudents receive real-world capstone projects, resume reviews, and direct job placement assistance with top IT firms. Both weekend and evening batches are available at our Panthapath campus and online.\n\n📍 Campus: Concord Tower (Level 6), Panthapath Signal, Dhaka 1205.\n📞 Admissions Helpline: +880 1712-345678 / +880 1987-654321\n🌐 Schedule: Weekend & Evening batches open.",
                'body_bn' => "প্রতিভা ইনস্টিটিউট অব টেক ও আইইএলটিএস একাডেমি দক্ষ প্রযুক্তি জনশক্তি তৈরি ও বিদেশে উচ্চশিক্ষার প্রস্তুতিতে ঢাকার একটি বিশ্বস্ত প্রশিক্ষণ কেন্দ্র।\n\nআমাদের অটাম ২০২৬ সেশনে আধুনিক ফুল-স্ট্যাক সফটওয়্যার ডেভেলপমেন্ট (React, Next.js, Node.js ও ক্লাউড) এবং ব্রিটিশ কাউন্সিল ও আইডিপি সিলেবাস ভিত্তিক পূর্ণাঙ্গ IELTS মাস্টারকোর্সে সরাসরি ল্যাব ও অনলাইন ব্যাচে ভর্তি চলছে।\n\nরয়েছে রিয়েল-লাইফ প্রজেক্ট ভিত্তিক প্রশিক্ষণ, নিয়মিত স্পিকিং ও লিসেনিং মক টেস্ট এবং শীর্ষ প্রযুক্তি প্রতিষ্ঠানে ক্যারিয়ার গাইডেন্স ও ইন্টার্নশিপ সহায়তা। আগ্রহী শিক্ষার্থীরা ফ্রি কাউন্সেলিং সেশনের মাধ্যমে স্কলারশিপ যাচাই করতে পারেন।\n\n📍 ক্যাম্পাস: কনকর্ড টাওয়ার (লিফট-৬), পান্থপথ সিগন্যাল, ঢাকা ১২০৫।\n📞 ভর্তি হটলাইন: ০১৭১২-৩৪৫৬৭৮ / ০১৯৮৭-৬৫৪৩২১\n🌐 শিডিউল: উইকেন্ড ও ইভনিং ব্যাচ চালু রয়েছে।",
                'bullets_en' => [
                    'Up to 40% merit scholarship for university students and early applicants',
                    'Official Cambridge IELTS materials, unlimited mock tests & 1-on-1 feedback',
                    'Hands-on capstone portfolio projects with internship & job placement support',
                ],
                'bullets_bn' => [
                    'বিশ্ববিদ্যালয় শিক্ষার্থী ও আগাম আবেদনকারীদের জন্য সর্বোচ্চ ৪০% মেধা বৃত্তি',
                    'ক্যামব্রিজ অফিসিয়াল ম্যাটেরিয়ালস, আনলিমিটেড মক টেস্ট ও ব্যক্তিগত ফিডব্যাক',
                    'হাতে-কলমে প্রজেক্ট পোর্টফোলিও তৈরি এবং ইন্টার্নশিপ ও ক্যারিয়ার নেটওয়ার্কিং',
                ],
                'destination_url' => 'https://protiva.edu.bd',
                'show_in_ticker' => true,
                'status' => 'published',
                'image_source' => 'creative_image',
                'creative_image_path' => '/advertisement-media/reference-education.jpg',
            ],
            'healthcare' => [
                'title_en' => 'MedFirst Specialized Hospital & Diagnostic — Comprehensive Cardiac & Wellness Screening',
                'title_bn' => 'মেডফার্স্ট স্পেশালাইজড হাসপাতাল অ্যান্ড ডায়াগনস্টিক — আধুনিক কার্ডিয়াক ও ফুল বডি চেকআপ',
                'ticker_text_en' => '🩺 MedFirst Hospital: Executive Cardiac Screening & Full Body Checkup Packages at 30% special concession through this month.',
                'ticker_text_bn' => '🩺 মেডফার্স্ট হাসপাতাল: অভিজ্ঞ বিশেষজ্ঞ ডাক্তারদের তত্ত্বাবধানে এক্সিকিউটিভ হার্ট ও ফুল বডি চেকআপ প্যাকেজে ৩০% বিশেষ ছাড়!',
                'body_en' => "MedFirst Specialized Hospital & Diagnostic Centre delivers comprehensive medical care and cutting-edge laboratory diagnostics in Dhanmondi, Dhaka.\n\nOur Department of Cardiology & Internal Medicine is currently offering Executive Health Checkup and Cardiac Screening Packages for early detection of heart disease and metabolic conditions.\n\nThe screening includes 12-Lead ECG, 2D Echocardiogram, Exercise Tolerance Test (ETT), Lipid Profile, HbA1c Diabetes Profile, Serum Creatinine, Liver Function Tests, CBC, and a dedicated consultation with our Senior Consultant Cardiologist. Digital reports are delivered within 6 hours.\n\n📍 Location: House 42, Road 8/A, Dhanmondi, Dhaka 1209.\n📞 24/7 Appointment & Emergency Hotline: 10678 / +880 1819-998877\n⏰ Diagnostics & Sample Collection: 7:00 AM – 11:00 PM daily.",
                'body_bn' => "মেডফার্স্ট স্পেশালাইজড হাসপাতাল অ্যান্ড ডায়াগনস্টিক সেন্টার ঢাকার ধানমন্ডিতে আন্তর্জাতিক মানের আধুনিক স্বাস্থ্যসেবা ও সর্বাধুনিক প্যাথলজিক্যাল ডায়াগনস্টিক সুবিধা প্রদান করছে।\n\nহৃদরোগের ঝুঁকি ও শারীরিক জটিলতা আগেভাগে শনাক্ত করার লক্ষ্যে আমাদের কার্ডিওলজি বিভাগ এই মাসে বিশেষ এক্সিকিউটিভ কার্ডিয়াক স্ক্রিনিং ও ওয়েলনেস প্যাকেজ পরিচালনা করছে।\n\nপ্যাকেজের অন্তর্ভুক্ত: ১২-লিড ইসিজি (ECG), ২ডি ইকোকার্ডিওগ্রাফি (2D Echo), ইটিটি (ETT), লিপিড প্রোফাইল, ডায়াবেটিসের HbA1c, কিডনি ও লিভার ফাংশন টেস্ট, কমপ্লিট ব্লাড কাউন্ট এবং সিনিয়র কনসালট্যান্ট কার্ডিওলজিস্টের সরাসরি পরামর্শ। ৬ ঘণ্টার মধ্যে ডিজিটাল রিপোর্ট পাওয়া যাবে।\n\n📍 ঠিকানা: বাড়ি ৪২, রোড ৮/এ, ধানমন্ডি, ঢাকা ১২০৯।\n📞 ২৪ ঘণ্টা হটলাইন ও সিরিয়াল: ১০৬৭৮ / ০১৮১৯-৯৯৮৮৭৭\n⏰ টেস্ট ও স্যাম্পল কালেকশন: প্রতিদিন সকাল ৭টা থেকে রাত ১১টা পর্যন্ত।",
                'bullets_en' => [
                    'Complete cardiac evaluation: 12-Lead ECG, 2D Echo, ETT & automated lab profiles',
                    'Direct consultation with senior professors and consultant cardiologists',
                    'Same-day digital diagnostic reporting with 24/7 emergency & ambulance support',
                ],
                'bullets_bn' => [
                    'পূর্ণাঙ্গ হার্ট স্ক্রিনিং: ইসিজি, ইকোকার্ডিওগ্রাম, ইটিটি ও অটোমেটেড রক্ত পরীক্ষা',
                    'সিনিয়র প্রফেসর ও কনসালট্যান্ট হৃদরোগ বিশেষজ্ঞদের সরাসরি পরামর্শ',
                    'একই দিনে ডিজিটাল রিপোর্ট ডেলিভারি এবং ২৪/৭ জরুরি অ্যাম্বুলেন্স ও আইসিইউ ব্যাকআপ',
                ],
                'destination_url' => 'https://medfirsthospital.com.bd',
                'show_in_ticker' => true,
                'status' => 'published',
                'image_source' => 'creative_image',
                'creative_image_path' => '/advertisement-media/reference-healthcare.jpg',
            ],
            'recruitment' => [
                'title_en' => 'K-Tech Global Solutions — Trainee Software Engineer & IT Career Drive 2026',
                'title_bn' => 'কে-টেক গ্লোবাল সলিউশনস — ট্রেইনি সফটওয়্যার ইঞ্জিনিয়ার ও টেক ক্যারিয়ার ড্রাইভ ২০২৬',
                'ticker_text_en' => '💼 K-Tech Global Career Drive 2026: Hiring 50+ Trainee Software Engineers & QA Analysts in Dhaka — Applications close 25 October.',
                'ticker_text_bn' => '💼 কে-টেক গ্লোবাল ক্যারিয়ার ড্রাইভ ২০২৬: ঢাকায় ৫০+ ট্রেইনি সফটওয়্যার ইঞ্জিনিয়ার ও কিউএ অ্যানালিস্ট নিয়োগ — আবেদনের শেষ তারিখ ২৫ অক্টোবর!',
                'body_en' => "K-Tech Global Solutions is a leading enterprise technology company providing fintech and cloud architecture services to international clients from our tech centre in Gulshan, Dhaka.\n\nWe are officially inviting applications for our Q4 2026 Trainee Software Engineer & Associate Quality Assurance Analyst Recruitment Drive (50+ Openings).\n\nSelected candidates will complete an intensive 3-month paid incubation program under direct mentorship from senior engineers, followed by immediate placement into active product teams building fintech microservices, cloud pipelines, and web applications.\n\nRequirements: Degree in CSE/IT or demonstrable software portfolio, strong problem-solving skills, and familiarity with TypeScript, Python, or Go.\n\n💼 Benefits: Competitive salary, health insurance, hybrid flexibility & global mentorship.\n📍 Office: Level 9, Bay's Galleria, 57 Gulshan Avenue, Dhaka 1212.\n📧 Apply: Send resume to careers@ktechglobal.com",
                'body_bn' => "কে-টেক গ্লোবাল সলিউশনস গুলশান, ঢাকায় অবস্থিত একটি শীর্ষস্থানীয় এন্টারপ্রাইজ সফটওয়্যার ও ফিনটেক সলিউশন সংস্থা, যা আন্তর্জাতিক গ্রাহকদের জন্য ক্লাউড ও সিকিউরিটি প্রযুক্তি তৈরি করে।\n\nআমাদের চতুর্থ প্রান্তিকের টেক ক্যারিয়ার ড্রাইভ ২০২৬-এর আওতায় ৫০+ ট্রেইনি সফটওয়্যার ইঞ্জিনিয়ার এবং জুনিয়র কিউএ অ্যানালিস্ট পদে আবেদন আহ্বান করা হচ্ছে।\n\nনির্বাচিত প্রার্থীরা ৩ মাসের পেইড ইনকিউবেশন প্রোগ্রামে সিনিয়র আর্কিটেক্টদের সরাসরি নির্দেশনায় বাস্তব মাইক্রোসার্ভিসেস ও ক্লাউড প্রজেক্টে কাজের অভিজ্ঞতা অর্জন করবেন এবং সফল সমাপ্তির পর নিয়মিত ফুল-টাইম টিমে অন্তর্ভুক্ত হবেন।\n\nযোগ্যতা: সিএসই/আইটি বা সমমানের ডিগ্রি (অথবা নিজস্ব কোডিং প্রজেক্ট), ডেটা স্ট্রাকচার ও অ্যালগরিদম জ্ঞান এবং TypeScript, Python বা Go-তে প্রাথমিক দক্ষতা।\n\n💼 সুবিধাসমূহ: আকর্ষণীয় বেতন স্কেল, স্বাস্থ্যবীমা, হাইব্রিড কাজের সুযোগ ও পারফরম্যান্স বোনাস।\n📍 অফিস: লেভেল ৯, বে'স গ্যালারিয়া, ৫৭ গুলশান অ্যাভিনিউ, ঢাকা ১২১২।\n📧 আবেদন: আপনার জীবনবৃত্তান্ত পাঠান careers@ktechglobal.com-এ।",
                'bullets_en' => [
                    '50+ open engineering vacancies with competitive salary and 3-month paid incubation',
                    'Hands-on work on enterprise fintech microservices, cloud systems and security',
                    'Hybrid work culture with medical insurance, provident fund and rapid promotion tracks',
                ],
                'bullets_bn' => [
                    '৫০+ পদে নিয়োগ, ৩ মাসের পেইড ইনকিউবেশন এবং আকর্ষণীয় প্রারম্ভিক বেতন কাঠামো',
                    'এন্টারপ্রাইজ ফিনটেক মাইক্রোসার্ভিসেস, ক্লাউড ও সিকিউরিটিতে সরাসরি কাজের সুযোগ',
                    'হাইব্রিড ওয়ার্ক কালচার, পূর্ণাঙ্গ স্বাস্থ্যবীমা, প্রভিডেন্ট ফান্ড ও দ্রুত প্রমোশন সুবিধা',
                ],
                'destination_url' => 'https://ktechglobal.com',
                'show_in_ticker' => true,
                'status' => 'published',
                'image_source' => 'creative_image',
                'creative_image_path' => '/advertisement-media/reference-recruitment.jpg',
            ],
        ];

        DB::transaction(function () use ($ads) {
            foreach ($ads as $sector => $data) {
                $record = Advertisement::where('sample_key', 'sample-advertisement-v1-' . $sector)
                    ->orWhere('sector', $sector)
                    ->first();

                if ($record) {
                    $record->update(array_merge($data, [
                        'decision_rationale' => 'Updated with realistic live advertisement creative copy, distinct top-bar ticker announcement and complete public page details.',
                    ]));
                    $this->info("Updated {$sector} advertisement (ID: {$record->id}).");
                }
            }
        });

        return self::SUCCESS;
    }
}
