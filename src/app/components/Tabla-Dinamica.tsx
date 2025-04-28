'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { XMarkIcon, CheckIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import esMX from 'dayjs/locale/es-mx';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale(esMX);
import { v4 as uuid } from 'uuid';
import { desformatearMonedaInput, formatearMonedaInput } from '../scripts/formateadores';

interface FilaTabla {
    fecha: Date;
    esLaborable: boolean;
    esHabil: boolean;
    saldoInicio: number;
    consumo: number;
    consumoEspecial: boolean;
    recarga: {
        monto: number;
        fechaSolicitud: Date;
        fechaAcreditacion: Date;
        uuid: string;
    } | null;
    saldoFin: number;
    fechaProyeccion: Date;
    saldoProyeccion: number;
}

interface ParametrosCalculo {
    fechaInicio: Date;
    presupuestoDiario: number;
    saldoInicial: number;
    montoRecarga: number;
    plazoAcreditacion: number;
    saldoMinimo: number;
    filas: number;
    feriados: Date[];
    noLaborables: Date[];
    laborablesEspeciales: Date[];
    diasProgramados: string;
    recargasAutomaticas: boolean;
    consumosEspeciales: { fecha: Date, monto: number }[];
    recargasEspeciales: { fechaAcreditacion: Date, monto: number, fechaSolicitud: Date, uuid: string }[];
}

const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            if (typeof window !== 'undefined') {
                const item = window.localStorage.getItem(key);

                if (item) {
                    // Parsear el JSON
                    const parsed = JSON.parse(item);

                    // Convertir las fechas de string a objetos Date
                    if (typeof parsed === 'object' && parsed !== null) {
                        // Convertir fechaInicio a Date
                        if (parsed.fechaInicio) {
                            parsed.fechaInicio = new Date(parsed.fechaInicio);
                        }

                        // Convertir arrays de fechas
                        if (Array.isArray(parsed.feriados)) {
                            parsed.feriados = parsed.feriados.map((f: string) => new Date(f));
                        }

                        if (Array.isArray(parsed.noLaborables)) {
                            parsed.noLaborables = parsed.noLaborables.map((f: string) => new Date(f));
                        }
                    }

                    return parsed;
                }
            }
            return initialValue;
        } catch (error) {
            console.error('Error recuperando del localStorage:', error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            // Para depuración
            console.log('Guardando en localStorage:', valueToStore);

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    };

    return [storedValue, setValue] as const;
};

