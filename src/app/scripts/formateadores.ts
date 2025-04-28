export const formatearFecha=(fecha:Date):string=>{
    return fecha.toLocaleDateString("es-AR", { weekday: 'long' });
}

export const formatearFechaSimple=(fecha:Date):string=>{
    return fecha.toLocaleDateString("es-AR", { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const formatearBooleano=(valor:boolean):string=>{
    return valor ? "SI" : "NO";
}   

export const formatearNumero=(numero:number):string=>{
    return numero.toFixed(2);
}   

export const formatearMoneda=(numero:number):string=>{
    return numero?.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}   

export const formatearPorcentaje=(numero:number):string=>{
    return numero.toFixed(2) + "%";
}   


// Formatea el número como ARS
export const formatearMonedaInput=(valor: string | number) => {
    if (valor === '' || isNaN(Number(valor))) return '';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(valor));
  }
  
  // Quita los caracteres no numéricos para obtener el valor puro
  export const desformatearMonedaInput=(valor: string) => {
    // Elimina todo lo que no sea dígito
    return valor.replace(/[^\d]/g, '');
  }