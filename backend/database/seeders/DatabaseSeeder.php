<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeder Maestro de la Escuela de Idiomas del Ejército (EIE) - SACA
     * Cumplimiento estricto 5FN con ~450 estudiantes normalizados (Militares y Civiles),
     * docentes, rotación quincenal, paralelos, avance libro a libro y almacén ROP.
     */
    public function run(): void
    {
        // Deshabilitar logs de queries para máxima velocidad de inserción
        DB::connection()->disableQueryLog();

        // ─────────────────────────────────────────────────────────────
        // 1. GESTIONES ACADÉMICAS
        // ─────────────────────────────────────────────────────────────
        $idGestion2026 = DB::table('gestion')->insertGetId([
            'anio_gestion'   => 2026,
            'estado_gestion' => 'Activa',
            'created_at'     => now(),
            'updated_at'     => now(),
        ], 'id_gestion');

        $idGestion2025 = DB::table('gestion')->insertGetId([
            'anio_gestion'   => 2025,
            'estado_gestion' => 'Cerrada',
            'created_at'     => now(),
            'updated_at'     => now(),
        ], 'id_gestion');

        // ─────────────────────────────────────────────────────────────
        // 2. IDIOMAS OFERTADOS
        // ─────────────────────────────────────────────────────────────
        $idiomasData = [
            ['nombre_idioma' => 'Inglés Militar'],
            ['nombre_idioma' => 'Francés Diplomático'],
            ['nombre_idioma' => 'Ruso Técnico'],
            ['nombre_idioma' => 'Mandarín Táctico'],
            ['nombre_idioma' => 'Quechua Institucional'],
            ['nombre_idioma' => 'Alemán Académico'],
            ['nombre_idioma' => 'Portugués Estratégico'],
        ];

        $idiomaIds = [];
        foreach ($idiomasData as $idm) {
            $idiomaIds[$idm['nombre_idioma']] = DB::table('idioma')->insertGetId([
                'nombre_idioma' => $idm['nombre_idioma'],
                'created_at'    => now(),
                'updated_at'    => now(),
            ], 'id_idioma');
        }

        // ─────────────────────────────────────────────────────────────
        // 3. TIPOS DE PROGRAMA
        // ─────────────────────────────────────────────────────────────
        $idProgMilitar = DB::table('tipo_programa')->insertGetId([
            'nombre_tipo_programa' => 'Militar Regular',
            'created_at' => now(), 'updated_at' => now()
        ], 'id_tipo_programa');

        $idProgCivil = DB::table('tipo_programa')->insertGetId([
            'nombre_tipo_programa' => 'Civil Particular',
            'created_at' => now(), 'updated_at' => now()
        ], 'id_tipo_programa');

        $idProgDiplom = DB::table('tipo_programa')->insertGetId([
            'nombre_tipo_programa' => 'Diplomático Especial',
            'created_at' => now(), 'updated_at' => now()
        ], 'id_tipo_programa');

        // ─────────────────────────────────────────────────────────────
        // 4. MODALIDADES
        // ─────────────────────────────────────────────────────────────
        $idModPresencial = DB::table('modalidad')->insertGetId(['nombre_modalidad' => 'Presencial', 'created_at' => now(), 'updated_at' => now()], 'id_modalidad');
        $idModVirtual    = DB::table('modalidad')->insertGetId(['nombre_modalidad' => 'Virtual', 'created_at' => now(), 'updated_at' => now()], 'id_modalidad');
        $idModSemi       = DB::table('modalidad')->insertGetId(['nombre_modalidad' => 'Semipresencial', 'created_at' => now(), 'updated_at' => now()], 'id_modalidad');
        $modalidades = [$idModPresencial, $idModVirtual, $idModSemi];

        // ─────────────────────────────────────────────────────────────
        // 5. HORARIOS MILITARES Y CIVILES
        // ─────────────────────────────────────────────────────────────
        $horariosData = [
            ['07:00:00', '08:30:00'],
            ['08:30:00', '10:00:00'],
            ['10:15:00', '11:45:00'],
            ['14:00:00', '15:30:00'],
            ['16:00:00', '17:30:00'],
            ['18:30:00', '20:00:00'],
            ['20:15:00', '21:45:00'],
        ];
        $horarioIds = [];
        foreach ($horariosData as $h) {
            $horarioIds[] = DB::table('horario')->insertGetId([
                'hora_inicio_horario' => $h[0],
                'hora_fin_horario'    => $h[1],
                'created_at'          => now(),
                'updated_at'          => now(),
            ], 'id_horario');
        }

        // ─────────────────────────────────────────────────────────────
        // 6. AULAS Y LABORATORIOS
        // ─────────────────────────────────────────────────────────────
        $aulasData = [
            ['Aula 101 - Pabellón Alfa', 30],
            ['Aula 102 - Pabellón Alfa', 30],
            ['Aula 103 - Pabellón Alfa', 25],
            ['Aula 201 - Pabellón Bravo', 25],
            ['Aula 202 - Pabellón Bravo', 25],
            ['Aula 205 - Pabellón Bravo', 20],
            ['Laboratorio de Idiomas 1', 25],
            ['Laboratorio de Idiomas 2', 25],
            ['Aula Magna CEDMIL', 60],
            ['Auditorio Mariscal Sucre', 45],
        ];
        $aulaIds = [];
        foreach ($aulasData as $a) {
            $aulaIds[] = DB::table('aula')->insertGetId([
                'nombre_aula'    => $a[0],
                'capacidad_aula' => $a[1],
                'created_at'     => now(),
                'updated_at'     => now(),
            ], 'id_aula');
        }

        // ─────────────────────────────────────────────────────────────
        // 7. TIPOS DE PAGO
        // ─────────────────────────────────────────────────────────────
        $idPagoBeca        = DB::table('tipo_pago')->insertGetId(['nombre_tipo_pago' => 'Beca Militar 100% Exenta', 'created_at' => now(), 'updated_at' => now()], 'id_tipo_pago');
        $idPagoMatricula   = DB::table('tipo_pago')->insertGetId(['nombre_tipo_pago' => 'Matrícula Regular Civil', 'created_at' => now(), 'updated_at' => now()], 'id_tipo_pago');
        $idPagoMensualidad = DB::table('tipo_pago')->insertGetId(['nombre_tipo_pago' => 'Mensualidad Civil', 'created_at' => now(), 'updated_at' => now()], 'id_tipo_pago');
        $idPagoLibro       = DB::table('tipo_pago')->insertGetId(['nombre_tipo_pago' => 'Adquisición de Texto Oficial', 'created_at' => now(), 'updated_at' => now()], 'id_tipo_pago');
        $idPagoCertificado = DB::table('tipo_pago')->insertGetId(['nombre_tipo_pago' => 'Certificado de Suficiencia', 'created_at' => now(), 'updated_at' => now()], 'id_tipo_pago');

        // ─────────────────────────────────────────────────────────────
        // 8. CAJAS / VENTANILLAS
        // ─────────────────────────────────────────────────────────────
        $idCaja1 = DB::table('caja')->insertGetId(['nombre_caja' => 'Ventanilla 1 - Militar', 'ubicacion_caja' => 'Hall Central - Bloque A', 'created_at' => now(), 'updated_at' => now()], 'id_caja');
        $idCaja2 = DB::table('caja')->insertGetId(['nombre_caja' => 'Ventanilla 2 - Civiles', 'ubicacion_caja' => 'Hall Central - Bloque B', 'created_at' => now(), 'updated_at' => now()], 'id_caja');
        $idCaja3 = DB::table('caja')->insertGetId(['nombre_caja' => 'Ventanilla 3 - Material & Libros', 'ubicacion_caja' => 'Planta Baja - Almacén', 'created_at' => now(), 'updated_at' => now()], 'id_caja');
        $cajas = [$idCaja1, $idCaja2, $idCaja3];

        // ─────────────────────────────────────────────────────────────
        // 9. PROGRAMAS, NIVELES Y LIBROS CON INVENTARIO ALMACÉN
        // ─────────────────────────────────────────────────────────────
        $programasConfig = [
            [
                'nombre' => 'Programa de Inglés Militar para Misiones de Paz',
                'idioma' => 'Inglés Militar',
                'tipo'   => $idProgMilitar,
                'duracion' => 2,
                'niveles' => [
                    ['nombre' => 'Básico A1/A2', 'libros' => ['American Headway - Military Edition (Book 1)', 'American Headway - Military Edition (Book 2)']],
                    ['nombre' => 'Intermedio B1/B2', 'libros' => ['Campaign: English for the Military 2', 'Campaign: English for the Military 3']],
                    ['nombre' => 'Avanzado C1', 'libros' => ['Tactical Operations & Staff English', 'UN Peacekeeping Officer English']],
                ]
            ],
            [
                'nombre' => 'Programa de Francés Diplomático y Operacional',
                'idioma' => 'Francés Diplomático',
                'tipo'   => $idProgDiplom,
                'duracion' => 2,
                'niveles' => [
                    ['nombre' => 'Básico A1/A2', 'libros' => ['Écho A1 - Méthode de français', 'Écho A2 - Méthode de français']],
                    ['nombre' => 'Intermedio B1', 'libros' => ['Français des Relations Internationales B1']],
                ]
            ],
            [
                'nombre' => 'Programa de Ruso Técnico y Táctico',
                'idioma' => 'Ruso Técnico',
                'tipo'   => $idProgMilitar,
                'duracion' => 2,
                'niveles' => [
                    ['nombre' => 'Básico Elemental', 'libros' => ['Ruso Técnico Militar: Manual de Armamento 1', 'Ruso Técnico Militar: Manual de Armamento 2']],
                    ['nombre' => 'Intermedio Operativo', 'libros' => ['Comunicaciones y Guerra Electrónica Ruso B1']],
                ]
            ],
            [
                'nombre' => 'Programa de Mandarín Táctico y Negocios',
                'idioma' => 'Mandarín Táctico',
                'tipo'   => $idProgCivil,
                'duracion' => 3,
                'niveles' => [
                    ['nombre' => 'HSK 1 Inicial', 'libros' => ['HSK Standard Course 1 (Libro de Texto)', 'HSK Standard Course 1 (Cuaderno de Trabajo)']],
                    ['nombre' => 'HSK 2 Intermedio', 'libros' => ['HSK Standard Course 2 (Libro Oficial)']],
                ]
            ],
            [
                'nombre' => 'Programa de Quechua Originario Institucional',
                'idioma' => 'Quechua Institucional',
                'tipo'   => $idProgMilitar,
                'duracion' => 1,
                'niveles' => [
                    ['nombre' => 'Quechua Básico y Diálogo', 'libros' => ['Quechua Militar para la Interacción Comunitaria']],
                ]
            ],
            [
                'nombre' => 'Programa de Alemán Académico y Estratégico',
                'idioma' => 'Alemán Académico',
                'tipo'   => $idProgCivil,
                'duracion' => 2,
                'niveles' => [
                    ['nombre' => 'Alemán A1', 'libros' => ['Menschen A1 Deutsch als Fremdsprache']],
                    ['nombre' => 'Alemán A2', 'libros' => ['Menschen A2 Deutsch als Fremdsprache']],
                ]
            ],
            [
                'nombre' => 'Programa de Portugués Militar y Mercosur',
                'idioma' => 'Portugués Estratégico',
                'tipo'   => $idProgMilitar,
                'duracion' => 1,
                'niveles' => [
                    ['nombre' => 'Portugués Operativo', 'libros' => ['Português para Missões Conjuntas Mercosul']],
                ]
            ]
        ];

        $nivelIds = [];
        $librosList = [];
        $almacenLibroIds = [];

        foreach ($programasConfig as $pConf) {
            $idProg = DB::table('programa')->insertGetId([
                'id_idioma'              => $idiomaIds[$pConf['idioma']],
                'id_tipo_programa'       => $pConf['tipo'],
                'nombre_programa'        => $pConf['nombre'],
                'duracion_anios_programa' => $pConf['duracion'],
                'created_at'             => now(),
                'updated_at'             => now(),
            ], 'id_programa');

            foreach ($pConf['niveles'] as $idxN => $nConf) {
                $idNiv = DB::table('nivel')->insertGetId([
                    'id_programa'           => $idProg,
                    'numero_nivel'          => $idxN + 1,
                    'nombre_nivel'          => $nConf['nombre'],
                    'cantidad_libros_nivel' => count($nConf['libros']),
                    'created_at'            => now(),
                    'updated_at'            => now(),
                ], 'id_nivel');

                $nivelIds[] = [
                    'id_nivel'   => $idNiv,
                    'idioma'     => $pConf['idioma'],
                    'nombre_niv' => $nConf['nombre'],
                    'libros'     => []
                ];

                $lastNivKey = count($nivelIds) - 1;

                foreach ($nConf['libros'] as $idxL => $libNombre) {
                    $idLib = DB::table('libro')->insertGetId([
                        'id_nivel'     => $idNiv,
                        'numero_libro' => $idxL + 1,
                        'nombre_libro' => $libNombre,
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ], 'id_libro');

                    $librosList[] = $idLib;
                    $nivelIds[$lastNivKey]['libros'][] = $idLib;

                    // Almacén ROP para este libro
                    // Generar algunos en alerta de reposición y otros con stock óptimo
                    $stockActual = ($idxL % 3 === 0) ? rand(8, 16) : rand(35, 90);
                    $puntoReorden = 20;
                    $stockMinimo = 10;
                    $stockMaximo = 100;

                    $idAlm = DB::table('almacen_libro')->insertGetId([
                        'id_libro'              => $idLib,
                        'stock_actual_almacen'  => $stockActual,
                        'punto_reorden_almacen' => $puntoReorden,
                        'stock_minimo_almacen'  => $stockMinimo,
                        'stock_maximo_almacen'  => $stockMaximo,
                        'created_at'            => now(),
                        'updated_at'            => now(),
                    ], 'id_almacen_libro');

                    $almacenLibroIds[] = $idAlm;

                    // Si stock <= punto de reorden, emitir pedido de reposición
                    if ($stockActual <= $puntoReorden) {
                        DB::table('pedido_reposicion')->insert([
                            'id_almacen_libro'        => $idAlm,
                            'cantidad_pedido'         => $stockMaximo - $stockActual,
                            'fecha_pedido'            => Carbon::now()->subDays(rand(1, 4))->toDateString(),
                            'fecha_recepcion_pedido'  => null,
                            'estado_pedido'           => 'Pendiente',
                            'created_at'              => now(),
                            'updated_at'              => now(),
                        ]);
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 10. DOCENTES E IDIOMAS HABILITADOS (22 Docentes Bolivianos)
        // ─────────────────────────────────────────────────────────────
        $docentesData = [
            ['5849201 LP', 'Fernando', 'Ríos Torrico', '+591 76543210', 'f.rios@ejercito.mil.bo', 'Inglés Militar'],
            ['7120485 LP', 'Carlos', 'Ramos Siles', '+591 71234567', 'c.ramos@ejercito.mil.bo', 'Inglés Militar'],
            ['6920184 CB', 'María', 'Condori Quispe', '+591 78901234', 'm.condori@ejercito.mil.bo', 'Francés Diplomático'],
            ['8392019 LP', 'Ana', 'Blanco Gutiérrez', '+591 74445566', 'ana.blanco@idiomas.edu.bo', 'Mandarín Táctico'],
            ['4920194 SC', 'Roberto', 'Daza Peñaranda', '+591 73102938', 'r.daza@ejercito.mil.bo', 'Ruso Técnico'],
            ['6194028 CB', 'Jeanette', 'Mendoza Alarcón', '+591 72019485', 'j.mendoza@ejercito.mil.bo', 'Francés Diplomático'],
            ['5302918 OR', 'Hugo', 'Mamani Choque', '+591 79182304', 'h.mamani@ejercito.mil.bo', 'Quechua Institucional'],
            ['7849201 PT', 'Beatriz', 'Flores Colque', '+591 76591283', 'b.flores@ejercito.mil.bo', 'Quechua Institucional'],
            ['4810293 TJ', 'Rodrigo', 'Guzmán Torrico', '+591 71492018', 'r.guzman@ejercito.mil.bo', 'Alemán Académico'],
            ['9201847 SC', 'Marcelo', 'Justiniano Roca', '+591 77201948', 'm.justiniano@ejercito.mil.bo', 'Portugués Estratégico'],
            ['6849102 LP', 'David', 'Morales Silva', '+591 73849102', 'd.morales@ejercito.mil.bo', 'Inglés Militar'],
            ['7392014 CB', 'Claudia', 'Pinto Montaño', '+591 75920184', 'c.pinto@idiomas.edu.bo', 'Inglés Militar'],
            ['8402918 LP', 'Jorge', 'Escalera Vargas', '+591 76019283', 'j.escalera@ejercito.mil.bo', 'Ruso Técnico'],
            ['5819203 CH', 'Valeria', 'Rojas Banzer', '+591 74920183', 'v.rojas@ejercito.mil.bo', 'Francés Diplomático'],
            ['6948201 BE', 'Gonzalo', 'Villarroel Suárez', '+591 78192039', 'g.villarroel@ejercito.mil.bo', 'Portugués Estratégico'],
            ['7301928 LP', 'Patricia', 'Alvis Murillo', '+591 72948102', 'p.alvis@ejercito.mil.bo', 'Inglés Militar'],
            ['8192049 CB', 'Sergio', 'Zambrana Quiroga', '+591 71839201', 's.zambrana@ejercito.mil.bo', 'Inglés Militar'],
            ['4928104 SC', 'Gabriela', 'Aguilera Méndez', '+591 76294018', 'g.aguilera@ejercito.mil.bo', 'Alemán Académico'],
            ['6719402 LP', 'Eduardo', 'Callisaya Quisbert', '+591 79283019', 'e.callisaya@ejercito.mil.bo', 'Mandarín Táctico'],
            ['7492018 OR', 'Néstor', 'Aruquipa Limachi', '+591 74819203', 'n.aruquipa@ejercito.mil.bo', 'Quechua Institucional'],
            ['8920147 TJ', 'Mariana', 'López Paz', '+591 77391029', 'm.lopez@ejercito.mil.bo', 'Inglés Militar'],
            ['6029481 PA', 'Oscar', 'Vaca Díez', '+591 78402918', 'o.vaca@ejercito.mil.bo', 'Portugués Estratégico'],
        ];

        $docenteIds = [];
        foreach ($docentesData as $doc) {
            $idDoc = DB::table('docente')->insertGetId([
                'ci_docente'       => $doc[0],
                'nombre_docente'   => $doc[1],
                'apellido_docente' => $doc[2],
                'telefono_docente' => $doc[3],
                'email_docente'    => $doc[4],
                'estado_docente'   => 'Activo',
                'created_at'       => now(),
                'updated_at'       => now(),
            ], 'id_docente');

            $docenteIds[] = $idDoc;

            // Vincular con su idioma principal
            $nomIdm = isset($idiomaIds[$doc[5]]) ? $doc[5] : 'Inglés Militar';
            DB::table('docente_idioma')->insert([
                'id_docente' => $idDoc,
                'id_idioma'  => $idiomaIds[$nomIdm]
            ]);
        }

        // ─────────────────────────────────────────────────────────────
        // 11. PARALELOS Y ASIGNACIONES CON ROTACIÓN QUINCENAL
        // ─────────────────────────────────────────────────────────────
        $paralelosList = [];
        $prefijosCodigos = ['ING', 'FRA', 'RUS', 'MAN', 'QUE', 'ALM', 'POR'];

        $paraleloCounter = 1;
        foreach ($nivelIds as $nivIdx => $nivInfo) {
            // Crear 2 paralelos por nivel para tener amplia oferta
            for ($p = 1; $p <= 2; $p++) {
                $codPrefix = substr($nivInfo['idioma'], 0, 3);
                $codParalelo = sprintf('%s-%d0%d-%s', strtoupper($codPrefix), $nivIdx + 1, $p, ($p === 1 ? 'A' : 'B'));

                $idAula = $aulaIds[($paraleloCounter) % count($aulaIds)];
                $idHorario = $horarioIds[($paraleloCounter) % count($horarioIds)];
                $idMod = $modalidades[($paraleloCounter) % count($modalidades)];

                $idPar = DB::table('paralelo')->insertGetId([
                    'id_nivel'                   => $nivInfo['id_nivel'],
                    'id_aula'                    => $idAula,
                    'id_horario'                 => $idHorario,
                    'id_modalidad'               => $idMod,
                    'id_gestion'                 => $idGestion2026,
                    'codigo_paralelo'            => $codParalelo,
                    'capacidad_maxima_paralelo'  => 30,
                    'capacidad_minima_apertura'  => 10,
                    'estado_paralelo'            => 'Abierto',
                    'created_at'                 => now(),
                    'updated_at'                 => now(),
                ], 'id_paralelo');

                // Asignar docente con rotación
                $docenteAsignado = $docenteIds[($paraleloCounter) % count($docenteIds)];

                // Generar algunos docentes con >= 14 días para activar la alerta quincenal
                $diasEnAula = ($paraleloCounter % 3 === 0) ? rand(14, 18) : rand(2, 10);

                DB::table('asignacion_docente_paralelo')->insert([
                    'id_paralelo'             => $idPar,
                    'id_docente'              => $docenteAsignado,
                    'fecha_inicio_asignacion' => Carbon::now()->subDays($diasEnAula)->toDateString(),
                    'fecha_fin_asignacion'    => null, // Activo actualmente
                    'created_at'              => now(),
                    'updated_at'              => now(),
                ]);

                $paralelosList[] = [
                    'id_paralelo'     => $idPar,
                    'codigo_paralelo' => $codParalelo,
                    'id_nivel'        => $nivInfo['id_nivel'],
                    'idioma'          => $nivInfo['idioma'],
                    'nombre_niv'      => $nivInfo['nombre_niv'],
                    'libros'          => $nivInfo['libros'],
                    'docente'         => $docenteAsignado,
                ];

                $paraleloCounter++;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 12. POBLACIÓN MASIVA DE ~450 ESTUDIANTES (280 Militares, 170 Civiles)
        // ─────────────────────────────────────────────────────────────
        $nombresVarones = [
            'Carlos Fernando', 'Jorge Luis', 'Alejandro René', 'Diego Armando', 'Rodrigo Javier',
            'Marcelo Andrés', 'Cristian Eduardo', 'Alvaro Gonzalo', 'Mauricio David', 'Luis Fernando',
            'Ronald Ariel', 'Oscar Daniel', 'Victor Hugo', 'Gustavo Adolfo', 'Jaime Alberto',
            'Marco Antonio', 'Edgar Ramiro', 'Boris Alexander', 'Franz Walter', 'Nelson Gabriel',
            'Juan Pablo', 'Ignacio Javier', 'Ruben Dario', 'Hernan Gonzalo', 'Cesar Augusto',
            'Ramiro Antonio', 'Erick Manuel', 'Reynaldo Jesus', 'Felipe Andres', 'Bernardo Jose'
        ];

        $nombresMujeres = [
            'Valentina Sofía', 'Camila Andrea', 'Mariana Lucía', 'Valeria Nicole', 'Gabriela Patricia',
            'Andrea Belén', 'Natalia Jimena', 'Paola Andrea', 'Daniela Isabel', 'Claudia Roxana',
            'Brenda Estefanía', 'Pamela Beatriz', 'Jessica Rossio', 'Cecilia Adriana', 'Fabiola Tatiana',
            'Lorena Patricia', 'Romina Andrea', 'Monica Gisela', 'Adriana Jimena', 'Silvia Veronica',
            'Viviana Alejandra', 'Patricia Roxana', 'Carla Jimena', 'Rocio Alejandra', 'Lucia Marcela'
        ];

        $apellidosBolivianos = [
            'Mamani', 'Quispe', 'Flores', 'Condori', 'Choque', 'Vargas', 'Rodríguez', 'Gutiérrez',
            'Torrico', 'Blanco', 'Morales', 'Justiniano', 'Banzer', 'Méndez', 'Ríos', 'Daza',
            'Siles', 'Alarcón', 'Pinto', 'Fernández', 'Rojas', 'Chávez', 'Peñaranda', 'Montaño',
            'Escalera', 'Villarroel', 'Aruquipa', 'Limachi', 'Callisaya', 'Quisbert', 'Paz', 'Aguilera',
            'Zambrana', 'Quiroga', 'Alvis', 'Murillo', 'Salazar', 'Maldonado', 'Cabrera', 'Llanos',
            'Terrazas', 'Serrano', 'Castillo', 'Camacho', 'Delgadillo', 'Guzmán', 'Ortiz', 'Suárez'
        ];

        $departamentos = ['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PA'];

        $gradosMilitares = [
            'Capitán de Infantería', 'Capitán de Caballería', 'Capitán de Artillería',
            'Teniente de Comunicaciones', 'Teniente de Ingeniería', 'Teniente de Armas',
            'Subteniente de Infantería', 'Subteniente de Artillería', 'Subteniente de Logística',
            'Mayor de Infantería', 'Mayor del Estado Mayor', 'Teniente Coronel DEM',
            'Suboficial Mayor', 'Suboficial 1ro.', 'Suboficial 2do.', 'Suboficial Inicial',
            'Sargento 1ro.', 'Sargento 2do.', 'Sargento Inicial',
            'Cadete de 4to Año', 'Cadete de 3er Año'
        ];

        $unidadesMilitares = [
            'Regimiento Colorados de Bolivia (Escolta Presidencial)',
            'Colegio Militar del Ejército Cnl. Gualberto Villarroel',
            'Escuela Militar de Inteligencia (EMI-Int)',
            'Regimiento de Infantería 1 Bolívar',
            'Regimiento de Caballería 4 Ingavi',
            'Escuela de Comando y Estado Mayor (ECEM)',
            'Batallón Logístico I - Las Delicias',
            'Batallón de Policía Militar Naval',
            'Dirección de Comunicación Social del Ejército',
            'Comando de Educación y Doctrina Militar (CEDMIL)',
            'Regimiento Andino 25 Tocopilla',
            'Grupo Aéreo de Caza 31'
        ];

        $direccionesCiviles = [
            'Av. Arce, Edif. Illimani 4B, La Paz',
            'Calle 21 de Calacoto, San Miguel, La Paz',
            'Miraflores, Plaza Triangular #420, La Paz',
            'Sopocachi, Av. 20 de Octubre #1829, La Paz',
            'Obrajes, Calle 8 #120, La Paz',
            'Av. Ballivián #680, El Prado, Cochabamba',
            'Av. América y Pando, Queru Queru, Cochabamba',
            'Av. San Martín, Barrio Equipetrol, Santa Cruz',
            'Av. Monseñor Rivero #310, Santa Cruz',
            'Calle Bolívar #580, Casco Viejo, Santa Cruz',
            'Av. 6 de Agosto #140, Zona Sud, Oruro',
            'Calle Sucre #250, Tarija',
            'Plaza 25 de Mayo #115, Sucre'
        ];

        $totalEstudiantesObjetivo = 450;
        $totalMilitares = 280; // ~62% militares
        $totalCiviles = 170;   // ~38% civiles

        $estudianteIds = [];
        $matriculasGeneradas = [];

        // Generar 450 estudiantes
        for ($i = 1; $i <= $totalEstudiantesObjetivo; $i++) {
            $esMilitar = ($i <= $totalMilitares);
            $tipoEstudiante = $esMilitar ? 'Militar' : 'Civil';

            $esVaron = (rand(1, 10) <= 7); // 70% varones en contexto militar
            $nombre = $esVaron ? $nombresVarones[array_rand($nombresVarones)] : $nombresMujeres[array_rand($nombresMujeres)];
            $apellidoP = $apellidosBolivianos[array_rand($apellidosBolivianos)];
            $apellidoM = $apellidosBolivianos[array_rand($apellidosBolivianos)];
            $apellidoCompleto = "{$apellidoP} {$apellidoM}";

            $depto = $departamentos[array_rand($departamentos)];
            $ciNumero = rand(3000000, 9999999);
            $ciEstudiante = "{$ciNumero} {$depto}";

            $anioNac = $esMilitar ? rand(1985, 2004) : rand(1992, 2006);
            $mesNac = rand(1, 12);
            $diaNac = rand(1, 28);
            $fechaNac = sprintf('%04d-%02d-%02d', $anioNac, $mesNac, $diaNac);

            $telefono = '+591 ' . (rand(1, 2) === 1 ? '7' : '6') . rand(1000000, 9999999);

            $nomSlug = strtolower(substr(str_replace(' ', '', $nombre), 0, 1));
            $apeSlug = strtolower(str_replace([' ', 'ñ', 'á', 'é', 'í', 'ó', 'ú'], ['', 'n', 'a', 'e', 'i', 'o', 'u'], $apellidoP));
            $email = $esMilitar ? "{$nomSlug}.{$apeSlug}{$i}@ejercito.mil.bo" : "{$nomSlug}.{$apeSlug}{$i}@gmail.com";

            $direccion = $esMilitar ? $unidadesMilitares[array_rand($unidadesMilitares)] : $direccionesCiviles[array_rand($direccionesCiviles)];

            $idEst = DB::table('estudiante')->insertGetId([
                'ci_estudiante'               => $ciEstudiante,
                'nombre_estudiante'           => $nombre,
                'apellido_estudiante'         => $apellidoCompleto,
                'fecha_nacimiento_estudiante' => $fechaNac,
                'telefono_estudiante'         => $telefono,
                'email_estudiante'            => $email,
                'direccion_estudiante'        => $direccion,
                'tipo_estudiante'             => $tipoEstudiante,
                'created_at'                  => Carbon::now()->subDays(rand(10, 60)),
                'updated_at'                  => now(),
            ], 'id_estudiante');

            $matricula = '';
            if ($esMilitar) {
                $matricula = sprintf('EIE-MIL-2026-%04d', $i);
                $grado = $gradosMilitares[array_rand($gradosMilitares)];
                $unidad = $unidadesMilitares[array_rand($unidadesMilitares)];

                DB::table('estudiante_militar')->insert([
                    'id_estudiante'         => $idEst,
                    'grado_militar'         => $grado,
                    'unidad_militar'        => $unidad,
                    'id_militar_estudiante' => $matricula,
                    'created_at'            => now(),
                    'updated_at'            => now(),
                ]);
            } else {
                $matricula = sprintf('EIE-CIV-2026-%04d', $i);
            }

            $estudianteIds[] = [
                'id_estudiante'   => $idEst,
                'tipo'            => $tipoEstudiante,
                'matricula'       => $matricula,
                'nombre_completo' => "{$nombre} {$apellidoCompleto}",
            ];

            // ─────────────────────────────────────────────────────────
            // 13. INSCRIPCIÓN Y AVANCE CURRICULAR POR ESTUDIANTE
            // ─────────────────────────────────────────────────────────
            // Asignar al estudiante a uno de los paralelos de forma distribuida
            $paraleloElegido = $paralelosList[($i - 1) % count($paralelosList)];

            $idIns = DB::table('inscripcion')->insertGetId([
                'id_estudiante'      => $idEst,
                'id_paralelo'        => $paraleloElegido['id_paralelo'],
                'fecha_inscripcion'  => Carbon::now()->subDays(rand(15, 45))->toDateString(),
                'estado_inscripcion' => ($i % 25 === 0) ? 'Concluida' : 'Activa',
                'created_at'         => now(),
                'updated_at'         => now(),
            ], 'id_inscripcion');

            // Asignar libro de avance
            if (!empty($paraleloElegido['libros'])) {
                $idLibroElegido = $paraleloElegido['libros'][0];

                $idInsLib = DB::table('inscripcion_libro')->insertGetId([
                    'id_inscripcion'     => $idIns,
                    'id_libro'           => $idLibroElegido,
                    'fecha_inicio_libro' => Carbon::now()->subDays(rand(10, 30))->toDateString(),
                    'fecha_fin_libro'    => ($i % 3 === 0) ? Carbon::now()->subDays(rand(1, 5))->toDateString() : null,
                    'estado_libro'       => ($i % 3 === 0) ? 'Aprobado' : 'En curso',
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ], 'id_inscripcion_libro');

                // Generar evaluación para todos los estudiantes matriculados
                $notaExamen = rand(65, 98);
                $notaOral = rand(70, 100);
                $notaPart = rand(75, 100);
                $notaFinal = round(($notaExamen * 0.8) + ($notaOral * 0.1) + ($notaPart * 0.1), 2);

                DB::table('evaluacion_libro')->insert([
                    'id_inscripcion_libro'     => $idInsLib,
                    'nota_examen_libro'        => $notaExamen,
                    'nota_defensa_oral'        => $notaOral,
                    'nota_participacion_libro' => $notaPart,
                    'nota_final_libro'         => $notaFinal,
                    'id_docente_calificador'   => $paraleloElegido['docente'],
                    'fecha_evaluacion_libro'   => Carbon::now()->subDays(rand(1, 10))->toDateString(),
                    'created_at'               => now(),
                    'updated_at'               => now(),
                ]);
            }

            // ─────────────────────────────────────────────────────────
            // 14. PAGOS DEL ESTUDIANTE
            // ─────────────────────────────────────────────────────────
            if ($esMilitar) {
                // Militares con beca exenta 100%
                DB::table('pago')->insert([
                    'id_estudiante' => $idEst,
                    'id_tipo_pago'  => $idPagoBeca,
                    'id_inscripcion'=> $idIns,
                    'id_gestion'    => $idGestion2026,
                    'id_caja'       => $idCaja1,
                    'monto_pago'    => 0.00,
                    'fecha_pago'    => Carbon::now()->subDays(rand(5, 30)),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            } else {
                // Civiles pagan matrícula regular y mensualidad
                $cajaCivil = ($i % 2 === 0) ? $idCaja2 : $idCaja3;

                DB::table('pago')->insert([
                    'id_estudiante' => $idEst,
                    'id_tipo_pago'  => $idPagoMatricula,
                    'id_inscripcion'=> $idIns,
                    'id_gestion'    => $idGestion2026,
                    'id_caja'       => $cajaCivil,
                    'monto_pago'    => 280.00,
                    'fecha_pago'    => Carbon::now()->subDays(rand(5, 30)),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);

                if ($i % 3 === 0) {
                    DB::table('pago')->insert([
                        'id_estudiante' => $idEst,
                        'id_tipo_pago'  => $idPagoLibro,
                        'id_inscripcion'=> $idIns,
                        'id_gestion'    => $idGestion2026,
                        'id_caja'       => $idCaja3,
                        'monto_pago'    => 150.00,
                        'fecha_pago'    => Carbon::now()->subDays(rand(2, 20)),
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ]);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 15. COLA FIFO Y FICHAS DE ATENCIÓN DEL DÍA (Para simulador Quarkus)
        // ─────────────────────────────────────────────────────────────
        $horaBase = Carbon::today()->setHour(8)->setMinute(0)->setSecond(0);

        // Fichas ya atendidas (históricas y de hoy, total 440)
        for ($f = 1; $f <= 440; $f++) {
            $esHoy = ($f >= 400);
            $fechaFicha = $esHoy
                ? $horaBase->copy()->addMinutes(($f - 400) * 8)
                : Carbon::now()->subDays(rand(1, 40))->setHour(rand(8, 16))->setMinute(rand(0, 59));

            $esperaMin = rand(3, 15);
            $servicioMin = rand(4, 18);
            $idEstRandom = $estudianteIds[($f - 1) % count($estudianteIds)]['id_estudiante'];
            $idCajaRandom = $cajas[array_rand($cajas)];

            DB::table('ficha_atencion')->insert([
                'id_caja'                    => $idCajaRandom,
                'id_estudiante'              => $idEstRandom,
                'numero_ficha'               => 100 + $f,
                'hora_llegada_ficha'         => $fechaFicha,
                'hora_inicio_atencion_ficha' => $fechaFicha->copy()->addMinutes($esperaMin),
                'hora_fin_atencion_ficha'    => $fechaFicha->copy()->addMinutes($esperaMin + $servicioMin),
                'estado_ficha'               => 'Atendida',
                'created_at'                 => $fechaFicha,
                'updated_at'                 => $fechaFicha->copy()->addMinutes($esperaMin + $servicioMin),
            ]);
        }

        // Fichas en espera actuales (10 en cola FIFO)
        for ($f = 441; $f <= 450; $f++) {
            $llegada = Carbon::now()->subMinutes((451 - $f) * 4);
            $idEstRandom = $estudianteIds[($f - 1) % count($estudianteIds)]['id_estudiante'];

            DB::table('ficha_atencion')->insert([
                'id_caja'                    => null,
                'id_estudiante'              => $idEstRandom,
                'numero_ficha'               => 100 + $f,
                'hora_llegada_ficha'         => $llegada,
                'hora_inicio_atencion_ficha' => null,
                'hora_fin_atencion_ficha'    => null,
                'estado_ficha'               => 'En espera',
                'created_at'                 => $llegada,
                'updated_at'                 => $llegada,
            ]);
        }

        // ─────────────────────────────────────────────────────────────
        // 15.1. KARDEX DE ALMACÉN: 450 MOVIMIENTOS HISTÓRICOS
        // ─────────────────────────────────────────────────────────────
        $motivosEntrada = [
            'Adquisición oficial según Orden de Compra CEDMIL',
            'Reabastecimiento trimestral Editorial Militar EIE',
            'Donación bibliográfica Cooperación Militar Internacional',
            'Recepción de lote de reposición ROP'
        ];
        $motivosSalida = [
            'Dotación reglamentaria a estudiante militar becado',
            'Venta directa en ventanilla a estudiante civil',
            'Entrega curricular a docente para material de aula',
            'Despacho de textos para inicio de módulo académico'
        ];

        for ($m = 1; $m <= 450; $m++) {
            $esEntrada = ($m % 4 === 0);
            $idAlmElegido = $almacenLibroIds[array_rand($almacenLibroIds)];
            $idParaleloElegido = $paralelosList[array_rand($paralelosList)]['id_paralelo'];
            $fechaMov = Carbon::now()->subDays(rand(1, 45))->setHour(rand(8, 17))->setMinute(rand(0, 59));

            DB::table('movimiento_almacen')->insert([
                'id_almacen_libro'    => $idAlmElegido,
                'id_paralelo'         => $esEntrada ? null : $idParaleloElegido,
                'tipo_movimiento'     => $esEntrada ? 'Entrada' : 'Salida',
                'cantidad_movimiento' => $esEntrada ? rand(20, 60) : rand(1, 5),
                'fecha_movimiento'    => $fechaMov,
                'motivo_movimiento'   => $esEntrada ? $motivosEntrada[array_rand($motivosEntrada)] : $motivosSalida[array_rand($motivosSalida)],
                'created_at'          => $fechaMov,
                'updated_at'          => $fechaMov,
            ]);
        }

        // ─────────────────────────────────────────────────────────────
        // 16. USUARIOS INSTITUCIONALES (6 ROLES CON PREFIJOS DE CORREO)
        // ─────────────────────────────────────────────────────────────
        $passwordHash = Hash::make('Password123!');

        // Admin: Único que puede alternar libremente de rol
        $idUserAdmin = DB::table('usuario')->insertGetId([
            'nombre_usuario'        => 'Cnl. DAEN. Roberto Méndez Silva',
            'email_usuario'         => 'admin.mendez@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'Admin',
            'id_docente'            => null,
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subHours(1),
            'created_at'            => now(),
            'updated_at'            => now(),
        ], 'id_usuario');

        // Jefe Académico
        DB::table('usuario')->insert([
            'nombre_usuario'        => 'Tcnl. DEM. Hugo Banzer Rivera',
            'email_usuario'         => 'jef.banzer@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'JefeAcademico',
            'id_docente'            => null,
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subHours(2),
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        // Docente vinculado
        DB::table('usuario')->insert([
            'nombre_usuario'        => 'Cap. Fernando Ríos Torrico',
            'email_usuario'         => 'doc.rios@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'Docente',
            'id_docente'            => $docenteIds[0],
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subHours(3),
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        // Secretaria
        DB::table('usuario')->insert([
            'nombre_usuario'        => 'Sgto. 1ro. Patricia Morales Guzmán',
            'email_usuario'         => 'sec.morales@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'Secretaria',
            'id_docente'            => null,
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subMinutes(20),
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        // Cajero
        DB::table('usuario')->insert([
            'nombre_usuario'        => 'Sof. My. David Choquehuanca',
            'email_usuario'         => 'caj.choquehuanca@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'Cajero',
            'id_docente'            => null,
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subMinutes(15),
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        // Almacenero
        DB::table('usuario')->insert([
            'nombre_usuario'        => 'Sgto. 2do. Marcelo Justiniano',
            'email_usuario'         => 'alm.justiniano@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'Almacenero',
            'id_docente'            => null,
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subMinutes(30),
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        // Estudiante institucional
        DB::table('usuario')->insert([
            'nombre_usuario'        => 'Cad. Carlos Fernando Mamani',
            'email_usuario'         => 'est.mamani@ejercito.mil.bo',
            'password_usuario'      => $passwordHash,
            'rol_usuario'           => 'Estudiante',
            'id_docente'            => null,
            'estado_usuario'        => 'Activo',
            'ultimo_acceso_usuario' => Carbon::now()->subMinutes(10),
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        // ─────────────────────────────────────────────────────────────
        // 17. AUDITORÍA INICIAL
        // ─────────────────────────────────────────────────────────────
        DB::table('log_auditoria')->insert([
            'id_usuario'           => $idUserAdmin,
            'accion_log'           => 'SEED_COMPLETE_450_5FN',
            'tabla_afectada_log'   => 'sistema',
            'registro_id_log'      => null,
            'datos_anteriores_log' => null,
            'datos_nuevos_log'     => json_encode([
                'version'              => '2.4.0',
                'gestion'              => 2026,
                'total_estudiantes'    => $totalEstudiantesObjetivo,
                'militares'            => $totalMilitares,
                'civiles'              => $totalCiviles,
                'paralelos'            => count($paralelosList),
                'docentes'             => count($docenteIds),
                'normalizacion'        => '5FN',
            ]),
            'ip_origen_log'        => '127.0.0.1',
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);
    }
}
