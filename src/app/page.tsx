import TablaDinamica from "./components/Tabla-Dinamica";
import PoweredByAlte from "./components/PoweredByAlte";
import Instrucciones from "./components/Instrucciones";
export default function Home() {
  return (
    <div  className="flex flex-col gap-2 p-10 bg-gray-900">
      <h1 className="text-4xl font-bold bg-gradient-to-r w-max from-blue-500 to-purple-500 bg-clip-text text-transparent">Calculadora Pay Media</h1>
      <Instrucciones />
      <TablaDinamica />
      <PoweredByAlte />
    </div>
  );
}
