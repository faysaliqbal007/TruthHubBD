<?php
namespace Database\Seeders;

use App\Models\Business;
use App\Models\Review;
use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoExperienceSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local','testing'])) throw new \RuntimeException('Demo fixtures may only run in local/testing environments.');
        $user=User::firstOrCreate(['email'=>'preview@example.test'],['name'=>'Demo Reviewer','password'=>Hash::make('DemoPreview2026!'),'role'=>'user','email_verified_at'=>now()]);
        $entities=[['Demo Northline Electronics','demo-northline-electronics','Products','Dhanmondi, Dhaka'],['Demo Riverstone Clinic','demo-riverstone-clinic','Hospitals & Clinics','Uttara, Dhaka'],['Demo Learning House','demo-learning-house','Universities & Education','Chattogram'],['Demo Parcel Path','demo-parcel-path','Courier & Digital Services','Sylhet']];
        foreach($entities as $i=>[$name,$slug,$category,$location]){
            $b=Business::firstOrCreate(['slug'=>$slug],['is_demo'=>true,'name'=>$name,'category'=>$category,'location'=>$location,'description'=>'Fictional demo listing for exploring TruthHubBD. Reviews and case histories here are sample content.','rating'=>4,'review_count'=>1,'status'=>'approved','verified'=>false,'color'=>'#0f766e']);
            $review=Review::firstOrCreate(['business_id'=>$b->id,'author'=>'Demo Reviewer'],['is_demo'=>true,'user_id'=>$user->id,'title'=>'Clear communication and a helpful team','body'=>'Demonstration review: the team explained the process clearly and answered my questions. This is sample content, not a real customer experience.','rating'=>4,'date'=>today()->toDateString(),'experience_date'=>today()->subDays(4),'verified_experience'=>false,'status'=>'published','relationship_disclosure'=>'none']);
            if($i<3) ScamCase::firstOrCreate(['case_code'=>'DEMO-2026-'.($i+1)],['business_id'=>$b->id,'review_id'=>$review->id,'reporter_user_id'=>$user->id,'title'=>'Fictional demonstration case','summary'=>'Private demonstration evidence summary.','public_summary'=>['Fictional demo: a delivery complaint met the example platform threshold after review.','Fictional demo: a refund dispute has been resolved. The case history remains available.','Fictional demo: the subject supplied a response and the case is disputed.'][$i],'status'=>['published','resolved','disputed'][$i],'published_at'=>now(),'decision_rationale'=>'Demonstration only.']);
        }
        $this->call(DemoPublicMediaSeeder::class);
    }
}
