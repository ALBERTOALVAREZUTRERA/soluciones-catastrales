export interface Servicio {
  slug: string;
  /** Nombre corto, tal como lo busca el cliente. */
  nombre: string;
  title: string;
  description: string;
  intro: string;
  cuando: string[];
  incluye: string[];
  faqs: { question: string; answer: string }[];
  relacionados: string[];
}

export const SERVICIOS: readonly Servicio[] = [
  {
    slug: "levantamiento-topografico",
    nombre: "Levantamiento topográfico",
    title: "Levantamiento topográfico en Jaén y Andalucía",
    description:
      "Levantamiento topográfico de fincas rústicas, solares y construcciones con GNSS y estación total. Planos georreferenciados, superficies y curvas de nivel para proyectos, escrituras y Catastro.",
    intro:
      "Un levantamiento topográfico es la medición precisa de un terreno y de lo que hay sobre él. El resultado es un plano fiel de la realidad, con coordenadas oficiales, que sirve de base para cualquier actuación posterior: una escritura, un proyecto, una licencia o una reclamación.",
    cuando: [
      "Antes de comprar, vender o heredar una finca cuya superficie no está clara.",
      "Para redactar un proyecto de obra, una nave o una vivienda.",
      "Cuando Catastro o el Registro no coinciden con la realidad.",
      "Para conocer desniveles, movimientos de tierra o cubicaciones.",
    ],
    incluye: [
      "Toma de datos en campo con GNSS de precisión y estación total.",
      "Plano planimétrico y, si se necesita, altimétrico con curvas de nivel.",
      "Coordenadas UTM ETRS89 y cálculo de superficies.",
      "Entrega en PDF firmado y en DXF.",
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta un levantamiento topográfico?",
        answer:
          "Depende de la superficie, del relieve, de la vegetación y del uso que se le vaya a dar. Con la referencia catastral podemos darle presupuesto cerrado antes de desplazarnos.",
      },
      {
        question: "¿Qué diferencia hay entre levantamiento planimétrico y altimétrico?",
        answer:
          "El planimétrico representa linderos y elementos en planta. El altimétrico añade las cotas y las curvas de nivel, necesarias para proyectos de obra y movimientos de tierra.",
      },
    ],
    relacionados: ["medicion-de-fincas", "plano-georreferenciado", "replanteo-topografico"],
  },
  {
    slug: "medicion-de-fincas",
    nombre: "Medición de fincas",
    title: "Medición de fincas rústicas y urbanas",
    description:
      "Medimos su finca sobre el terreno y le entregamos la superficie real y el plano con coordenadas. Para compraventas, herencias, arrendamientos y comprobación de Catastro y escrituras.",
    intro:
      "Medir una finca es comprobar, sobre el terreno, cuánto mide realmente y por dónde van sus linderos. Es habitual que la superficie de la escritura, la del Catastro y la real sean tres cifras distintas; la medición es la única forma de saber cuál es la correcta.",
    cuando: [
      "Va a comprar o vender y quiere saber qué superficie se transmite.",
      "La escritura expresa la cabida en fanegas, cuerdas u otras medidas antiguas.",
      "Sospecha que Catastro le atribuye más o menos terreno del real.",
      "Hay que repartir una finca entre herederos.",
    ],
    incluye: [
      "Visita a la finca e identificación de los linderos.",
      "Medición con equipo GNSS de precisión centimétrica.",
      "Plano de la finca con superficie y coordenadas.",
      "Comparación con la superficie catastral y la del título.",
    ],
    faqs: [
      {
        question: "¿Sirve medir la finca con una aplicación del móvil o con el visor de Catastro?",
        answer:
          "Sirve como aproximación. No tiene validez ante notaría, Registro o Catastro, que exigen una medición realizada y firmada por técnico competente.",
      },
      {
        question: "¿Tiene que estar presente el vecino?",
        answer:
          "No es obligatorio, pero ayuda cuando el lindero no está materializado. Si luego se tramita una rectificación, los colindantes serán notificados por el Registro o la notaría.",
      },
    ],
    relacionados: ["certificado-de-superficie", "levantamiento-topografico", "deslinde-y-amojonamiento"],
  },
  {
    slug: "certificado-de-superficie",
    nombre: "Certificado de superficie",
    title: "Certificado de superficie de parcela o construcción",
    description:
      "Certificado técnico de la superficie real de una parcela, vivienda, nave o local, firmado por técnico. Para escrituras, herencias, arrendamientos, Catastro y entidades bancarias.",
    intro:
      "El certificado de superficie es el documento en el que un técnico acredita, tras medirlo, cuánto mide un terreno o una construcción. Se adjunta a escrituras y expedientes cuando la superficie que consta en los documentos no es fiable o no existe.",
    cuando: [
      "El notario pide acreditar la superficie real para una escritura.",
      "Se va a declarar una obra nueva o una ampliación.",
      "Hay discrepancia entre la superficie construida real y la catastral.",
      "Un contrato de arrendamiento o una tasación necesitan la superficie exacta.",
    ],
    incluye: [
      "Medición de la parcela o de la construcción, planta por planta.",
      "Plano acotado con las superficies útil y construida, según el caso.",
      "Certificado firmado con identificación catastral y registral del inmueble.",
      "Coordenadas georreferenciadas cuando el destino es Catastro o el Registro.",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre superficie útil y construida?",
        answer:
          "La construida incluye muros y elementos de la edificación; la útil es la que se puede pisar. Catastro y el Registro trabajan normalmente con la superficie construida.",
      },
      {
        question: "¿El certificado cambia por sí solo los metros de Catastro?",
        answer:
          "No. Es la prueba técnica que acompaña a la solicitud. La modificación la acuerda Catastro o la inscribe el Registro tras el procedimiento que corresponda.",
      },
    ],
    relacionados: ["medicion-de-fincas", "subsanacion-discrepancias-catastrales", "plano-georreferenciado"],
  },
  {
    slug: "plano-georreferenciado",
    nombre: "Plano georreferenciado",
    title: "Plano georreferenciado de finca o construcción",
    description:
      "Plano georreferenciado con coordenadas UTM ETRS89, firmado por técnico, para notaría, Registro de la Propiedad, ayuntamiento y Catastro. Entrega en PDF, DXF y GML.",
    intro:
      "Un plano georreferenciado sitúa la finca sobre el territorio mediante las coordenadas de cada uno de sus vértices. A diferencia de un croquis, permite ubicarla de forma inequívoca y compararla con la cartografía catastral, las fincas vecinas y el dominio público.",
    cuando: [
      "El notario o el registrador piden la representación gráfica de la finca.",
      "El ayuntamiento exige plano de situación y emplazamiento para una licencia.",
      "Se va a segregar, agrupar o dividir una finca.",
      "Hay que corregir superficie o linderos en Catastro o en el Registro.",
    ],
    incluye: [
      "Medición en campo enlazada con la red geodésica oficial.",
      "Plano a escala con listado de coordenadas de los vértices.",
      "Superposición con la cartografía catastral y la ortofotografía.",
      "Archivo GML cuando el plano se destina a una escritura.",
    ],
    faqs: [
      {
        question: "¿Qué sistema de coordenadas lleva el plano?",
        answer:
          "El oficial en la Península: ETRS89 en proyección UTM. La provincia de Jaén se encuentra en el huso 30.",
      },
      {
        question: "¿Es lo mismo un plano georreferenciado que un GML?",
        answer:
          "No. El plano es el documento gráfico y el GML es el archivo informático con esas mismas coordenadas en el formato que exige Catastro.",
      },
    ],
    relacionados: ["gml-parcela-catastral", "representacion-grafica-alternativa", "levantamiento-topografico"],
  },
  {
    slug: "representacion-grafica-alternativa",
    nombre: "Representación gráfica alternativa",
    title: "Representación gráfica alternativa a la catastral (RGA)",
    description:
      "Elaboramos la representación gráfica alternativa georreferenciada cuando Catastro no refleja la realidad de la finca: medición, GML, informe de validación e informe técnico para notaría y Registro.",
    intro:
      "La representación gráfica alternativa es la delimitación georreferenciada de una finca que se aporta al Registro de la Propiedad cuando la cartografía catastral no coincide con la realidad. La Ley 13/2015 la prevé para poder inscribir la finca con su geometría correcta.",
    cuando: [
      "La parcela catastral no coincide con los linderos reales de la finca.",
      "Segregaciones, agrupaciones, divisiones y agregaciones.",
      "Rectificaciones de superficie e inmatriculaciones.",
      "El registrador rechaza la certificación catastral por no corresponder con la finca.",
    ],
    incluye: [
      "Levantamiento topográfico de los linderos reales.",
      "Archivo GML de parcela en sistema ETRS89.",
      "Informe de Validación Gráfica Alternativa de la Sede del Catastro.",
      "Informe técnico que justifica la delimitación.",
    ],
    faqs: [
      {
        question: "¿Cuándo es obligatoria la representación gráfica alternativa?",
        answer:
          "Cuando la operación exige aportar la representación gráfica de la finca y la certificación catastral no refleja su realidad física.",
      },
      {
        question: "¿Qué ocurre si el informe de validación es negativo?",
        answer:
          "Indica que la delimitación afecta a parcelas colindantes o a dominio público. Hay que revisar la medición o tramitar la corrección catastral que proceda.",
      },
    ],
    relacionados: ["gml-parcela-catastral", "plano-georreferenciado", "segregacion-de-fincas"],
  },
  {
    slug: "gml-parcela-catastral",
    nombre: "GML de parcela catastral",
    title: "Archivo GML de parcela catastral con informe de validación",
    description:
      "Generamos el archivo GML de parcela catastral a partir de una medición real y obtenemos el Informe de Validación Gráfica Alternativa (IVGA) que exigen notarías y registros.",
    intro:
      "El GML de parcela catastral es el archivo que contiene las coordenadas del perímetro de una finca en el formato oficial de Catastro. Es el soporte técnico de la representación gráfica que se incorpora a la escritura y al Registro.",
    cuando: [
      "Para inscribir una segregación, agrupación o división.",
      "En rectificaciones de cabida e inmatriculaciones.",
      "Cuando el notario solicita el informe de validación gráfica.",
      "Para coordinar la finca con Catastro.",
    ],
    incluye: [
      "Medición de la finca o comprobación de las coordenadas existentes.",
      "Archivo GML conforme al formato de la Sede Electrónica del Catastro.",
      "Informe de Validación Gráfica Alternativa con su código de verificación.",
      "Plano de la finca y listado de coordenadas.",
    ],
    faqs: [
      {
        question: "¿Puedo hacer yo el GML con una herramienta gratuita?",
        answer:
          "Puede prepararlo con nuestro conversor si dispone de coordenadas fiables. Para una escritura, la representación debe proceder de una medición real y estar suscrita por técnico competente.",
      },
      {
        question: "¿Cuánto tarda el informe de validación?",
        answer:
          "La Sede del Catastro lo emite en el momento. El plazo real lo marca la medición previa de la finca.",
      },
    ],
    relacionados: ["representacion-grafica-alternativa", "informe-catastral-ubicacion-construcciones", "plano-georreferenciado"],
  },
  {
    slug: "informe-catastral-ubicacion-construcciones",
    nombre: "ICUC y GML de edificio",
    title: "Informe Catastral de Ubicación de las Construcciones (ICUC) y GML de edificio",
    description:
      "Obtenemos el Informe Catastral de Ubicación de las Construcciones y el GML de edificio con las coordenadas de la edificación, necesarios para inscribir una obra nueva.",
    intro:
      "El Informe Catastral de Ubicación de las Construcciones acredita, mediante coordenadas, la posición de una edificación dentro de su parcela. La Ley Hipotecaria exige identificar la porción de suelo ocupada por la construcción para inscribir una obra nueva.",
    cuando: [
      "Declaración de obra nueva terminada o en construcción.",
      "Obra nueva por antigüedad de edificaciones sin escriturar.",
      "Ampliaciones, piscinas, garajes o naves añadidas.",
      "Divisiones horizontales que requieren ubicar el edificio.",
    ],
    incluye: [
      "Medición de la huella de cada construcción.",
      "Archivo GML de edificio.",
      "Informe Catastral de Ubicación de las Construcciones de la Sede del Catastro.",
      "Comprobación de que la edificación queda dentro de la finca.",
    ],
    faqs: [
      {
        question: "¿Es obligatorio para escriturar una obra nueva?",
        answer:
          "Sí es obligatorio aportar las coordenadas de la superficie ocupada por la edificación. El ICUC es la forma habitual de acreditarlas.",
      },
      {
        question: "¿Qué pasa si la construcción invade la parcela vecina?",
        answer:
          "El informe lo pondrá de manifiesto y la inscripción puede quedar suspendida. Habrá que estudiar si el error está en Catastro, en la medición o en la propia obra.",
      },
    ],
    relacionados: ["gml-parcela-catastral", "certificado-de-superficie", "declaracion-catastral"],
  },
  {
    slug: "subsanacion-discrepancias-catastrales",
    nombre: "Subsanación de discrepancias catastrales",
    title: "Subsanación de discrepancias catastrales",
    description:
      "Corregimos los errores de Catastro en superficie, linderos, uso, antigüedad o construcciones. Preparamos el expediente técnico y lo tramitamos ante la Gerencia del Catastro.",
    intro:
      "La subsanación de discrepancias es el procedimiento para que Catastro corrija la descripción de un inmueble cuando no coincide con la realidad. Un dato erróneo afecta al valor catastral y, con él, al IBI y a otros impuestos.",
    cuando: [
      "La superficie de suelo o construida es mayor o menor que la real.",
      "Una nave o almacén figura como vivienda, o al revés.",
      "Constan construcciones demolidas o faltan las existentes.",
      "La parcela está mal dibujada o invade la del vecino.",
    ],
    incluye: [
      "Análisis de la descripción catastral y de la valoración.",
      "Medición y reportaje fotográfico de la realidad.",
      "Informe técnico y documentación gráfica.",
      "Presentación y seguimiento del expediente.",
    ],
    faqs: [
      {
        question: "¿Cuánto tarda Catastro en resolver?",
        answer:
          "Son procedimientos lentos, que con frecuencia superan los seis meses. El plazo depende de la Gerencia y de la complejidad del caso.",
      },
      {
        question: "¿Se puede recuperar el IBI pagado de más?",
        answer:
          "Corregido el valor, puede estudiarse la devolución de ingresos indebidos de los ejercicios no prescritos. Es un expediente posterior y su resultado depende de cada caso.",
      },
    ],
    relacionados: ["revision-valor-catastral-ibi", "declaracion-catastral", "certificado-de-superficie"],
  },
  {
    slug: "declaracion-catastral",
    nombre: "Declaración catastral",
    title: "Declaración catastral de obra nueva, reforma, segregación o cambio de cultivo",
    description:
      "Preparamos y presentamos la declaración catastral de nuevas construcciones, ampliaciones, demoliciones, segregaciones, agrupaciones y cambios de uso o cultivo, con la documentación técnica.",
    intro:
      "Los titulares están obligados a declarar ante Catastro las alteraciones de sus inmuebles: una construcción nueva, una ampliación, una demolición, una división o un cambio de uso. Hacerlo bien desde el principio evita valoraciones erróneas y regularizaciones posteriores.",
    cuando: [
      "Ha construido, ampliado o reformado un inmueble.",
      "Ha demolido una edificación que sigue tributando.",
      "Ha segregado, agrupado o dividido una finca.",
      "Ha cambiado el cultivo o el aprovechamiento de una parcela rústica.",
    ],
    incluye: [
      "Revisión de la situación catastral actual.",
      "Planos, superficies y fotografías de la alteración.",
      "Cumplimentación y presentación de la declaración.",
      "Comprobación del resultado y del nuevo valor catastral.",
    ],
    faqs: [
      {
        question: "¿Hay plazo para declarar?",
        answer:
          "Sí. La normativa catastral establece un plazo desde que se produce el hecho, y su incumplimiento puede dar lugar a sanción. Conviene declarar cuanto antes.",
      },
      {
        question: "¿Declarar una obra sube el IBI?",
        answer:
          "Si la construcción no constaba, el valor catastral aumentará. Una declaración bien documentada asegura que se valore con la tipología y la categoría correctas.",
      },
    ],
    relacionados: ["cambio-titularidad-catastral", "subsanacion-discrepancias-catastrales", "informe-catastral-ubicacion-construcciones"],
  },
  {
    slug: "cambio-titularidad-catastral",
    nombre: "Cambio de titularidad catastral",
    title: "Cambio de titularidad catastral",
    description:
      "Tramitamos el cambio de titular en Catastro tras una compraventa, herencia, donación o disolución de condominio, para que el recibo del IBI llegue a quien corresponde.",
    intro:
      "El cambio de titularidad actualiza quién figura como propietario en Catastro. Cuando no se ha hecho, el IBI sigue llegando al anterior titular o a un causante fallecido, y cualquier trámite posterior se complica.",
    cuando: [
      "Herencias en las que el inmueble sigue a nombre del fallecido.",
      "Compraventas en documento privado o antiguas.",
      "Donaciones, permutas y disoluciones de comunidad.",
      "Errores en el nombre, el NIF o el porcentaje de propiedad.",
    ],
    incluye: [
      "Revisión del título que acredita la propiedad.",
      "Preparación de la solicitud y de la documentación.",
      "Presentación ante Catastro.",
      "Comprobación del alta del nuevo titular.",
    ],
    faqs: [
      {
        question: "¿No lo comunica el notario?",
        answer:
          "En las escrituras recientes, notarías y registros comunican la transmisión. En documentos privados, herencias antiguas o cuando falta la referencia catastral, debe solicitarlo el interesado.",
      },
      {
        question: "¿Estar en Catastro acredita la propiedad?",
        answer:
          "No. Catastro tiene finalidad fiscal. La propiedad se acredita con el título y su inscripción en el Registro de la Propiedad.",
      },
    ],
    relacionados: ["nota-simple-registro-propiedad", "declaracion-catastral", "subsanacion-discrepancias-catastrales"],
  },
  {
    slug: "nota-simple-registro-propiedad",
    nombre: "Nota simple del Registro",
    title: "Nota simple del Registro de la Propiedad",
    description:
      "Solicitamos por usted la nota simple de su finca: titular, descripción, superficie y cargas. Se la enviamos por correo electrónico y, si lo necesita, la comparamos con Catastro.",
    intro:
      "La nota simple es el documento informativo del Registro de la Propiedad que resume la situación de una finca: quién es el titular, cómo se describe, qué superficie tiene y qué cargas pesan sobre ella. Es el punto de partida de cualquier compraventa, herencia o trámite técnico.",
    cuando: [
      "Antes de comprar un inmueble, para comprobar titular y cargas.",
      "Para iniciar una rectificación de superficie o una segregación.",
      "En herencias, para saber qué fincas constan inscritas.",
      "Cuando se desconoce el número de finca registral.",
    ],
    incluye: [
      "Solicitud al Registro de la Propiedad competente.",
      "Localización por datos registrales, titular o referencia catastral.",
      "Envío de la nota por correo electrónico.",
      "Comparación con los datos catastrales, a petición.",
    ],
    faqs: [
      {
        question: "¿Qué validez tiene una nota simple?",
        answer:
          "Tiene valor informativo y refleja la situación en la fecha de emisión. Para acreditar el contenido del Registro con fe pública existe la certificación registral.",
      },
      {
        question: "¿Qué necesito para pedirla?",
        answer:
          "Cualquier dato que identifique la finca: número registral, titular, dirección o referencia catastral.",
      },
    ],
    relacionados: ["cambio-titularidad-catastral", "medicion-de-fincas", "representacion-grafica-alternativa"],
  },
  {
    slug: "segregacion-de-fincas",
    nombre: "Segregación y división de fincas",
    title: "Segregación, división y parcelación de fincas",
    description:
      "Documentación técnica para segregar, dividir o parcelar una finca rústica o urbana: medición, plano de las fincas resultantes, licencia o innecesariedad y GML para la escritura.",
    intro:
      "Segregar es separar una porción de una finca para formar otra independiente; dividir es repartirla por completo en varias. En ambos casos hay que respetar la superficie mínima que fija la normativa y obtener el control del ayuntamiento antes de escriturar.",
    cuando: [
      "Quiere vender solo una parte del terreno.",
      "Los herederos van a repartir una finca en lotes.",
      "Necesita separar la parte edificada del resto.",
      "Un camino o una carretera dividen físicamente la propiedad.",
    ],
    incluye: [
      "Estudio de viabilidad: unidad mínima de cultivo o parcela mínima.",
      "Levantamiento topográfico y propuesta de división.",
      "Documentación para la licencia o la declaración de innecesariedad.",
      "GML de las fincas resultantes e informe de validación.",
    ],
    faqs: [
      {
        question: "¿Cuál es la superficie mínima para segregar una finca rústica?",
        answer:
          "La unidad mínima de cultivo, que en Andalucía depende del municipio y de si la finca es de secano o de regadío. Existen excepciones tasadas en la ley.",
      },
      {
        question: "¿Se necesita licencia?",
        answer:
          "Sí, licencia de segregación o declaración municipal de su innecesariedad. Sin ella, notarías y registros no autorizan ni inscriben la operación.",
      },
    ],
    relacionados: ["agrupacion-de-fincas", "gml-parcela-catastral", "representacion-grafica-alternativa"],
  },
  {
    slug: "agrupacion-de-fincas",
    nombre: "Agrupación de fincas",
    title: "Agrupación y agregación de fincas",
    description:
      "Documentación técnica para unir dos o más fincas colindantes en una sola: medición, plano de la finca resultante, GML e informe de validación para la escritura de agrupación.",
    intro:
      "Agrupar es unir varias fincas colindantes para formar una nueva. Agregar es incorporar a una finca mayor una porción o una finca menor. Son operaciones frecuentes para ordenar una explotación, alcanzar la superficie mínima edificable o simplificar la titularidad.",
    cuando: [
      "Ha comprado la finca colindante y quiere una sola escritura.",
      "Necesita alcanzar una superficie mínima para construir.",
      "Quiere simplificar una explotación formada por muchas parcelas.",
      "Una herencia ha dejado fincas contiguas con el mismo titular.",
    ],
    incluye: [
      "Comprobación de la colindancia y de la titularidad.",
      "Medición del conjunto.",
      "Plano y GML de la finca resultante.",
      "Informe de validación para notaría y Registro.",
    ],
    faqs: [
      {
        question: "¿Deben ser del mismo propietario las fincas?",
        answer:
          "Lo habitual es que sí. Si pertenecen a distintos titulares, la finca resultante queda en proindiviso en la proporción que acuerden.",
      },
      {
        question: "¿Se actualiza Catastro al agrupar?",
        answer:
          "La notaría o el Registro comunican la operación. Conviene comprobar después que Catastro ha unificado las parcelas correctamente.",
      },
    ],
    relacionados: ["segregacion-de-fincas", "gml-parcela-catastral", "nota-simple-registro-propiedad"],
  },
  {
    slug: "deslinde-y-amojonamiento",
    nombre: "Deslinde y amojonamiento",
    title: "Deslinde y amojonamiento de fincas",
    description:
      "Determinamos y señalamos sobre el terreno los linderos de su finca: estudio de títulos y cartografía, medición, plano de deslinde y colocación de mojones con acta firmada.",
    intro:
      "El deslinde fija por dónde discurre el límite entre dos fincas; el amojonamiento lo señala físicamente con hitos o mojones. Es la forma de terminar con la incertidumbre sobre una linde y prevenir conflictos antes de vallar, plantar o construir.",
    cuando: [
      "No hay señales claras del lindero o han desaparecido.",
      "Va a vallar, plantar o construir junto al límite.",
      "Existe desacuerdo con un vecino sobre la linde.",
      "Tras una compra, para conocer exactamente lo adquirido.",
    ],
    incluye: [
      "Estudio de escrituras, Catastro y ortofotografías históricas.",
      "Medición de la situación actual.",
      "Replanteo de la linde y colocación de mojones.",
      "Plano y acta de deslinde para firma de los colindantes.",
    ],
    faqs: [
      {
        question: "¿Qué ocurre si el vecino no está de acuerdo?",
        answer:
          "El deslinde amistoso requiere conformidad. Sin ella, cabe el deslinde ante notario para fincas inscritas o la vía judicial, donde el informe técnico es la prueba principal.",
      },
      {
        question: "¿El deslinde se puede inscribir?",
        answer:
          "Sí. El acuerdo puede formalizarse y llevarse al Registro de la Propiedad y a Catastro con la representación gráfica resultante.",
      },
    ],
    relacionados: ["informe-pericial-topografico", "medicion-de-fincas", "replanteo-topografico"],
  },
  {
    slug: "replanteo-topografico",
    nombre: "Replanteo topográfico",
    title: "Replanteo topográfico de linderos y obras",
    description:
      "Marcamos sobre el terreno los puntos de un plano o proyecto: linderos, cimentaciones, ejes, viales, plantaciones y naves. Replanteo con GNSS y estación total, con acta.",
    intro:
      "Replantear es trasladar al terreno lo que está dibujado en un plano. Se marcan con estacas o clavos los puntos exactos donde va una linde, una zapata, un eje o una alineación, de modo que la obra se ejecute donde debe.",
    cuando: [
      "Antes de iniciar una obra, para situar la cimentación.",
      "Para marcar los linderos de una finca segregada.",
      "En plantaciones, para trazar marcos y alineaciones.",
      "Para comprobar retranqueos a linderos y caminos.",
    ],
    incluye: [
      "Estudio del plano o proyecto a replantear.",
      "Marcado de los puntos sobre el terreno.",
      "Comprobación de distancias y alineaciones.",
      "Plano y acta de replanteo.",
    ],
    faqs: [
      {
        question: "¿Qué necesito para un replanteo?",
        answer:
          "El plano o proyecto en formato digital con coordenadas. Si no existe, se realiza antes un levantamiento topográfico.",
      },
      {
        question: "¿Qué es el acta de replanteo?",
        answer:
          "El documento que deja constancia de los puntos marcados y de su conformidad con el proyecto. En obra, marca el inicio de los trabajos.",
      },
    ],
    relacionados: ["levantamiento-topografico", "deslinde-y-amojonamiento", "proyecto-caseta-aperos-nave-agraria"],
  },
  {
    slug: "informe-pericial-topografico",
    nombre: "Informe pericial topográfico",
    title: "Informe pericial topográfico para juicios y reclamaciones",
    description:
      "Dictamen pericial sobre linderos, superficies, invasiones, servidumbres y discrepancias entre título, Catastro y realidad. Con ratificación en sede judicial.",
    intro:
      "El informe pericial topográfico es el dictamen técnico que se aporta a un procedimiento judicial o a una reclamación para acreditar hechos medibles: dónde está una linde, cuánto mide una finca, si una construcción invade terreno ajeno o por dónde discurre un camino.",
    cuando: [
      "Conflictos de linderos e invasiones de finca.",
      "Reclamaciones por defecto o exceso de cabida en una compraventa.",
      "Litigios sobre servidumbres de paso y caminos.",
      "Recursos frente a Catastro o frente a una expropiación.",
    ],
    incluye: [
      "Estudio de la documentación del procedimiento.",
      "Medición y análisis de cartografía actual e histórica.",
      "Dictamen con planos y conclusiones.",
      "Ratificación y aclaraciones ante el juzgado.",
    ],
    faqs: [
      {
        question: "¿Quién puede firmar un informe pericial topográfico?",
        answer:
          "Un técnico con titulación en la materia objeto del dictamen. El perito debe actuar con objetividad, con independencia de la parte que lo proponga.",
      },
      {
        question: "¿Sirven las fotos aéreas antiguas como prueba?",
        answer:
          "Sí. Las ortofotografías históricas permiten comprobar dónde estaban los linderos, caminos y construcciones en cada fecha.",
      },
    ],
    relacionados: ["deslinde-y-amojonamiento", "tasacion-pericial-contradictoria", "servidumbres-y-caminos"],
  },
  {
    slug: "tasacion-pericial-contradictoria",
    nombre: "Tasación pericial contradictoria",
    title: "Tasación pericial contradictoria frente a la comprobación de valores",
    description:
      "Actuamos como perito del contribuyente en la tasación pericial contradictoria cuando Hacienda o la Junta comprueban al alza el valor de un inmueble en una compraventa, herencia o donación.",
    intro:
      "La tasación pericial contradictoria es el procedimiento que permite al contribuyente rebatir, con el informe de su propio perito, el valor que la Administración tributaria asigna a un inmueble. Se utiliza cuando una comprobación de valores eleva la base de un impuesto.",
    cuando: [
      "Recibe una liquidación complementaria tras una compraventa.",
      "La Administración valora al alza los bienes de una herencia o donación.",
      "El valor comprobado no tiene en cuenta el estado real del inmueble.",
      "La finca rústica se ha valorado sin atender a su cultivo o sus limitaciones.",
    ],
    incluye: [
      "Análisis de la valoración de la Administración.",
      "Visita y medición del inmueble.",
      "Informe de valoración motivado.",
      "Actuación como perito designado por el contribuyente.",
    ],
    faqs: [
      {
        question: "¿Cuándo se puede solicitar?",
        answer:
          "Dentro del plazo del primer recurso o reclamación contra la liquidación basada en el valor comprobado, o reservándose ese derecho al recurrir. El plazo es breve y conviene actuar en cuanto se recibe la notificación.",
      },
      {
        question: "¿Suspende el pago de la liquidación?",
        answer:
          "La solicitud suspende la ejecución de la liquidación y el plazo para recurrirla, conforme a la Ley General Tributaria.",
      },
    ],
    relacionados: ["valoracion-agraria", "informe-pericial-topografico", "revision-valor-catastral-ibi"],
  },
  {
    slug: "valoracion-agraria",
    nombre: "Valoración agraria",
    title: "Valoración agraria de fincas rústicas",
    description:
      "Valoración de fincas rústicas, olivares, plantaciones, instalaciones de riego y construcciones agrarias para herencias, compraventas, expropiaciones, daños e indemnizaciones.",
    intro:
      "La valoración agraria determina el valor de una finca rústica y de sus elementos a una fecha y para una finalidad concretas. No vale lo mismo una finca para repartir una herencia que para una expropiación o para reclamar unos daños: el método cambia con el propósito.",
    cuando: [
      "Particiones de herencia y liquidaciones de gananciales.",
      "Compraventas y arrendamientos rústicos.",
      "Expropiaciones forzosas y ocupaciones temporales.",
      "Daños en cultivos, plantaciones o instalaciones.",
    ],
    incluye: [
      "Visita, medición e inventario de la explotación.",
      "Valoración del suelo según cultivo, riego y situación.",
      "Valoración de plantaciones, construcciones e instalaciones.",
      "Informe motivado con el método empleado.",
    ],
    faqs: [
      {
        question: "¿Cómo se valora un olivar?",
        answer:
          "Se atiende a la superficie, al marco y la edad de la plantación, a si es de secano o regadío, a su producción y a los valores de mercado de la zona.",
      },
      {
        question: "¿Sirve el valor catastral como valor de la finca?",
        answer:
          "No. El valor catastral rústico tiene finalidad fiscal y suele estar muy alejado del valor de mercado.",
      },
    ],
    relacionados: ["tasacion-pericial-contradictoria", "medicion-de-fincas", "segregacion-de-fincas"],
  },
  {
    slug: "servidumbres-y-caminos",
    nombre: "Servidumbres y caminos",
    title: "Servidumbres de paso, caminos y accesos a fincas",
    description:
      "Medición, plano e informe técnico de servidumbres de paso, caminos públicos y privados, vías pecuarias y accesos a fincas enclavadas, para escritura, acuerdo o juicio.",
    intro:
      "Muchas fincas rústicas dependen de un paso por terreno ajeno o de un camino cuya titularidad no está clara. Documentar con precisión por dónde discurre, qué anchura tiene y desde cuándo existe es la base para constituir una servidumbre, defenderla o discutirla.",
    cuando: [
      "Una finca no tiene salida a camino público.",
      "Un vecino cierra o estrecha un paso que se venía usando.",
      "Hay que escriturar una servidumbre de paso o de acueducto.",
      "Se discute si un camino es público o privado.",
    ],
    incluye: [
      "Levantamiento del trazado y de su anchura.",
      "Estudio de títulos, Catastro y cartografía histórica.",
      "Plano georreferenciado de la servidumbre.",
      "Informe técnico o pericial.",
    ],
    faqs: [
      {
        question: "¿Tengo derecho de paso si mi finca está enclavada?",
        answer:
          "El Código Civil reconoce al propietario de una finca sin salida a camino público el derecho a exigir paso por las vecinas, mediante la indemnización que corresponda.",
      },
      {
        question: "¿Cómo se sabe si un camino es público?",
        answer:
          "Se estudian el inventario municipal de caminos, el Catastro, los títulos y la cartografía histórica. Que Catastro lo dibuje como camino es un indicio, no una prueba definitiva.",
      },
    ],
    relacionados: ["informe-pericial-topografico", "deslinde-y-amojonamiento", "plano-georreferenciado"],
  },
  {
    slug: "proyecto-caseta-aperos-nave-agraria",
    nombre: "Proyecto de caseta de aperos o nave agraria",
    title: "Proyecto de caseta de aperos y nave agraria",
    description:
      "Redactamos el proyecto técnico de casetas de aperos, almacenes y naves agrarias en suelo rústico: viabilidad urbanística, planos, memoria y presupuesto para solicitar la licencia de obras.",
    intro:
      "Construir una caseta de aperos o una nave en suelo rústico exige justificar su vinculación con la explotación agraria y cumplir las condiciones del planeamiento municipal. El proyecto técnico es el documento con el que se solicita la licencia.",
    cuando: [
      "Necesita guardar maquinaria, aperos o cosecha en la finca.",
      "Quiere construir una nave para la explotación.",
      "El ayuntamiento le exige proyecto para conceder la licencia.",
      "Quiere legalizar una construcción agraria existente.",
    ],
    incluye: [
      "Estudio previo de viabilidad urbanística de la parcela.",
      "Levantamiento topográfico y plano de emplazamiento.",
      "Memoria, planos, mediciones y presupuesto.",
      "Alta de la construcción en Catastro al terminar la obra.",
    ],
    faqs: [
      {
        question: "¿Se puede construir una caseta de aperos en cualquier finca?",
        answer:
          "No. Depende del planeamiento del municipio, de la superficie de la parcela, de las distancias a linderos y caminos y de las protecciones que afecten al suelo.",
      },
      {
        question: "¿Qué superficie puede tener?",
        answer:
          "La que permita la normativa urbanística municipal en proporción a la finca y a las necesidades de la explotación. Se comprueba en el estudio previo.",
      },
    ],
    relacionados: ["replanteo-topografico", "declaracion-catastral", "levantamiento-topografico"],
  },
  {
    slug: "segregar-vivienda-unir-pisos",
    nombre: "Segregar una vivienda o unir dos pisos",
    title: "Segregar una vivienda en dos o unir dos pisos",
    description:
      "Documentación técnica para dividir una vivienda o un local en dos, o para unir dos pisos o locales contiguos: planos, superficies, licencia, escritura y actualización de Catastro.",
    intro:
      "Dividir una vivienda grande en dos, separar un local o unir dos pisos contiguos son operaciones que modifican la finca registral y la descripción catastral. Requieren planos del estado actual y del resultante, y el control urbanístico del ayuntamiento.",
    cuando: [
      "Quiere dividir una vivienda para vender o alquilar una parte.",
      "Ha comprado el piso contiguo y quiere unirlos.",
      "Va a separar un local en dos con accesos independientes.",
      "Una herencia obliga a repartir un inmueble.",
    ],
    incluye: [
      "Medición y planos del estado actual.",
      "Planos y superficies de las fincas resultantes.",
      "Documentación técnica para la licencia municipal.",
      "Declaración de la alteración en Catastro.",
    ],
    faqs: [
      {
        question: "¿Hace falta permiso de la comunidad de propietarios?",
        answer:
          "En edificios en régimen de propiedad horizontal, la división o agregación de pisos y locales requiere la autorización de la junta en los términos de la Ley de Propiedad Horizontal, salvo que los estatutos lo permitan.",
      },
      {
        question: "¿Se necesita licencia?",
        answer:
          "Sí, con carácter general. Además, cada vivienda resultante debe cumplir las condiciones mínimas de habitabilidad del municipio.",
      },
    ],
    relacionados: ["certificado-de-superficie", "declaracion-catastral", "segregacion-de-fincas"],
  },
  {
    slug: "revision-valor-catastral-ibi",
    nombre: "Revisión de valor catastral e IBI",
    title: "Revisión del valor catastral y del IBI",
    description:
      "Revisamos cómo ha valorado Catastro su inmueble: superficies, uso, tipología, categoría y antigüedad. Si hay error, preparamos la corrección y estudiamos la devolución de IBI.",
    intro:
      "El IBI se calcula sobre el valor catastral, y este depende de cómo describe Catastro el inmueble. Una tipología, una categoría o una superficie mal asignadas elevan el recibo todos los años. La revisión técnica comprueba cada dato de la valoración.",
    cuando: [
      "El recibo del IBI le parece excesivo para lo que es el inmueble.",
      "Una nave agrícola tributa como vivienda.",
      "Constan más metros construidos de los reales.",
      "Ha recibido una regularización catastral.",
    ],
    incluye: [
      "Análisis de la valoración local por local.",
      "Comprobación con la ponencia de valores del municipio.",
      "Medición y fotografías de la realidad.",
      "Solicitud de corrección y estudio de ingresos indebidos.",
    ],
    faqs: [
      {
        question: "¿Puedo comprobar yo mismo el valor catastral?",
        answer:
          "Nuestras calculadoras gratuitas permiten una primera estimación del valor urbano y rústico a partir de los datos del inmueble.",
      },
      {
        question: "¿Se puede reclamar el tipo de IBI del ayuntamiento?",
        answer:
          "No. El tipo lo fija la ordenanza municipal. Lo que puede corregirse es la descripción catastral sobre la que se aplica.",
      },
    ],
    relacionados: ["subsanacion-discrepancias-catastrales", "tasacion-pericial-contradictoria", "declaracion-catastral"],
  },
];

export function getServicio(slug: string) {
  return SERVICIOS.find((servicio) => servicio.slug === slug) ?? null;
}
