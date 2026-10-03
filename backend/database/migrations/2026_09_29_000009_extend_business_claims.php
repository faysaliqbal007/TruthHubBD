<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('business_claims', function(Blueprint $t) {
            $t->string('status',32)->default('submitted')->change();
            $t->string('business_photo_path')->nullable();
            $t->string('contact_email')->nullable();
            $t->string('business_address',500)->nullable();
            $t->string('document_type',60)->nullable();
        });
    }
    public function down(): void {
        Schema::table('business_claims',fn(Blueprint $t)=>$t->dropColumn(['business_photo_path','contact_email','business_address','document_type']));
    }
};