const TablaDinamica = () => {
    const VALORES_DEFAULT: ParametrosCalculo = {
        fechaInicio: new Date(),
        presupuestoDiario: 150000,
        saldoInicial: 500000,
        montoRecarga: 500000,
        plazoAcreditacion: 3,
        saldoMinimo: 150000,
        filas: 60,
        feriados: [dayjs('2025-01-01').toDate(), dayjs('2025-03-03').toDate(), dayjs('2025-03-04').toDate(), dayjs('2025-03-24').toDate(), dayjs('2025-04-02').toDate(), dayjs('2025-04-18').toDate(), dayjs('2025-05-01').toDate(), dayjs('2025-05-25').toDate(), dayjs('2025-06-16').toDate(), dayjs('2025-06-20').toDate(), dayjs('2025-07-09').toDate(), dayjs('2025-08-17').toDate(), dayjs('2025-10-12').toDate(), dayjs('2025-11-24').toDate(), dayjs('2025-12-08').toDate(), dayjs('2025-12-25').toDate(),
        dayjs('2025-05-02').toDate(), dayjs('2025-08-15').toDate(), dayjs('2025-11-21').toDate()
        ],
        noLaborables: [],
        laborablesEspeciales: [],
        diasProgramados: '1,2,3,4,5',
        recargasAutomaticas: true,
        consumosEspeciales: [],
        recargasEspeciales: []
    }

    const [parametros, setParametros] = useLocalStorage<ParametrosCalculo>('parametros-tabla-dinamica', VALORES_DEFAULT);
    const [tabla, setTabla] = useState<FilaTabla[]>([]);
    const [editandoConsumo, setEditandoConsumo] = useState<string | null>(null);
    const [nuevoConsumo, setNuevoConsumo] = useState<string>('');
    const [editandoRecarga, setEditandoRecarga] = useState<string | null>(null);
    const [nuevaRecarga, setNuevaRecarga] = useState<{ monto: string, fechaAcreditacion: Date, uuid: string, fechaSolicitud: Date }>({
        monto: '',
        fechaAcreditacion: new Date(),
        uuid: '',
        fechaSolicitud: new Date()
    });
    const [hoverRecarga, setHoverRecarga] = useState<string | null>(null);


    const esDiaLaborable = (fecha: Date): boolean => {
        const diaSemana = fecha.getDay();
        const esProgramado = parametros.diasProgramados.split(',').includes(diaSemana.toString());
        const esNoLaborable = parametros.noLaborables.some(noLab =>
            dayjs(noLab).isSame(fecha, 'day')
        );
        const esLaborableEspecial = parametros.laborablesEspeciales.some(labEs =>
            dayjs(labEs).isSame(fecha, 'day')
        );

        return (esProgramado && !esNoLaborable) || esLaborableEspecial;
    };

    const esDiaHabil = (fecha: Date): boolean => {
        const diaSemana = dayjs(fecha).day();
        const esFeriado = parametros.feriados.some(feriado =>
            dayjs(feriado).isSame(fecha, 'day')
        );
        return diaSemana >= 1 && diaSemana <= 5 && !esFeriado;
    };

    const getFechaProyeccion = (fecha: Date): Date => {
        let fechaProyeccion = dayjs(fecha).add(1, 'day')
        let diasContador = 0
        let fechaProyeccionFinal = dayjs(fecha)
        while (diasContador <= parametros.plazoAcreditacion) {
            if (esDiaHabil(fechaProyeccion.toDate())) {
                diasContador++
                fechaProyeccionFinal = fechaProyeccion
            }
            fechaProyeccion = fechaProyeccion.add(1, 'day')
        }
        return fechaProyeccionFinal.toDate()
    }

    const getSaldoProyeccion = (tabla: FilaTabla[], fecha: Date): number => {
        let saldoProyeccion = 0
        let fechaProyeccion = getFechaProyeccion(fecha) 
        const fila = tabla.find(f => dayjs(f.fecha).isSame(fechaProyeccion, 'day'))
        if (fila) {
            //Ver si hay recarga proyectada
            const recargaProyectada = tabla?.find(f => f.recarga?.fechaAcreditacion === fecha)
            if (recargaProyectada) {
                saldoProyeccion += recargaProyectada.recarga?.monto || 0
            }

            saldoProyeccion += fila.saldoFin
            return saldoProyeccion
        }
        return parametros.saldoInicial
    }

    const crearFilasIniciales = () => {
        const nuevasFilas: FilaTabla[] = [];
        let saldoActual = parametros.saldoInicial;

        for (let i = 0; i < parametros.filas; i++) {
            const fecha = dayjs(parametros.fechaInicio).add(i, 'day').toDate();
            const esLaborable = esDiaLaborable(fecha);
            const esHabil = esDiaHabil(fecha);

            // Calcular consumo basado en si es laborable
            let consumo = esLaborable ?
                Math.min(parametros.presupuestoDiario, saldoActual) : 0;

            const consumoEspecial = parametros.consumosEspeciales.find(f => dayjs(f.fecha).isSame(fecha, 'day'))
            if (consumoEspecial) {
                consumo = consumoEspecial.monto
            }

            const recargaEspecial = parametros.recargasEspeciales.find(f => dayjs(f.fechaSolicitud).isSame(fecha, 'day'))

            const recargaImpactante = parametros.recargasEspeciales.find(f => f.fechaAcreditacion && dayjs(f.fechaAcreditacion).isSame(fecha, 'day'))
            //  
            // Crear fila
            const fila: FilaTabla = {
                fecha,
                esLaborable,
                esHabil,
                saldoInicio: saldoActual,
                consumo,
                recarga: recargaEspecial ?? null,
                saldoFin: saldoActual - consumo + (recargaImpactante?.monto || 0),
                consumoEspecial: !!consumoEspecial,
                fechaProyeccion: getFechaProyeccion(fecha),
                saldoProyeccion: 0,
            };

            nuevasFilas.push(fila);
            saldoActual = fila.saldoFin;
        }

        return nuevasFilas;
    };

    const calcularRecargasAutomaticas = (filas: FilaTabla[]): FilaTabla[] => {

        if (!parametros.recargasAutomaticas) return filas;

        let filasCopia = [...filas];
        const montoRecarga = parametros.montoRecarga;
        const saldoMinimo = parametros.saldoMinimo;

        for (let i = 0; i < filasCopia.length; i++) {
            const filaActual = filasCopia[i];

            // Solo evaluar días hábiles para el banco
            if (!filaActual.esHabil) continue;

            // Si ya tiene una recarga, saltar
            if (filaActual.recarga) continue;


            //Verificar si hay recargas especiales en esta fecha
            const recargaEspecial = parametros.recargasEspeciales.find(f => dayjs(f.fechaSolicitud).isSame(filaActual.fecha, 'day'))

            //Actualizo el consumo de la fila actual
            const consumoEspecial = parametros.consumosEspeciales.find(f => dayjs(f.fecha).isSame(filaActual.fecha, 'day'))
            if (consumoEspecial) {
                filaActual.consumo = consumoEspecial.monto
            } else if (filaActual.esLaborable) {
                filaActual.consumo = Math.min(parametros.presupuestoDiario, filaActual.saldoInicio)
            }

            //Verifico si necesito una recarga
            let necesitaRecarga = false;
            if (!recargaEspecial) {
                let saldoProyectado = getSaldoProyeccion(filasCopia, filaActual.fecha);
                necesitaRecarga = saldoProyectado < saldoMinimo
            }

            if (!necesitaRecarga && !recargaEspecial) {
                //Si no necesito recarga y no hay recarga especial, salteo el dia
                continue
            }

            // Programar recarga si es necesario
            if (necesitaRecarga && !recargaEspecial) {
                let fechaAcreditacion = getFechaProyeccion(filaActual.fecha)
                filaActual.recarga = {
                    monto: montoRecarga,
                    fechaSolicitud: filaActual.fecha,
                    fechaAcreditacion: fechaAcreditacion,
                    uuid: uuid()
                };
            } else if (recargaEspecial) {
                //Si no necesito recarga, pero hay una recarga especial, se acredita la recarga especial
                filaActual.recarga = {
                    monto: recargaEspecial.monto,
                    fechaSolicitud: recargaEspecial.fechaSolicitud,
                    fechaAcreditacion: recargaEspecial.fechaAcreditacion,
                    uuid: recargaEspecial.uuid
                }
            }

            filasCopia[i].recarga = filaActual.recarga
            const index = filasCopia.findIndex(f => dayjs(f.fecha).isSame(filaActual.recarga?.fechaAcreditacion, 'day')) //Index de la recarga
            if (index !== -1) {

                filasCopia[index].saldoFin += filaActual.recarga?.monto || 0

                for (let j = i ; j < filasCopia.length; j++) {
                    //Actualizamos consumo, saldo y recarga de los dias siguientes
                    const recargaDia = Number(filasCopia.find(f => dayjs(f.recarga?.fechaAcreditacion).isSame(filasCopia[j].fecha, 'day'))?.recarga?.monto) || 0

                    filasCopia[j].saldoInicio = j===0 ? parametros.saldoInicial : filasCopia[j - 1]?.saldoFin 
                    filasCopia[j].consumo = getConsumoDia(filasCopia[j].fecha, filasCopia[j].saldoInicio)
                    filasCopia[j].saldoFin = filasCopia[j].saldoInicio - filasCopia[j].consumo + (j === index ? Number(filaActual.recarga?.monto) || 0 : recargaDia)
                }

                //Calcular proyecciones
                for (let j = i; j < filasCopia.length; j++) {
                    filasCopia[j].fechaProyeccion = getFechaProyeccion(filasCopia[j].fecha)
                    filasCopia[j].saldoProyeccion = getSaldoProyeccion(filasCopia, filasCopia[j].fecha)
                }
            }

        }

        return filasCopia;
    };

    const getConsumoDia = (fecha: Date, saldoInicio: number) => {
        const esLaborable = esDiaLaborable(fecha)
        const consumoEspecial = parametros.consumosEspeciales.find(f => dayjs(f.fecha).isSame(fecha, 'day'))

        if (consumoEspecial) {
            return consumoEspecial.monto
        } else if (esLaborable) {
            return Math.min(parametros.presupuestoDiario, saldoInicio)
        }
        return 0

    }

    const calcularSaldoProyecciones = (filas: FilaTabla[]): FilaTabla[] => {
        return filas.map(f => {
            return { ...f, saldoProyeccion: getSaldoProyeccion(filas, f.fecha) }
        })
    }



    // Handlers para edición
    const handleEditarConsumo = (fechaStr: string) => {
        const fila = tabla.find(f => dayjs(f.fecha).format('YYYY-MM-DD') === fechaStr);
        if (fila) {
            setEditandoConsumo(fechaStr);
            setNuevoConsumo(fila.consumo.toString());
        }
    };

    const handleGuardarConsumo = (fecha: Date) => {
        if (!editandoConsumo) return;

        const nuevoValor = parseInt(nuevoConsumo);
        if (isNaN(nuevoValor) || nuevoValor < 0) {
            alert('El consumo debe ser un número válido mayor o igual a cero');
            return;
        }

        setParametros(pv => {
            const existe = pv.consumosEspeciales.find(f => dayjs(f.fecha).isSame(fecha, 'day'))
            if (existe) {
                return { ...pv, consumosEspeciales: pv.consumosEspeciales.filter(f => !dayjs(f.fecha).isSame(fecha, 'day')) }
            } else {
                return { ...pv, consumosEspeciales: [...pv.consumosEspeciales, { fecha, monto: nuevoValor }] }
            }
        })

        setEditandoConsumo(null);
        setNuevoConsumo('');
    };

    const handleEditarRecarga = (fechaStr: string) => {
        const fila = tabla.find(f => dayjs(f.fecha).format('YYYY-MM-DD') === fechaStr);
        if (fila && fila.recarga) {
            setEditandoRecarga(fechaStr);
            setNuevaRecarga({
                monto: fila.recarga.monto.toString(),
                fechaAcreditacion: dayjs(fila.recarga.fechaAcreditacion).toDate(),
                uuid: fila.recarga.uuid,
                fechaSolicitud: dayjs(fila.recarga.fechaSolicitud).toDate()
            });
        }
    };

    const handleGuardarRecarga = () => {
        if (!editandoRecarga) return;

        const nuevoMonto = parseInt(nuevaRecarga.monto);
        if (isNaN(nuevoMonto) || nuevoMonto < 0) {
            alert('El monto debe ser un número válido mayor o igual a cero');
            return;
        }

        if (!dayjs(nuevaRecarga.fechaAcreditacion).isValid()) {
            alert('La fecha de acreditación no es válida');
            return;
        }

        // Verificar si la fecha es hábil
        const fechaAcreditacion = dayjs(nuevaRecarga.fechaAcreditacion).toDate();
        if (!esDiaHabil(fechaAcreditacion)) {
            const confirmar = window.confirm(
                'La fecha seleccionada no es un día hábil. ¿Desea continuar de todos modos?'
            );
            if (!confirmar) return;
        }

        setParametros(pv => {
            const existe = pv.recargasEspeciales.find(f => f.uuid === nuevaRecarga.uuid)
            if (existe) {
                //Editar la recarga especial
                return { ...pv, recargasEspeciales: pv.recargasEspeciales.map(f => f.uuid === nuevaRecarga.uuid ? { ...f, monto: nuevoMonto, fechaAcreditacion: dayjs(nuevaRecarga.fechaAcreditacion).toDate(), fechaSolicitud: dayjs(nuevaRecarga.fechaSolicitud).toDate() } : f) }
            } else {
                //Agregar la recarga especial
                return { ...pv, recargasEspeciales: [...pv.recargasEspeciales, { fechaAcreditacion: dayjs(nuevaRecarga.fechaAcreditacion).toDate(), monto: nuevoMonto, fechaSolicitud: dayjs(nuevaRecarga.fechaSolicitud).toDate(), uuid: nuevaRecarga.uuid }] }
            }
        })
        setEditandoRecarga(null);
        setNuevaRecarga({ monto: '', fechaAcreditacion: new Date(), uuid: '', fechaSolicitud: new Date() });
    };

    const handleCancelarEdicion = () => {
        setEditandoConsumo(null);
        setNuevoConsumo('');
        setEditandoRecarga(null);
        setNuevaRecarga({ monto: '', fechaAcreditacion: new Date(), uuid: '', fechaSolicitud: new Date() });
    };

    const handleParametroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setParametros({
            ...parametros,
            [name]: type === 'number' ? parseInt(value) : value
        });
    };

    const handleMonedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const valor = desformatearMonedaInput(value)
        setParametros({
            ...parametros,
            [name]: valor
        });
    }

    const handleEliminarRecargaEspecial = (uuid: string) => {
        setParametros(pv => {
            return { ...pv, recargasEspeciales: pv.recargasEspeciales.filter(f => f.uuid !== uuid) }
        })
        setEditandoRecarga(null);
    }

    const handleAgregarRecargaEspecial = (fecha: Date) => {
        setEditandoRecarga(dayjs(fecha).format('YYYY-MM-DD'))
        setNuevaRecarga({ monto: '', fechaAcreditacion: new Date(), uuid: uuid(), fechaSolicitud: fecha })
    }

    const handleEditarLaborable = (fecha: Date) => {
        setParametros(pv => {
            const esFinDeSemana = dayjs(fecha).day() === 0 || dayjs(fecha).day() === 6
            if (!esFinDeSemana) {
                const existe = pv.noLaborables.find(f => dayjs(f).isSame(fecha, 'day'))
                if (existe) {
                    return { ...pv, noLaborables: pv.noLaborables.filter(f => !dayjs(f).isSame(fecha, 'day')) }
                } else {
                    return { ...pv, noLaborables: [...pv.noLaborables, fecha] }
                }
            } else {
                const existe = pv.laborablesEspeciales.find(f => dayjs(f).isSame(fecha, 'day'))
                if (existe) {
                    return { ...pv, laborablesEspeciales: pv.laborablesEspeciales.filter(f => !dayjs(f).isSame(fecha, 'day')) }
                } else {
                    return { ...pv, laborablesEspeciales: [...pv.laborablesEspeciales, fecha] }
                }
            }
        })
    };

    const handleEditarHabil = (fecha: Date) => {
        setParametros(pv => {
            const existe = pv.feriados.find(f => dayjs(f).isSame(fecha, 'day'))
            if (existe) {
                return { ...pv, feriados: pv.feriados.filter(f => !dayjs(f).isSame(fecha, 'day')) }
            } else {
                return { ...pv, feriados: [...pv.feriados, fecha] }
            }
        })
    }

    const handleEliminarConsumoEspecial = (fecha: Date) => {
        setParametros(pv => {
            return { ...pv, consumosEspeciales: pv.consumosEspeciales.filter(f => !dayjs(f.fecha).isSame(fecha, 'day')) }
        })
    }

    const handleRestaurarValores = () => {
        const confirmar = window.confirm('¿Estás seguro de querer restaurar los valores a los originales?')
        if (confirmar) {
            setParametros(VALORES_DEFAULT)
        }
    }

    // Inicializar y actualizar tabla
    useEffect(() => {
        // Crear tabla inicial basada en el estado
        const inicializarTabla = () => {
            // Validar que los parámetros tienen valores correctos
            if (!parametros.fechaInicio || isNaN(parametros.fechaInicio.getTime())) {
                setParametros(prev => ({ ...prev, fechaInicio: new Date() }));
                return;
            }

            //Se crean las filas iniciales con los parametros.
            //Se calculan los consumos de cada dia y el saldo final.
            let nuevaTabla = crearFilasIniciales();

            //Se calculan las proyecciones de saldo adelantandose a los días que tardan en acreditarse las recargas.
            nuevaTabla = calcularSaldoProyecciones(nuevaTabla);

            if (parametros.recargasAutomaticas) {
                //Se calculan las recargas automáticas.
                nuevaTabla = calcularRecargasAutomaticas(nuevaTabla);
            }

            setTabla(nuevaTabla);
        };

        inicializarTabla();
    }, [parametros]); // Solo recalcular cuando cambien los parámetros


    // Formatear valores
    const formatearMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    };


    return (
        <div className="container mx-auto p-4">
            {/* Panel de configuración */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold mb-3">Configuración</h3>
                    <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600" onClick={() => handleRestaurarValores()}>Restaurar valores</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1">Fecha de inicio:</label>
                        <input
                            type="date"
                            name="fechaInicio"
                            value={dayjs(parametros.fechaInicio).format('YYYY-MM-DD')}
                            onChange={e => setParametros({
                                ...parametros,
                                fechaInicio: dayjs(e.target.value).toDate()
                            })}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Presupuesto diario:</label>
                        <input
                            type="text"
                            name="presupuestoDiario"
                            value={formatearMonedaInput(parametros.presupuestoDiario)}
                            onChange={handleMonedaChange}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Saldo inicial:</label>
                        <input
                            type="text"
                            name="saldoInicial"
                            value={formatearMonedaInput(parametros.saldoInicial)}
                            onChange={handleMonedaChange}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Monto de recarga:</label>
                        <input
                            type="text"
                            name="montoRecarga"
                            value={formatearMonedaInput(parametros.montoRecarga)}
                            onChange={handleMonedaChange}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Plazo de acreditación (días hábiles):</label>
                        <input
                            type="number"
                            name="plazoAcreditacion"
                            value={parametros.plazoAcreditacion}
                            onChange={handleParametroChange}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Saldo mínimo:</label>
                        <input
                            type="text"
                            name="saldoMinimo"
                            value={formatearMonedaInput(parametros.saldoMinimo)}
                            onChange={handleMonedaChange}
                            className="w-full p-2 bg-gray-700 rounded"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={parametros.recargasAutomaticas}
                            onChange={e => setParametros({
                                ...parametros,
                                recargasAutomaticas: e.target.checked
                            })}
                            className="rounded"
                        />
                        <span>Recargas automáticas</span>
                    </label>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
                <table className="min-w-full bg-gray-800 rounded-lg">
                    <thead className="sticky top-0 bg-gray-800 z-20">
                        <tr className="bg-gray-700">
                            <th className="p-3 text-center">Hábil</th>
                            <th className="p-3 text-left">Fecha</th>
                            <th className="p-3 text-center">Laborable</th>
                            <th className="p-3 text-right">Saldo Inicial</th>
                            <th className="p-3 text-right">Consumo</th>
                            <th className="p-3 text-center">Recarga</th>
                            <th className="p-3 text-right">Saldo Final</th>

                            <th className="p-3 text-right text-xs brightness-75 bg-gray-700">Fecha Proyección</th>
                            <th className="p-3 text-right text-xs brightness-75 bg-gray-700">Saldo Proyección</th>
                            <th className="p-3 text-xs text-center brightness-75 bg-gray-700">Recarga Proyectada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((fila, index) => {
                            const fechaStr = dayjs(fila.fecha).format('YYYY-MM-DD');
                            const esHoy = dayjs(fila.fecha).isSame(dayjs(), 'day');
                            const esFinDeSemana = [0, 6].includes(fila.fecha.getDay());
                            const recargaImpactante = tabla.find(f => f.recarga?.fechaAcreditacion && dayjs(f.recarga.fechaAcreditacion).isSame(fila.fecha, 'day'))
                            const recargaEspecial = parametros.recargasEspeciales.some(f => dayjs(f.fechaSolicitud).isSame(fila.fecha, 'day'))
                            const esFeriado = parametros.feriados.some(f => dayjs(f).isSame(fila.fecha, 'day'))

                            return (
                                <tr key={index} className={`
                  ${esHoy ? 'bg-blue-900/30' : ''} 
                  ${esFinDeSemana ? 'bg-gray-800/70' : ''}
                  ${hoverRecarga === recargaImpactante?.recarga?.uuid ? 'bg-cyan-600/20' : ''}
                  ${fila.saldoInicio <= 0 ? 'text-red-500' : fila.saldoInicio < parametros.saldoMinimo ? 'text-yellow-500' : ''}

                  border-b border-gray-700
                `}>
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={fila.esHabil}
                                            onChange={() => handleEditarHabil(fila.fecha)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="p-3">
                                        {dayjs(fila.fecha).format('ddd DD/MM/YY')}
                                        {esHoy && <span className="ml-2 text-blue-300">(Hoy)</span>}
                                        {esFeriado && <span className="ml-2 text-red-500">(Feriado)</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={fila.esLaborable}
                                            onChange={() => handleEditarLaborable(fila.fecha)}
                                            className="rounded"
                                        />
                                    </td>

                                    <td className="p-3 text-right">
                                        {formatearMoneda(fila.saldoInicio)}
                                    </td>
                                    <td className="p-3 text-right">
                                        {editandoConsumo === fechaStr ? (
                                            <div className="flex items-center justify-end space-x-2">
                                                <input
                                                    type="text"
                                                    value={formatearMonedaInput(nuevoConsumo)}
                                                    onChange={e => setNuevoConsumo(desformatearMonedaInput(e.target.value))}
                                                    className="w-24 p-1 bg-gray-700 rounded text-right"
                                                />
                                                <button
                                                    onClick={() => handleGuardarConsumo(fila.fecha)}
                                                    className="rounded-full hover:bg-green-600/50 relative p-1"
                                                >
                                                    <CheckIcon className='w-4 h-4' />
                                                </button>
                                                <button
                                                    onClick={handleCancelarEdicion}
                                                    className="rounded-full hover:bg-red-600/50 relative p-1"
                                                >
                                                    <XMarkIcon className='w-4 h-4' />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className={`cursor-pointer hover:bg-gray-700 p-1 rounded text-right ${fila.consumoEspecial ? 'bg-blue-600/50 text-blue-300 flex gap-2 items-center justify-end' : ''}`}
                                                onClick={() => fila.consumoEspecial ? () => { } : handleEditarConsumo(fechaStr)}
                                            >
                                                {formatearMoneda(fila.consumo)}
                                                {fila.consumoEspecial && <button className='rounded-full hover:bg-blue-600/50 relative p-1' onClick={() => handleEliminarConsumoEspecial(fila.fecha)}>
                                                    <XMarkIcon className='w-4 h-4' />
                                                </button>}
                                            </div>
                                        )}
                                    </td>
                                    <td className={`p-3 text-right ${hoverRecarga === recargaImpactante?.recarga?.uuid ? ' text-green-700' : ''}`}>
                                        {recargaImpactante?.recarga?.monto ? formatearMoneda(recargaImpactante?.recarga?.monto || 0) : ''}
                                    </td>
                                    <td className="p-3 text-right">
                                        {formatearMoneda(fila.saldoFin)}
                                    </td>


                                    <td className="p-3 text-right text-xs brightness-75 ">
                                        {dayjs(fila.fechaProyeccion).format('ddd DD/MM')}
                                    </td>
                                    <td className="p-3 text-right text-xs brightness-75">
                                        {formatearMoneda(fila.saldoProyeccion)}
                                    </td>

                                    <td className="p-3 text-center text-xs flex justify-center items-center">
                                        {editandoRecarga !== fechaStr &&
                                            (fila.recarga ?
                                                <div
                                                    className={`
                            ${dayjs(fila.recarga.fechaSolicitud).isSame(fila.fecha, 'day') ? 'bg-yellow-800/50 text-yellow-300 ' : ''}
                            cursor-pointer hover:brightness-125 p-2 rounded
                          `}
                                                    onClick={() => handleEditarRecarga(fechaStr)}
                                                    onMouseEnter={() => setHoverRecarga(fila.recarga?.uuid || null)}
                                                    onMouseLeave={() => setHoverRecarga(null)}
                                                >
                                                    {formatearMoneda(fila.recarga.monto)}
                                                    {dayjs(fila.recarga.fechaSolicitud).isSame(fila.fecha, 'day') && <span className="ml-1">(Solicitud)</span>}
                                                </div>

                                                :
                                                <button
                                                    onClick={() => handleAgregarRecargaEspecial(fila.fecha)}
                                                    className="p-1 text-green-600 rounded-full cursor-pointer hover:bg-green-600/50"
                                                >
                                                    <PlusIcon className='w-4 h-4' />
                                                </button>)
                                        }

                                        {editandoRecarga === fechaStr ? (
                                            <div className="space-y-2 w-max">
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-xs w-16 text-right">Monto:</label>
                                                    <input
                                                        type="text"
                                                        value={formatearMonedaInput(nuevaRecarga.monto)}
                                                        onChange={e => setNuevaRecarga({
                                                            ...nuevaRecarga,
                                                            monto: desformatearMonedaInput(e.target.value)
                                                        })}
                                                        className="w-32 p-1 bg-gray-700 rounded text-right"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-xs w-16 text-right">Acreditación:</label>
                                                    <input
                                                        type="date"
                                                        value={dayjs(nuevaRecarga.fechaAcreditacion).format('YYYY-MM-DD')}
                                                        onChange={e => setNuevaRecarga({
                                                            ...nuevaRecarga,
                                                            fechaAcreditacion: dayjs(e.target.value).toDate()
                                                        })}
                                                        className="w-32 p-1 bg-gray-700 rounded"
                                                    />
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={handleGuardarRecarga}
                                                        className="p-1 bg-green-600 rounded"
                                                    >
                                                        <CheckIcon className='w-4 h-4' />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelarEdicion}
                                                        className="p-1 bg-orange-600 rounded"
                                                    >
                                                        <XMarkIcon className='w-4 h-4' />
                                                    </button>

                                                    {recargaEspecial && <button
                                                        onClick={() => handleEliminarRecargaEspecial(fila.recarga?.uuid || '')}
                                                        className="p-1 bg-red-600 rounded"
                                                    >
                                                        <TrashIcon className='w-4 h-4' />
                                                    </button>}


                                                </div>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TablaDinamica; 