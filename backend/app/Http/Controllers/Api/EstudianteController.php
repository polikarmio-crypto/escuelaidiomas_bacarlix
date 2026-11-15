<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Estudiante;
use App\Models\EstudianteMilitar;
use App\Models\Usuario;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EstudianteController extends Controller
{
    public function index(Request $request)
    {
        $query = Estudiante::with([
            'militar',
            'inscripciones.paralelo.nivel.programa.idioma',
            'inscripciones.librosAvance.evaluacion',
        ]);

        if ($request->has('tipo') && in_array(strtolower($request->tipo), ['civil', 'militar'])) {
            $query->where('tipo_estudiante', ucfirst(strtolower($request->tipo)));
        }

        if ($request->filled('paralelo')) {
            $paraleloParam = trim($request->paralelo);
            $query->whereHas('inscripciones.paralelo', function ($p) use ($paraleloParam) {
                $p->where('codigo_paralelo', 'ilike', "%{$paraleloParam}%")
                  ->orWhere('id_paralelo', $paraleloParam);
            });
        }

        if ($request->filled('idioma')) {
            $idiomaParam = trim($request->idioma);
            $query->whereHas('inscripciones.paralelo.nivel.programa.idioma', function ($i) use ($idiomaParam) {
                $i->where('nombre_idioma', 'ilike', "%{$idiomaParam}%")
                  ->orWhere('id_idioma', $idiomaParam);
            });
        }

        if ($request->filled('email')) {
            $email = trim($request->email);
            $query->where('email_estudiante', 'ilike', "%{$email}%");
        }

        if ($request->filled('q')) {
            $q = trim($request->q);
            $query->where(function ($sub) use ($q) {
                $sub->where('nombre_estudiante', 'ilike', "%{$q}%")
                    ->orWhere('apellido_estudiante', 'ilike', "%{$q}%")
                    ->orWhere('ci_estudiante', 'ilike', "%{$q}%")
                    ->orWhere('email_estudiante', 'ilike', "%{$q}%");
            });
        }

        $perPage = (int) $request->get('per_page', 20);
        $paginator = $query->orderBy('apellido_estudiante')->paginate($perPage);

        $paginator->getCollection()->transform(function ($est) {
            $actIns = $est->inscripciones->where('estado_inscripcion', 'Activa')->first() ?? $est->inscripciones->first();
            $paralelo = $actIns?->paralelo;
            $nivel = $paralelo?->nivel;
            $programa = $nivel?->programa;
            $idioma = $programa?->idioma;

            $nota = null;
            if ($actIns && $actIns->librosAvance->isNotEmpty()) {
                $eval = $actIns->librosAvance->first()?->evaluacion;
                if ($eval && $eval->nota_final_libro !== null) {
                    $nota = round((float) $eval->nota_final_libro, 1);
                }
            }

            $ciParts = explode(' ', trim($est->ci_estudiante));
            $ciNumero = $ciParts[0] ?? $est->ci_estudiante;
            $expedido = $ciParts[1] ?? 'LP';

            $matricula = $est->militar
                ? $est->militar->id_militar_estudiante
                : sprintf('EIE-CIV-2026-%04d', $est->id_estudiante);

            return [
                'id'              => $est->id_estudiante,
                'id_estudiante'   => $est->id_estudiante,
                'nombre_completo' => "{$est->nombre_estudiante} {$est->apellido_estudiante}",
                'codigoMatricula' => $matricula,
                'nombres'         => $est->nombre_estudiante,
                'nombre_estudiante' => $est->nombre_estudiante,
                'apellidos'       => $est->apellido_estudiante,
                'apellido_estudiante' => $est->apellido_estudiante,
                'ci'              => $ciNumero,
                'expedido'        => $expedido,
                'ci_estudiante'   => $est->ci_estudiante,
                'tipo'            => strtoupper($est->tipo_estudiante),
                'tipo_estudiante' => $est->tipo_estudiante,
                'gradoMilitar'    => $est->militar?->grado_militar,
                'unidadMilitar'   => $est->militar?->unidad_militar,
                'idiomaActual'    => $idioma?->nombre_idioma ?? 'Sin asignar',
                'id_idioma_actual'=> $idioma?->id_idioma ?? null,
                'nivelActual'     => $nivel?->nombre_nivel ?? 'Sin asignar',
                'paralelo'        => $paralelo?->codigo_paralelo ?? 'Sin asignar',
                'id_paralelo_actual' => $paralelo?->id_paralelo ?? null,
                'inscripciones_ids' => $est->inscripciones->pluck('id_paralelo')->filter()->values()->toArray(),
                'idiomas_inscritos' => $est->inscripciones->map(function ($ins) {
                    return $ins->paralelo?->nivel?->programa?->idioma?->nombre_idioma;
                })->filter()->unique()->values()->toArray(),
                'telefono'        => $est->telefono_estudiante ?? '+591 70000000',
                'correo'          => $est->email_estudiante ?? 'alumno@ejercito.mil.bo',
                'estado'          => ($actIns && $actIns->estado_inscripcion === 'Concluida') ? 'INACTIVO' : 'ACTIVO',
                'asistencia'      => $actIns ? 95 : null,
                'promedio'        => $nota,
                'fecha_nacimiento_estudiante' => $est->fecha_nacimiento_estudiante ? $est->fecha_nacimiento_estudiante->format('Y-m-d') : null,
                'direccion_estudiante'        => $est->direccion_estudiante,
                'militar'                     => $est->militar,
            ];
        });

        return response()->json($paginator);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ci_estudiante' => 'required|string|max:15|unique:estudiante,ci_estudiante',
            'nombre_estudiante' => 'required|string|max:60',
            'apellido_estudiante' => 'required|string|max:60',
            'fecha_nacimiento_estudiante' => 'nullable|date|before_or_equal:today|after:1930-01-01',
            'telefono_estudiante' => 'nullable|string|max:20',
            'email_estudiante' => 'nullable|email|max:100',
            'direccion_estudiante' => 'nullable|string|max:150',
            'tipo_estudiante' => 'required|in:Civil,Militar',
            'grado_militar' => 'required_if:tipo_estudiante,Militar|nullable|string|max:40',
            'unidad_militar' => 'required_if:tipo_estudiante,Militar|nullable|string|max:80',
            'id_militar_estudiante' => 'required_if:tipo_estudiante,Militar|nullable|string|max:20|unique:estudiante_militar,id_militar_estudiante',
        ]);

        $resultado = DB::transaction(function () use ($validated) {
            $est = Estudiante::create([
                'ci_estudiante' => $validated['ci_estudiante'],
                'nombre_estudiante' => $validated['nombre_estudiante'],
                'apellido_estudiante' => $validated['apellido_estudiante'],
                'fecha_nacimiento_estudiante' => $validated['fecha_nacimiento_estudiante'] ?? null,
                'telefono_estudiante' => $validated['telefono_estudiante'] ?? null,
                'email_estudiante' => $validated['email_estudiante'] ?? null,
                'direccion_estudiante' => $validated['direccion_estudiante'] ?? null,
                'tipo_estudiante' => $validated['tipo_estudiante'],
            ]);

            if ($validated['tipo_estudiante'] === 'Militar') {
                EstudianteMilitar::create([
                    'id_estudiante' => $est->id_estudiante,
                    'grado_militar' => $validated['grado_militar'],
                    'unidad_militar' => $validated['unidad_militar'],
                    'id_militar_estudiante' => $validated['id_militar_estudiante'],
                ]);
            }

            $ciDigits = preg_replace('/\D/', '', $validated['ci_estudiante']);
            $emailUsuario = !empty($validated['email_estudiante'])
                ? strtolower(trim($validated['email_estudiante']))
                : 'est.' . strtolower(Str::slug($validated['apellido_estudiante'])) . $est->id_estudiante . '@idiomas.ejercito.mil.bo';

            $passwordTemporal = 'EIE-' . random_int(1000, 9999) . '-' . substr($ciDigits, -3);

            $cuentaUsuario = Usuario::create([
                'nombre_usuario' => "{$validated['nombre_estudiante']} {$validated['apellido_estudiante']}",
                'email_usuario' => $emailUsuario,
                'password_usuario' => Hash::make($passwordTemporal),
                'rol_usuario' => 'ESTUDIANTE',
                'id_estudiante' => $est->id_estudiante,
                'estado_usuario' => 'Activo',
            ]);

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'ESTUDIANTE_REGISTRADO', [
                'id_estudiante' => $est->id_estudiante,
                'ci' => $validated['ci_estudiante'],
                'tipo' => $validated['tipo_estudiante'],
            ], null, 'estudiante', $est->id_estudiante);

            AuditLogger::auth(AuditLogger::LEVEL_INFO, 'CUENTA_ESTUDIANTE_CREADA', [
                'id_usuario' => $cuentaUsuario->id_usuario,
                'email' => $emailUsuario,
                'id_estudiante' => $est->id_estudiante,
            ], $cuentaUsuario->id_usuario);

            return [
                'estudiante' => $est->load('militar'),
                'credenciales' => [
                    'id_usuario' => $cuentaUsuario->id_usuario,
                    'email_institucional' => $emailUsuario,
                    'password_temporal' => $passwordTemporal,
                    'rol' => 'ESTUDIANTE',
                    'instruccion' => 'Entregar de forma reservada al alumno para su primer acceso a la plataforma SACA.',
                ],
            ];
        });

        return response()->json([
            'message' => 'Estudiante matriculado y cuenta institucional creada con éxito.',
            'data' => $resultado['estudiante'],
            'credenciales_iniciales' => $resultado['credenciales'],
        ], 201);
    }

    public function show($id)
    {
        $estudiante = Estudiante::with([
            'militar',
            'inscripciones.paralelo.nivel.programa.idioma',
            'inscripciones.librosAvance.libro',
            'inscripciones.librosAvance.evaluacion.docenteCalificador',
            'pagos.tipoPago',
        ])->findOrFail($id);

        return response()->json($estudiante);
    }

    public function update(Request $request, $id)
    {
        $estudiante = Estudiante::findOrFail($id);
        $validated = $request->validate([
            'nombre_estudiante'   => 'sometimes|string|max:60',
            'apellido_estudiante' => 'sometimes|string|max:60',
            'ci_estudiante'       => 'sometimes|string|max:20',
            'telefono_estudiante' => 'nullable|string|max:20',
            'email_estudiante'    => 'nullable|email|max:100',
            'direccion_estudiante'=> 'nullable|string|max:150',
            'tipo_estudiante'     => 'sometimes|in:Civil,Militar',
            'grado_militar'       => 'nullable|string|max:40',
            'unidad_militar'      => 'nullable|string|max:80',
        ]);

        DB::transaction(function () use ($estudiante, $validated) {
            $estudiante->update($validated);

            if (($validated['tipo_estudiante'] ?? $estudiante->tipo_estudiante) === 'Militar') {
                if (isset($validated['grado_militar']) || isset($validated['unidad_militar'])) {
                    EstudianteMilitar::updateOrCreate(
                        ['id_estudiante' => $estudiante->id_estudiante],
                        [
                            'grado_militar'         => $validated['grado_militar'] ?? 'Oficial',
                            'unidad_militar'        => $validated['unidad_militar'] ?? 'Sin unidad',
                            'id_militar_estudiante' => 'MIL-' . $estudiante->id_estudiante,
                        ]
                    );
                }
            }

            AuditLogger::academico(AuditLogger::LEVEL_INFO, 'ESTUDIANTE_ACTUALIZADO', [
                'id_estudiante' => $estudiante->id_estudiante,
            ], null, 'estudiante', $estudiante->id_estudiante);
        });

        return response()->json([
            'message' => "Expediente del estudiante {$estudiante->nombre_estudiante} {$estudiante->apellido_estudiante} actualizado.",
            'data'    => $estudiante->load('militar'),
        ]);
    }

    public function destroy($id)
    {
        $estudiante = Estudiante::findOrFail($id);
        $nombre = "{$estudiante->nombre_estudiante} {$estudiante->apellido_estudiante}";

        DB::transaction(function () use ($estudiante) {
            Usuario::where('id_estudiante', $estudiante->id_estudiante)->delete();
            EstudianteMilitar::where('id_estudiante', $estudiante->id_estudiante)->delete();
            $estudiante->delete();
        });

        AuditLogger::academico(AuditLogger::LEVEL_WARNING, 'ESTUDIANTE_ELIMINADO', [
            'nombre' => $nombre,
            'id_estudiante' => $id,
        ], null, 'estudiante');

        return response()->json([
            'message' => "Estudiante {$nombre} y su cuenta asociada han sido dados de baja."
        ]);
    }
}
