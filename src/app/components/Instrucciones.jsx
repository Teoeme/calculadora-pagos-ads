import React from 'react'

const Instrucciones = () => {
  return (
    <div className=' bg-gray-800 p-4 rounded-lg '>
        <h2 className='text-white text-lg font-bold'>Instrucciones</h2>
        <p className='text-white text-sm'>
            Esta calculadora le permite calcular los pagos recurrentes de forma automática y ajustarlos a las necesidades de su cuenta de pay media.
        </p>

        <p className='text-white mt-4 font-semibold  '>
            Cómo funciona:
        </p>
        <ul className='list-disc list-inside text-white text-sm'>
            <li>
                La calculadora se basa en los parámetros de configuración para estimar el consumo de cada día y proyectar los saldos a futuro de la cuenta.
                Si la opción de "Recargas automáticas" está activada, la calculadora propone las recargas necesarias para mantener el saldo mínimo configurado.
            </li>
            <li>
                Las proyecciones se hacen teniendo en cuenta el plazo de acreditación, es decir se estima el saldo al inicio del día pasando el plazo de acreditación y se propone una recarga si es necesario.
            </li>

        </ul>

        <p className='text-white mt-4 font-semibold pb-1 '>
            Configuración de parámetros:
        </p>
        <ul className='list-disc list-inside text-gray-200 text-sm '>
            <li>
                <span className='font-semibold text-white'>Presupuesto diario:</span> Es el presupuesto que se tiene para cada dia. De manera automática el consumo será igual al presupuesto diario cuando el saldo al inicio del día lo permita.
                Los consumos de cada día, sin embargo, pueden ser modificados clickeando en el mismo.
            </li>
            <li>
                <span className='font-semibold text-white'>Saldo inicial:</span> Es el saldo con el que se inicia el cálculo.
            </li>
            <li>
                <span className='font-semibold text-white'>Monto de recarga:</span> Es el monto por defecto con el que se calculan las recargas de saldo en caso de que la opción de "Recargas automáticas" esté activada. Cada recarga se calculará con este monto, aunque pueden ser modificados clickeando en la misma, pudiendo ser modificado el monto y la fecha de acreditación.
            </li>
            <li>
                <span className='font-semibold text-white'>Plazo de acreditación:</span> Es el plazo de acreditación de las recargas en cantidad de días habiles (Es decir, no incluye fines de semana ni días feriados). Si la opción de "Recargas automáticas" está activada, las recargas se calcularán con este plazo. 
            </li>
        </ul>

        <p className='text-white mt-4 font-semibold '>Consideraciones</p>
        <ul className='list-disc list-inside text-white text-sm'>
            <li>
                Para el calculo de recargas se supone que la misma se realiza el día que se solicita, contando un día hábil al final de cada día posterior, lo que implica que transcurrido el plazo de acreditación, el saldo se habrá acreditado para el final del día.
            </li>
            <li>
                La calculadora no tiene en cuenta los gastos de la cuenta como inmpuestos, gastos operativos, etc. Posiblemente el consumo bruto diario deba ser ajustado para reflejar el consumo neto.
            </li>

        </ul>
        <p className='text-white text-sm mt-4 font-semibold '>
            Nota:
        </p>
        <p className='text-white text-sm'>
            La calculadora es una herramienta de estimación y no garantiza resultados exactos. Los resultados son una aproximación y pueden variar según las circunstancias reales.
        </p>
        <p className='text-red-400 text-sm font-semibold'>
            El uso de esta calculadora es de responsabilidad exclusiva del usuario, bajo ninguna circustancia el proveedor se hará responsable de los resultados obtenidos y las consecuencias que puedan derivarse de su uso.
        </p>
    </div>
  )
}

export default Instrucciones