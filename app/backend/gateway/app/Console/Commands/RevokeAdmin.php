<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Take away panel access from an admin and close their open sessions. The
 * account is kept (orders and history stay intact) but can no longer sign in.
 * The last remaining admin cannot be revoked, so the panel never locks out.
 */
class RevokeAdmin extends Command
{
    protected $signature = 'admin:revoke {email : Correo del administrador}';

    protected $description = 'Quita el acceso al panel a un administrador y cierra sus sesiones';

    public function handle(): int
    {
        $email = Str::lower(trim((string) $this->argument('email')));
        $user = User::where('email', $email)->where('is_admin', true)->first();

        if (! $user) {
            $this->error("No hay un administrador con el correo {$email}.");

            return self::FAILURE;
        }

        if (User::where('is_admin', true)->count() === 1) {
            $this->error('Es el único administrador; crea otro antes de quitarle el acceso.');

            return self::FAILURE;
        }

        $user->is_admin = false;
        $user->save();
        $user->tokens()->delete();

        $this->info("Acceso al panel retirado: {$email}");

        return self::SUCCESS;
    }
}
