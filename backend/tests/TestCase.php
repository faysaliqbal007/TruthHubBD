<?php
namespace Tests;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
abstract class TestCase extends BaseTestCase {
 protected function setUp():void {parent::setUp();$this->mock(\App\Services\MalwareScanner::class,fn($mock)=>$mock->shouldReceive('scan')->andReturn(null));}
}
