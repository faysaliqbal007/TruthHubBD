<?php

namespace Tests\Feature;

use App\Console\Commands\ImportDghsOrganizations;
use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DghsDirectoryImportTest extends TestCase
{
    use RefreshDatabase;

    private function row(string $division='Dhaka'): array
    {
        return ['id'=>'<a href="/public/facilities/1">1</a>','name'=>'<a>Source Clinic</a>','name_bn'=>'উৎস ক্লিনিক','division_name'=>$division,'district_name'=>'Dhaka','upazila_name'=>'Savar','is_active'=>'Yes','facility_type_name'=>'Hospital','email_1'=>'never-import@example.test','mobile_1'=>'private-contact'];
    }

    public function test_import_facts_are_source_backed_unclaimed_and_do_not_copy_contacts_or_guess_coordinates(): void
    {
        Http::fake(['hris.mohfw.gov.bd/*'=>Http::response(['data'=>[$this->row()]])]);
        $this->artisan('directory:import-dghs',['--apply'=>true,'--per-division'=>1])->assertSuccessful();
        $business = Business::where('source_ref','dghs:facility:1')->firstOrFail();
        $this->assertSame('Source Clinic',$business->name);
        $this->assertSame('Savar, Dhaka, Dhaka Division, Bangladesh',$business->location);
        $this->assertFalse($business->verified);
        $this->assertFalse($business->is_demo);
        $this->assertNull($business->user_id);
        $this->assertNull($business->latitude);
        $this->assertNull($business->phone);
        $this->assertDatabaseCount('reviews',0);
        $this->artisan('directory:import-dghs',['--apply'=>true,'--per-division'=>1])->assertSuccessful();
        $this->assertDatabaseCount('businesses',1);
    }

    public function test_wrong_division_inactive_invalid_source_and_empty_district_are_skipped(): void
    {
        $row = $this->row();
        $this->assertNull(ImportDghsOrganizations::facts($row,'Rangpur'));
        $this->assertNull(ImportDghsOrganizations::facts(array_replace($row,['is_active'=>'No']),'Dhaka'));
        $this->assertNull(ImportDghsOrganizations::facts(array_replace($row,['id'=>'../../secret']),'Dhaka'));
        $this->assertNull(ImportDghsOrganizations::facts(array_replace($row,['district_name'=>'']),'Dhaka'));
    }

    public function test_source_outage_does_not_touch_existing_records(): void
    {
        Business::create(['name'=>'Existing','slug'=>'existing','category'=>'Businesses & Services','verified'=>false]);
        Http::fake(['hris.mohfw.gov.bd/*'=>Http::response([],503)]);
        $this->artisan('directory:import-dghs',['--apply'=>true])->assertFailed();
        $this->assertDatabaseCount('businesses',1);
    }
}
