<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Create another admin account for the panel. The password is generated here
 * and shown once; the new admin changes it from "Mi cuenta" after signing in.
 * There is deliberately no web endpoint for this: only someone with shell
 * access to the server can add admins.
 */
class CreateAdmin extends Command
{
    protected $signature = 'admin:create {email : Correo con el que entrará al panel} {--name=Admin : Nombre que se muestra en el panel}';

    protected $description = 'Crea un administrador del panel con una contraseña aleatoria que se muestra una sola vez';

    public function handle(): int
    {
        $email = Str::lower(trim((string) $this->argument('email')));
        $name = trim((string) $this->option('name')) ?: 'Admin';

        if (Validator::make(['email' => $email], ['email' => ['required', 'email']])->fails()) {
            $this->error("El correo '{$email}' no es válido.");

            return self::FAILURE;
        }

        if (User::where('email', $email)->exists()) {
            $this->error("Ya existe un usuario con el correo {$email}.");

            return self::FAILURE;
        }

        $password = Str::password(20, symbols: false);

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'is_admin' => true,
        ]);

        $this->info("Administrador creado: {$email}");
        $this->line("Contraseña temporal (se muestra solo esta vez): {$password}");
        $this->line('Debe cambiarla al entrar, en el panel > Mi cuenta.');

        return self::SUCCESS;
    }
}
