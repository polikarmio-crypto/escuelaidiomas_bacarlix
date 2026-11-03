<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\LogAuditoria;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Iniciar sesión institucional según los 6 roles definidos
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $usuario = Usuario::where('email_usuario', $validated['email'])->first();

        if (!$usuario || !Hash::check($validated['password'], $usuario->password_usuario)) {
            return response()->json([
                'error' => 'Credenciales inválidas. Verifique su correo institucional y contraseña.'
            ], 401);
        }

        if ($usuario->estado_usuario !== 'Activo') {
            return response()->json([
                'error' => 'La cuenta institucional se encuentra deshabilitada o suspendida.'
            ], 403);
        }

        // Registrar timestamp de último acceso
        $usuario->update([
            'ultimo_acceso_usuario' => Carbon::now(),
        ]);

        // Registrar log de auditoría
        LogAuditoria::create([
            'id_usuario'         => $usuario->id_usuario,
            'accion_log'         => 'LOGIN',
            'tabla_afectada_log' => 'usuario',
            'registro_id_log'    => $usuario->id_usuario,
            'ip_origen_log'      => $request->ip(),
        ]);

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

    /**
     * Listado de operadores y roles institucionales para pruebas
     */
    public function usuarios()
    {
        $usuarios = Usuario::with('docente')
            ->select('id_usuario', 'nombre_usuario', 'email_usuario', 'rol_usuario', 'id_docente', 'estado_usuario', 'ultimo_acceso_usuario')
            ->get();

        return response()->json($usuarios);
    }
}
