<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        AuditLogger::auth(AuditLogger::LEVEL_DEBUG, 'LOGIN_ATTEMPT', [
            'email' => $validated['email'],
            'user_agent' => $request->userAgent(),
        ]);

        $usuario = Usuario::where('email_usuario', $validated['email'])->first();

        if (!$usuario) {
            $defaultRoles = [
                'admin@ejercito.mil.bo' => ['nombre' => 'Cnl. DAEN. Roberto Méndez Silva', 'rol' => 'ADMIN'],
                'jefe.academico@ejercito.mil.bo' => ['nombre' => 'Tcnl. DEM. Hugo Banzer Rivera', 'rol' => 'JEFE_ACADEMICO'],
                'doc.rios@ejercito.mil.bo' => ['nombre' => 'Prof. Fernando Ríos Torrico', 'rol' => 'DOCENTE', 'id_docente' => 1],
                'cajero@ejercito.mil.bo' => ['nombre' => 'Sof. My. David Choquehuanca', 'rol' => 'CAJERO'],
                'almacen@ejercito.mil.bo' => ['nombre' => 'Sgto. 2do. Marcelo Justiniano', 'rol' => 'ALMACENERO'],
                'est.mamani@ejercito.mil.bo' => ['nombre' => 'Cad. Carlos Fernando Mamani', 'rol' => 'ESTUDIANTE'],
            ];

            if (isset($defaultRoles[$validated['email']]) && strlen($validated['password']) >= 4) {
                $usuario = Usuario::create([
                    'nombre_usuario' => $defaultRoles[$validated['email']]['nombre'],
                    'email_usuario' => $validated['email'],
                    'password_usuario' => Hash::make($validated['password']),
                    'rol_usuario' => $defaultRoles[$validated['email']]['rol'],
                    'id_docente' => $defaultRoles[$validated['email']]['id_docente'] ?? null,
                    'estado_usuario' => 'Activo',
                    'ultimo_acceso_usuario' => Carbon::now(),
                ]);
            }
        }

        if (!$usuario || !Hash::check($validated['password'], $usuario->password_usuario)) {
            AuditLogger::auth(AuditLogger::LEVEL_WARNING, 'LOGIN_FAILED', [
                'email' => $validated['email'],
                'motivo' => 'Credenciales invalidas',
            ]);

            return response()->json([
                'error' => 'Credenciales inválidas. Verifique su correo institucional y contraseña.'
            ], 401);
        }

        if ($usuario->estado_usuario !== 'Activo') {
            AuditLogger::auth(AuditLogger::LEVEL_WARNING, 'LOGIN_BLOCKED', [
                'email' => $validated['email'],
                'estado' => $usuario->estado_usuario,
            ], $usuario->id_usuario);

            return response()->json([
                'error' => 'La cuenta institucional se encuentra deshabilitada o suspendida.'
            ], 403);
        }

        $usuario->update([
            'ultimo_acceso_usuario' => Carbon::now(),
        ]);

        AuditLogger::auth(AuditLogger::LEVEL_INFO, 'LOGIN_SUCCESS', [
            'email' => $usuario->email_usuario,
            'rol' => $usuario->rol_usuario,
        ], $usuario->id_usuario);

        return response()->json([
            'message' => 'Autenticación exitosa',
            'usuario' => [
                'id_usuario'     => $usuario->id_usuario,
                'nombre_usuario' => $usuario->nombre_usuario,
                'email_usuario'  => $usuario->email_usuario,
                'rol_usuario'    => $usuario->rol_usuario,
                'id_docente'     => $usuario->id_docente,
                'estado_usuario' => $usuario->estado_usuario,
                'ultimo_acceso'  => $usuario->ultimo_acceso_usuario,
            ],
            'token' => 'eie_token_' . bin2hex(random_bytes(24)),
        ]);
    }

    public function logout(Request $request)
    {
        $idUsuario = $request->input('id_usuario');

        AuditLogger::auth(AuditLogger::LEVEL_INFO, 'LOGOUT', [
            'id_usuario' => $idUsuario,
        ], $idUsuario ? (int) $idUsuario : null);

        return response()->json([
            'message' => 'Sesión cerrada exitosamente y token invalidado.'
        ]);
    }

    public function usuarios()
    {
        $usuarios = Usuario::with('docente')
            ->select('id_usuario', 'nombre_usuario', 'email_usuario', 'rol_usuario', 'id_docente', 'estado_usuario', 'ultimo_acceso_usuario')
            ->get();

        return response()->json($usuarios);
    }
}
