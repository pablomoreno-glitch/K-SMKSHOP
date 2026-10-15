<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_adds_a_second_admin_who_can_sign_in(): void
    {
        User::factory()->create(['email' => 'pablo@example.com', 'is_admin' => true]);

        $exit = Artisan::call('admin:create', ['email' => 'Hermana@Example.com', '--name' => 'Hermana']);
        $output = Artisan::output();

        $this->assertSame(0, $exit);
        $admin = User::where('email', 'hermana@example.com')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->is_admin);
        $this->assertSame('Hermana', $admin->name);
        $this->assertSame(2, User::where('is_admin', true)->count());

        preg_match('/se muestra solo esta vez\): (\S+)/', $output, $match);
        $this->assertTrue(Hash::check($match[1], $admin->password));

        $this->postJson('/api/admin/login', ['email' => 'hermana@example.com', 'password' => $match[1]])
            ->assertOk()
            ->assertJsonPath('user.email', 'hermana@example.com');
    }

    public function test_create_refuses_an_existing_email(): void
    {
        $existing = User::factory()->create(['email' => 'pablo@example.com', 'is_admin' => true]);
        $hash = $existing->password;

        $this->artisan('admin:create', ['email' => 'pablo@example.com'])->assertFailed();

        $this->assertSame($hash, $existing->fresh()->password);
    }

    public function test_create_refuses_an_invalid_email(): void
    {
        $this->artisan('admin:create', ['email' => 'no-es-correo'])->assertFailed();

        $this->assertSame(0, User::count());
    }

    public function test_revoke_removes_access_and_open_sessions(): void
    {
        User::factory()->create(['email' => 'pablo@example.com', 'is_admin' => true]);
        $other = User::factory()->create(['email' => 'hermana@example.com', 'is_admin' => true]);
        $token = $other->createToken('admin-panel', ['admin'])->plainTextToken;

        $this->artisan('admin:revoke', ['email' => 'hermana@example.com'])->assertSuccessful();

        $this->assertFalse($other->fresh()->is_admin);
        $this->assertSame(0, $other->tokens()->count());
        $this->withToken($token)->getJson('/api/admin/me')->assertUnauthorized();
    }

    public function test_revoke_never_removes_the_last_admin(): void
    {
        $only = User::factory()->create(['email' => 'pablo@example.com', 'is_admin' => true]);

        $this->artisan('admin:revoke', ['email' => 'pablo@example.com'])->assertFailed();

        $this->assertTrue($only->fresh()->is_admin);
    }
}
