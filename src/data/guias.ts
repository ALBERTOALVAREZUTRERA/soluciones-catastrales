export interface Guia {
  slug: string;
  title: string;
  description: string;
  intro: string;
  /** Situaciones típicas en las que aparece el problema. */
  cuando: string[];
  /** Pasos del procedimiento, en orden. */
  pasos: { titulo: string; texto: string }[];
  documentacion: string[];
  faqs: { question: string; answer: string }[];
  /** Enlaces internos relacionados. */
  relacionados: { href: string; label: string }[];
}

export const GUIAS_UPDATED_ON = "2026-11-10";

const TRAMITES_REGISTRALES = { href: "/tramites-registrales", label: "Trámites registrales" };
const TRAMITES_CATASTRALES = { href: "/tramites-catastrales", label: "Trámites catastrales" };
const CONVERSOR_GML = { href: "/herramientas/conversor-gml", label: "Conversor gratuito a GML de parcela" };
const VISOR = { href: "/herramientas/visor-catastral", label: "Visor catastral" };

export const GUIAS: readonly Guia[] = [
  {
    slug: "rectificacion-de-cabida",
    title: "Rectificación de cabida: cómo corregir la superficie de una finca",
    description:
      "Qué hacer cuando la superficie de la escritura o del Registro no coincide con la real: procedimientos de los artículos 199 y 201 de la Ley Hipotecaria, documentación y papel del levantamiento topográfico.",
    intro:
      "La rectificación de cabida es el procedimiento para que el Registro de la Propiedad refleje la superficie real de una finca. Es habitual en fincas antiguas, descritas «a ojo» o en medidas tradicionales, y suele aparecer justo al vender, heredar o hipotecar.",
    cuando: [
      "La escritura indica una superficie y la medición real arroja otra distinta.",
      "Catastro y Registro recogen superficies diferentes para la misma finca.",
      "El notario o el registrador advierten de la discrepancia antes de firmar una compraventa o una herencia.",
      "Se quiere inscribir la representación gráfica georreferenciada de la finca.",
    ],
    pasos: [
      {
        titulo: "Medición de la realidad física.",
        texto:
          "Se realiza un levantamiento topográfico georreferenciado de los linderos reales, identificando muros, vallas, caminos y demás signos de posesión.",
      },
      {
        titulo: "Comparación con Catastro y con el título.",
        texto:
          "Se contrasta la medición con la cartografía catastral y con la descripción registral para cuantificar la diferencia y determinar si afecta a colindantes o a dominio público.",
      },
      {
        titulo: "Elección del procedimiento.",
        texto:
          "Si la cartografía catastral ya refleja la realidad, puede bastar la certificación catastral descriptiva y gráfica. Si no, se elabora una representación gráfica alternativa en formato GML. El expediente se tramita ante el Registro (artículo 199 de la Ley Hipotecaria) o ante notario (artículo 201), según la entidad de la diferencia y las circunstancias del caso.",
      },
      {
        titulo: "Notificación a colindantes e inscripción.",
        texto:
          "El registrador o el notario notifican a los titulares colindantes. Si no hay oposición fundada, se inscribe la nueva superficie con su representación gráfica.",
      },
    ],
    documentacion: [
      "Escritura o nota simple actualizada de la finca.",
      "Referencia catastral y, si existe, certificación catastral descriptiva y gráfica.",
      "Levantamiento topográfico e informe técnico.",
      "Archivo GML e Informe de Validación Gráfica Alternativa, cuando Catastro no refleja la realidad.",
    ],
    faqs: [
      {
        question: "¿Qué diferencia de superficie se puede rectificar?",
        answer:
          "La Ley Hipotecaria no fija un límite máximo, pero el procedimiento exigible depende de la diferencia. Las pequeñas diferencias admiten vías simplificadas; las superiores al 10 % de la cabida inscrita requieren el expediente con notificación a colindantes de los artículos 199 o 201.",
      },
      {
        question: "¿Hace falta un topógrafo para rectificar la cabida?",
        answer:
          "Cuando la cartografía catastral no coincide con la realidad, sí: es necesaria una representación gráfica alternativa elaborada por técnico competente a partir de una medición georreferenciada.",
      },
      {
        question: "¿Puede oponerse un vecino?",
        answer:
          "Sí. Los colindantes son notificados y pueden formular alegaciones. Una oposición fundada puede impedir la inscripción, por lo que conviene que la medición documente con rigor los linderos reales.",
      },
    ],
    relacionados: [TRAMITES_REGISTRALES, CONVERSOR_GML],
  },
  {
    slug: "informe-validacion-grafica-alternativa",
    title: "Informe de Validación Gráfica Alternativa (IVGA): qué es y cómo obtenerlo",
    description:
      "Qué es el IVGA de Catastro, cuándo lo piden notarios y registradores, qué significa que sea positivo o negativo y cómo se prepara el archivo GML necesario para obtenerlo.",
    intro:
      "El Informe de Validación Gráfica Alternativa es el documento que emite la Sede Electrónica del Catastro al comprobar una representación gráfica distinta de la catastral. Indica si la nueva delimitación respeta la cartografía de las parcelas colindantes y se identifica mediante un código seguro de verificación.",
    cuando: [
      "Segregaciones, agrupaciones, divisiones y agregaciones de fincas.",
      "Rectificaciones de superficie o de linderos cuando Catastro no refleja la realidad.",
      "Inmatriculaciones y expedientes de dominio con cartografía catastral incorrecta.",
      "Cualquier operación en la que notario o registrador soliciten una representación gráfica alternativa.",
    ],
    pasos: [
      {
        titulo: "Levantamiento topográfico.",
        texto:
          "Se miden los linderos reales con equipo GNSS o estación total, en el sistema de referencia oficial ETRS89.",
      },
      {
        titulo: "Elaboración del GML.",
        texto:
          "Se genera el archivo GML de parcela catastral con las coordenadas de la finca o de las fincas resultantes, en el formato que exige Catastro.",
      },
      {
        titulo: "Validación en la Sede Electrónica.",
        texto:
          "El técnico presenta el GML en la Sede del Catastro, que compara la geometría con las parcelas afectadas y emite el informe.",
      },
      {
        titulo: "Resultado positivo o negativo.",
        texto:
          "El informe es positivo cuando la representación encaja con la cartografía colindante sin invadir otras parcelas ni dominio público. Si es negativo, detalla las parcelas afectadas y hay que corregir la delimitación o tramitar la rectificación correspondiente.",
      },
    ],
    documentacion: [
      "Referencia catastral de las parcelas afectadas.",
      "Escritura o nota simple.",
      "Descripción de la operación que se quiere inscribir.",
      "Acceso a la finca para realizar la medición.",
    ],
    faqs: [
      {
        question: "¿Quién puede obtener un IVGA?",
        answer:
          "Lo obtiene el técnico que firma la representación gráfica, identificándose en la Sede Electrónica del Catastro. El resultado puede consultarlo después cualquier interesado, el notario o el registrador mediante el código seguro de verificación.",
      },
      {
        question: "¿Un IVGA positivo modifica Catastro?",
        answer:
          "No por sí solo. El informe acredita que la representación es técnicamente válida. La alteración catastral se produce cuando se formaliza la operación y se comunica o declara ante Catastro.",
      },
      {
        question: "¿Puedo generar yo mismo el GML?",
        answer:
          "Puede prepararlo con una herramienta de conversión si dispone de coordenadas fiables. Para que surta efecto en una escritura, la representación debe proceder de una medición real y estar suscrita por técnico competente.",
      },
    ],
    relacionados: [CONVERSOR_GML, TRAMITES_REGISTRALES],
  },
  {
    slug: "catastro-y-registro-no-coinciden",
    title: "Catastro y Registro no coinciden: causas y solución",
    description:
      "Por qué la finca aparece con datos distintos en Catastro y en el Registro de la Propiedad, qué consecuencias tiene al vender o heredar y cómo se coordinan ambas descripciones conforme a la Ley 13/2015.",
    intro:
      "Catastro y Registro de la Propiedad son instituciones distintas, con fines distintos. El primero describe los inmuebles a efectos fiscales; el segundo publica quién es el propietario y con qué cargas. Durante décadas funcionaron sin conexión, por lo que es frecuente que superficie, linderos o titular no coincidan.",
    cuando: [
      "La superficie catastral y la registral son diferentes.",
      "La parcela catastral incluye terreno del vecino o deja fuera parte de la finca.",
      "Una finca registral corresponde a varias parcelas catastrales, o al revés.",
      "El titular catastral no es el propietario actual.",
    ],
    pasos: [
      {
        titulo: "Identificar cuál de las dos descripciones es errónea.",
        texto:
          "Se mide la finca y se compara con ambas. Puede fallar Catastro, el Registro o los dos.",
      },
      {
        titulo: "Corregir Catastro, si procede.",
        texto:
          "Cuando la cartografía catastral no refleja la realidad, se solicita su corrección mediante el procedimiento de subsanación de discrepancias o la declaración que corresponda, aportando la medición.",
      },
      {
        titulo: "Corregir el Registro, si procede.",
        texto:
          "Cuando el error está en la descripción registral, se tramita la rectificación de la descripción con la representación gráfica georreferenciada de la finca.",
      },
      {
        titulo: "Coordinación gráfica.",
        texto:
          "Inscrita la representación gráfica, el registrador hace constar que la finca queda coordinada con Catastro. Desde ese momento ambas instituciones describen el mismo recinto.",
      },
    ],
    documentacion: [
      "Nota simple y certificación catastral descriptiva y gráfica.",
      "Escrituras o títulos de propiedad.",
      "Levantamiento topográfico georreferenciado.",
      "Recibo del IBI, si la discrepancia afecta al valor catastral.",
    ],
    faqs: [
      {
        question: "¿Qué prevalece, Catastro o el Registro?",
        answer:
          "A efectos de propiedad prevalece el Registro, que es el que produce efectos jurídicos. Catastro tiene valor fiscal y sus datos se presumen ciertos salvo prueba en contrario, pero no acreditan la titularidad.",
      },
      {
        question: "¿Es obligatorio coordinar la finca?",
        answer:
          "Es obligatorio aportar la representación gráfica en operaciones como segregaciones, agrupaciones, inmatriculaciones y obras nuevas. En el resto de casos es voluntario, aunque muy recomendable antes de vender.",
      },
      {
        question: "¿Qué ventaja tiene una finca coordinada?",
        answer:
          "La presunción de exactitud del Registro se extiende a la ubicación y delimitación geográfica de la finca, lo que aporta seguridad frente a conflictos de linderos y agiliza futuras transmisiones.",
      },
    ],
    relacionados: [TRAMITES_REGISTRALES, TRAMITES_CATASTRALES, VISOR],
  },
  {
    slug: "conflicto-de-lindes-con-el-vecino",
    title: "Conflicto de lindes con el vecino: cómo documentarlo y resolverlo",
    description:
      "Qué hacer si un vecino ha movido la linde o Catastro dibuja su parcela sobre la suya: medición topográfica, comparación de títulos, acuerdo de deslinde y vías notarial y judicial.",
    intro:
      "Los conflictos de linderos surgen cuando dos propietarios no están de acuerdo sobre por dónde discurre el límite entre sus fincas. Antes de cualquier reclamación conviene saber con precisión qué dice cada título, qué recoge Catastro y qué existe realmente sobre el terreno.",
    cuando: [
      "El vecino ha desplazado una valla, un mojón o ha labrado más allá de su finca.",
      "Catastro dibuja la linde en un lugar distinto del real.",
      "Al medir para vender aparece menos superficie de la esperada.",
      "Una obra o un cerramiento nuevo invade parte del terreno.",
    ],
    pasos: [
      {
        titulo: "Levantamiento topográfico de la situación actual.",
        texto:
          "Se miden los linderos existentes y todos los elementos físicos relevantes: muros, vallas, mojones, acequias, caminos y cultivos.",
      },
      {
        titulo: "Estudio de títulos y cartografía histórica.",
        texto:
          "Se comparan las escrituras de ambas fincas, la cartografía catastral actual y la histórica, y las ortofotografías antiguas, que permiten comprobar dónde estaba la linde en cada fecha.",
      },
      {
        titulo: "Intento de acuerdo.",
        texto:
          "Con el plano en la mano, muchos conflictos se resuelven de mutuo acuerdo. El deslinde consensuado puede documentarse y llevarse a Catastro y al Registro.",
      },
      {
        titulo: "Vía notarial o judicial.",
        texto:
          "Si no hay acuerdo, cabe el deslinde ante notario cuando las fincas están inscritas, o la acción judicial correspondiente. En ambos casos el informe técnico es la prueba principal.",
      },
    ],
    documentacion: [
      "Escritura y nota simple de su finca.",
      "Referencias catastrales de las parcelas implicadas.",
      "Fotografías y cualquier documento antiguo que describa la linde.",
      "Datos de contacto del colindante, si se va a intentar un acuerdo.",
    ],
    faqs: [
      {
        question: "¿Sirve Catastro para demostrar dónde está la linde?",
        answer:
          "Es un indicio, no una prueba definitiva. La cartografía catastral tiene finalidad fiscal y puede contener errores. Los tribunales valoran el conjunto: títulos, posesión, signos físicos e informes periciales.",
      },
      {
        question: "¿Qué valor tiene un informe topográfico?",
        answer:
          "Documenta de forma objetiva y medible la realidad física y su comparación con los títulos. Si el asunto llega a juicio, puede aportarse como dictamen pericial.",
      },
      {
        question: "¿Puedo corregir Catastro si el vecino no está de acuerdo?",
        answer:
          "Catastro da audiencia a los colindantes afectados. Si existe oposición, normalmente no altera la delimitación hasta que haya acuerdo o resolución que la determine.",
      },
    ],
    relacionados: [VISOR, TRAMITES_CATASTRALES],
  },
  {
    slug: "segregacion-de-finca-rustica",
    title: "Segregación de finca rústica: requisitos y pasos",
    description:
      "Qué se necesita para dividir una finca rústica: unidad mínima de cultivo, licencia o declaración de innecesariedad, levantamiento topográfico, GML de las fincas resultantes e inscripción.",
    intro:
      "Segregar es separar una porción de una finca para formar otra independiente. En suelo rústico no basta con la voluntad del propietario: la división debe respetar la superficie mínima que fija la normativa agraria y contar con el control urbanístico del ayuntamiento.",
    cuando: [
      "Se quiere vender solo una parte de la finca.",
      "Los herederos desean repartir una finca en lotes.",
      "Un camino, una carretera o un cauce dividen físicamente la propiedad.",
      "Se necesita separar la parte edificada del resto del terreno.",
    ],
    pasos: [
      {
        titulo: "Comprobación de la viabilidad.",
        texto:
          "Las fincas resultantes deben respetar la unidad mínima de cultivo, que en Andalucía varía según el municipio y según se trate de secano o regadío. La ley prevé excepciones tasadas que hay que valorar en cada caso.",
      },
      {
        titulo: "Levantamiento topográfico y propuesta de división.",
        texto:
          "Se mide la finca matriz y se define la línea de división, obteniendo la superficie exacta de cada porción.",
      },
      {
        titulo: "Licencia o declaración de innecesariedad.",
        texto:
          "Se solicita al ayuntamiento la licencia de segregación o la declaración de su innecesariedad, aportando la documentación técnica.",
      },
      {
        titulo: "GML, validación y escritura.",
        texto:
          "Se generan los archivos GML de las fincas resultantes y se obtiene el Informe de Validación Gráfica Alternativa. Con ello se otorga la escritura, se inscribe en el Registro y se actualiza Catastro.",
      },
    ],
    documentacion: [
      "Escritura y nota simple de la finca matriz.",
      "Referencia catastral.",
      "Croquis o indicación de cómo se quiere dividir.",
      "Información sobre el tipo de cultivo y si existe regadío.",
    ],
    faqs: [
      {
        question: "¿Cuál es la superficie mínima para segregar una finca rústica?",
        answer:
          "Depende del municipio y del tipo de cultivo. En Andalucía la unidad mínima de cultivo en secano es de varias hectáreas y en regadío es muy inferior. Hay que consultar la que corresponde al término municipal concreto.",
      },
      {
        question: "¿Se puede segregar por debajo de la unidad mínima de cultivo?",
        answer:
          "Solo en los supuestos de excepción que establece la ley, por ejemplo cuando la porción segregada se agrupa a una finca colindante. Fuera de ellos, la división es nula.",
      },
      {
        question: "¿Es obligatorio el GML en una segregación?",
        answer:
          "Sí. Desde la Ley 13/2015 la inscripción de segregaciones exige la representación gráfica georreferenciada de las fincas resultantes.",
      },
    ],
    relacionados: [TRAMITES_REGISTRALES, CONVERSOR_GML],
  },
  {
    slug: "declarar-obra-nueva-antigua",
    title: "Declarar una obra nueva antigua: cómo escriturar una construcción sin papeles",
    description:
      "Cómo inscribir una construcción antigua que no figura en la escritura: declaración de obra nueva por antigüedad, certificado técnico, coordenadas de la edificación y alta en Catastro.",
    intro:
      "Muchas viviendas, naves y cortijos se construyeron o ampliaron sin escriturar la obra. La construcción existe y a menudo paga IBI, pero el Registro sigue describiendo un solar o un edificio menor. La declaración de obra nueva por antigüedad permite regularizar esa situación cuando ya no cabe adoptar medidas de restablecimiento de la legalidad urbanística.",
    cuando: [
      "La escritura describe un terreno sin edificar y existe una construcción.",
      "Se ha ampliado la vivienda o se ha añadido una planta, un garaje o una piscina.",
      "El banco o el comprador exigen que la construcción conste en el Registro.",
      "Catastro no recoge la edificación o la recoge con datos erróneos.",
    ],
    pasos: [
      {
        titulo: "Medición de la construcción.",
        texto:
          "Se mide la edificación planta por planta y se obtienen las coordenadas georreferenciadas de la superficie que ocupa sobre la parcela.",
      },
      {
        titulo: "Acreditación de la antigüedad.",
        texto:
          "Se justifica la fecha de terminación mediante certificado técnico, certificación catastral, ortofotografías históricas u otros medios admitidos, y se describe la obra conforme a la realidad.",
      },
      {
        titulo: "Comprobación urbanística.",
        texto:
          "Debe verificarse que ha transcurrido el plazo para que la Administración actúe y que el suelo no tiene un régimen de protección que lo impida. En Andalucía hay que atender además a la situación de la edificación conforme a la normativa autonómica.",
      },
      {
        titulo: "Escritura, Registro y Catastro.",
        texto:
          "Con el certificado y las coordenadas se otorga la escritura de obra nueva, se inscribe y se declara la construcción en Catastro.",
      },
    ],
    documentacion: [
      "Escritura y nota simple.",
      "Referencia catastral y recibo del IBI.",
      "Fotografías exteriores e interiores de la construcción.",
      "Cualquier documento que acredite la fecha de la obra: licencias, facturas o contratos de suministro.",
    ],
    faqs: [
      {
        question: "¿Hace falta licencia para declarar una obra antigua?",
        answer:
          "No es imprescindible cuando la obra se declara por antigüedad y se acredita que ha transcurrido el plazo para restablecer la legalidad urbanística. Sí se exige acreditar la fecha de terminación y la descripción de la obra.",
      },
      {
        question: "¿Por qué piden las coordenadas de la edificación?",
        answer:
          "La Ley Hipotecaria exige que la porción de suelo ocupada por la construcción quede identificada mediante sus coordenadas georreferenciadas, para comprobar que se ubica dentro de la finca.",
      },
      {
        question: "¿Declarar la obra sube el IBI?",
        answer:
          "Si Catastro no la tenía recogida, sí: el valor catastral incorporará la construcción. Catastro puede además regularizar los ejercicios no prescritos, por lo que conviene revisar antes que los datos constructivos sean correctos.",
      },
    ],
    relacionados: [
      { href: "/herramientas/conversor-edificio", label: "Conversor a GML de edificio" },
      TRAMITES_REGISTRALES,
    ],
  },
  {
    slug: "catastro-me-cobra-de-mas",
    title: "Catastro me cobra de más: cómo corregir un valor catastral erróneo",
    description:
      "Qué hacer si Catastro atribuye a su inmueble un uso, una superficie o una antigüedad que no son reales y el IBI resulta excesivo: subsanación de discrepancias, documentación y devolución de ingresos indebidos.",
    intro:
      "El IBI se calcula sobre el valor catastral, y este depende de cómo describe Catastro el inmueble. Un error en el uso, la superficie, la tipología o la antigüedad se traduce en un recibo más alto cada año. Es un caso frecuente en fincas rústicas: una nave agrícola valorada como vivienda paga varias veces lo que le corresponde.",
    cuando: [
      "Una nave o almacén agrícola figura como vivienda.",
      "La superficie construida catastral es mayor que la real.",
      "Siguen constando construcciones que se demolieron.",
      "La antigüedad o la categoría asignadas no corresponden al edificio.",
    ],
    pasos: [
      {
        titulo: "Revisión de la descripción catastral.",
        texto:
          "Se analizan los datos de cada construcción y cada local: destino, tipología, categoría, año y superficie, y se comparan con la realidad.",
      },
      {
        titulo: "Informe técnico y documentación gráfica.",
        texto:
          "Se documenta el uso real con mediciones y fotografías de cada edificación, que permiten justificar la tipología constructiva correcta.",
      },
      {
        titulo: "Solicitud de corrección ante Catastro.",
        texto:
          "Se presenta la solicitud de subsanación de discrepancias con el informe. La tramitación suele prolongarse varios meses.",
      },
      {
        titulo: "Devolución de ingresos indebidos.",
        texto:
          "Corregido el valor, puede estudiarse la reclamación al ayuntamiento u organismo recaudador de lo pagado en exceso en los ejercicios no prescritos. Es un expediente distinto y posterior.",
      },
    ],
    documentacion: [
      "Copia del DNI del titular catastral, para otorgar la representación ante Catastro.",
      "Escritura o nota simple actualizada.",
      "Último recibo del IBI.",
      "Fotografías exteriores e interiores de cada construcción, indicando a cuál corresponden.",
    ],
    faqs: [
      {
        question: "¿Cómo sé si mi valor catastral es incorrecto?",
        answer:
          "Compare los datos de la consulta catastral con la realidad: uso de cada construcción, metros construidos y año. Si alguno no coincide, el valor probablemente esté mal calculado. Las calculadoras de esta web permiten una primera estimación.",
      },
      {
        question: "¿Cuánto tarda Catastro en corregir un error?",
        answer:
          "Depende de la Gerencia y de la complejidad del caso. Son procedimientos lentos, que con frecuencia superan los seis meses.",
      },
      {
        question: "¿Me devuelven lo que he pagado de más?",
        answer:
          "Puede solicitarse la devolución de ingresos indebidos de los ejercicios no prescritos, una vez acreditado el error. No es automática y su resultado depende de cada caso.",
      },
    ],
    relacionados: [
      { href: "/herramientas/calculadora", label: "Calculadora de valor catastral urbano" },
      { href: "/herramientas/calculadora-rustica", label: "Calculadora de valor catastral rústico" },
      { href: "/ibi", label: "Tipos de IBI por municipio" },
    ],
  },
];

export function getGuia(slug: string) {
  return GUIAS.find((guia) => guia.slug === slug) ?? null;
}
